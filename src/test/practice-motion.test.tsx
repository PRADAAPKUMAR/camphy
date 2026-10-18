import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MCQOptionGroup from "@/components/question-mode/MCQOptionGroup";
import Timer from "@/components/Timer";
import RollingNumber from "@/components/motion/RollingNumber";

describe("practice motion preserves exam behaviour", () => {
  it("locks every option immediately after an answer is committed", () => {
    const select = vi.fn();
    const { rerender } = render(<MCQOptionGroup question={1} onSelect={select} />);
    fireEvent.click(screen.getByRole("button", { name: "Question 1 option A" }));
    expect(select).toHaveBeenCalledWith("A");
    rerender(<MCQOptionGroup question={1} userAnswer="A" correctAnswer="B" onSelect={select} />);
    for (const option of screen.getAllByRole("button")) expect(option).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Question 1 option B" }));
    expect(select).toHaveBeenCalledTimes(1);
  });

  it("publishes the actual numeric value without waiting for the visual roll", () => {
    const { rerender } = render(<RollingNumber value={14} />);
    rerender(<RollingNumber value={15} />);
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("calls time-up when the clock expires, regardless of digit animation", () => {
    vi.useFakeTimers();
    const finish = vi.fn();
    const { unmount } = render(<Timer durationMinutes={1 / 60} onTimeUp={finish} isRunning />);
    vi.advanceTimersByTime(1000);
    expect(finish).toHaveBeenCalled();
    unmount();
    vi.useRealTimers();
  });
});