const OPTIONS = ["A", "B", "C", "D"] as const;

interface OptionButtonsProps {
  question: number;
  userAnswer?: string;
  correctAnswer?: string;
  onSelect: (option: string) => void;
  disabled?: boolean;
}

/** Four large option buttons with instant correct/wrong colouring and locking. */
const OptionButtons = ({
  question,
  userAnswer,
  correctAnswer,
  onSelect,
  disabled,
}: OptionButtonsProps) => {
  const locked = !!userAnswer || !!disabled;
  const hasResult = !!userAnswer && correctAnswer !== undefined;

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {OPTIONS.map((opt) => {
        const selected = userAnswer === opt;
        const isCorrectOpt = hasResult && opt === correctAnswer;
        const isWrongSel = selected && hasResult && userAnswer !== correctAnswer;

        let cls =
          "flex h-14 items-center justify-center rounded-xl border text-lg font-bold transition-colors sm:h-16 sm:text-xl ";
        if (hasResult) {
          if (isCorrectOpt) cls += "border-success/50 bg-success text-success-foreground";
          else if (isWrongSel)
            cls += "border-destructive/50 bg-destructive text-destructive-foreground";
          else cls += "border-border/30 bg-muted/20 text-muted-foreground/50";
        } else if (selected) {
          cls += "border-primary bg-primary text-primary-foreground";
        } else {
          cls += "border-border/50 bg-muted/40 text-foreground hover:border-primary/50 hover:bg-primary/20";
        }

        return (
          <button
            key={opt}
            type="button"
            className={cls}
            aria-label={`Question ${question} option ${opt}`}
            disabled={locked}
            onClick={() => onSelect(opt)}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
};

export default OptionButtons;
