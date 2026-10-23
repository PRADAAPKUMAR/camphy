import type { TheoryTopicalQuestion } from "@/lib/theory-topical-pdf";
export const THEORY_PROGRESS_KEY = "physicshq_theory_practice_state";
export interface TheoryProgress { completedQuestionIds: string[]; flaggedQuestionIds: string[]; lastActive: Record<string, string> }
export const emptyTheoryProgress = (): TheoryProgress => ({ completedQuestionIds: [], flaggedQuestionIds: [], lastActive: {} });
export function readTheoryProgress(): TheoryProgress {
  try {
    const value = JSON.parse(localStorage.getItem(THEORY_PROGRESS_KEY) ?? "null");
    if (!value || typeof value !== "object") return emptyTheoryProgress();
    const ids = (items: unknown) => Array.isArray(items) ? [...new Set(items.filter((id): id is string => typeof id === "string"))] : [];
    return { completedQuestionIds: ids(value.completedQuestionIds), flaggedQuestionIds: ids(value.flaggedQuestionIds), lastActive: Object.fromEntries(Object.entries(value.lastActive ?? {}).filter(([, id]) => typeof id === "string")) as Record<string, string> };
  } catch { return emptyTheoryProgress(); }
}
export const toggleTheoryId = (ids: string[], id: string) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
export function filterTheoryQuestions(questions: TheoryTopicalQuestion[], filters: { topicIds: string[]; year: string; series: string; search: string; hideCompleted: boolean; flaggedOnly: boolean }, progress: TheoryProgress) {
  return [...new Map(questions.filter((q) =>
    (!filters.topicIds.length || q.topics.some((t) => filters.topicIds.includes(t.id))) &&
    (filters.year === "all" || String(q.year) === filters.year) &&
    (filters.series === "all" || q.session === filters.series) &&
    (!filters.hideCompleted || !progress.completedQuestionIds.includes(q.mapping_id)) &&
    (!filters.flaggedOnly || progress.flaggedQuestionIds.includes(q.mapping_id)) &&
    `${q.paper_code} ${q.session} ${q.year} Q${q.question_number} ${q.topics.map((t) => t.topic_name).join(" ")}`.toLowerCase().includes(filters.search.trim().toLowerCase())
  ).map((q) => [q.mapping_id, q])).values()].sort((a, b) => b.year - a.year || a.paper_code.localeCompare(b.paper_code) || a.question_number - b.question_number);
}
export const practiceGrade = (level = "") => ["as", "as-level", "AS LEVEL"].includes(level) ? "as" : ["a2", "a2-level", "a-level", "A2 Level", "A LEVEL"].includes(level) ? "a2" : null;
export const theoryPracticePath = (grade: "as" | "a2") => `/theory-practice/${grade === "as" ? "as-level" : "a2-level"}`;