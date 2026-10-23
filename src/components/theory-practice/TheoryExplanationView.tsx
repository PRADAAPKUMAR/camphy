import MathText from "@/components/MathText";
import type { TheoryExplanationPart } from "@/components/theory/TheoryExplanationDialog";
export interface PartMark { question_number: number; part_label: string; order_index: number; marks: number }
export default function TheoryExplanationView({ parts, marks }: { parts: TheoryExplanationPart[]; marks: PartMark[] }) {
  return <div className="space-y-6 p-5 sm:p-7">
    {!parts.length && <p className="text-sm text-muted-foreground">No explanation has been added for this question yet.</p>}
    {parts.map((part) => <section key={part.id} className="border-b border-border/40 pb-6">
      <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold text-grade">{part.part_label ? `Part ${part.part_label}` : `Question ${part.question_number}`}</h3>{marks.find((m) => m.part_label === (part.part_label ?? "")) && <span className="text-xs text-muted-foreground">{marks.find((m) => m.part_label === (part.part_label ?? ""))?.marks} marks</span>}</div>
      {part.explanation && <MathText text={part.explanation} />}
      {part.image_url && <img src={part.image_url} alt={`Question ${part.question_number} ${part.part_label ?? ""} explanation diagram`} className="mt-4 max-w-full rounded-md" loading="lazy" />}
    </section>)}
    {!!marks.length && <section><h3 className="mb-3 text-sm font-semibold">Subdivision marks</h3><div className="flex flex-wrap gap-3">{marks.map((m) => <span key={m.part_label} className="text-xs text-muted-foreground">{m.part_label || "Whole question"}: <span className="text-grade">{m.marks} marks</span></span>)}</div></section>}
  </div>;
}