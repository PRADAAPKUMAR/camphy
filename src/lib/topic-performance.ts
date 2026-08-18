import type { PerformanceRecord } from "@/lib/performance-history";
import { practiceTypeOf } from "@/lib/performance-history";
import type { QuestionTopicMapping, SyllabusTopic } from "@/lib/syllabus";

export interface TopicAccuracyRow {
  topicId: string;
  topicCode: string;
  topicName: string;
  level: string | null;
  attempted: number;
  correct: number;
  accuracy: number;
}

/** Minimum mapped questions before showing topic stats (avoids misleading data). */
export const MIN_MAPPED_QUESTIONS = 10;

/**
 * Student answers -> paper/question -> verified question_topic_mapping ->
 * syllabus topic -> topic accuracy.
 *
 * Only verified *primary* mappings are counted. Unmapped questions are ignored
 * entirely, never bucketed into a fallback topic.
 */
export const computeTopicAccuracy = (
  records: PerformanceRecord[],
  mappings: QuestionTopicMapping[],
  topics: SyllabusTopic[],
): TopicAccuracyRow[] => {
  const byQuestion = new Map<string, string>();
  mappings.forEach((m) => {
    if (m.verified && m.mapping_type === "primary") {
      byQuestion.set(`${m.paper_id}:${m.question_number}`, m.syllabus_topic_id);
    }
  });
  if (!byQuestion.size) return [];

  const topicById = new Map(topics.map((t) => [t.id, t]));
  const tally = new Map<string, { attempted: number; correct: number }>();

  records.forEach((r) => {
    if (practiceTypeOf(r) !== "paper" || !r.questionResults) return;
    Object.entries(r.questionResults).forEach(([q, isCorrect]) => {
      const topicId = byQuestion.get(`${r.paperId}:${Number(q)}`);
      if (!topicId) return;
      const cur = tally.get(topicId) ?? { attempted: 0, correct: 0 };
      cur.attempted++;
      if (isCorrect) cur.correct++;
      tally.set(topicId, cur);
    });
  });

  return Array.from(tally.entries())
    .map(([topicId, t]) => {
      const topic = topicById.get(topicId);
      return {
        topicId,
        topicCode: topic?.topic_code ?? "",
        topicName: topic?.topic_name ?? "Unknown topic",
        level: topic?.level ?? null,
        attempted: t.attempted,
        correct: t.correct,
        accuracy: t.attempted ? Math.round((t.correct / t.attempted) * 100) : 0,
      };
    })
    .sort((a, b) => b.attempted - a.attempted);
};

export const totalMappedQuestions = (rows: TopicAccuracyRow[]) =>
  rows.reduce((s, r) => s + r.attempted, 0);
