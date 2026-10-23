import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Flag, ListChecks, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import QuestionQueue from "@/components/theory-practice/QuestionQueue";
import QuestionStage from "@/components/theory-practice/QuestionStage";
import { GRADES, gradePath } from "@/lib/grades";
import { useSyncGrade } from "@/hooks/use-sync-grade";
import { useTopicsByIds } from "@/hooks/use-syllabus";
import { groupTheoryTopics } from "@/lib/theory-topic-selection";
import { filterTheoryQuestions, practiceGrade, readTheoryProgress, THEORY_PROGRESS_KEY, toggleTheoryId } from "@/lib/theory-practice";
import type { TheoryTopicalQuestion } from "@/lib/theory-topical-pdf";

export default function TheoryPracticePage() {
  const { level } = useParams();
  const grade = practiceGrade(level);
  return grade ? <TheoryPractice key={grade} grade={grade} /> : <Navigate to="/" replace />;
}
function TheoryPractice({ grade }: { grade: "as" | "a2" }) {
  const details = GRADES[grade];
  useSyncGrade(details.dbLevel);
  const [progress, setProgress] = useState(readTheoryProgress);
  const [activeId, setActiveId] = useState(() => progress.lastActive[grade] ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [year, setYear] = useState("all");
  const [series, setSeries] = useState("all");
  const [search, setSearch] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [storageFailed, setStorageFailed] = useState(false);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["theory-topical", details.dbLevel],
    queryFn: async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("get-theory-topical", { body: { level: details.dbLevel } });
      if (error || data?.error) throw new Error(data?.error ?? error?.message);
      return data as { questions: TheoryTopicalQuestion[]; topics: { id: string; topic_code: string; topic_name: string }[] };
    }, staleTime: 15 * 60 * 1000,
  });
  const questions = useMemo(() => (data?.questions ?? []).filter((q) => new RegExp(`^9702/${grade === "as" ? "2" : "4"}[1-3]$`).test(q.paper_code)), [data, grade]);
  const topicOptions = useMemo(() => [...new Map(questions.flatMap((q) => q.topics).map((t) => [t.id, t])).values()], [questions]);
  const { data: hierarchy } = useTopicsByIds(topicOptions.map((t) => t.id));
  const groups = useMemo(() => groupTheoryTopics(topicOptions, hierarchy?.topics ?? {}), [topicOptions, hierarchy]);
  const visible = useMemo(() => filterTheoryQuestions(questions, { topicIds, year, series, search, hideCompleted, flaggedOnly }, progress), [questions, topicIds, year, series, search, hideCompleted, flaggedOnly, progress]);
  const active = visible.find((q) => q.mapping_id === activeId) ?? visible[0];
  const index = active ? visible.findIndex((q) => q.mapping_id === active.mapping_id) : -1;
  useEffect(() => {
    if (!active) return;
    setActiveId(active.mapping_id);
    setProgress((p) => p.lastActive[grade] === active.mapping_id ? p : { ...p, lastActive: { ...p.lastActive, [grade]: active.mapping_id } });
  }, [active?.mapping_id, grade]);
  useEffect(() => { try { localStorage.setItem(THEORY_PROGRESS_KEY, JSON.stringify(progress)); setStorageFailed(false); } catch { setStorageFailed(true); } }, [progress]);
  const open = (id: string) => setActiveId(id);
  const move = (delta: number) => { const q = visible[index + delta]; if (q) open(q.mapping_id); };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input,textarea,select,button,[role=combobox],[contenteditable=true]") || e.ctrlKey || e.metaKey || e.altKey) return;
      if (["j", "k"].includes(e.key.toLowerCase())) { e.preventDefault(); move(e.key.toLowerCase() === "j" ? 1 : -1); }
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  });
  const toggle = (field: "completedQuestionIds" | "flaggedQuestionIds", ids: string[]) => setProgress((p) => ({ ...p, [field]: ids.reduce((list, id) => toggleTheoryId(list, id), p[field]) }));
  const completed = questions.filter((q) => progress.completedQuestionIds.includes(q.mapping_id)).length;
  const bulk = selectedIds.filter((id) => visible.some((q) => q.mapping_id === id));
  return <div data-grade={grade} className="min-h-screen bg-background">
    <header className="border-b border-border/40"><div className="container flex flex-wrap items-center justify-between gap-4 py-5">
      <div><Link to={gradePath(grade)} className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-grade"><ArrowLeft className="h-3 w-3" />{details.label} Physics</Link><h1 className="text-2xl font-semibold">Paper {grade === "as" ? "2" : "4"} Topical Theory Practice</h1><p className="mt-1 font-mono text-xs text-grade">9702 · {details.label}</p></div>
      <div className="text-right"><p className="text-sm text-grade">{completed} / {questions.length} completed</p><Link to={`/theory-papers/${encodeURIComponent(details.dbLevel)}`} className="text-xs text-muted-foreground hover:text-grade">Theory papers</Link></div>
    </div></header>
    <main className="container py-5">
      {storageFailed && <p role="status" className="mb-3 text-xs text-warning">Browser storage is unavailable. Progress will last only while this page stays open.</p>}
      <div className="mb-4 flex flex-wrap gap-2">
        <Popover><PopoverTrigger asChild><Button variant="outline" className="gap-2"><ListChecks className="h-4 w-4" />{topicIds.length ? `${topicIds.length} topics selected` : "All topics"}</Button></PopoverTrigger><PopoverContent align="start" className="max-h-[60vh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto">
          <Button variant="ghost" size="sm" onClick={() => setTopicIds([])}>All topics</Button>
          {groups.map((g) => <div key={g.topic.id} className="border-t border-border/40 py-2"><div className="flex items-start gap-2"><Checkbox aria-label={g.topic.topic_name} checked={g.mappedIds.every((id) => topicIds.includes(id))} onCheckedChange={(checked) => setTopicIds((ids) => checked ? [...new Set([...ids, ...g.mappedIds])] : ids.filter((id) => !g.mappedIds.includes(id)))} /><Button variant="ghost" className="h-auto min-w-0 flex-1 justify-start whitespace-normal p-0 text-left text-xs" aria-expanded={expanded.includes(g.topic.id)} onClick={() => setExpanded((ids) => toggleTheoryId(ids, g.topic.id))}>{g.topic.topic_code} {g.topic.topic_name}</Button></div>{expanded.includes(g.topic.id) && g.subtopics.map((t) => <label key={t.id} className="ml-5 mt-3 flex items-start gap-2 text-xs"><Checkbox aria-label={t.topic_name} checked={topicIds.includes(t.id)} onCheckedChange={() => setTopicIds((ids) => toggleTheoryId(ids, t.id))} />{t.topic_name}</label>)}</div>)}
        </PopoverContent></Popover>
        <Select value={year} onValueChange={setYear}><SelectTrigger aria-label="Year" className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All years</SelectItem>{[...new Set(questions.map((q) => q.year))].sort((a, b) => b - a).map((y) => <SelectItem value={String(y)} key={y}>{y}</SelectItem>)}</SelectContent></Select>
        <Select value={series} onValueChange={setSeries}><SelectTrigger aria-label="Exam series" className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All series</SelectItem>{[...new Set(questions.map((q) => q.session))].map((s) => <SelectItem value={s} key={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Input aria-label="Search questions" placeholder="Search questions" className="min-w-40 flex-1" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {isLoading ? <div className="flex min-h-80 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-grade" /></div> : isError ? <div className="space-y-3 py-10"><p className="text-destructive">Practice questions could not be loaded.</p><Button variant="outline" onClick={() => refetch()}>Try again</Button></div> : <div className="grid min-w-0 gap-4 lg:h-[calc(100dvh-18rem)] lg:min-h-[36rem] lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)]">
        <aside className="flex max-h-[65dvh] min-h-80 min-w-0 flex-col overflow-hidden rounded-lg border border-border/40 lg:max-h-none" aria-label="Practice questions">
          <div className="shrink-0 space-y-3 border-b border-border/40 p-3"><div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">Questions <span className="text-muted-foreground">({visible.length})</span></h2><div className="flex items-center gap-1"><Button variant="ghost" size="icon" title="Previous question" aria-label="Previous question" disabled={index <= 0} onClick={() => move(-1)}><ChevronLeft className="h-4 w-4" /></Button><span className="w-16 text-center text-xs">{index + 1} / {visible.length}</span><Button variant="ghost" size="icon" title="Next question" aria-label="Next question" disabled={index < 0 || index >= visible.length - 1} onClick={() => move(1)}><ChevronRight className="h-4 w-4" /></Button></div></div>
          <div className="flex flex-wrap items-center gap-4 text-xs"><label className="flex items-center gap-2"><Switch checked={hideCompleted} onCheckedChange={setHideCompleted} aria-label="Hide completed" />Hide completed</label><label className="flex items-center gap-2"><Switch checked={flaggedOnly} onCheckedChange={setFlaggedOnly} aria-label="Flagged only" />Flagged only</label></div>
          <div className="flex flex-wrap items-center gap-2"><label className="mr-auto flex items-center gap-2 text-xs"><Checkbox aria-label="Select all visible questions" checked={!!visible.length && bulk.length === visible.length} onCheckedChange={(checked) => setSelectedIds(checked ? visible.map((q) => q.mapping_id) : [])} />{bulk.length ? `${bulk.length} selected` : "Select all"}</label><Button variant="ghost" size="icon" title="Complete selected questions" aria-label="Complete selected questions" disabled={!bulk.length} onClick={() => { setProgress((p) => ({ ...p, completedQuestionIds: [...new Set([...p.completedQuestionIds, ...bulk])] })); setSelectedIds([]); }}><CheckCircle2 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title="Flag selected questions" aria-label="Flag selected questions" disabled={!bulk.length} onClick={() => { setProgress((p) => ({ ...p, flaggedQuestionIds: [...new Set([...p.flaggedQuestionIds, ...bulk])] })); setSelectedIds([]); }}><Flag className="h-4 w-4" /></Button></div></div>
          <QuestionQueue questions={visible} activeId={active?.mapping_id ?? ""} selectedIds={selectedIds} progress={progress} onOpen={open} onSelect={(id) => setSelectedIds((ids) => toggleTheoryId(ids, id))} />
        </aside>
        {active ? <QuestionStage question={active} completed={progress.completedQuestionIds.includes(active.mapping_id)} flagged={progress.flaggedQuestionIds.includes(active.mapping_id)} onComplete={() => toggle("completedQuestionIds", [active.mapping_id])} onFlag={() => toggle("flaggedQuestionIds", [active.mapping_id])} /> : <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">{questions.length ? "No questions match these filters." : "No reviewed questions are available yet."}</div>}
      </div>}
    </main>
  </div>;
}