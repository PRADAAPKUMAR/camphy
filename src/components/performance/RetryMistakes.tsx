import { useMemo } from "react";
import { Link } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { collectWrongQuestions, type PerformanceRecord } from "@/lib/performance-history";

/** Re-attempt only the questions previously answered wrong, per paper. */
const RetryMistakes = ({ records }: { records: PerformanceRecord[] }) => {
  const sets = useMemo(() => collectWrongQuestions(records).slice(0, 6), [records]);
  if (!sets.length) return null;

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Retry Your Mistakes
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sets.map((s) => (
          <Link
            key={s.paperId}
            to={`/question-mode/${s.paperId}?qs=${s.questions.join(",")}`}
            className="glass-card flex flex-col gap-2 rounded-xl p-4 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-mono text-sm font-semibold">{s.paperCode}</p>
              <Badge variant="outline" className="shrink-0 border-border/40 text-[11px]">
                {s.questions.length} wrong
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {[s.session, s.year].filter(Boolean).join(" ")} · {s.level}
            </p>
            <p className="line-clamp-2 font-mono text-[11px] text-muted-foreground/80">
              Q{s.questions.join(", Q")}
            </p>
            <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
              <RotateCcw className="h-3.5 w-3.5" /> Retry in Question mode
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RetryMistakes;
