import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, FileStack, Loader2, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { createTheoryTopicalPdf, type TheoryTopicalQuestion } from "@/lib/theory-topical-pdf";
import { gradeFromLevel, gradePath, normalizeGradeLabel } from "@/lib/grades";
import { useSyncGrade } from "@/hooks/use-sync-grade";

const getSupabase = () => import("@/integrations/supabase/client").then((module) => module.supabase);

const TheoryTopicalPdfPage = () => {
  const { level } = useParams<{ level: string }>();
  const decodedLevel = decodeURIComponent(level ?? "");
  const grade = gradeFromLevel(decodedLevel);
  const navigate = useNavigate();
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  useSyncGrade(decodedLevel);

  const { data, isLoading } = useQuery({
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

  const matching = useMemo(() => (data?.questions ?? []).filter((question) => question.topics.some((topic) => topicIds.includes(topic.id))), [data, topicIds]);
  const selected = useMemo(() => selectedIds.flatMap((id) => {
    const question = data?.questions.find((item) => item.mapping_id === id);
    return question ? [question] : [];
  }), [data, selectedIds]);
  const toggleTopic = (id: string, checked: boolean) => {
    const next = checked ? [...topicIds, id] : topicIds.filter((topicId) => topicId !== id);
    setTopicIds(next);
    const eligible = new Set((data?.questions ?? []).filter((question) => question.topics.some((topic) => next.includes(topic.id))).map((question) => question.mapping_id));
    setSelectedIds((current) => current.filter((mappingId) => eligible.has(mappingId)));
  };
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
    <header className="border-b border-border/40"><div className="container py-10">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/theory-papers/${encodeURIComponent(decodedLevel)}`)} className="mb-4 gap-1 text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Theory papers</Button>
      <h1 className="text-3xl font-extrabold">{normalizeGradeLabel(decodedLevel)} — Topical Theory PDF</h1>
      <p className="text-sm text-muted-foreground">Choose reviewed questions by topic and combine their original PDF pages.</p>
    </div></header>
    <main className="container grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <section><h2 className="mb-3 font-semibold">1. Select topics</h2>
          {isLoading ? <div className="grid gap-2 sm:grid-cols-2">{[1,2,3,4].map((item) => <Skeleton key={item} className="h-12" />)}</div> : !data?.topics.length ? <p className="rounded-lg border border-border/40 p-4 text-sm text-muted-foreground">No reviewed topic mappings are available for this level yet.</p> : <div className="grid gap-2 sm:grid-cols-2">{data.topics.map((topic) => <label key={topic.id} className="flex items-start gap-3 rounded-lg border border-border/40 p-3 hover:border-primary/40"><Checkbox checked={topicIds.includes(topic.id)} onCheckedChange={(checked) => toggleTopic(topic.id, checked === true)} /><span className="text-sm"><span className="mr-2 font-mono text-primary">{topic.topic_code}</span>{topic.topic_name}</span></label>)}</div>}
        </section>
        <section><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-semibold">2. Select questions</h2>{matching.length > 0 && <Button variant="outline" size="sm" onClick={() => setSelectedIds(matching.map((question) => question.mapping_id))}>Select all {matching.length}</Button>}</div>
          {!topicIds.length ? <p className="text-sm text-muted-foreground">Choose one or more topics first.</p> : !matching.length ? <p className="text-sm text-muted-foreground">No reviewed questions match these topics.</p> : <div className="space-y-2">{matching.map((question) => <label key={question.mapping_id} className="flex items-start gap-3 rounded-lg border border-border/40 p-3"><Checkbox checked={selectedIds.includes(question.mapping_id)} onCheckedChange={(checked) => setSelectedIds((current) => checked ? [...new Set([...current, question.mapping_id])] : current.filter((id) => id !== question.mapping_id))} /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{question.paper_code} · {question.session} {question.year} · Q{question.question_number}</span><span className="mt-1 flex flex-wrap gap-1">{question.topics.map((topic) => <Badge key={topic.id} variant="outline" className="text-[10px]">{topic.topic_name}</Badge>)}</span></span><span className="text-xs text-muted-foreground">pp. {question.start_page}–{question.end_page}</span>{question.shared_page_warning && <TriangleAlert className="h-4 w-4 text-warning" />}</label>)}</div>}
        </section>
      </div>
      <aside className="h-fit rounded-lg border border-border/40 bg-card p-4 lg:sticky lg:top-20"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">PDF order</h2><Badge>{selected.length}</Badge></div>
        <div className="max-h-[55vh] space-y-2 overflow-y-auto">{selected.map((question, index) => <div key={question.mapping_id} className="flex items-center gap-2 rounded-md border border-border/40 p-2 text-xs"><span className="w-5 font-bold text-primary">{index + 1}</span><span className="min-w-0 flex-1 truncate">{question.paper_code} Q{question.question_number}</span><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(index, -1)} disabled={index === 0}><ArrowUp className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(index, 1)} disabled={index === selected.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedIds((current) => current.filter((id) => id !== question.mapping_id))}><X className="h-3.5 w-3.5" /></Button></div>)}</div>
        <Button className="mt-4 w-full gap-2" onClick={generate} disabled={!selected.length || generating}>{generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileStack className="h-4 w-4" />}Open combined PDF</Button>
        {grade && <Button variant="link" asChild className="mt-2 w-full"><Link to={gradePath(grade)}>Grade Home</Link></Button>}
      </aside>
    </main>
  </div>;
};

export default TheoryTopicalPdfPage;