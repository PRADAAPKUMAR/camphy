import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import QuestionCard from "@/components/question-mode/QuestionCard";

describe("question image loading", () => {
  it("isolates each source so a previous image cannot finish loading the next source", () => {
    const { rerender } = render(<QuestionCard question={1} imageUrl="/first.png" />);
    const first = screen.getByAltText("Question 1");
    fireEvent.load(first);
    expect(first).not.toHaveClass("hidden");
    rerender(<QuestionCard question={2} imageUrl="/second.png" />);
    const second = screen.getByAltText("Question 2");
    expect(second).not.toBe(first);
    expect(second).toHaveClass("hidden");
    fireEvent.load(first);
    expect(second).toHaveClass("hidden");
    fireEvent.load(second);
    expect(second).not.toHaveClass("hidden");
  });
});
