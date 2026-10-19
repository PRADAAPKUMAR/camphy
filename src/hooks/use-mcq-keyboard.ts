import { useEffect, useRef } from "react";

const KEY_TO_OPTION: Record<string, string> = {
  a: "A", b: "B", c: "C", d: "D", "1": "A", "2": "B", "3": "C", "4": "D",
};

interface Options {
  enabled: boolean;
  onSelect: (option: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

/** A–D / 1–4 answer, arrows move; typing, native controls and modal work retain their keys. */
export const useMcqKeyboard = ({ enabled, onSelect, onNext, onPrev }: Options) => {
  const ref = useRef({ onSelect, onNext, onPrev });
  ref.current = { onSelect, onNext, onPrev };

  useEffect(() => {
    if (!enabled) return;
    const pressed = new Map<HTMLElement, number>();
    const pulse = (selector: string) => {
      const button = Array.from(document.querySelectorAll<HTMLButtonElement>(selector))
        .find(button => !button.disabled && button.getClientRects().length > 0);
      if (!button) return;
      button.dataset.keyboardPress = "true";
      clearTimeout(pressed.get(button));
      pressed.set(button, window.setTimeout(() => { delete button.dataset.keyboardPress; pressed.delete(button); }, 180));
    };
    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const t = e.target instanceof HTMLElement ? e.target : null;
      if (t && (t.isContentEditable || t.closest('input, textarea, select, [contenteditable="true"], [role="combobox"], [role="slider"], [role="listbox"], [role="menu"]'))) return;
      const blockingModal = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"]'))
        .some(dialog => !dialog.hasAttribute("data-mcq-keyboard"));
      if (blockingModal) return;
      const opt = KEY_TO_OPTION[e.key.toLowerCase()];
      if (opt) {
        e.preventDefault();
        pulse(`button[data-answer-option="${opt}"][aria-keyshortcuts]`);
        ref.current.onSelect(opt);
      } else if (e.key === "ArrowRight" || e.key === " ") {
        // Space still activates a focused button/link instead of moving twice.
        if (e.key === " " && t?.closest('button, a, [role="button"], [role="checkbox"], [role="switch"]')) return;
        e.preventDefault(); pulse('button[aria-label="Next question"]'); ref.current.onNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault(); pulse('button[aria-label="Previous question"]'); ref.current.onPrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      pressed.forEach((timer, button) => { clearTimeout(timer); delete button.dataset.keyboardPress; });
    };
  }, [enabled]);
};
