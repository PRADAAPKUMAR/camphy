import type { TheoryTopicalQuestion } from "@/lib/theory-topical-pdf";
import type { TheoryProgress } from "@/lib/theory-practice";
import { CheckCircle2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
export default function QuestionQueue({ questions, activeId, selectedIds, progress, onOpen, onSelect }: { questions: TheoryTopicalQuestion[]; activeId: string; selectedIds: string[]; progress: TheoryProgress; onOpen: (id: string) => void; onSelect: (id: string) => void }) {
  return <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3" aria-label="Question queue">
    {!questions.length && <p className="p-4 text-sm text-muted-foreground">No questions match these filters.</p>}
    {questions.map((q) => <div key={q.mapping_id} className={`flex items-start gap-2 rounded-lg border p-3 ${activeId === q.mapping_id ? "border-grade/60 bg-grade/10" : "border-border/40 bg-card/30"}`}>
      <Checkbox className="mt-1" aria-label={`Select ${q.paper_code} ${q.session} ${q.year} Q${q.question_number}`} checked={selectedIds.includes(q.mapping_id)} onCheckedChange={() => onSelect(q.mapping_id)} />
      <Button variant="ghost" className="h-auto min-w-0 flex-1 flex-col items-start gap-2 whitespace-normal p-0 text-left hover:bg-transparent" onClick={() => onOpen(q.mapping_id)} aria-pressed={activeId === q.mapping_id}>
        <span className="flex w-full items-center justify-between gap-2"><span className="text-base font-semibold">Q{q.question_number}</span><span className="text-xs text-grade">{q.marks ? `${q.marks} marks` : "Marks pending"}</span></span>
        <span className="font-mono text-[11px] text-muted-foreground">{q.paper_code} · {q.session} {q.year}</span>
        <span className="flex flex-wrap gap-x-3 gap-y-1">{q.topics.map((t) => <span key={t.id} className="text-xs text-muted-foreground">{t.topic_code} {t.topic_name}</span>)}</span>
        <span className="flex items-center gap-3 text-xs">{progress.completedQuestionIds.includes(q.mapping_id) && <span className="flex items-center gap-1 text-success"><CheckCircle2 className="h-3 w-3" />Completed</span>}{progress.flaggedQuestionIds.includes(q.mapping_id) && <span className="flex items-center gap-1 text-warning"><Flag className="h-3 w-3" />Flagged</span>}</span>
      </Button>
    </div>)}
  </div>;
}