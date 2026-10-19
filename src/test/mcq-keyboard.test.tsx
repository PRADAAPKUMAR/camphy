import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMcqKeyboard } from "@/hooks/use-mcq-keyboard";
import SplitFlapDisplay from "@/components/SplitFlapDisplay";

afterEach(cleanup);

function Shortcuts({ enabled = true, select, next, prev }: { enabled?: boolean; select: (answer: string) => void; next: () => void; prev: () => void }) {
  useMcqKeyboard({ enabled, onSelect: select, onNext: next, onPrev: prev });
  return <><input aria-label="Notes" /><button>Next</button><div contentEditable aria-label="Editable notes" /></>;
}

describe("MCQ keyboard controls", () => {
  it("maps letters/numbers and navigation, without repeated or modified key presses", () => {
    const select = vi.fn(), next = vi.fn(), prev = vi.fn();
    render(<Shortcuts select={select} next={next} prev={prev} />);
    for (const key of ["a", "B", "3", "4"]) fireEvent.keyDown(window, { key });
    expect(select.mock.calls.map(([answer]) => answer)).toEqual(["A", "B", "C", "D"]);
    fireEvent.keyDown(window, { key: "a", repeat: true });
    fireEvent.keyDown(window, { key: "a", ctrlKey: true });
    expect(select).toHaveBeenCalledTimes(4);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(next).toHaveBeenCalledOnce();
    expect(prev).toHaveBeenCalledOnce();
  });

  it("preserves typing, native Space, and modal controls, while allowing the answer drawer", () => {
    const select = vi.fn(), next = vi.fn(), prev = vi.fn();
    const view = render(<Shortcuts select={select} next={next} prev={prev} />);
    fireEvent.keyDown(view.getByLabelText("Notes"), { key: "a" });
    fireEvent.keyDown(view.getByLabelText("Editable notes"), { key: "b" });
    const space = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    act(() => view.getByRole("button").dispatchEvent(space));
    expect(space.defaultPrevented).toBe(false);
    expect(next).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    const dialog = document.createElement("div"); dialog.setAttribute("role", "dialog"); document.body.append(dialog);
    fireEvent.keyDown(window, { key: "a" }); expect(select).not.toHaveBeenCalled();
    dialog.setAttribute("data-mcq-keyboard", "true");
    fireEvent.keyDown(window, { key: "b" }); expect(select).toHaveBeenCalledWith("B");
    dialog.remove();
  });

  it("uses the current callbacks and disables shortcuts after finishing", () => {
    const first = vi.fn(), second = vi.fn(), next = vi.fn(), prev = vi.fn();
    const view = render(<Shortcuts select={first} next={next} prev={prev} />);
    view.rerender(<Shortcuts select={second} next={next} prev={prev} />);
    fireEvent.keyDown(window, { key: "a" });
    expect(first).not.toHaveBeenCalled(); expect(second).toHaveBeenCalledWith("A");
    view.rerender(<Shortcuts enabled={false} select={second} next={next} prev={prev} />);
    fireEvent.keyDown(window, { key: "b" }); expect(second).toHaveBeenCalledOnce();
  });
});

it("flips only changed clock digits and exposes one readable time value", () => {
  const view = render(<SplitFlapDisplay value="00:59" label="Time remaining" />);
  expect(view.container.querySelectorAll(".split-flap__change")).toHaveLength(0);
  view.rerender(<SplitFlapDisplay value="01:00" label="Time remaining" />);
  expect(view.getByRole("timer")).toHaveAttribute("aria-label", "Time remaining: 01:00");
  expect(view.container.querySelectorAll(".split-flap__change")).toHaveLength(3);
  expect(Array.from(view.container.querySelectorAll(".split-flap__character")).map(cell => cell.textContent).join("")).toBe("0100");
});
