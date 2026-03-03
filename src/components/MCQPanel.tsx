import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle } from "lucide-react";

const OPTIONS = ["A", "B", "C", "D"] as const;

interface MCQPanelProps {
  totalQuestions: number;
  answers: Record<number, string>;
  correctAnswers: Record<number, string>;
  onSelectAnswer: (question: number, option: string) => void;
  onSubmit: () => void;
  isSubmitted: boolean;
}

interface QuestionRowProps {
  q: number;
  userAnswer: string | undefined;
  correctAnswer: string | undefined;
  onSelectAnswer: (question: number, option: string) => void;
  isSubmitted: boolean;
}

const QuestionRow = memo(({ q, userAnswer, correctAnswer, onSelectAnswer, isSubmitted }: QuestionRowProps) => {
  const isAnswered = !!userAnswer;
  const isCorrect = isAnswered && userAnswer === correctAnswer;

  return (
    <div
      className={`flex items-center justify-center gap-4 py-3 ${
        isAnswered
          ? isCorrect
            ? "bg-success/5 rounded-lg"
            : "bg-destructive/5 rounded-lg"
          : ""
      }`}
    >
      <span className="w-8 text-right text-sm font-bold tabular-nums text-muted-foreground">
        {q}
      </span>
      <div className="flex gap-3">
        {OPTIONS.map((opt) => {
          const isSelected = userAnswer === opt;
          const isCorrectOpt = isAnswered && opt === correctAnswer;
          const isWrongSelection = isSelected && !isCorrect;

          let className =
            "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold transition-all duration-150 ";

          if (isAnswered) {
            if (isCorrectOpt) {
              className += "bg-success text-success-foreground shadow-sm";
            } else if (isWrongSelection) {
              className += "bg-destructive text-destructive-foreground";
            } else {
              className += "bg-muted/40 text-muted-foreground/50";
            }
          } else {
            className += "bg-muted/60 text-foreground hover:bg-primary/15 cursor-pointer";
          }

          return (
            <button
              key={opt}
              className={className}
              onClick={() => onSelectAnswer(q, opt)}
              disabled={isAnswered || isSubmitted}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {isAnswered && (
        <span className="w-5">
          {isCorrect ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
        </span>
      )}
    </div>
  );
});

QuestionRow.displayName = "QuestionRow";

const MCQPanel = memo(({
  totalQuestions,
  answers,
  correctAnswers,
  onSelectAnswer,
  onSubmit,
  isSubmitted,
}: MCQPanelProps) => {
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  const handleSelectAnswer = useCallback(
    (question: number, option: string) => onSelectAnswer(question, option),
    [onSelectAnswer]
  );

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header with progress */}
      <div className="border-b px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold">Answer Sheet</p>
          <p className="text-xs font-mono text-muted-foreground">
            {answeredCount}/{totalQuestions}
          </p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-4">
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((q) => (
            <QuestionRow
              key={q}
              q={q}
              userAnswer={answers[q]}
              correctAnswer={correctAnswers[q]}
              onSelectAnswer={handleSelectAnswer}
              isSubmitted={isSubmitted}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Submit */}
      {!isSubmitted && (
        <div className="border-t p-4">
          <Button onClick={onSubmit} className="w-full font-semibold" size="lg">
            Submit Answers
          </Button>
        </div>
      )}
    </div>
  );
});

MCQPanel.displayName = "MCQPanel";

export default MCQPanel;