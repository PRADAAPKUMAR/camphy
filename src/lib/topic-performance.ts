import type { PerformanceRecord } from "@/lib/performance-history";
import { practiceTypeOf } from "@/lib/performance-history";
import type { QuestionTopicMapping, SyllabusTopic, TopicLookup } from "@/lib/syllabus";

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

/* ------------------------------------------------------------------ *
 * Hierarchical view: syllabus (IGCSE / AS) -> topic -> subtopic -> Qs
 * ------------------------------------------------------------------ */

export interface TopicQuestionResult {
  paperId: string;
  paperCode: string;
  year: number | null;
  session: string | null;
  questionNumber: number;
  correct: boolean;
  completedAt: string;
}

interface Stats {
  attempted: number;
  correct: number;
  accuracy: number;
}

export interface SubtopicNode extends Stats {
  key: string;
  code: string;
  name: string;
  questions: TopicQuestionResult[];
}

export interface TopicNodeStats extends Stats {
  key: string;
  code: string;
  name: string;
  subtopics: SubtopicNode[];
}

export interface SyllabusGroup extends Stats {
  code: string;
  label: string;
  topics: TopicNodeStats[];
}

const SYLLABUS_LABEL: Record<string, string> = { "0625": "IGCSE", "9702": "AS & A Level" };

const pct = (correct: number, attempted: number) =>
  attempted ? Math.round((correct / attempted) * 100) : 0;

const codeSort = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

/**
 * Builds the two-column drill-down used on the performance page. Topics are
 * looked up by id (so older syllabus versions still resolve) and de-duplicated
 * by topic code across versions.
 */
export const computeTopicTreePerformance = (
  records: PerformanceRecord[],
  mappings: QuestionTopicMapping[],
  lookup: TopicLookup,
): SyllabusGroup[] => {
  const byQuestion = new Map<string, string>();
  mappings.forEach((m) => {
    if (m.verified && m.mapping_type === "primary") {
      byQuestion.set(`${m.paper_id}:${m.question_number}`, m.syllabus_topic_id);
    }
  });
  if (!byQuestion.size) return [];

  const { topics, versionCode } = lookup;

  type SubAcc = { code: string; name: string; questions: TopicQuestionResult[] };
  type TopicAcc = { code: string; name: string; subs: Map<string, SubAcc> };
  const groups = new Map<string, Map<string, TopicAcc>>();

  records.forEach((r) => {
    if (practiceTypeOf(r) !== "paper" || !r.questionResults) return;
    Object.entries(r.questionResults).forEach(([q, isCorrect]) => {
      const qNum = Number(q);
      const topicId = byQuestion.get(`${r.paperId}:${qNum}`);
      if (!topicId) return;
      const topic = topics[topicId];
      if (!topic) return;

      const parent = topic.parent_topic_id ? topics[topic.parent_topic_id] : undefined;
      const root = parent ?? topic;
      const syllabus = versionCode[root.syllabus_version_id] ?? "9702";

      const topicMap = groups.get(syllabus) ?? new Map<string, TopicAcc>();
      groups.set(syllabus, topicMap);

      const rootKey = `${root.topic_code}|${root.topic_name.toLowerCase()}`;
      const acc =
        topicMap.get(rootKey) ??
        { code: root.topic_code, name: root.topic_name, subs: new Map<string, SubAcc>() };
      topicMap.set(rootKey, acc);

      const subKey = parent
        ? `${topic.topic_code}|${topic.topic_name.toLowerCase()}`
        : `__self__|${root.topic_code}`;
      const sub =
        acc.subs.get(subKey) ??
        {
          code: parent ? topic.topic_code : root.topic_code,
          name: parent ? topic.topic_name : "General",
          questions: [] as TopicQuestionResult[],
        };
      acc.subs.set(subKey, sub);
      sub.questions.push({
        paperId: r.paperId,
        paperCode: r.paperCode,
        year: r.year ?? null,
        session: r.session ?? null,
        questionNumber: qNum,
        correct: !!isCorrect,
        completedAt: r.completedAt,
      });
    });
  });

  const result: SyllabusGroup[] = [];
  groups.forEach((topicMap, syllabus) => {
    const topicNodes: TopicNodeStats[] = [];
    topicMap.forEach((t, key) => {
      const subtopics: SubtopicNode[] = [];
      t.subs.forEach((s, subKey) => {
        const questions = [...s.questions].sort(
          (a, b) =>
            codeSort(a.paperCode, b.paperCode) || a.questionNumber - b.questionNumber,
        );
        const correct = questions.filter((q) => q.correct).length;
        subtopics.push({
          key: `${syllabus}:${key}:${subKey}`,
          code: s.code,
          name: s.name,
          questions,
          attempted: questions.length,
          correct,
          accuracy: pct(correct, questions.length),
        });
      });
      subtopics.sort((a, b) => codeSort(a.code, b.code));
      const attempted = subtopics.reduce((s, x) => s + x.attempted, 0);
      const correct = subtopics.reduce((s, x) => s + x.correct, 0);
      topicNodes.push({
        key: `${syllabus}:${key}`,
        code: t.code,
        name: t.name,
        subtopics,
        attempted,
        correct,
        accuracy: pct(correct, attempted),
      });
    });
    topicNodes.sort((a, b) => codeSort(a.code, b.code));
    const attempted = topicNodes.reduce((s, x) => s + x.attempted, 0);
    const correct = topicNodes.reduce((s, x) => s + x.correct, 0);
    result.push({
      code: syllabus,
      label: SYLLABUS_LABEL[syllabus] ?? syllabus,
      topics: topicNodes,
      attempted,
      correct,
      accuracy: pct(correct, attempted),
    });
  });

  // IGCSE column first, AS/A Level second
  return result.sort((a, b) => a.code.localeCompare(b.code));
};

export const totalTreeQuestions = (groups: SyllabusGroup[]) =>
  groups.reduce((s, g) => s + g.attempted, 0);
