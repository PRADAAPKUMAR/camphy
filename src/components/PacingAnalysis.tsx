import { Timer, TriangleAlert } from "lucide-react";
import { formatPacingTime, pacingSummary } from "@/lib/question-pacing";

interface PacingAnalysisProps {
  times: Record<number, number>;
  questions: number[];
  durationMinutes: number;
  estimated?: boolean;
}

export default function PacingAnalysis({ times, questions, durationMinutes, estimated }: PacingAnalysisProps) {
  const summary = pacingSummary(times, questions);
  if (!summary.count) return null;
  const target = durationMinutes * 60 / 40;
  return (
    <section aria-label="Pacing analysis" className="border-b border-border p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Timer className="h-4 w-4 text-primary" />Pacing analysis</h2>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-xs">
        <div><dt className="text-muted-foreground">Average / question</dt><dd className="mt-1 font-mono text-sm">{formatPacingTime(summary.average)}</dd></div>
        <div><dt className="text-muted-foreground">Paper target</dt><dd className="mt-1 font-mono text-sm">{formatPacingTime(target)}</dd></div>
        <div><dt className="text-muted-foreground">Fastest · Q{summary.fastest?.question}</dt><dd className="mt-1 font-mono">{formatPacingTime(summary.fastest?.seconds ?? 0)}</dd></div>
        <div><dt className="text-muted-foreground">Slowest · Q{summary.slowest?.question}</dt><dd className="mt-1 font-mono">{formatPacingTime(summary.slowest?.seconds ?? 0)}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">{summary.count} questions timed{estimated ? " · Estimated from active answer-sheet question" : " · Active question time"}</p>
      <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
        <TriangleAlert className={`mt-0.5 h-4 w-4 shrink-0 ${summary.bottlenecks.length ? "text-destructive" : "text-muted-foreground"}`} />
        <p>{summary.bottlenecks.length ? `${summary.bottlenecks.length} over 2 minutes: ${summary.bottlenecks.map((entry) => `Q${entry.question}`).join(", ")}` : "No questions over 2 minutes."}</p>
      </div>
      {summary.average > target && <p className="mt-2 text-xs text-destructive">Average pace is above the full-paper target.</p>}
    </section>
  );
}