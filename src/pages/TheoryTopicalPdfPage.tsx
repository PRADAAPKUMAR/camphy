import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, ChevronDown, FileStack, Loader2, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { createTheoryTopicalPdf, type TheoryTopicalQuestion } from "@/lib/theory-topical-pdf";
import { addTheoryQuestionIds, groupTheoryTopics } from "@/lib/theory-topic-selection";
import { gradeFromLevel, gradePath, normalizeGradeLabel } from "@/lib/grades";
import { useSyncGrade } from "@/hooks/use-sync-grade";
import { useTopicsByIds } from "@/hooks/use-syllabus";

const getSupabase = () => import("@/integrations/supabase/client").then((module) => module.supabase);

const TheoryTopicalPdfPage = () => {
  const { level } = useParams<{ level: string }>();
  const decodedLevel = decodeURIComponent(level ?? "");
  const grade = gradeFromLevel(decodedLevel);
  const navigate = useNavigate();
  const [activeTopicId, setActiveTopicId] = useState("");
  const [subtopicId, setSubtopicId] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  useSyncGrade(decodedLevel);

  // A new level has a different question bank; topic changes within it do not clear the basket.
  useEffect(() => {
    setActiveTopicId("");
    setSubtopicId("all");
    setSelectedIds([]);
  }, [decodedLevel]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["theory-topical", decodedLevel],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase.functions.invoke("get-theory-topical", { body: { level: decodedLevel } });
      if (error) throw new Error(data?.error ?? error.message);
      if (data?.error) throw new Error(data.error);
      return data as { questions: TheoryTopicalQuestion[]; topics: { id: string; topic_code: string; topic_name: string }[] };
    },
    enabled: !!decodedLevel,
    staleTime: 15 * 60 * 1000,
  });
  const mappedTopicIds = useMemo(() => (data?.topics ?? []).map((topic) => topic.id), [data]);
  const { data: hierarchy, isLoading: loadingHierarchy } = useTopicsByIds(mappedTopicIds);
  const groups = useMemo(() => groupTheoryTopics(data?.topics ?? [], hierarchy?.topics ?? {}), [data, hierarchy]);
  const activeGroup = groups.find((group) => group.topic.id === activeTopicId);
  const matching = useMemo(() => {
    const ids = new Set(subtopicId === "all" ? activeGroup?.mappedIds ?? [] : [subtopicId]);
    return (data?.questions ?? []).filter((question) => question.topics.some((topic) => ids.has(topic.id)));
  }, [data, activeGroup, subtopicId]);
  const selected = useMemo(() => selectedIds.flatMap((id) => {
    const question = data?.questions.find((item) => item.mapping_id === id);
    return question ? [question] : [];
  }), [data, selectedIds]);
  const move = (index: number, delta: number) => setSelectedIds((current) => {
    const target = index + delta;
    if (target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const generate = async () => {
    if (!selected.length) return toast.error("Select at least one mapped question");
    setGenerating(true);
    try { await createTheoryTopicalPdf(selected); } catch (error) { toast.error(error instanceof Error ? error.message : "PDF generation failed"); } finally { setGenerating(false); }
  };

  return <div className="min-h-screen bg-background bg-grid">
    <header className="border-b border-border/40"><div className="container py-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/theory-papers/${encodeURIComponent(decodedLevel)}`)} className="mb-3 gap-1 text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Theory papers</Button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{normalizeGradeLabel(decodedLevel)} — Topical Theory PDF</h1>
        {grade && <Button variant="link" asChild><Link to={gradePath(grade)}>Grade Home</Link></Button>}
      </div>
    </div></header>
    <main className="container grid items-start gap-6 py-6 md:grid-cols-[minmax(220px,300px)_minmax(0,1fr)]">
      <section className="min-w-0 md:sticky md:top-20" aria-label="Topic browser">
        <h2 className="mb-3 font-semibold">Topics</h2>
        {isLoading || loadingHierarchy ? <div className="space-y-2">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-12" />)}</div>
          : isError ? <div className="space-y-3"><p className="text-sm text-destructive">Questions could not be loaded.</p><Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button></div>
          : !groups.length ? <p className="text-sm text-muted-foreground">No reviewed topic mappings are available for this level yet.</p>
          : <div className="space-y-1" role="group" aria-label="Main topics">{groups.map(({ topic, subtopics }) => <div key={topic.id}><Button
            variant={activeTopicId === topic.id ? "secondary" : "ghost"}
            aria-expanded={activeTopicId === topic.id}
            aria-controls={`subtopics-${topic.id}`}
            className="h-auto min-h-11 w-full justify-start gap-3 whitespace-normal px-3 py-3 text-left"
            onClick={() => { setActiveTopicId(activeTopicId === topic.id ? "" : topic.id); setSubtopicId("all"); }}>
            <span className="shrink-0 font-mono text-primary">{topic.topic_code}</span><span className="min-w-0 flex-1 break-words">{topic.topic_name}</span>
            <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none ${activeTopicId === topic.id ? "rotate-180" : ""}`} />
          </Button>
          {activeTopicId === topic.id && <div id={`subtopics-${topic.id}`} role="group" aria-label={`${topic.topic_name} subtopics`} className="my-2 ml-5 space-y-1 border-l border-border/40 pl-3">
            <Button variant={subtopicId === "all" ? "secondary" : "ghost"} aria-pressed={subtopicId === "all"} className="h-auto min-h-9 w-full justify-start whitespace-normal py-2 text-left text-xs" onClick={() => setSubtopicId("all")}>All questions in this topic</Button>
            {subtopics.map((subtopic) => <Button key={subtopic.id} variant={subtopicId === subtopic.id ? "secondary" : "ghost"} aria-pressed={subtopicId === subtopic.id} className="h-auto min-h-9 w-full justify-start gap-2 whitespace-normal py-2 text-left text-xs" onClick={() => setSubtopicId(subtopic.id)}>
              <span className="shrink-0 font-mono text-primary">{subtopic.topic_code}</span><span className="min-w-0 break-words">{subtopic.topic_name}</span>
            </Button>)}
          </div>}
          </div>)}</div>}
      </section>
      <div className="min-w-0 space-y-6">
        <section aria-label="Selected questions" className="sticky top-16 z-10 border-y border-border bg-background py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-semibold">Your PDF <Badge>{selected.length} selected</Badge></h2>
            <Button className="w-full gap-2 sm:w-auto" onClick={generate} disabled={!selected.length || generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileStack className="h-4 w-4" />}
              {generating ? "Creating PDF…" : "Create theory PDF"}
            </Button>
          </div>
          {selected.length > 0 && <div className="mt-3 max-h-48 space-y-1 overflow-y-auto" aria-label="PDF question order">{selected.map((question, index) => <div key={question.mapping_id} className="flex items-center gap-2 border-b border-border/40 py-2 text-xs">
            <span className="w-5 shrink-0 font-bold text-primary">{index + 1}</span>
            <span className="min-w-0 flex-1 break-words">{question.paper_code} · {question.session} {question.year} · Q{question.question_number}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" title="Move question up" aria-label={`Move question ${index + 1} up`} onClick={() => move(index, -1)} disabled={index === 0}><ArrowUp className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" title="Move question down" aria-label={`Move question ${index + 1} down`} onClick={() => move(index, 1)} disabled={index === selected.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" title="Remove question" aria-label={`Remove question ${index + 1}`} onClick={() => setSelectedIds((current) => current.filter((id) => id !== question.mapping_id))}><X className="h-3.5 w-3.5" /></Button>
          </div>)}</div>}
          {selected.some((question) => question.shared_page_warning) && <p className="mt-3 flex items-start gap-2 text-xs text-warning"><TriangleAlert className="h-4 w-4 shrink-0" />Some selected questions share pages; the PDF will include their complete mapped pages.</p>}
        </section>
        <section aria-label="Available questions">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">{activeGroup?.topic.topic_name ?? "Questions"}{activeGroup && <span className="ml-2 text-sm font-normal text-muted-foreground">({matching.length})</span>}</h2>
            {matching.length > 0 && <Button variant="outline" size="sm" onClick={() => setSelectedIds((current) => addTheoryQuestionIds(current, matching.map((question) => question.mapping_id)))}>Select all {matching.length}</Button>}
          </div>
          {!activeGroup ? <p className="text-sm text-muted-foreground">Select a topic to view its questions.</p> : !matching.length ? <p className="text-sm text-muted-foreground">No reviewed questions match this subtopic.</p> : <div className="space-y-2">{matching.map((question) => <label key={question.mapping_id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/40 p-3 hover:border-primary/40">
            <Checkbox aria-label={`Select ${question.paper_code} Q${question.question_number}`} checked={selectedIds.includes(question.mapping_id)} onCheckedChange={(checked) => setSelectedIds((current) => checked === true ? addTheoryQuestionIds(current, [question.mapping_id]) : current.filter((id) => id !== question.mapping_id))} />
            <span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold">{question.paper_code} · {question.session} {question.year} · Q{question.question_number}</span><span className="mt-1 flex flex-wrap gap-1">{question.topics.map((topic) => <Badge key={topic.id} variant="outline" className="whitespace-normal text-[10px]">{topic.topic_name}</Badge>)}</span><span className="mt-2 block text-xs text-muted-foreground">Pages {question.start_page}–{question.end_page}</span></span>
            {question.shared_page_warning && <TriangleAlert aria-label="Shared pages" className="h-4 w-4 shrink-0 text-warning" />}
          </label>)}</div>}
        </section>
      </div>
    </main>
  </div>;
};

export default TheoryTopicalPdfPage;
