import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  Shuffle,
  Sparkles,
  Save,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { displayLevel } from "@/lib/syllabus";
import { GRADES, isGradeKey, type GradeKey } from "@/lib/grades";
import { collectWrongQuestions, readPerformanceHistory } from "@/lib/performance-history";
import {
  fetchWorksheetSelection,
  fetchWorksheetTopics,
  generateAnswerKeyPdf,
  generateWorksheetPdf,
  getDefaultWorksheetName,
  loadWorksheetImages,
  sanitizeFilePart,
  type LoadedImage,
  type WorksheetSelection,
  type WorksheetSource,
} from "@/lib/worksheet";

import { questionKey, questionRef, readSavedWorksheets, renumberWorksheet, writeSavedWorksheets, type SavedWorksheetSelection } from "@/lib/worksheet-selections";

const LEVELS = [
  { value: "IGCSE", label: "IGCSE Physics 0625" },
  { value: "AS LEVEL", label: "AS Level Physics 9702" },
];

const SOURCES: { value: WorksheetSource; label: string }[] = [
  { value: "random", label: "Random questions" },
  { value: "topic", label: "Topical questions" },
  { value: "mistakes", label: "My mistakes" },
];

const COUNTS = [10, 15, 20, 25, 30, 40];

/** One selected topic or subtopic. */
interface Picked {
  key: string;
  label: string;
  ids: string[];
  count: number;
}

