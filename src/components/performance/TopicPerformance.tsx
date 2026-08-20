import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePaperMappings, useTopicsByIds } from "@/hooks/use-syllabus";
import { practiceTypeOf, type PerformanceRecord } from "@/lib/performance-history";
import {
  computeTopicTreePerformance,
  MIN_MAPPED_QUESTIONS,
  totalTreeQuestions,
  type SubtopicNode,
  type SyllabusGroup,
  type TopicNodeStats,
} from "@/lib/topic-performance";

const Chevron = ({ open }: { open: boolean }) => (
  <ChevronRight
    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
  />
);

const QuestionChips = ({ questions }: { questions: SubtopicNode["questions"] }) => (
  <div className="flex flex-wrap gap-1.5 pt-2">
    {questions.map((q, i) => (
      <span
        key={`${q.paperId}-${q.questionNumber}-${q.completedAt}-${i}`}
        title={`${q.paperCode} · Q${q.questionNumber} · ${q.correct ? "Correct" : "Wrong"}`}
        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold ${
          q.correct
            ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
            : "border-rose-400/40 bg-rose-500/15 text-rose-300"
        }`}
      >
        <span className="font-mono opacity-90">{q.paperCode}</span>
        <span className="opacity-50">·</span>
        <span>Q{q.questionNumber}</span>
      </span>
    ))}
  </div>
);

const SubtopicRow = ({ sub }: { sub: SubtopicNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border/30 bg-muted/5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
      >
        <Chevron open={open} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium sm:text-sm">
            {sub.code ? `${sub.code} ` : ""}
            {sub.name}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {sub.correct}/{sub.attempted} correct
          </span>
        </span>
        <Badge variant="outline" className="shrink-0 border-border/40 text-[10px]">
          {sub.accuracy}%
        </Badge>
      </button>
      {open && (
        <div className="px-2.5 pb-2.5">
          <QuestionChips questions={sub.questions} />
        </div>
      )}
    </div>
  );
};

const TopicRow = ({ topic }: { topic: TopicNodeStats }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card rounded-xl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <Chevron open={open} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold sm:text-base">
            {topic.code ? `${topic.code} ` : ""}
            {topic.name}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {topic.attempted} attempted · {topic.correct} correct
          </span>
        </span>
        <Badge variant="outline" className="shrink-0 border-border/40 text-xs">
          {topic.accuracy}%
        </Badge>
      </button>
      {open && (
        <div className="space-y-1.5 px-3 pb-3">
          {topic.subtopics.map((s) => (
            <SubtopicRow key={s.key} sub={s} />
          ))}
        </div>
      )}
    </div>
  );
};

const GroupColumn = ({ group }: { group: SyllabusGroup }) => (
  <div className="space-y-2.5">
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-sm font-bold">{group.label}</h3>
      <span className="text-[11px] text-muted-foreground">
        {group.correct}/{group.attempted} · {group.accuracy}%
      </span>
    </div>
    {group.topics.map((t) => (
      <TopicRow key={t.key} topic={t} />
    ))}
  </div>
);

/**
 * Topic accuracy from verified question mappings only, split by syllabus and
 * drillable down to individual question outcomes.
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

  const groups = useMemo(() => {
    if (!mappings?.length || !lookup) return [];
    return computeTopicTreePerformance(records, mappings, lookup);
  }, [records, mappings, lookup]);

  if (totalTreeQuestions(groups) < MIN_MAPPED_QUESTIONS) return null;

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Topic Accuracy
      </h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {groups.map((g) => (
          <GroupColumn key={g.code} group={g} />
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Based only on past-paper questions with a verified syllabus topic mapping. Tap a topic to see
        subtopics, then a subtopic to see each question — green is correct, red is wrong.
      </p>
    </section>
  );
};

export default TopicPerformance;
