import { act, render, renderHook, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { QuestionPacingClock, pacingSummary, paperDurationMinutes } from "@/lib/question-pacing";
import { useQuestionPacing } from "@/hooks/use-question-pacing";
import ResultSummary from "@/components/ResultSummary";

describe("question pacing", () => {
  it("accumulates revisits, pauses idle time and freezes answers", () => {
    let now = 0;
    const clock = new QuestionPacingClock(() => now);
    clock.activate(1, true);
    now = 30000; clock.activate(2, true);
    now = 50000; clock.activate(1, true);
    now = 65000; clock.activate(1, false);
    now = 125000; clock.activate(1, true);
    now = 135000; clock.commit(1);
    now = 200000; clock.activate(1, true);
    now = 300000;
    expect(clock.snapshot()).toEqual({ 1: 55, 2: 20 });
  });

  it("pauses on hidden tabs and stops at finish", () => {
    let now = 0;
    const spy = vi.spyOn(performance, "now").mockImplementation(() => now);
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    const { result, unmount } = renderHook(() => useQuestionPacing(1, true));
    now = 10000;
    act(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
    now = 100000;
    act(() => { Object.defineProperty(document, "hidden", { configurable: true, value: false }); document.dispatchEvent(new Event("visibilitychange")); });
    now = 110000;
    expect(result.current.finish()).toEqual({ 1: 20 });
    now = 200000;
    expect(result.current.finish()).toEqual({ 1: 20 });
    unmount(); spy.mockRestore();
  });

  it("uses the actual paper duration and strictly over 120 seconds", () => {
    expect(paperDurationMinutes("AS LEVEL Physics")).toBe(75);
    expect(paperDurationMinutes("IGCSE")).toBe(45);
    expect(pacingSummary({ 1: 120, 2: 121, 3: NaN, 4: 200 }, [1, 2, 3]).bottlenecks).toEqual([{ question: 2, seconds: 121 }]);
  });

  it("shows retry question numbers and estimated timing without inventing missing times", () => {
    render(<MemoryRouter><ResultSummary score={1} totalQuestions={2} questionNumbers={[7, 12]} answers={{ 7: "A" }} correctAnswers={{ 7: "A", 12: "B" }} questionTimes={{ 7: 125 }} durationMinutes={75} estimatedTiming /></MemoryRouter>);
    expect(screen.getByRole("region", { name: "Pacing analysis" })).toHaveTextContent("1 questions timed");
    expect(screen.getByText("1m 53s")).toBeInTheDocument();
    expect(screen.getByLabelText("Question 7 time, over 2 minutes")).toHaveTextContent("2m 05s");
    expect(screen.queryByLabelText("Question 12 time")).not.toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });
});