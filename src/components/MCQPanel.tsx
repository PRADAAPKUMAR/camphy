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
  const progress = Math.round((answeredCount / totalQuestions) * 100);

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
            <div
              key={q}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                answers[q] ? "bg-primary/5" : "hover:bg-muted/50"
              }`}
            >
              <span className="w-7 text-right text-xs font-bold tabular-nums text-muted-foreground">
                {q}
              </span>
              <div className="flex gap-1.5">
                {OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    className={`flex h-8 w-9 items-center justify-center rounded-md text-xs font-semibold transition-all duration-150 ${
                      answers[q] === opt
                        ? "bg-primary text-primary-foreground shadow-sm scale-105"
                        : "border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5"
                    }`}
                    onClick={() => onSelectAnswer(q, opt)}
                    disabled={isSubmitted}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
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
};

export default MCQPanel;
