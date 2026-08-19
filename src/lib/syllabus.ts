import { supabase } from "@/integrations/supabase/client";

/** Cambridge syllabus codes handled by PhysicsHQ. */
export type SyllabusCode = "0625" | "9702";

export interface SyllabusVersion {
  id: string;
  syllabus_code: string;
  syllabus_version: string;
  qualification: string | null;
  level: string | null;
  official_source_url: string | null;
  is_current: boolean;
}

export interface SyllabusTopic {
  id: string;
  syllabus_version_id: string;
  parent_topic_id: string | null;
  topic_code: string;
  topic_name: string;
  level: string | null;
  display_order: number | null;
  is_active: boolean;
}

export interface QuestionTopicMapping {
  paper_id: string;
  question_number: number;
  syllabus_topic_id: string;
  mapping_type: "primary" | "secondary";
  verified: boolean;
}

/** Canonical display labels. "A2" is a PhysicsHQ-only label, never a syllabus. */
export const displayLevel = (level?: string | null) => {
  const l = (level ?? "").trim().toUpperCase();
  if (l === "IGCSE") return "IGCSE";
  if (l === "AS" || l === "AS LEVEL") return "AS Level";
  if (l === "A2" || l === "A2 LEVEL" || l === "A LEVEL") return "A Level";
  return level ?? "";
};

/** Which Cambridge syllabus a level/paper belongs to. */
export const syllabusCodeForLevel = (level?: string | null): SyllabusCode =>
  (level ?? "").trim().toUpperCase() === "IGCSE" ? "0625" : "9702";

export const SYLLABUS_VERSION_LABEL: Record<SyllabusCode, string> = {
  "0625": "0625 2026-2028",
  "9702": "9702 2025-2027",
};

/** Stable identifier stored on performance records. */
export const syllabusVersionForLevel = (level?: string | null) =>
  SYLLABUS_VERSION_LABEL[syllabusCodeForLevel(level)];

// The syllabus tables are managed via SQL; the generated types may not know
// them yet, so these queries use an untyped client and fail soft.
const db = supabase as unknown as {
  from: (table: string) => any;
};

export const fetchSyllabusVersions = async (): Promise<SyllabusVersion[]> => {
  const { data, error } = await db.from("syllabus_versions").select("*").order("syllabus_code");
  if (error) return [];
  return (data ?? []) as SyllabusVersion[];
};

/** Topics for one syllabus only — versions are never mixed. */
export const fetchSyllabusTopics = async (code: SyllabusCode): Promise<SyllabusTopic[]> => {
  const versions = await fetchSyllabusVersions();
  const version = versions.find((v) => v.syllabus_code === code && v.is_current)
    ?? versions.find((v) => v.syllabus_code === code);
  if (!version) return [];
  const { data, error } = await db
    .from("syllabus_topics")
    .select("*")
    .eq("syllabus_version_id", version.id)
    .eq("is_active", true)
    .order("display_order");
  if (error) return [];
  return (data ?? []) as SyllabusTopic[];
};

export interface TopicNode extends SyllabusTopic {
  children: TopicNode[];
}

/** Builds the top-level -> subtopic hierarchy. */
export const buildTopicTree = (topics: SyllabusTopic[]): TopicNode[] => {
  const nodes = new Map<string, TopicNode>();
  topics.forEach((t) => nodes.set(t.id, { ...t, children: [] }));
  const roots: TopicNode[] = [];
  nodes.forEach((n) => {
    const parent = n.parent_topic_id ? nodes.get(n.parent_topic_id) : undefined;
    if (parent) parent.children.push(n);
    else roots.push(n);
  });
  const byOrder = (a: TopicNode, b: TopicNode) => (a.display_order ?? 0) - (b.display_order ?? 0);
  roots.sort(byOrder);
  roots.forEach((r) => r.children.sort(byOrder));
  return roots;
};

export interface QuestionTopics {
  primary: SyllabusTopic | null;
  secondary: SyllabusTopic[];
  syllabusVersion: string | null;
}

/**
 * Verified topic mapping for a single past-paper question
 * (paper_id + question_number).
 */
export const fetchQuestionTopics = async (
  paperId: string,
  questionNumber: number,
): Promise<QuestionTopics> => {
  const empty: QuestionTopics = { primary: null, secondary: [], syllabusVersion: null };
  const { data, error } = await db
    .from("question_topic_mapping")
    .select("mapping_type, verified, syllabus_topics(*), syllabus_topic_id")
    .eq("paper_id", paperId)
    .eq("question_number", questionNumber)
    .eq("verified", true);
  if (error || !data?.length) return empty;

  const versions = await fetchSyllabusVersions();
  let primary: SyllabusTopic | null = null;
  const secondary: SyllabusTopic[] = [];
  for (const row of data as any[]) {
    const topic = row.syllabus_topics as SyllabusTopic | null;
    if (!topic) continue;
    if (row.mapping_type === "primary") primary = topic;
    else secondary.push(topic);
  }
  const versionId = primary?.syllabus_version_id ?? secondary[0]?.syllabus_version_id;
  const version = versions.find((v) => v.id === versionId);
  return {
    primary,
    secondary,
    syllabusVersion: version ? `${version.syllabus_code} ${version.syllabus_version}` : null,
  };
};

/** Verified mappings for a set of papers — only fetched when needed. */
export const fetchPaperMappings = async (paperIds: string[]): Promise<QuestionTopicMapping[]> => {
  if (!paperIds.length) return [];
  const { data, error } = await db
    .from("question_topic_mapping")
    .select("paper_id, question_number, syllabus_topic_id, mapping_type, verified")
    .in("paper_id", paperIds)
    .eq("verified", true);
  if (error) return [];
  return (data ?? []) as QuestionTopicMapping[];
};

/** topic-practice topic name -> syllabus topic bridge. */
export interface TopicLookup {
  /** topic id -> topic (mapped topics + their ancestors, across all syllabus versions) */
  topics: Record<string, SyllabusTopic>;
  /** syllabus_version_id -> syllabus_code */
  versionCode: Record<string, string>;
}

/**
 * Topics referenced by question mappings can belong to older syllabus versions,
 * so they must be looked up by id (never filtered to the current version) —
 * otherwise they render as "Unknown topic".
 */
export const fetchTopicsByIds = async (ids: string[]): Promise<TopicLookup> => {
  const empty: TopicLookup = { topics: {}, versionCode: {} };
  if (!ids.length) return empty;

  const topics: Record<string, SyllabusTopic> = {};
  let pending = Array.from(new Set(ids));
  // walk up the parent chain (subtopic -> topic) in at most a few rounds
  for (let depth = 0; depth < 4 && pending.length; depth++) {
    const { data, error } = await db.from("syllabus_topics").select("*").in("id", pending);
    if (error) break;
    const rows = (data ?? []) as SyllabusTopic[];
    rows.forEach((t) => (topics[t.id] = t));
    pending = Array.from(
      new Set(
        rows
          .map((t) => t.parent_topic_id)
          .filter((p): p is string => !!p && !topics[p]),
      ),
    );
  }

  const versions = await fetchSyllabusVersions();
  const versionCode: Record<string, string> = {};
  versions.forEach((v) => (versionCode[v.id] = v.syllabus_code));
  return { topics, versionCode };
};

export const fetchTopicPracticeMap = async (): Promise<
  { topic: string; level: string; syllabus_topic_id: string }[]
> => {
  const { data, error } = await db
    .from("topic_practice_syllabus_map")
    .select("topic, level, syllabus_topic_id");
  if (error) return [];
  return data ?? [];
};
