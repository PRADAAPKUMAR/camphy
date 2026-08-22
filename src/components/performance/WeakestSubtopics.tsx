import { useMemo } from "react";
import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePaperMappings, useTopicsByIds } from "@/hooks/use-syllabus";
import { practiceTypeOf, type PerformanceRecord } from "@/lib/performance-history";
import { computeTopicTreePerformance, weakestSubtopics } from "@/lib/topic-performance";

/** Lowest-accuracy subtopics, so revision can be targeted. */
const WeakestSubtopics = ({ records }: { records: PerformanceRecord[] }) => {
  const paperIds = useMemo(
    () =>
      Array.from(
        new Set(
          records
            .filter((r) => practiceTypeOf(r) === "paper" && r.questionResults)
            .map((r) => r.paperId),
        ),
      ),
    [records],
  );

  const { data: mappings } = usePaperMappings(paperIds);
  const topicIds = useMemo(
    () =>
      Array.from(
        new Set(
          (mappings ?? [])
            .filter((m) => m.verified && m.mapping_type === "primary")
            .map((m) => m.syllabus_topic_id),
        ),
      ),
    [mappings],
  );
  const { data: lookup } = useTopicsByIds(topicIds);

  const weak = useMemo(() => {
    if (!mappings?.length || !lookup) return [];
    return weakestSubtopics(computeTopicTreePerformance(records, mappings, lookup));
  }, [records, mappings, lookup]);

  if (!weak.length) return null;

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Focus Next — Weakest Subtopics
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {weak.map((s) => (
          <div key={s.key} className="glass-card rounded-xl p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {s.code ? `${s.code} ` : ""}
                  {s.name}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {s.syllabusLabel} · {s.topicName}
                </p>
              </div>
              <Badge
                variant="outline"
                className="shrink-0 gap-1 border-rose-400/40 bg-rose-500/10 text-xs text-rose-300"
              >
                <TriangleAlert className="h-3 w-3" />
                {s.accuracy}%
              </Badge>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
              <div className="h-full rounded-full bg-rose-400/70" style={{ width: `${s.accuracy}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {s.correct}/{s.attempted} correct
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WeakestSubtopics;
