import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CircleCheck, CircleX, Undo2, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

const OPTIONS = ["A", "B", "C", "D"] as const;

interface ResultSummaryProps {
  score: number;
  totalQuestions: number;
  answers: Record<number, string>;
  correctAnswers: Record<number, string>;
}

const ResultRow = memo(({ q, userAnswer, correct }: { q: number; userAnswer: string | undefined; correct: string | undefined }) => {
  const isCorrect = userAnswer === correct;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
        isCorrect
          ? "bg-success/5"
          : userAnswer
          ? "bg-destructive/5"
          : ""
      }`}
    >
      <span className="w-7 text-right text-xs font-bold tabular-nums text-muted-foreground">
        {q}
      </span>
      <div className="flex gap-1.5">
        {OPTIONS.map((opt) => {
          const isCorrectOpt = opt === correct;
          const isUserWrong = opt === userAnswer && !isCorrect;

          return (
            <div
              key={opt}
              className={`flex h-8 w-9 items-center justify-center rounded-md text-xs font-semibold border transition-all ${
                isCorrectOpt
                  ? "bg-success text-success-foreground border-success shadow-sm"
                  : isUserWrong
                  ? "bg-destructive text-destructive-foreground border-destructive"
                  : "bg-background text-muted-foreground border-border"
              }`}
            >
              {opt}
            </div>
          );
        })}
      </div>
      <span className="ml-auto">
        {isCorrect ? (
           <CircleCheck className="h-4 w-4 text-success" />
         ) : userAnswer ? (
           <CircleX className="h-4 w-4 text-destructive" />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </span>
    </div>
  );
});

ResultRow.displayName = "ResultRow";

const ResultSummary = memo(({
  score,
  totalQuestions,
  answers,
  correctAnswers,
}: ResultSummaryProps) => {
  const navigate = useNavigate();
  const percentage = Math.round((score / totalQuestions) * 100);

  const getScoreColor = () => {
    if (percentage >= 80) return "text-success";
    if (percentage >= 50) return "text-primary";
    return "text-destructive";
  };

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Score header */}
      <div className="border-b p-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Award className={`h-7 w-7 ${getScoreColor()}`} />
        </div>
        <div className={`text-4xl font-black tabular-nums ${getScoreColor()}`}>
          {score}/{totalQuestions}
        </div>
        <p className="mt-1 text-sm text-muted-foreground font-medium">{percentage}% correct</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/")}
        >
          <Home className="mr-2 h-4 w-4" />
          Back to Papers
        </Button>
      </div>

      {/* Answer review */}
      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-4">
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((q) => (
            <ResultRow
              key={q}
              q={q}
              userAnswer={answers[q]}
              correct={correctAnswers[q]}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
});

ResultSummary.displayName = "ResultSummary";

export default ResultSummary;