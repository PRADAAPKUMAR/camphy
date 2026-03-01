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

const MCQPanel = ({
  totalQuestions,
  answers,
  correctAnswers,
  onSelectAnswer,
  onSubmit,
  isSubmitted,
}: MCQPanelProps) => {
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header with progress */}
      <div className="border-b px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold">Answer Sheet</p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {answeredCount}/{totalQuestions}
          </p>
        </div>
        <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <ScrollArea className="flex-1">
        <div className="space-y-0 px-2 py-1">
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((q) => {
            const userAnswer = answers[q];
            const correctAnswer = correctAnswers[q];
            const isAnswered = !!userAnswer;
            const isCorrect = isAnswered && userAnswer === correctAnswer;

            return (
              <div
                key={q}
                className={`flex items-center gap-2 py-1 px-1 ${
                  isAnswered
                    ? isCorrect
                      ? "bg-success/5 rounded"
                      : "bg-destructive/5 rounded"
                    : ""
                }`}
              >
                <span className="w-6 text-right text-[11px] font-bold tabular-nums text-muted-foreground shrink-0">
                  {q}
                </span>
                <div className="flex gap-1.5">
                  {OPTIONS.map((opt) => {
                    const isSelected = userAnswer === opt;
                    const isCorrectOpt = isAnswered && opt === correctAnswer;
                    const isWrongSelection = isSelected && !isCorrect;

                    let btnClass =
                      "flex h-7 w-7 items-center justify-center rounded text-xs font-semibold transition-all duration-150 ";

                    if (isAnswered) {
                      if (isCorrectOpt) {
                        btnClass +=
                          "bg-success text-success-foreground shadow-sm";
                      } else if (isWrongSelection) {
                        btnClass +=
                          "bg-destructive text-destructive-foreground";
                      } else {
                        btnClass += "bg-muted/40 text-muted-foreground/50";
                      }
                    } else {
                      btnClass +=
                        "bg-muted/60 text-foreground hover:bg-primary/15 cursor-pointer";
                    }

                    return (
                      <button
                        key={opt}
                        className={btnClass}
                        onClick={() => onSelectAnswer(q, opt)}
                        disabled={isAnswered || isSubmitted}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {isAnswered && (
                  <span className="w-4 shrink-0">
                    {isCorrect ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                    )}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Submit */}
      {!isSubmitted && (
        <div className="border-t px-3 py-2">
          <Button onClick={onSubmit} className="w-full font-semibold text-sm" size="sm">
            Submit Answers
          </Button>
        </div>
      )}
    </div>
  );
};

export default MCQPanel;
