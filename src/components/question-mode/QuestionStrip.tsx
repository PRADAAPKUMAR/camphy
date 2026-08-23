interface QuestionStripProps {
  questions: number[];
  current: number;
  answers: Record<number, string>;
  correctAnswers: Record<number, string>;
  onJump: (question: number) => void;
}

/** Compact progress strip: green = correct, red = wrong, muted = unanswered. */
const QuestionStrip = ({
  questions,
  current,
  answers,
  correctAnswers,
  onJump,
}: QuestionStripProps) => (
  <div className="grid grid-cols-5 gap-1.5">
    {questions.map((q) => {
      const answer = answers[q];
      const correct = correctAnswers[q];
      let cls =
        "h-8 w-full rounded-lg border text-xs font-semibold tabular-nums transition-colors ";
      if (answer && correct !== undefined) {
        cls +=
          answer === correct
            ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
            : "border-rose-400/40 bg-rose-500/20 text-rose-300";
      } else if (answer) {
        cls += "border-primary/40 bg-primary/20 text-foreground";
      } else {
        cls += "border-border/40 bg-muted/20 text-muted-foreground";
      }
      if (q === current) cls += " ring-2 ring-primary ring-offset-1 ring-offset-background";
      return (
        <button key={q} type="button" className={cls} onClick={() => onJump(q)} aria-label={`Go to question ${q}`}>
          {q}
        </button>
      );
    })}
  </div>
);

export default QuestionStrip;
