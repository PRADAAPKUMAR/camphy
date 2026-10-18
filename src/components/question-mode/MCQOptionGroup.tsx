import { memo, useLayoutEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS = ["A", "B", "C", "D"] as const;
interface MCQOptionGroupProps {
  question: number;
  userAnswer?: string;
  correctAnswer?: string;
  onSelect: (option: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

/** Shared feedback paint; answers and correct keys never wait for animation. */
const MCQOptionGroup = memo(({ question, userAnswer, correctAnswer, onSelect, disabled, compact }: MCQOptionGroupProps) => {
  const group = useRef<HTMLDivElement>(null);
  const prior = useRef({ question, userAnswer, correctAnswer });
  const hasResult = userAnswer !== undefined && correctAnswer !== undefined;
  useLayoutEffect(() => {
    const before = prior.current;
    prior.current = { question, userAnswer, correctAnswer };
    const root = group.current;
    if (!root || before.question !== question || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const newSelection = !before.userAnswer && !!userAnswer;
    const newResult = !!userAnswer && correctAnswer !== undefined && (newSelection || before.correctAnswer !== correctAnswer);
    const animated: Element[] = [];
    if (newSelection) {
      const selected = root.querySelector(`[data-option="${userAnswer}"]`);
      if (selected) { selected.classList.add("mcq-picked"); animated.push(selected); }
    }
    if (newResult) {
      const correct = root.querySelector(`[data-option="${correctAnswer}"]`);
      const wrong = userAnswer !== correctAnswer ? root.querySelector(`[data-option="${userAnswer}"]`) : null;
      if (correct) { correct.classList.add("mcq-correct-pulse"); animated.push(correct); }
      if (wrong) { wrong.classList.add("mcq-wrong-wobble"); animated.push(wrong); }
    }
    const clear = () => animated.forEach((el) => el.classList.remove("mcq-picked", "mcq-correct-pulse", "mcq-wrong-wobble"));
    const ended = (event: AnimationEvent) => {
      if (!(event.target instanceof Element)) return;
      const option = event.target.closest("[data-option]");
      if (event.animationName === "optionSlide") option?.classList.remove("mcq-picked");
      if (event.animationName === "optionCorrect") option?.classList.remove("mcq-correct-pulse");
      if (event.animationName === "optionWrong") option?.classList.remove("mcq-wrong-wobble");
    };
    root.addEventListener("animationend", ended);
    return () => { root.removeEventListener("animationend", ended); clear(); };
  }, [question, userAnswer, correctAnswer]);

  return <div ref={group} className={cn("grid grid-cols-4", compact ? "gap-1" : "gap-2 sm:gap-3")}>
    {OPTIONS.map((opt, index) => {
      const selected = userAnswer === opt;
      const correct = hasResult && correctAnswer === opt;
      const wrong = hasResult && selected && !correct;
      return <Button key={opt} variant="ghost" type="button" data-option={opt}
        className={cn("mcq-option relative isolate overflow-hidden rounded-lg border p-0 font-semibold disabled:opacity-100", compact ? "h-11 w-9 shrink-0 text-sm" : "h-14 w-full text-lg sm:h-16 sm:text-xl",
          correct ? "border-success/50 bg-success text-success-foreground" : wrong ? "border-destructive/50 bg-destructive text-destructive-foreground" : hasResult ? "border-border/30 bg-muted/20 text-muted-foreground/50" : selected ? "border-primary bg-primary text-primary-foreground" : "border-border/50 bg-muted/40 text-foreground hover:border-primary/50 hover:bg-primary/20")}
        aria-label={`Question ${question}${compact ? "," : ""} option ${opt}`} aria-pressed={selected}
        aria-keyshortcuts={compact ? undefined : `${opt} ${index + 1}`} disabled={!!userAnswer || !!disabled} onClick={() => onSelect(opt)}>
        <span className="mcq-option-fill absolute inset-0" aria-hidden="true" />
        <svg className="mcq-option-trace absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 100 100"><rect x="2" y="2" width="96" height="96" rx="12" pathLength="1" /></svg>
        <span className="relative">{opt}</span>
      </Button>;
    })}
  </div>;
});
MCQOptionGroup.displayName = "MCQOptionGroup";
export default MCQOptionGroup;