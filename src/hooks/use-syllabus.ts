import { useQuery } from "@tanstack/react-query";
import {
  buildTopicTree,
  fetchPaperMappings,
  fetchQuestionTopics,
  fetchSyllabusTopics,
  fetchSyllabusVersions,
  fetchTopicPracticeMap,
  fetchTopicsByIds,
  syllabusCodeForLevel,
  type SyllabusCode,
} from "@/lib/syllabus";

// Syllabus data changes once every few years — cache it hard.
const STATIC = { staleTime: Infinity, gcTime: 24 * 60 * 60 * 1000 } as const;

export const useSyllabusVersions = () =>
  useQuery({ queryKey: ["syllabus-versions"], queryFn: fetchSyllabusVersions, ...STATIC });

/** Topics of the syllabus that matches the given level (no version picker needed). */
export const useSyllabusTopics = (level?: string | null, enabled = true) => {
  const code: SyllabusCode = syllabusCodeForLevel(level);
  return useQuery({
    queryKey: ["syllabus-topics", code],
    queryFn: () => fetchSyllabusTopics(code),
    enabled,
    ...STATIC,
  });
};

export const useSyllabusTopicTree = (level?: string | null, enabled = true) => {
  const query = useSyllabusTopics(level, enabled);
  return { ...query, tree: query.data ? buildTopicTree(query.data) : [] };
};

/** Verified topic mapping for one past-paper question. Off unless asked for. */
export const useQuestionTopics = (paperId?: string, questionNumber?: number, enabled = true) =>
  useQuery({
    queryKey: ["question-topics", paperId, questionNumber],
    queryFn: () => fetchQuestionTopics(paperId!, questionNumber!),
    enabled: enabled && !!paperId && !!questionNumber,
    staleTime: 60 * 60 * 1000,
  });

/** Verified mappings for the papers a student actually attempted. */
export const usePaperMappings = (paperIds: string[], enabled = true) =>
  useQuery({
    queryKey: ["paper-topic-mappings", [...paperIds].sort().join(",")],
    queryFn: () => fetchPaperMappings(paperIds),
    enabled: enabled && paperIds.length > 0,
    staleTime: 60 * 60 * 1000,
  });

export const useTopicPracticeMap = () =>
  useQuery({ queryKey: ["topic-practice-syllabus-map"], queryFn: fetchTopicPracticeMap, ...STATIC });

/** Resolves mapped topic ids (any syllabus version) plus their parent topics. */
export const useTopicsByIds = (ids: string[], enabled = true) =>
  useQuery({
    queryKey: ["syllabus-topics-by-id", [...ids].sort().join(",")],
    queryFn: () => fetchTopicsByIds(ids),
    enabled: enabled && ids.length > 0,
    ...STATIC,
  });
