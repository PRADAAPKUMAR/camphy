import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { componentForBoundary, estimateComponentGrade, type BoundaryPaper } from "@/lib/grade-boundaries";
import { COMPONENT_THRESHOLDS } from "@/lib/grade-boundary-data";
import ResultSummary from "@/components/ResultSummary";

afterEach(cleanup);
const paper: BoundaryPaper = { level: "AS LEVEL", session: "May / June", year: 2025, paper_code: "V2" };

describe("Cambridge component grade estimates", () => {
  it("matches canonical series, level and exact variant", () => {
    expect(componentForBoundary(paper)).toBe("12");
    expect(componentForBoundary({ ...paper, level: "IGCSE Physics", paper_code: "EXTENDED MCQ-V2" })).toBe("22");
    expect(componentForBoundary({ ...paper, level: "IGCSE", paper_code: "CORE MCQ-V1" })).toBe("11");
    const result = estimateComponentGrade({ ...paper, session: "s", level: "AS Level Physics" }, 29, 40);
    expect(result).toMatchObject({ available: true, grade: "B", nextGrade: { grade: "A", marksNeeded: 1 } });
    expect(estimateComponentGrade({ ...paper, session: "October / November" }, 30, 40)).toMatchObject({ grade: "B", nextGrade: { marksNeeded: 2 } });
  });
  it("checks every exact boundary and one mark below for all reviewed rows", () => {
    expect(COMPONENT_THRESHOLDS).toHaveLength(24);
    for (const row of COMPONENT_THRESHOLDS) {
      const p = { level: row.syllabus === "0625" ? "IGCSE" : "AS LEVEL", year: row.year, session: row.session, paper_code: row.component };
      expect(row.sourceUrl).toMatch(/^https:\/\/www\.cambridgeinternational\.org\/Images\/.*\.pdf$/);
      row.boundaries.forEach((boundary, index) => {
        expect(estimateComponentGrade(p, boundary.minimum, 40)).toMatchObject({ grade: boundary.grade });
        expect(estimateComponentGrade(p, boundary.minimum - 1, 40)).toMatchObject({ grade: row.boundaries[index + 1]?.grade ?? "U" });
      });
      expect(estimateComponentGrade(p, 40, 40)).toMatchObject({ grade: "A", nextGrade: null });
      expect(estimateComponentGrade(p, 0, 40)).toMatchObject({ grade: "U" });
    }
  });
  it("never borrows thresholds for missing years, series, components or partial papers", () => {
    for (const p of [{ ...paper, year: 2020 }, { ...paper, session: "March" }, { ...paper, paper_code: "V4" }, { ...paper, level: "A Level" }, { ...paper, level: "IGCSE", paper_code: "CORE MCQ-V2" }]) {
      expect(estimateComponentGrade(p, 30, 40).available).toBe(false);
    }
    for (const score of [-1, 41, NaN, 30.5]) expect(estimateComponentGrade(paper, score, 40).available).toBe(false);
    expect(estimateComponentGrade(paper, 15, 20).available).toBe(false);
  });
  it("shows source, next-grade marks and component disclaimer in paper results", () => {
    render(<MemoryRouter><ResultSummary score={29} totalQuestions={40} answers={{}} correctAnswers={{}} paper={paper} /></MemoryRouter>);
    expect(screen.getByLabelText("Estimated grade B")).toBeInTheDocument();
    expect(screen.getByText("1 more mark to A (30/40)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Official Cambridge thresholds/ })).toHaveAttribute("href", COMPONENT_THRESHOLDS.find((r) => r.syllabus === "9702" && r.year === 2025 && r.session === "s")?.sourceUrl);
    expect(screen.getByText(/not your overall qualification grade/)).toBeInTheDocument();
  });
  it("keeps topic and retry result panels unchanged without paper metadata", () => {
    render(<MemoryRouter><ResultSummary score={10} totalQuestions={20} answers={{}} correctAnswers={{}} /></MemoryRouter>);
    expect(screen.queryByLabelText("Cambridge grade estimate")).not.toBeInTheDocument();
  });
});