const WorksheetGeneratorPage = () => {
  const { grade: rawGrade } = useParams<{ grade: string }>();
  const grade = isGradeKey(rawGrade) ? rawGrade.toLowerCase() as GradeKey : "igcse";
  const gradeDefinition = GRADES[grade];
  const level = gradeDefinition.worksheetLevel ?? "IGCSE";
  const [source, setSource] = useState<WorksheetSource>("random");
  const [picked, setPicked] = useState<Picked[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [count, setCount] = useState(20);
  const [customCount, setCustomCount] = useState("");
  const [shuffle, setShuffle] = useState(false);
  const [includeSources, setIncludeSources] = useState(true);
  const [worksheetName, setWorksheetName] = useState("");
  const [showTotalMarks, setShowTotalMarks] = useState(true);

  const requestId = useRef(0);
  const [savedSelections, setSavedSelections] = useState(readSavedWorksheets);
  const [selection, setSelection] = useState<WorksheetSelection | null>(null);
  const [loaded, setLoaded] = useState<LoadedImage[] | null>(null);
  const [failed, setFailed] = useState<{ paper_code: string; question_number: number }[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  useEffect(() => {
    requestId.current += 1;
    setBusy(false);
    setProgress(null);
    setPicked([]);
    setExpanded({});
    setSelection(null);
    setLoaded(null);
    setFailed([]);
    return () => { requestId.current += 1; };
  }, [level]);

  const { data: topicGroups, isLoading: topicsLoading } = useQuery({
    queryKey: ["worksheet-topics", level],
    queryFn: () => fetchWorksheetTopics(level),
    enabled: source === "topic",
    staleTime: 30 * 60 * 1000,
  });
  const tree = topicGroups ?? [];

  const wrongSets = useMemo(() => collectWrongQuestions(readPerformanceHistory()), []);
  const mistakeRefs = useMemo(
    () =>
      wrongSets.flatMap((s) =>
        s.questions.map((q) => ({ paper_id: s.paperId, question_number: q })),
      ),
    [wrongSets],
  );

  const effectiveCount = Math.min(40, Math.max(1, Number(customCount) || count));

  const reset = () => {
    setSelection(null);
    setLoaded(null);
    setFailed([]);
  };

  const isPicked = (key: string) => picked.some((p) => p.key === key);

  const togglePick = (entry: Picked, on: boolean) => {
    setPicked((prev) => (on ? [...prev.filter((p) => p.key !== entry.key), entry] : prev.filter((p) => p.key !== entry.key)));
    reset();
  };

  // Unique topic ids across every selection — this is what the query filters on.
  const selectedTopicIds = useMemo(
    () => Array.from(new Set(picked.flatMap((p) => p.ids))),
    [picked],
  );
  const selectedPoolCount = picked.reduce((sum, p) => sum + p.count, 0);

  const sourceLabel = useMemo(() => {
    if (source === "topic") {
      if (!picked.length) return "Topical practice";
      if (picked.length <= 3) return `Topics: ${picked.map((p) => p.label).join(", ")}`;
      return `Topics: ${picked.length} selected`;
    }
    if (source === "mistakes") return "Source: my previous mistakes";
    return "Source: random mixed questions";
  }, [source, picked]);

  const fileBase = useMemo(() => {
    const lvl = level === "IGCSE" ? "IGCSE" : "AS";
    if (source === "topic" && picked.length) {
      const part =
        picked.length === 1 ? sanitizeFilePart(picked[0].label) : `${picked.length}_Topics`;
      return `PhysicsHQ_${lvl}_${part}_MCQ`;
    }
    if (source === "mistakes") return `PhysicsHQ_${lvl}_My_Mistakes_MCQ`;
    return `PhysicsHQ_${lvl}_Mixed_MCQ`;
  }, [level, source, picked]);

  const defaultWorksheetName = useMemo(() => {
    return getDefaultWorksheetName(level, source, picked.map((topic) => topic.label));
  }, [level, source, picked]);

  const resolvedWorksheetName = worksheetName.trim() || defaultWorksheetName;

  const meta = {
    levelLabel: LEVELS.find((l) => l.value === level)?.label ?? displayLevel(level),
    sourceLabel,
    questionCount: loaded?.length ?? 0,
    fileBase,
    worksheetName: resolvedWorksheetName,
    showTotalMarks,
  };

  const buildSelection = async () => {
    if (source === "topic" && !selectedTopicIds.length) {
      toast.error("Select at least one topic or subtopic");
      return;
    }
    if (source === "mistakes" && !mistakeRefs.length) {
      toast.error("No wrong questions saved yet — attempt a paper in Question mode first");
      return;
    }
    const request = requestId.current;
    setBusy(true);
    reset();
    setProgress("Selecting questions…");
    try {
      const result = await fetchWorksheetSelection({
        level,
        source,
        topic_ids: source === "topic" ? selectedTopicIds : [],
        refs: source === "mistakes" ? mistakeRefs : [],
        count: effectiveCount,
        shuffle,
      });
      if (request !== requestId.current) return;
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
      if (request !== requestId.current) return;
      // Renumber sequentially over what actually loaded.
      const renumbered = ok.map((entry, i) => ({
        ...entry,
        item: { ...entry.item, worksheet_number: i + 1 },
      }));
      setLoaded(renumbered);
      setFailed(bad.map((b) => ({ paper_code: b.paper_code, question_number: b.question_number })));
      if (renumbered.length) toast.success(`Worksheet ready — ${renumbered.length} questions`);
    } catch {
      if (request !== requestId.current) return;
      toast.error("Could not build the worksheet");
    } finally {
      if (request === requestId.current) { setBusy(false); setProgress(null); }
    }
  };

  const removeQuestion = (index: number) => {
    setLoaded((current) => current ? renumberWorksheet(current.filter((_, i) => i !== index)) : current);
  };

  const replaceQuestion = async (index: number) => {
    if (!loaded || busy) return;
    const request = requestId.current;
    setBusy(true);
    setProgress(`Replacing question ${index + 1}…`);
    try {
      const result = await fetchWorksheetSelection({
        level, source, count: 1, shuffle: true,
        topic_ids: source === "topic" ? selectedTopicIds : [],
        refs: source === "mistakes" ? mistakeRefs : [],
        exclude_refs: loaded.map(({ item }) => questionRef(item)),
      });
      if (request !== requestId.current) return;
      if (result.error) throw new Error(result.error);
      const existing = new Set(loaded.map(({ item }) => questionKey(item)));
      const candidate = result.items.find((item) => !existing.has(questionKey(item)) && item.image_url && item.correct_answer);
      if (!candidate) throw new Error("No different question is available in this selection. Try another topic or source.");
      const replacement = await loadWorksheetImages([candidate]);
      if (request !== requestId.current) return;
      if (!replacement.loaded.length) throw new Error("The replacement image could not be loaded. Your original question is unchanged.");
      setLoaded(renumberWorksheet(loaded.map((entry, i) => i === index ? replacement.loaded[0] : entry)));
      toast.success(`Question ${index + 1} replaced`);
    } catch (error) {
      if (request !== requestId.current) return;
      toast.error(error instanceof Error ? error.message : "Could not replace this question");
    } finally { if (request === requestId.current) { setBusy(false); setProgress(null); } }
  };

  const saveSelection = () => {
    if (!loaded?.length) return;
    const saved: SavedWorksheetSelection = {
      id: crypto.randomUUID(), name: resolvedWorksheetName, level, savedAt: new Date().toISOString(),
      source, topics: picked, refs: loaded.map(({ item }) => questionRef(item)), includeSources, showTotalMarks,
    };
    const next = [saved, ...savedSelections].slice(0, 20);
    try { writeSavedWorksheets(next); setSavedSelections(next); toast.success("Selection saved on this device"); }
    catch { toast.error("Could not save on this device. Your worksheet is still available."); }
  };

  const restoreSelection = async (saved: SavedWorksheetSelection) => {
    if (busy) return;
    const request = requestId.current;
    setBusy(true);
    setProgress("Restoring saved questions…");
    try {
      // Re-resolve stable references to fresh signed images and current answer keys.
      const result = await fetchWorksheetSelection({ level, source: "mistakes", refs: saved.refs, count: saved.refs.length, shuffle: false });
      if (request !== requestId.current) return;
      if (result.error) throw new Error(result.error);
      const order = new Map(saved.refs.map((ref, index) => [questionKey(ref), index]));
      const items = result.items.filter((item) => order.has(questionKey(item)))
        .sort((a, b) => order.get(questionKey(a))! - order.get(questionKey(b))!)
        .map((item, index) => ({ ...item, worksheet_number: index + 1 }));
      const images = await loadWorksheetImages(items);
      if (request !== requestId.current) return;
      if (!images.loaded.length) throw new Error("These saved questions are currently unavailable. Your current worksheet is unchanged.");
      setSource(saved.source); setPicked(saved.topics); setWorksheetName(saved.name);
      setIncludeSources(saved.includeSources); setShowTotalMarks(saved.showTotalMarks);
      setCount(saved.refs.length); setCustomCount(COUNTS.includes(saved.refs.length) ? "" : String(saved.refs.length)); setShuffle(false);
      setSelection(result); setLoaded(renumberWorksheet(images.loaded));
      setFailed(images.failed.map(({ paper_code, question_number }) => ({ paper_code, question_number })));
      if (images.loaded.length < saved.refs.length) toast.warning(`Restored ${images.loaded.length} of ${saved.refs.length} questions; some are unavailable.`);
      else toast.success("Saved selection restored");
    } catch (error) {
      if (request !== requestId.current) return;
      toast.error(error instanceof Error ? error.message : "Could not restore this selection");
    }
    finally { if (request === requestId.current) { setBusy(false); setProgress(null); } }
  };

  const deleteSelection = (id: string) => {
    const next = savedSelections.filter((saved) => saved.id !== id);
    try { writeSavedWorksheets(next); setSavedSelections(next); }
    catch { toast.error("Could not delete the saved selection"); }
  };

  const download = async (kind: "worksheet" | "key") => {
    if (!loaded?.length) return;
    setBusy(true);
    try {
      if (kind === "worksheet") {
        const result = await generateWorksheetPdf(loaded, meta);
        if (result.unavailableQuestions.length) {
          toast.warning(`PDF opened, but question images ${result.unavailableQuestions.join(", ")} could not be printed. Rebuild before using it.`);
        }
      } else await generateAnswerKeyPdf(loaded, meta, includeSources);
    } catch (error) {
      console.error("Worksheet PDF generation failed", error);
      const detail = error instanceof Error ? error.message : "Unknown browser error";
      toast.error(`PDF generation failed: ${detail}`);
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

  if (!gradeDefinition.worksheetLevel) return <Navigate to={`/grade/${grade}`} replace />;

  return (
    <div className="min-h-screen bg-background bg-grid">
      <header className="border-b border-border/40">
        <div className="container py-8">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/grade/${grade}`}>{gradeDefinition.label}</Link>
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
        <fieldset disabled={busy} className="glass-card min-w-0 space-y-5 rounded-2xl p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Level</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-background px-3 text-sm font-medium">{LEVELS.find((item) => item.value === level)?.label}</div>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Topics — select one or more</Label>
                {!!picked.length && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      setPicked([]);
                      reset();
                    }}
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {!!picked.length && (
                <div className="flex flex-wrap gap-1.5">
                  {picked.map((p) => (
                    <Badge key={p.key} variant="secondary" className="gap-1 pr-1">
                      {p.label}
                      <button
                        type="button"
                        aria-label={`Remove ${p.label}`}
                        className="rounded-full p-0.5 hover:bg-background/40"
                        onClick={() => togglePick(p, false)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Badge variant="outline">
                    {picked.length} selected · {selectedPoolCount} questions
                  </Badge>
                </div>
              )}

              <div className="max-h-80 space-y-1 overflow-y-auto rounded-xl border border-border/40 p-2">
                {topicsLoading && (
                  <p className="p-2 text-sm text-muted-foreground">Loading topics…</p>
                )}
                {!topicsLoading && !tree.length && (
                  <p className="p-2 text-xs text-muted-foreground">
                    No topic-mapped questions with images for this level yet.
                  </p>
                )}
                {tree.map((t) => {
                  const topicKey = `topic:${t.key}`;
                  const parentOn = isPicked(topicKey);
                  const open = !!expanded[t.key];
                  return (
                    <div key={t.key} className="rounded-lg">
                      <div className="flex items-center gap-2 px-1 py-1.5">
                        <Checkbox
                          id={topicKey}
                          checked={parentOn}
                          onCheckedChange={(v) => {
                            const on = v === true;
                            // Selecting the whole topic supersedes its subtopics.
                            if (on) {
                              setPicked((prev) => [
                                ...prev.filter((p) => !p.key.startsWith(`sub:${t.key}:`)),
                                { key: topicKey, label: t.name, ids: t.ids, count: t.count },
                              ]);
                              reset();
                            } else {
                              togglePick({ key: topicKey, label: t.name, ids: t.ids, count: t.count }, false);
                            }
                          }}
                        />
                        <Label htmlFor={topicKey} className="flex-1 cursor-pointer text-sm font-normal">
                          <span className="text-muted-foreground">{t.code}</span> {t.name}{" "}
                          <span className="text-muted-foreground">({t.count})</span>
                        </Label>
                        {!!t.subtopics.length && (
                          <button
                            type="button"
                            aria-label={open ? "Hide subtopics" : "Show subtopics"}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted/40"
                            onClick={() => setExpanded((p) => ({ ...p, [t.key]: !open }))}
                          >
                            {open ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>

                      {open && !!t.subtopics.length && (
                        <div className="ml-6 space-y-1 border-l border-border/40 pl-3">
                          {t.subtopics.map((s) => {
                            const subKey = `sub:${t.key}:${s.key}`;
                            return (
                              <div key={s.key} className="flex items-center gap-2 py-1">
                                <Checkbox
                                  id={subKey}
                                  disabled={parentOn}
                                  checked={parentOn || isPicked(subKey)}
                                  onCheckedChange={(v) =>
                                    togglePick(
                                      { key: subKey, label: s.name, ids: s.ids, count: s.count },
                                      v === true,
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={subKey}
                                  className="flex-1 cursor-pointer text-xs font-normal text-muted-foreground"
                                >
                                  {s.code} {s.name} ({s.count})
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
            <Label htmlFor="worksheet-name">Worksheet Name</Label>
            <Input
              id="worksheet-name"
              value={worksheetName}
              maxLength={100}
              placeholder={defaultWorksheetName}
              onChange={(event) => setWorksheetName(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use: {defaultWorksheetName}
            </p>
          </div>

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
            <div className="flex items-center gap-2">
              <Switch id="total-marks" checked={showTotalMarks} onCheckedChange={setShowTotalMarks} />
              <Label htmlFor="total-marks">Show Total Marks</Label>
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
        </fieldset>

        {/* ---------------- preview ---------------- */}
        <section className="glass-card space-y-4 rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-lg font-semibold">Worksheet preview</h2><p className="mt-1 text-xs text-muted-foreground">Review the original questions before opening your PDF.</p></div>
            <Button variant="outline" size="sm" className="gap-2" disabled={busy || !loaded?.length} onClick={saveSelection}><Save className="h-4 w-4" />Save selection</Button>
          </div>
          <p role="status" className="text-sm text-muted-foreground">{busy ? progress ?? "Preparing PDF…" : loaded ? `${loaded.length} questions in your worksheet` : ""}</p>
          {savedSelections.some((saved) => saved.level === level) && <details className="rounded-xl border border-border/40 p-3">
            <summary className="cursor-pointer text-sm font-medium">Saved selections ({savedSelections.filter((saved) => saved.level === level).length})</summary>
            <p className="mt-2 text-xs text-muted-foreground">Saved on this device. Loading refreshes question images and answer keys.</p>
            <ul className="mt-3 space-y-2">{savedSelections.filter((saved) => saved.level === level).map((saved) => <li key={saved.id} className="flex flex-wrap items-center gap-2 border-t border-border/30 pt-2">
              <span className="min-w-0 flex-1 break-words text-sm">{saved.name}<span className="block text-xs text-muted-foreground">{saved.refs.length} questions · {new Date(saved.savedAt).toLocaleDateString()}</span></span>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => restoreSelection(saved)}>Load<span className="sr-only"> {saved.name}</span></Button>
              <Button variant="ghost" size="icon" disabled={busy} aria-label={`Delete saved selection ${saved.name}`} onClick={() => deleteSelection(saved.id)}><Trash2 className="h-4 w-4" /></Button>
            </li>)}</ul>
          </details>}

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
                  Questions ready: {loaded?.length ?? 0}
                </Badge>
              </div>
              <p className="text-muted-foreground">{sourceLabel}</p>
              <p className="font-medium">{resolvedWorksheetName}</p>

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
                    <ExternalLink className="h-4 w-4" /> Open worksheet PDF
                  </Button>
                  <Button
                    onClick={() => download("key")}
                    disabled={busy}
                    variant="outline"
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" /> Open answer key PDF
                  </Button>
                </div>
              )}

              {loaded !== null && !loaded.length && <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">All questions removed. Generate a new worksheet or load a saved selection.</p>}
              {!!loaded?.length && <div className="max-h-[75dvh] space-y-4 overflow-y-auto pr-1" aria-label="Question previews">
                {loaded.map((entry, index) => <article key={questionKey(entry.item)} className="overflow-hidden rounded-xl border border-border/50 bg-background/40">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 p-3">
                    <div className="min-w-0"><h3 className="text-sm font-semibold">Question {index + 1}</h3><p className="break-words text-xs text-muted-foreground">{entry.item.paper_code} · {entry.item.session} {entry.item.year} · Original Q{entry.item.question_number}</p>{entry.item.topic_name && <p className="text-xs text-grade">{entry.item.topic_name}</p>}</div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" disabled={busy} aria-label={`Replace question ${index + 1}`} onClick={() => replaceQuestion(index)} className="gap-1"><RefreshCw className="h-3.5 w-3.5" />Replace</Button>
                      <Button variant="ghost" size="sm" disabled={busy} aria-label={`Remove question ${index + 1}`} onClick={() => removeQuestion(index)} className="gap-1"><X className="h-3.5 w-3.5" />Remove</Button>
                    </div>
                  </div>
                  <div className="bg-white p-3"><img src={entry.dataUrl} alt={`Worksheet question ${index + 1}, ${entry.item.paper_code}, original question ${entry.item.question_number}`} width={entry.width} height={entry.height} className="h-auto w-full" /></div>
                </article>)}
              </div>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default WorksheetGeneratorPage;
