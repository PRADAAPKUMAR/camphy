import { lazy, Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, CheckCircle2, FileText, Flag, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TheoryTopicalQuestion } from "@/lib/theory-topical-pdf";
import type { TheoryExplanationPart } from "@/components/theory/TheoryExplanationDialog";
import TheoryExplanationView, { type PartMark } from "./TheoryExplanationView";
const TheoryPdfReader = lazy(() => import("./TheoryPdfReader"));
export default function QuestionStage({ question, completed, flagged, onComplete, onFlag }: { question: TheoryTopicalQuestion; completed: boolean; flagged: boolean; onComplete: () => void; onFlag: () => void }) {
  const [tab, setTab] = useState("question");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["theory-practice-paper", question.paper_id],
    queryFn: async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("get-theory-paper", { body: { theory_paper_id: question.paper_id } });
      if (error || data?.error) throw new Error(data?.error ?? error?.message);
      return data as { question_url: string | null; answer_url: string | null; explanations: TheoryExplanationPart[]; part_marks?: PartMark[] };
    }, staleTime: 60 * 60 * 1000,
  });
  const marks = (data?.part_marks ?? []).filter((m) => m.question_number === question.question_number);
  return <section className="flex h-[75dvh] min-h-[36rem] min-w-0 flex-col overflow-hidden rounded-lg border border-border/40 bg-card lg:h-full lg:min-h-0" aria-label="Question and answer stage">
    <div className="shrink-0 border-b border-border/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Question {question.question_number} <span className="ml-2 text-sm text-grade">{question.marks ? `${question.marks} marks` : "Marks pending"}</span></h2><p className="mt-1 font-mono text-xs text-muted-foreground">{question.paper_code} · {question.session} {question.year}</p></div><div className="flex gap-1">
        <Button variant={flagged ? "secondary" : "ghost"} size="icon" title={flagged ? "Remove flag" : "Flag question"} aria-label={flagged ? "Remove flag" : "Flag question"} aria-pressed={flagged} onClick={onFlag}><Flag className={`h-4 w-4 ${flagged ? "text-warning" : ""}`} /></Button>
        <Button variant={completed ? "secondary" : "outline"} size="sm" aria-pressed={completed} onClick={onComplete} className="gap-2"><CheckCircle2 className="h-4 w-4" />{completed ? "Completed" : "Complete"}</Button>
      </div></div>
      <Tabs value={tab} onValueChange={setTab}><TabsList className="grid h-auto w-full grid-cols-3"><TabsTrigger value="question" className="gap-1 px-1 py-2 text-xs data-[state=active]:text-grade sm:text-sm"><FileText className="h-4 w-4 shrink-0" />Question</TabsTrigger><TabsTrigger value="scheme" className="gap-1 px-1 py-2 text-xs data-[state=active]:text-grade sm:text-sm"><BookOpenCheck className="hidden h-4 w-4 shrink-0 sm:block" />Official answer key</TabsTrigger><TabsTrigger value="explanation" className="gap-1 px-1 py-2 text-xs data-[state=active]:text-grade sm:text-sm"><Lightbulb className="hidden h-4 w-4 shrink-0 sm:block" />Explanation</TabsTrigger></TabsList></Tabs>
    </div>
    {question.shared_page_warning && tab === "question" && <p className="shrink-0 border-b border-border/40 px-4 py-2 text-xs text-warning">These original pages may include part of an adjacent question.</p>}
    <div role="tabpanel" aria-label={tab === "question" ? "Question" : tab === "scheme" ? "Official answer key" : "Explanation"} className="flex min-h-0 flex-1 flex-col">
      {tab === "question" ? <Suspense fallback={<Loader2 className="m-auto h-6 w-6 animate-spin text-grade" />}><TheoryPdfReader key={`${question.mapping_id}-q`} url={data?.question_url ?? question.question_url} start={question.start_page} end={question.end_page} title="Question PDF" /></Suspense>
        : isLoading ? <Loader2 className="m-auto h-6 w-6 animate-spin text-grade" />
        : isError ? <div className="space-y-3 p-6"><p className="text-sm text-destructive">The answer key and explanation could not be loaded.</p><Button variant="outline" onClick={() => refetch()}>Try again</Button></div>
        : tab === "scheme" ? data?.answer_url ? <Suspense fallback={<Loader2 className="m-auto h-6 w-6 animate-spin text-grade" />}><TheoryPdfReader key={`${question.paper_id}-ms`} url={data.answer_url} title="Official mark scheme" searchable /></Suspense> : <p className="p-6 text-sm text-muted-foreground">The official answer key has not been uploaded yet.</p>
        : <div className="min-h-0 flex-1 overflow-y-auto"><TheoryExplanationView parts={(data?.explanations ?? []).filter((p) => p.question_number === question.question_number)} marks={marks} /></div>}
    </div>
  </section>;
}