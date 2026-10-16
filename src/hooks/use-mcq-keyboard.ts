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

/** A–D / 1–4 select an option; → or Space go next; ← goes back. Ignores typing and open dialogs. */
export const useMcqKeyboard = ({ enabled, onSelect, onNext, onPrev }: Options) => {
  const ref = useRef({ onSelect, onNext, onPrev });
  ref.current = { onSelect, onNext, onPrev };

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      const opt = KEY_TO_OPTION[e.key.toLowerCase()];
      if (opt) {
        e.preventDefault();
        ref.current.onSelect(opt);
      } else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        ref.current.onNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        ref.current.onPrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled]);
};
