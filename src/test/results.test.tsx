import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import ResultSummary from "@/components/ResultSummary";
describe("result review", () => {
  it("does not mark unanswered questions with unavailable keys as correct", () => {
    const { container } = render(<MemoryRouter><ResultSummary score={1} totalQuestions={3} answers={{ 1: "A" }} correctAnswers={{ 1: "A" }} /></MemoryRouter>);
    expect(screen.getByText("1/3")).toBeInTheDocument();
    expect(container.querySelectorAll(".lucide-circle-check")).toHaveLength(1);
  });
});