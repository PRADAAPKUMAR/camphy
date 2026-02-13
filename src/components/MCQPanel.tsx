import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const OPTIONS = ["A", "B", "C", "D"] as const;

interface MCQPanelProps {
  totalQuestions: number;
  answers: Record<number, string>;
  onSelectAnswer: (question: number, option: string) => void;
  onSubmit: () => void;
  isSubmitted: boolean;
}

const MCQPanel = ({
  totalQuestions,
  answers,
  onSelectAnswer,
  onSubmit,
  isSubmitted,
}: MCQPanelProps) => {
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Answered: {answeredCount}/{totalQuestions}
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-4">
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((q) => (
            <div
              key={q}
              className="flex items-center gap-2 rounded-md px-2 py-1.5"
            >
              <span className="w-8 text-sm font-medium text-muted-foreground">
                {q}.
              </span>
              <div className="flex gap-1.5">
                {OPTIONS.map((opt) => (
                  <Button
                    key={opt}
                    size="sm"
                    variant={answers[q] === opt ? "default" : "outline"}
                    className="h-8 w-10 text-xs font-semibold"
                    onClick={() => onSelectAnswer(q, opt)}
                    disabled={isSubmitted}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      {!isSubmitted && (
        <div className="border-t p-4">
          <Button onClick={onSubmit} className="w-full" size="lg">
            Submit Answers
          </Button>
        </div>
      )}
    </div>
  );
};

export default MCQPanel;
