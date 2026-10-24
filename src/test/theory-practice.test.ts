import { describe, expect, it } from "vitest";
import { emptyTheoryProgress, filterTheoryQuestions, practiceGrade, readTheoryProgress, THEORY_PROGRESS_KEY, toggleTheoryId } from "@/lib/theory-practice";
import type { TheoryTopicalQuestion } from "@/lib/theory-topical-pdf";
const question = (id: string, topics: string[], year = 2025): TheoryTopicalQuestion => ({ mapping_id: id, paper_id: "paper", question_number: 1, start_page: 2, end_page: 3, shared_page_warning: false, marks: 12, paper_code: "9702/22", session: "May/June", year, question_url: "https://example.test/q.pdf", topics: topics.map((id) => ({ id, topic_code: id, topic_name: id })) });
const filters = { topicIds: [] as string[], year: "all", series: "all", search: "", hideCompleted: false, flaggedOnly: false };
describe("theory practice rules", () => {
  it("combines selected topics without duplicating shared-topic questions", () => {
    expect(filterTheoryQuestions([question("shared", ["a", "b"]), question("a", ["a"]), question("b", ["b"]), question("other", ["c"]), question("shared", ["a", "b"])], { ...filters, topicIds: ["a", "b"] }, emptyTheoryProgress()).map((q) => q.mapping_id)).toEqual(["shared", "a", "b"]);
  });
  it("hides completed questions and retains flagged-only filtering", () => {
    const progress = { ...emptyTheoryProgress(), completedQuestionIds: ["done"], flaggedQuestionIds: ["flagged", "done"] };
    expect(filterTheoryQuestions([question("done", []), question("flagged", []), question("other", [])], { ...filters, hideCompleted: true, flaggedOnly: true }, progress).map((q) => q.mapping_id)).toEqual(["flagged"]);
  });
  it("filters exact year and series", () => {
    expect(filterTheoryQuestions([question("2024", [], 2024), question("2025", [])], { ...filters, year: "2024", series: "May/June" }, emptyTheoryProgress()).map((q) => q.mapping_id)).toEqual(["2024"]);
  });
  it("restores local completion flags and grade-specific last question", () => {
    localStorage.setItem(THEORY_PROGRESS_KEY, JSON.stringify({ completedQuestionIds: ["q", "q"], flaggedQuestionIds: ["flag"], lastActive: { as: "q", a2: "different" } }));
    expect(readTheoryProgress()).toEqual({ completedQuestionIds: ["q"], flaggedQuestionIds: ["flag"], lastActive: { as: "q", a2: "different" } });
    localStorage.removeItem(THEORY_PROGRESS_KEY);
  });
  it("completion and flags are reversible", () => { expect(toggleTheoryId(["q"], "q")).toEqual([]); expect(toggleTheoryId([], "q")).toEqual(["q"]); });
  it("supports AS Paper 2 and A Level Paper 4 routes, not IGCSE", () => { expect(practiceGrade("as-level")).toBe("as"); expect(practiceGrade("a2-level")).toBe("a2"); expect(practiceGrade("igcse")).toBeNull(); });
});