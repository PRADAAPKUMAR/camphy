import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, FileText, Images, Loader2, Table2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  imageDimensions,
  questionNumberFromFilename,
  readFileAsBase64,
} from "@/lib/question-images";
import { matchPaper, paperLabel, parseMcqImageName } from "@/lib/mcq-filenames";
import { compareSessions } from "@/lib/exam-sessions";

import TableGridEditor, { type ColumnMeta } from "@/components/admin/TableGridEditor";
import TheoryAdminPanel from "@/components/admin/TheoryAdminPanel";

const getSupabase = () => import("@/integrations/supabase/client").then((m) => m.supabase);


interface Pending {
  file: File;
  name: string;
  question: number | null;
  /** Paper resolved from the filename; null when it could not be matched. */
  targetPaperId: string | null;
  targetLabel: string | null;
  /** The filename was recognised by the parser. */
  recognised: boolean;
  /** Recognised but no matching paper row exists. */
  unmatched: boolean;
  status: "pending" | "uploading" | "done" | "error";
  message?: string;
}

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp)$/i;
const CONCURRENCY = 4;

const extractFiles = async (input: File[]): Promise<File[]> => {
  const out: File[] = [];
  for (const f of input) {
    if (IMAGE_EXT.test(f.name) || f.type.startsWith("image/")) {
      out.push(f);
      continue;
    }
    if (!/\.zip$/i.test(f.name)) continue;
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(f);
    const entries = Object.values(zip.files).filter(
      (e) => !e.dir && IMAGE_EXT.test(e.name) && !e.name.split("/").pop()!.startsWith("."),
    );
    for (const entry of entries) {
      const blob = await entry.async("blob");
      const base = entry.name.split("/").pop()!;
      const ext = base.split(".").pop()!.toLowerCase();
      const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      out.push(new File([blob], base, { type }));
    }
  }
  return out;
};



const callTheory = async (passcode: string, body: Record<string, unknown>) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.functions.invoke("admin-theory", {
    body: { passcode, ...body },
  });
  if (error) throw new Error(data?.error ?? error.message);
  if (data?.error) throw new Error(data.error);
  return data;
};

const callAdmin = async (passcode: string, body: Record<string, unknown>) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.functions.invoke("admin-upload-question", {
    body: { passcode, ...body },
  });
  if (error) throw new Error(data?.error ?? error.message);
  if (data?.error) throw new Error(data.error);
  return data;
};

const callTables = async (passcode: string, body: Record<string, unknown>) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.functions.invoke("admin-table-editor", {
    body: { passcode, ...body },
  });
  if (error) throw new Error(data?.error ?? error.message);
  if (data?.error) throw new Error(data.error);
  return data;
};

