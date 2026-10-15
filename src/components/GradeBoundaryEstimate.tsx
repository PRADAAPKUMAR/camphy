import { ExternalLink, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gradeFromLevel } from "@/lib/grades";
import { estimateComponentGrade, type BoundaryPaper } from "@/lib/grade-boundaries";

interface Props {
  paper: BoundaryPaper;
  score: number;
  totalQuestions: number;
}

const SERIES = { s: "May/June", m: "February/March", w: "October/November" } as const;

export default function GradeBoundaryEstimate({ paper, score, totalQuestions }: Props) {
  const result = estimateComponentGrade(paper, score, totalQuestions);
  if (result.available === false) {
    return (
      <section aria-label="Cambridge grade estimate" className="border-b border-border px-4 py-4">
        <h2 className="text-sm font-semibold">Cambridge grade estimate</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{result.reason}</p>
      </section>
    );
  }
  const { threshold, grade, nextGrade } = result;
  const bands = [...threshold.boundaries].reverse();
  return (
    <section aria-label="Cambridge grade estimate" data-grade={gradeFromLevel(paper.level) ?? undefined} className="border-b border-border px-4 py-4 text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Estimated component grade</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {threshold.syllabus} · Paper {threshold.component}<br />
            {SERIES[threshold.session]} {threshold.year}
          </p>
        </div>
        <span className="grade-crest flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl" aria-label={`Estimated grade ${grade}`}>{grade}</span>
      </div>
      <svg viewBox="0 0 240 28" className="mt-4 block w-full overflow-visible" role="img" aria-label={`Score ${score} out of 40; ${threshold.boundaries.map((b) => `${b.grade} begins at ${b.minimum}`).join(", ")}`}>
        <line x1="4" y1="15" x2="236" y2="15" className="stroke-border" strokeWidth="4" />
        <line x1="4" y1="15" x2={4 + (score / 40) * 232} y2="15" className="stroke-grade" strokeWidth="4" />
        {bands.map((b) => <line key={b.grade} x1={4 + (b.minimum / 40) * 232} x2={4 + (b.minimum / 40) * 232} y1="10" y2="20" className="stroke-muted-foreground" />)}
        <circle cx={4 + (score / 40) * 232} cy="15" r="5" className="fill-grade stroke-card" strokeWidth="2" />
      </svg>
      <div className="flex gap-1" aria-label="Minimum marks by grade">
        {[{ grade: "U", minimum: 0 }, ...bands].map((b) => (
          <div key={b.grade} className={`min-w-0 flex-1 rounded-md py-1 text-center text-xs ${b.grade === grade ? "bg-grade-subtle text-grade ring-1 ring-grade" : "bg-muted/50 text-muted-foreground"}`}>
            <span className="block">{b.grade}</span>
            <span className="block font-mono text-[10px]">{b.minimum}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed">
        <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-grade" />
        {nextGrade ? `${nextGrade.marksNeeded} more ${nextGrade.marksNeeded === 1 ? "mark" : "marks"} to ${nextGrade.grade} (${nextGrade.minimum}/40)` : "Highest published component grade reached"}
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        Practice estimate for this component only, not your overall qualification grade. A* is not awarded to individual components.
      </p>
      <Button asChild variant="link" size="sm" className="mt-1 h-auto max-w-full gap-1.5 whitespace-normal px-0 py-1 text-xs text-grade">
        <a href={threshold.sourceUrl} target="_blank" rel="noopener noreferrer">Official Cambridge thresholds <ExternalLink className="h-3 w-3 shrink-0" /></a>
      </Button>
    </section>
  );
}