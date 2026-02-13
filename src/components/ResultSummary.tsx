import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const OPTIONS = ["A", "B", "C", "D"] as const;

interface ResultSummaryProps {
  score: number;
  totalQuestions: number;
  answers: Record<number, string>;
  correctAnswers: Record<number, string>;
}

const ResultSummary = ({
  score,
  totalQuestions,
  answers,
  correctAnswers,
}: ResultSummaryProps) => {
  const navigate = useNavigate();
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <div className="flex h-full flex-col">
      {/* Score header */}
      <div className="border-b p-6 text-center">
        <div className="text-5xl font-black text-primary">
          {score}/{totalQuestions}
        </div>
        <p className="mt-1 text-lg text-muted-foreground">{percentage}%</p>
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
        <div className="space-y-1 p-4">
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((q) => {
            const userAnswer = answers[q];
            const correct = correctAnswers[q];
            const isCorrect = userAnswer === correct;

            return (
              <div
                key={q}
                className="flex items-center gap-2 rounded-md px-2 py-1.5"
              >
                <span className="w-8 text-sm font-medium text-muted-foreground">
                  {q}.
                </span>
                <div className="flex gap-1.5">
                  {OPTIONS.map((opt) => {
                    let className = "h-8 w-10 text-xs font-semibold ";
                    if (opt === correct) {
                      className +=
                        "bg-green-500 text-white hover:bg-green-600 border-green-500";
                    } else if (opt === userAnswer && !isCorrect) {
                      className +=
                        "bg-destructive text-destructive-foreground hover:bg-destructive/90";
                    }
                    return (
                      <Button
                        key={opt}
                        size="sm"
                        variant={
                          opt === correct || opt === userAnswer
                            ? "default"
                            : "outline"
                        }
                        className={className}
                        disabled
                      >
                        {opt}
                      </Button>
                    );
                  })}
                </div>
                <span className="ml-auto">
                  {isCorrect ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : userAnswer ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ResultSummary;