const AdminUploadPage = () => {
  const [passcode, setPasscode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const [level, setLevel] = useState<string>("");
  const [paperId, setPaperId] = useState<string>("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState<number[]>([]);
  const [reading, setReading] = useState(false);
  const [overrideUnmatched, setOverrideUnmatched] = useState(false);

  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ["admin-tables"],
    queryFn: async () => {
      const data = await callTables(passcode, { action: "tables" });
      return (data?.tables ?? []) as { name: string; columns: ColumnMeta[] }[];
    },
    enabled: unlocked,
    staleTime: 60_000,
  });


  const { data: papers } = useQuery({
    queryKey: ["admin-papers"],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("papers")
        .select("id, level, paper_code, session, year")
        .order("year", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: unlocked,
  });

  const levels = useMemo(
    () => Array.from(new Set((papers ?? []).map((p) => p.level))),
    [papers],
  );
  const levelPapers = useMemo(
    () =>
      (papers ?? [])
        .filter((p) => !level || p.level === level)
        .sort(
          (a, b) =>
            (b.year ?? 0) - (a.year ?? 0) ||
            compareSessions(a.session, b.session) ||
            (a.paper_code ?? "").localeCompare(b.paper_code ?? ""),
        ),
    [papers, level],
  );

  const unlock = async () => {
    try {
      await callAdmin(passcode, { action: "verify" });
      setUnlocked(true);
      toast.success("Admin unlocked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invalid passcode");
    }
  };

  const loadStatus = async (id: string) => {
    setPaperId(id);
    setUploaded([]);
    if (!id) return;
    try {
      const data = await callAdmin(passcode, { action: "status", paper_id: id });
      setUploaded((data?.questions ?? []) as number[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load status");
    }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const rows = papers ?? [];
    setReading(true);
    try {
      const expanded = await extractFiles(Array.from(files));
      const next: Pending[] = expanded
        .map((file) => {
          const parsed = parseMcqImageName(file.name);
          const match = parsed ? matchPaper(rows, parsed) : null;
          return {
            file,
            name: file.name,
            question: parsed?.question ?? questionNumberFromFilename(file.name),
            targetPaperId: match?.id ?? null,
            targetLabel: match
              ? paperLabel(match)
              : parsed
                ? `No paper found for ${parsed.level} · ${parsed.paper_code} · ${parsed.session} ${parsed.year}`
                : null,
            recognised: Boolean(parsed),
            unmatched: Boolean(parsed) && !match,
            status: "pending" as const,
          };
        })
        .sort(
          (a, b) =>
            (a.targetLabel ?? "zz").localeCompare(b.targetLabel ?? "zz") ||
            (a.question ?? 999) - (b.question ?? 999),
        );
      setPending(next);
      setOverrideUnmatched(false);
      if (!next.length) toast.error("No image files found in that selection");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read those files");
    } finally {
      setReading(false);
    }
  };

  const targetFor = (p: Pending) =>
    p.targetPaperId ?? (p.recognised && !overrideUnmatched ? null : paperId || null);

  const summary = useMemo(() => {
    const matched = pending.filter((p) => p.targetPaperId).length;
    const unmatched = pending.filter((p) => p.unmatched).length;
    const unparsed = pending.filter((p) => !p.recognised).length;
    const invalidQ = pending.filter(
      (p) => !p.question || p.question < 1 || p.question > 100,
    ).length;
    const seen = new Map<string, number>();
    let duplicates = 0;
    for (const p of pending) {
      const t = p.targetPaperId ?? (p.recognised ? "?" : paperId);
      if (!t || !p.question) continue;
      const key = `${t}#${p.question}`;
      const n = (seen.get(key) ?? 0) + 1;
      seen.set(key, n);
      if (n > 1) duplicates++;
    }
    const papersHit = new Set(pending.map((p) => p.targetPaperId).filter(Boolean)).size;
    return { total: pending.length, matched, unmatched, unparsed, invalidQ, duplicates, papersHit };
  }, [pending, paperId, overrideUnmatched]);

  const ready = useMemo(
    () => pending.filter((p) => p.question && targetFor(p)),
    [pending, paperId, overrideUnmatched],
  );
  const blocked = summary.unmatched > 0 && !overrideUnmatched;

  const uploadAll = async () => {
    if (blocked) {
      return toast.error(
        `${summary.unmatched} recognised file(s) have no matching paper — resolve them before uploading`,
      );
    }
    const queue = pending
      .map((p, index) => ({ p, index, target: targetFor(p) }))
      .filter((x) => x.p.question && x.target);
    if (!queue.length) {
      return toast.error(
        "No uploadable files — each image needs a question number and a paper (from its filename or the picker above)",
      );
    }

    setUploading(true);
    setProgress(0);
    let done = 0;
    let failed = 0;

    const runOne = async ({ p, index, target }: (typeof queue)[number]) => {
      setPending((prev) =>
        prev.map((x, idx) => (idx === index ? { ...x, status: "uploading" } : x)),
      );
      try {
        const [data_base64, dims] = await Promise.all([
          readFileAsBase64(p.file),
          imageDimensions(p.file),
        ]);
        await callAdmin(passcode, {
          action: "upload",
          paper_id: target,
          question_number: p.question,
          content_type: p.file.type,
          data_base64,
          width: dims?.width,
          height: dims?.height,
        });
        setPending((prev) =>
          prev.map((x, idx) => (idx === index ? { ...x, status: "done" } : x)),
        );
        if (target === paperId) {
          setUploaded((prev) =>
            Array.from(new Set([...prev, p.question!])).sort((a, b) => a - b),
          );
        }
      } catch (e) {
        failed++;
        setPending((prev) =>
          prev.map((x, idx) =>
            idx === index
              ? { ...x, status: "error", message: e instanceof Error ? e.message : "Failed" }
              : x,
          ),
        );
      }
      done++;
      setProgress(Math.round((done / queue.length) * 100));
    };

    let cursor = 0;
    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (cursor < queue.length) {
        const job = queue[cursor++];
        await runOne(job);
      }
    });
    await Promise.all(workers);

    setUploading(false);
    if (failed) toast.error(`${queue.length - failed} uploaded, ${failed} failed`);
    else toast.success(`${queue.length} image(s) uploaded`);
  };



  const removeQuestion = async (q: number) => {
    try {
      await callAdmin(passcode, { action: "delete", paper_id: paperId, question_number: q });
      setUploaded((prev) => prev.filter((n) => n !== q));
      toast.success(`Removed Q${q}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
    }
  };

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background bg-grid p-6">
        <div className="glass-card w-full max-w-sm space-y-4 rounded-2xl p-6">
          <h1 className="text-lg font-bold">Admin console</h1>
          <div className="space-y-2">
            <Label htmlFor="passcode">Passcode</Label>
            <Input
              id="passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && unlock()}
              placeholder="Enter admin passcode"
            />
          </div>
          <Button className="w-full" onClick={unlock} disabled={!passcode}>
            Unlock
          </Button>
          <Button variant="ghost" className="w-full gap-2 text-muted-foreground" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Back home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (view === null) {
    return (
      <div className="min-h-screen bg-background bg-grid">
        <div className="container max-w-6xl space-y-6 py-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Admin console</h1>
              <p className="text-sm text-muted-foreground">
                Pick a tile to edit data like a spreadsheet, or manage question images.
              </p>
            </div>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4" /> Home
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              onClick={() => setView("__images")}
              className="glass-card flex flex-col items-start gap-2 rounded-2xl p-5 text-left transition hover:border-primary/50"
            >
              <Images className="h-8 w-8 text-primary" />
              <span className="font-semibold">Question images</span>
              <span className="text-xs text-muted-foreground">
                Upload one JPG per MCQ question and manage what is already uploaded.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setView("__theory")}
              className="glass-card flex flex-col items-start gap-2 rounded-2xl p-5 text-left transition hover:border-primary/50"
            >
              <FileText className="h-8 w-8 text-primary" />
              <span className="font-semibold">Theory past papers</span>
              <span className="text-xs text-muted-foreground">
                Upload question paper &amp; mark scheme PDFs (auto-paired by filename) and write
                explanations.
              </span>
            </button>



            {tablesLoading && (
              <div className="glass-card flex items-center gap-2 rounded-2xl p-5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading tables…
              </div>
            )}

            {(tables ?? []).map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setView(t.name)}
                className="glass-card flex flex-col items-start gap-2 rounded-2xl p-5 text-left transition hover:border-primary/50"
              >
                <Table2 className="h-8 w-8 text-primary" />
                <span className="font-mono text-sm font-semibold">{t.name}</span>
                <span className="text-xs text-muted-foreground">
                  {t.columns.length} columns · edit, add, delete or download rows
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === "__theory") {
    return (
      <div className="min-h-screen bg-background bg-grid">
        <div className="container max-w-5xl space-y-5 py-8">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => setView(null)}>
            <ArrowLeft className="h-4 w-4" /> All tiles
          </Button>
          <TheoryAdminPanel call={(body) => callTheory(passcode, body)} />
        </div>
      </div>
    );
  }

  if (view !== "__images") {
    const meta = (tables ?? []).find((t) => t.name === view);
    return (
      <div className="min-h-screen bg-background bg-grid">
        <div className="container max-w-[100rem] space-y-5 py-8">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => setView(null)}>
            <ArrowLeft className="h-4 w-4" /> All tiles
          </Button>
          <div className="glass-card rounded-2xl p-5">
            {meta ? (
              <TableGridEditor
                table={meta.name}
                columns={meta.columns}
                call={(body) => callTables(passcode, body)}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Table not found.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid">
      <div className="container max-w-4xl space-y-6 py-8">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => setView(null)}>
          <ArrowLeft className="h-4 w-4" /> All tiles
        </Button>

        <div>
          <h1 className="text-2xl font-bold">Question image uploads</h1>
          <p className="text-sm text-muted-foreground">
            Drop all your images at once — the paper and question number are read from each
            filename (e.g. <span className="font-mono">9702_s23_12_q07.jpg</span>,{" "}
            <span className="font-mono">0625_w22_22_q7.png</span>) and each image is filed under
            the right paper automatically. The pickers below are only needed for files whose name
            can&apos;t be matched.
          </p>
        </div>


        <div className="glass-card grid gap-4 rounded-2xl p-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Level</Label>
            <Select
              value={level}
              onValueChange={(v) => {
                setLevel(v);
                setPaperId("");
                setUploaded([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Paper</Label>
            <Select value={paperId} onValueChange={loadStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select paper" />
              </SelectTrigger>
              <SelectContent>
                {levelPapers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.paper_code} · {p.session} {p.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="glass-card space-y-4 rounded-2xl p-5">
          <div className="space-y-2">
            <Label htmlFor="files">Question images or ZIP files</Label>
            <Input
              id="files"
              type="file"
              accept="image/*,.zip,application/zip"
              multiple
              onChange={(e) => onFiles(e.target.files)}
            />
            <p className="text-[11px] text-muted-foreground">
              You can drop thousands of images at once, or a .zip containing them — every file
              inside is read the same way.
            </p>
          </div>

          {reading && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Reading files…
            </p>
          )}

          {pending.length > 0 && (
            <div className="grid gap-2 rounded-xl border border-border/40 p-3 text-xs sm:grid-cols-3">
              <div>Total files: <span className="font-semibold">{summary.total}</span></div>
              <div className="text-emerald-300">
                Matched: <span className="font-semibold">{summary.matched}</span>
                {summary.papersHit ? ` (${summary.papersHit} paper${summary.papersHit > 1 ? "s" : ""})` : ""}
              </div>
              <div className={summary.unmatched ? "text-destructive" : "text-muted-foreground"}>
                Unmatched: <span className="font-semibold">{summary.unmatched}</span>
              </div>
              <div className={summary.unparsed ? "text-amber-300" : "text-muted-foreground"}>
                Name not readable: <span className="font-semibold">{summary.unparsed}</span>
              </div>
              <div className={summary.invalidQ ? "text-amber-300" : "text-muted-foreground"}>
                Invalid question no.: <span className="font-semibold">{summary.invalidQ}</span>
              </div>
              <div className={summary.duplicates ? "text-amber-300" : "text-muted-foreground"}>
                Duplicates: <span className="font-semibold">{summary.duplicates}</span>
              </div>
            </div>
          )}

          {summary.unmatched > 0 && (
            <label className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={overrideUnmatched}
                onChange={(e) => setOverrideUnmatched(e.target.checked)}
              />
              <span>
                {summary.unmatched} file(s) were read correctly but no such paper exists. Upload is
                blocked until you tick this box to send them to the paper picked above instead.
              </span>
            </label>
          )}

          {pending.length > 0 && (
            <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-lg border border-border/40 p-2">
              {pending.map((p, idx) => (
                <div key={`${p.name}-${idx}`} className="flex items-center gap-2 text-xs">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={p.question ?? ""}
                    onChange={(e) =>
                      setPending((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, question: Number(e.target.value) || null } : x,
                        ),
                      )
                    }
                    className="h-8 w-16"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-muted-foreground">{p.name}</div>
                    <div
                      className={
                        p.targetPaperId
                          ? "truncate text-[11px] text-emerald-300"
                          : p.unmatched
                            ? "truncate text-[11px] text-destructive"
                            : "truncate text-[11px] text-amber-300"
                      }
                    >
                      {p.targetLabel ?? "Name not readable — uses the paper picked above"}
                    </div>
                  </div>
                  {p.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {p.status === "done" && <CheckCircle2 className="h-4 w-4 text-success" />}
                  {p.status === "error" && (
                    <span className="text-destructive">{p.message ?? "Failed"}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {uploading && <Progress value={progress} />}

          <Button
            className="gap-2"
            onClick={uploadAll}
            disabled={uploading || reading || blocked || !ready.length}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload {ready.length || ""} images
          </Button>

        </div>


        {paperId && (
          <div className="glass-card space-y-3 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Uploaded questions</h2>
              <Badge variant="outline" className="border-border/40 text-xs">
                {uploaded.length}
              </Badge>
            </div>
            {uploaded.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nothing uploaded for this paper yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {uploaded.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => removeQuestion(q)}
                    title={`Delete image for Q${q}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-300 hover:border-destructive/50 hover:bg-destructive/15 hover:text-destructive"
                  >
                    Q{q}
                    <Trash2 className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to={`/question-mode/${paperId}`}>Open in Question mode</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUploadPage;
