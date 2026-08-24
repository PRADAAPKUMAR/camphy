import { supabase } from "@/integrations/supabase/client";
import { fetchTopicsByIds, type SyllabusTopic } from "./syllabus";

/** Levels that have a topic-mapped past-paper MCQ bank. */
export const BANK_LEVELS = ["IGCSE", "AS LEVEL"] as const;
export type BankLevel = (typeof BANK_LEVELS)[number];

// question_topic_mapping / syllabus_topics are SQL-managed; generated types may lag.
const db = supabase as unknown as { from: (table: string) => any };

export interface MappedQuestion {
  paperId: string;
  paperCode: string;
  year: number | null;
  session: string | null;
  questionNumber: number;
  topicId: string;
}

const PAGE = 1000;

/** Every verified primary mapping for MCQ past papers of one level. */
export const fetchMappedQuestions = async (level: string): Promise<MappedQuestion[]> => {
  const out: MappedQuestion[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("question_topic_mapping")
      .select(
        "question_number, syllabus_topic_id, paper_id, papers!inner(id, level, paper_code, year, session)",
      )
      .eq("verified", true)
      .eq("mapping_type", "primary")
      .eq("papers.level", level)
      .order("question_number")
      .range(from, from + PAGE - 1);
    if (error) break;
    const rows = (data ?? []) as any[];
    rows.forEach((r) =>
      out.push({
        paperId: r.paper_id,
        paperCode: r.papers?.paper_code ?? "",
        year: r.papers?.year ?? null,
        session: r.papers?.session ?? null,
        questionNumber: r.question_number,
        topicId: r.syllabus_topic_id,
      }),
    );
    if (rows.length < PAGE) break;
  }
  return out;
};

export interface BankTopic {
  id: string;
  name: string;
  code: string;
  questions: MappedQuestion[];
  subtopics: { id: string; name: string; code: string; count: number }[];
}

/** Root-level topics of a level's bank, with the questions mapped under each. */
export const fetchBankTopics = async (level: string): Promise<BankTopic[]> => {
  const mapped = await fetchMappedQuestions(level);
  if (!mapped.length) return [];

  const { topics } = await fetchTopicsByIds(mapped.map((m) => m.topicId));

  const rootOf = (id: string): SyllabusTopic | null => {
    let node = topics[id];
    let guard = 0;
    while (node?.parent_topic_id && topics[node.parent_topic_id] && guard++ < 6) {
      node = topics[node.parent_topic_id];
    }
    return node ?? null;
  };

  // Topic names repeat across syllabus versions — merge by name.
  const groups = new Map<string, BankTopic>();
  const subCounts = new Map<string, Map<string, { name: string; code: string; count: number }>>();

  for (const q of mapped) {
    const root = rootOf(q.topicId);
    if (!root) continue;
    const key = root.topic_name.trim().toLowerCase();
    const group =
      groups.get(key) ??
      (groups
        .set(key, {
          id: root.id,
          name: root.topic_name,
          code: root.topic_code,
          questions: [],
          subtopics: [],
        })
        .get(key) as BankTopic);
    group.questions.push(q);

    const leaf = topics[q.topicId];
    if (leaf && leaf.id !== root.id) {
      const subs = subCounts.get(key) ?? new Map();
      subCounts.set(key, subs);
      const subKey = leaf.topic_name.trim().toLowerCase();
      const entry = subs.get(subKey) ?? { name: leaf.topic_name, code: leaf.topic_code, count: 0 };
      entry.count++;
      subs.set(subKey, entry);
    }
  }

  return Array.from(groups.entries())
    .map(([key, g]) => ({
      ...g,
      subtopics: Array.from(subCounts.get(key)?.entries() ?? []).map(([id, s]) => ({
        id,
        name: s.name,
        code: s.code,
        count: s.count,
      })),
    }))
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
};

/** Which (paper, question) pairs have an uploaded question image. */
export const fetchImageCoverage = async (paperIds: string[]): Promise<Set<string>> => {
  const set = new Set<string>();
  if (!paperIds.length) return set;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("question_images")
      .select("paper_id, question_number")
      .in("paper_id", paperIds)
      .range(from, from + PAGE - 1);
    if (error) break;
    const rows = (data ?? []) as any[];
    rows.forEach((r) => set.add(`${r.paper_id}:${r.question_number}`));
    if (rows.length < PAGE) break;
  }
  return set;
};

export interface BankSessionQuestion extends MappedQuestion {
  index: number;
}

/** Builds a playable topical set: image-backed questions, newest papers first. */
export const buildTopicalSet = async (
  level: string,
  topicSlug: string,
  max = 30,
): Promise<{ topic: BankTopic | null; questions: BankSessionQuestion[] }> => {
  const topics = await fetchBankTopics(level);
  const topic = topics.find((t) => slugifyTopic(t.name) === topicSlug) ?? null;
  if (!topic) return { topic: null, questions: [] };

  const coverage = await fetchImageCoverage(
    Array.from(new Set(topic.questions.map((q) => q.paperId))),
  );
  const withImages = topic.questions.filter((q) => coverage.has(`${q.paperId}:${q.questionNumber}`));
  const pool = (withImages.length ? withImages : topic.questions).slice();

  pool.sort(
    (a, b) =>
      (b.year ?? 0) - (a.year ?? 0) ||
      a.paperCode.localeCompare(b.paperCode) ||
      a.questionNumber - b.questionNumber,
  );

  return {
    topic,
    questions: pool.slice(0, max).map((q, i) => ({ ...q, index: i + 1 })),
  };
};

export const slugifyTopic = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
