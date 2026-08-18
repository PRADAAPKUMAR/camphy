import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { usePaperMappings, useSyllabusTopics } from "@/hooks/use-syllabus";
import { practiceTypeOf, type PerformanceRecord } from "@/lib/performance-history";
import {
  computeTopicAccuracy,
  MIN_MAPPED_QUESTIONS,
  totalMappedQuestions,
} from "@/lib/topic-performance";

/**
 * Topic accuracy from verified question mappings only.
 * Renders nothing until there is enough mapped data to be meaningful.
 */
const TopicPerformance = ({ records }: { records: PerformanceRecord[] }) => {
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
  const { data: igcseTopics } = useSyllabusTopics("IGCSE", !!mappings?.length);
  const { data: alevelTopics } = useSyllabusTopics("AS Level", !!mappings?.length);

  const rows = useMemo(() => {
    if (!mappings?.length) return [];
    return computeTopicAccuracy(records, mappings, [...(igcseTopics ?? []), ...(alevelTopics ?? [])]);
  }, [records, mappings, igcseTopics, alevelTopics]);

  if (totalMappedQuestions(rows) < MIN_MAPPED_QUESTIONS) return null;

  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div
          key={r.topicId}
          className="glass-card flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold sm:text-base">
              {r.topicCode ? `${r.topicCode} ` : ""}
              {r.topicName}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
              {r.attempted} attempted · {r.correct} correct
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {r.level && (
              <Badge variant="outline" className="border-border/50 px-1.5 py-0 text-[10px]">
                {r.level}
              </Badge>
            )}
            <Badge variant="outline" className="border-border/40 text-xs">
              {r.accuracy}%
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopicPerformance;
