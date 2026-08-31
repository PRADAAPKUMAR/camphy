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
import { compareSessions } from "@/lib/exam-sessions";
import TableGridEditor, { type ColumnMeta } from "@/components/admin/TableGridEditor";
import TheoryAdminPanel from "@/components/admin/TheoryAdminPanel";

const getSupabase = () => import("@/integrations/supabase/client").then((m) => m.supabase);


interface Pending {
  file: File;
  question: number | null;
  status: "pending" | "uploading" | "done" | "error";
  message?: string;
}

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

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const next: Pending[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
        file,
        question: questionNumberFromFilename(file.name),
        status: "pending" as const,
      }))
      .sort((a, b) => (a.question ?? 999) - (b.question ?? 999));
    setPending(next);
  };

  const uploadAll = async () => {
    if (!paperId) return toast.error("Pick a paper first");
    const ready = pending.filter((p) => p.question);
    if (!ready.length) return toast.error("No files with a detected question number");

    setUploading(true);
    setProgress(0);
    let done = 0;

    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];
      if (!item.question) continue;
      setPending((prev) =>
        prev.map((p, idx) => (idx === i ? { ...p, status: "uploading" } : p)),
      );
      try {
        const [data_base64, dims] = await Promise.all([
          readFileAsBase64(item.file),
          imageDimensions(item.file),
        ]);
        await callAdmin(passcode, {
          action: "upload",
          paper_id: paperId,
          question_number: item.question,
          content_type: item.file.type,
          data_base64,
          width: dims?.width,
          height: dims?.height,
        });
        setPending((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "done" } : p)));
        setUploaded((prev) => Array.from(new Set([...prev, item.question!])).sort((a, b) => a - b));
      } catch (e) {
        setPending((prev) =>
          prev.map((p, idx) =>
            idx === i
              ? { ...p, status: "error", message: e instanceof Error ? e.message : "Failed" }
              : p,
          ),
        );
      }
      done++;
      setProgress(Math.round((done / ready.length) * 100));
    }

    setUploading(false);
    toast.success("Upload finished");
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
            One JPG per MCQ question. Question numbers are detected from filenames
            (e.g. <span className="font-mono">q07.jpg</span>, <span className="font-mono">9702_s23_12_q7.jpg</span>).
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
            <Label htmlFor="files">Question images</Label>
            <Input
              id="files"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onFiles(e.target.files)}
            />
          </div>

          {pending.length > 0 && (
            <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-border/40 p-2">
              {pending.map((p, idx) => (
                <div key={`${p.file.name}-${idx}`} className="flex items-center gap-2 text-xs">
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
                  <span className="min-w-0 flex-1 truncate font-mono text-muted-foreground">
                    {p.file.name}
                  </span>
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

          <Button className="gap-2" onClick={uploadAll} disabled={uploading || !paperId}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload {pending.filter((p) => p.question).length || ""} images
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
