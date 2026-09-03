import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Download, FileText, Loader2, Shuffle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useSyllabusTopicTree } from "@/hooks/use-syllabus";
import { displayLevel } from "@/lib/syllabus";
import { collectWrongQuestions, readPerformanceHistory } from "@/lib/performance-history";
import {
  fetchWorksheetSelection,
  generateAnswerKeyPdf,
  generateWorksheetPdf,
  loadWorksheetImages,
  sanitizeFilePart,
  type LoadedImage,
  type WorksheetSelection,
  type WorksheetSource,
} from "@/lib/worksheet";

const getSupabase = () => import("@/integrations/supabase/client").then((m) => m.supabase);

const LEVELS = [
  { value: "IGCSE", label: "IGCSE Physics 0625" },
  { value: "AS LEVEL", label: "AS Level Physics 9702" },
];

const SOURCES: { value: WorksheetSource; label: string }[] = [
  { value: "random", label: "Random questions" },
  { value: "topic", label: "Topic / subtopic" },
  { value: "paper", label: "Past paper" },
  { value: "mistakes", label: "My mistakes" },
];

const COUNTS = [10, 15, 20, 25, 30, 40];

const WorksheetGeneratorPage = () => {
  const [level, setLevel] = useState("IGCSE");
  const [source, setSource] = useState<WorksheetSource>("random");
  const [topicId, setTopicId] = useState<string>("");
  const [subtopicId, setSubtopicId] = useState<string>("");
  const [paperId, setPaperId] = useState<string>("");
  const [count, setCount] = useState(20);
  const [customCount, setCustomCount] = useState("");
  const [shuffle, setShuffle] = useState(false);
  const [includeSources, setIncludeSources] = useState(true);

  const [selection, setSelection] = useState<WorksheetSelection | null>(null);
  const [loaded, setLoaded] = useState<LoadedImage[] | null>(null);
  const [failed, setFailed] = useState<{ paper_code: string; question_number: number }[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const { tree } = useSyllabusTopicTree(level, source === "topic");

  const { data: papers } = useQuery({
    queryKey: ["worksheet-papers", level],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("papers")
        .select("id, paper_code, year, session")
        .eq("level", level)
        .order("year", { ascending: false })
        .order("paper_code");
      if (error) throw error;
      return data ?? [];
    },
    enabled: source === "paper",
  });

  const wrongSets = useMemo(() => collectWrongQuestions(readPerformanceHistory()), []);
  const mistakeRefs = useMemo(
    () =>
      wrongSets.flatMap((s) =>
        s.questions.map((q) => ({ paper_id: s.paperId, question_number: q })),
      ),
    [wrongSets],
  );

  const selectedTopic = tree.find((t) => t.id === topicId);
  const effectiveCount = Math.min(40, Math.max(1, Number(customCount) || count));

  const reset = () => {
    setSelection(null);
    setLoaded(null);
    setFailed([]);
  };

  const sourceLabel = useMemo(() => {
    if (source === "paper") {
      const p = papers?.find((x) => x.id === paperId);
      return p ? `Past paper: ${p.paper_code} — ${p.session} ${p.year}` : "Past paper";
    }
    if (source === "topic") {
      const sub = selectedTopic?.children.find((c) => c.id === subtopicId);
      if (sub) return `Topic: ${selectedTopic?.topic_name} — ${sub.topic_name}`;
      if (selectedTopic) return `Topic: ${selectedTopic.topic_name}`;
      return "Topic practice";
    }
    if (source === "mistakes") return "Source: my previous mistakes";
    return "Source: random mixed questions";
  }, [source, papers, paperId, selectedTopic, subtopicId]);

  const fileBase = useMemo(() => {
    const lvl = level === "IGCSE" ? "IGCSE" : "AS";
    if (source === "topic" && selectedTopic) {
      const sub = selectedTopic.children.find((c) => c.id === subtopicId);
      return `PhysicsHQ_${lvl}_${sanitizeFilePart(sub?.topic_name ?? selectedTopic.topic_name)}_MCQ`;
    }
    if (source === "paper") {
      const p = papers?.find((x) => x.id === paperId);
      return `PhysicsHQ_${lvl}_${sanitizeFilePart(`${p?.paper_code ?? "Paper"}_${p?.session ?? ""}_${p?.year ?? ""}`)}_MCQ`;
    }
    if (source === "mistakes") return `PhysicsHQ_${lvl}_My_Mistakes_MCQ`;
    return `PhysicsHQ_${lvl}_Mixed_MCQ`;
  }, [level, source, selectedTopic, subtopicId, papers, paperId]);

  const meta = {
    levelLabel: LEVELS.find((l) => l.value === level)?.label ?? displayLevel(level),
    sourceLabel,
    questionCount: loaded?.length ?? 0,
    fileBase,
  };

  const buildSelection = async () => {
    if (source === "paper" && !paperId) {
      toast.error("Pick a past paper first");
      return;
    }
    if (source === "topic" && !topicId) {
      toast.error("Pick a topic first");
      return;
    }
    if (source === "mistakes" && !mistakeRefs.length) {
      toast.error("No wrong questions saved yet — attempt a paper in Question mode first");
      return;
    }
    setBusy(true);
    reset();
    setProgress("Selecting questions…");
    try {
      const result = await fetchWorksheetSelection({
        level,
        source,
        paper_id: source === "paper" ? paperId : null,
        topic_ids: source === "topic" ? [subtopicId || topicId] : [],
        refs: source === "mistakes" ? mistakeRefs : [],
        count: effectiveCount,
        shuffle,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSelection(result);
      if (!result.items.length) {
        toast.error("No eligible questions found for this selection");
        return;
      }
      if (result.pool_size < effectiveCount) {
        toast.warning(
          `Only ${result.pool_size} eligible question${result.pool_size === 1 ? "" : "s"} available — worksheet built with ${result.items.length}.`,
        );
      }
      setProgress("Loading question images…");
      const usable = result.items.filter((i) => i.image_url && i.correct_answer);
      const { loaded: ok, failed: bad } = await loadWorksheetImages(usable, (done, total) =>
        setProgress(`Loading question images… ${done}/${total}`),
      );
      // Renumber sequentially over what actually loaded.
      const renumbered = ok.map((entry, i) => ({
        ...entry,
        item: { ...entry.item, worksheet_number: i + 1 },
      }));
      setLoaded(renumbered);
      setFailed(bad.map((b) => ({ paper_code: b.paper_code, question_number: b.question_number })));
      if (renumbered.length) toast.success(`Worksheet ready — ${renumbered.length} questions`);
    } catch {
      toast.error("Could not build the worksheet");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const download = async (kind: "worksheet" | "key") => {
    if (!loaded?.length) return;
    setBusy(true);
    try {
      if (kind === "worksheet") await generateWorksheetPdf(loaded, meta);
      else await generateAnswerKeyPdf(loaded, meta, includeSources);
    } catch {
      toast.error("PDF generation failed");
    } finally {
      setBusy(false);
    }
  };

  const topicBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    (loaded ?? []).forEach((l) => {
      const key = l.item.topic_name ?? "Unmapped";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [loaded]);

  const problems = [...(selection?.excluded ?? []), ...failed.map((f) => ({ ...f, reason: "image unavailable" }))];

  return (
    <div className="min-h-screen bg-background bg-grid">
      <header className="border-b border-border/40">
        <div className="container py-8">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Worksheet generator</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/40 bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">MCQ Worksheet Generator</h1>
              <p className="text-sm text-muted-foreground">
                Build a printable A4 worksheet from real Cambridge MCQ questions, with a separate answer key.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container grid gap-6 py-8 lg:grid-cols-[1.1fr_1fr]">
        {/* ---------------- settings ---------------- */}
        <section className="glass-card space-y-5 rounded-2xl p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Level</Label>
              <Select
                value={level}
                onValueChange={(v) => {
                  setLevel(v);
                  setTopicId("");
                  setSubtopicId("");
                  setPaperId("");
                  reset();
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Source</Label>
              <Select
                value={source}
                onValueChange={(v) => {
                  setSource(v as WorksheetSource);
                  reset();
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {source === "topic" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Topic</Label>
                <Select
                  value={topicId}
                  onValueChange={(v) => {
                    setTopicId(v);
                    setSubtopicId("");
                    reset();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {tree.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.topic_code} {t.topic_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subtopic (optional)</Label>
                <Select
                  value={subtopicId}
                  onValueChange={(v) => {
                    setSubtopicId(v === "__all" ? "" : v);
                    reset();
                  }}
                  disabled={!selectedTopic?.children.length}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All subtopics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">All subtopics</SelectItem>
                    {(selectedTopic?.children ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.topic_code} {c.topic_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {source === "paper" && (
            <div className="space-y-2">
              <Label>Past paper</Label>
              <Select
                value={paperId}
                onValueChange={(v) => {
                  setPaperId(v);
                  reset();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a paper" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {(papers ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.paper_code} · {p.session} {p.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {source === "mistakes" && (
            <p className="text-sm text-muted-foreground">
              {mistakeRefs.length
                ? `${mistakeRefs.length} wrong question${mistakeRefs.length === 1 ? "" : "s"} found in your saved performance history.`
                : "No wrong questions saved yet — attempt a paper first."}
            </p>
          )}

          <div className="space-y-2">
            <Label>Number of questions</Label>
            <div className="flex flex-wrap items-center gap-2">
              {COUNTS.map((c) => (
                <Button
                  key={c}
                  type="button"
                  size="sm"
                  variant={!customCount && count === c ? "default" : "outline"}
                  onClick={() => {
                    setCount(c);
                    setCustomCount("");
                    reset();
                  }}
                >
                  {c}
                </Button>
              ))}
              <Input
                type="number"
                min={1}
                max={40}
                placeholder="Custom"
                value={customCount}
                onChange={(e) => {
                  setCustomCount(e.target.value);
                  reset();
                }}
                className="h-9 w-24"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="shuffle"
                checked={shuffle}
                onCheckedChange={(v) => {
                  setShuffle(v);
                  reset();
                }}
              />
              <Label htmlFor="shuffle" className="flex items-center gap-1.5">
                <Shuffle className="h-3.5 w-3.5" /> Shuffle questions
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="src" checked={includeSources} onCheckedChange={setIncludeSources} />
              <Label htmlFor="src">Show sources on answer key</Label>
            </div>
          </div>

          <Button onClick={buildSelection} disabled={busy} className="w-full gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? progress ?? "Working…" : "Generate worksheet"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Option order (A–D) is always preserved exactly as printed by Cambridge — original question
            images are used unmodified.
          </p>
        </section>

        {/* ---------------- preview ---------------- */}
        <section className="glass-card space-y-4 rounded-2xl p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Preview</h2>

          {!selection && !loaded && (
            <p className="text-sm text-muted-foreground">
              Choose your settings and generate to see a summary here.
            </p>
          )}

          {selection && (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Eligible pool: {selection.pool_size}</Badge>
                <Badge variant="outline">
                  Questions ready: {loaded?.length ?? 0} / {selection.items.length}
                </Badge>
              </div>
              <p className="text-muted-foreground">{sourceLabel}</p>

              {!!topicBreakdown.length && (
                <div className="space-y-1">
                  <p className="font-medium">Topics</p>
                  {topicBreakdown.map(([name, n]) => (
                    <div key={name} className="flex justify-between text-muted-foreground">
                      <span className="truncate pr-3">{name}</span>
                      <span>{n}</span>
                    </div>
                  ))}
                </div>
              )}

              {!!problems.length && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3">
                  <p className="mb-1 flex items-center gap-1.5 font-medium text-destructive">
                    <AlertTriangle className="h-4 w-4" /> Some questions were unavailable or missing
                    answer-key data
                  </p>
                  <ul className="space-y-0.5 text-xs text-muted-foreground">
                    {problems.slice(0, 12).map((p, i) => (
                      <li key={`${p.paper_code}-${p.question_number}-${i}`}>
                        {p.paper_code} Q{p.question_number} — {p.reason}
                      </li>
                    ))}
                    {problems.length > 12 && <li>+{problems.length - 12} more…</li>}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    These are left out of the worksheet and the answer key. Generate again to pick
                    replacements.
                  </p>
                </div>
              )}

              {!!loaded?.length && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button onClick={() => download("worksheet")} disabled={busy} className="gap-2">
                    <Download className="h-4 w-4" /> Worksheet PDF
                  </Button>
                  <Button
                    onClick={() => download("key")}
                    disabled={busy}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" /> Answer key PDF
                  </Button>
                </div>
              )}

              {!!loaded?.length && (
                <div className="max-h-64 overflow-y-auto rounded-xl border border-border/40 p-3 text-xs text-muted-foreground">
                  {loaded.map((l) => (
                    <div key={`${l.item.paper_id}-${l.item.question_number}`} className="flex justify-between gap-3 py-0.5">
                      <span>Q{l.item.worksheet_number}</span>
                      <span className="truncate">
                        {l.item.paper_code} {l.item.session} {l.item.year} · Q{l.item.question_number}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default WorksheetGeneratorPage;
