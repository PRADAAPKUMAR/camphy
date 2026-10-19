import McqKeyboardHint from "@/components/McqKeyboardHint";
import { memo, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, CircleCheck, CircleX, Lightbulb } from "lucide-react";

const OPTIONS = ["A", "B", "C", "D"] as const;

interface MCQPanelProps {
  totalQuestions: number;
  answers: Record<number, string>;
  correctAnswers: Record<number, string>;
  onSelectAnswer: (question: number, option: string) => void;
  onSubmit: () => void;
  isSubmitted: boolean;
  onExplain?: (question: number) => void;
  onQuestionActivate?: (question: number) => void;
  activeQuestion?: number;
  showNavigation?: boolean;
}

interface QuestionRowProps {
  q: number;
  userAnswer: string | undefined;
  correctAnswer: string | undefined;
  onSelectAnswer: (question: number, option: string) => void;
  isSubmitted: boolean;
  onExplain?: (question: number) => void;
  onQuestionActivate?: (question: number) => void;
  activeQuestion?: number;
}

const QuestionRow = memo(({ q, userAnswer, correctAnswer, onSelectAnswer, isSubmitted, onExplain, onQuestionActivate, activeQuestion }: QuestionRowProps) => {
  const isSelected = !!userAnswer;
  const hasResult = correctAnswer !== undefined;
  const isCorrect = isSelected && hasResult && userAnswer === correctAnswer;
  const isWrong = isSelected && hasResult && userAnswer !== correctAnswer;

  return (
    <div
      role="group"
      aria-label={`Question ${q}`}
      data-current-question={activeQuestion === q ? "true" : undefined}
      aria-current={activeQuestion === q ? "step" : undefined}
      onFocus={() => onQuestionActivate?.(q)}
      onPointerDown={() => onQuestionActivate?.(q)}
      className={`flex items-center justify-center gap-1 py-3 ${activeQuestion === q ? "mcq-active-row" : ""} ${
        hasResult
          ? isCorrect
            ? "bg-success/5 rounded-lg"
            : isWrong
              ? "bg-destructive/5 rounded-lg"
              : ""
          : ""
      }`}
    >
      {onQuestionActivate ? <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-sm tabular-nums text-muted-foreground" aria-label={`Work on question ${q}`} title={`Work on question ${q}`} onClick={() => onQuestionActivate(q)}>{q}</Button> : <span className="w-8 text-right text-sm font-bold tabular-nums text-muted-foreground">{q}</span>}
      <div className="flex min-w-0 gap-1">
        {OPTIONS.map((opt) => {
          const isThisSelected = userAnswer === opt;
          const isCorrectOpt = hasResult && opt === correctAnswer;
          const isWrongSelection = isThisSelected && isWrong;

          let className =
             "flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold transition-all duration-150 ";

          if (hasResult) {
            if (isCorrectOpt) {
              className += "bg-success text-success-foreground shadow-sm";
            } else if (isWrongSelection) {
              className += "bg-destructive text-destructive-foreground";
            } else {
              className += "bg-muted/40 text-muted-foreground/50";
            }
          } else if (isThisSelected) {
            className += "bg-primary text-primary-foreground shadow-sm";
          } else {
            className += "bg-muted/60 text-foreground hover:bg-primary/15 cursor-pointer";
          }

          return (
            <Button variant="ghost"
              key={opt}
               aria-label={`Question ${q}, option ${opt}`}
               aria-pressed={isThisSelected}
               data-answer-option={opt}
               aria-keyshortcuts={activeQuestion === q ? `${opt} ${OPTIONS.indexOf(opt) + 1}` : undefined}
              className={className}
              onClick={() => onSelectAnswer(q, opt)}
              disabled={isSubmitted || isSelected}
            >
              {opt}
            </Button>
          );
        })}
      </div>
      <span className="flex w-14 items-center justify-end gap-1">
        {hasResult && (
          isCorrect ? (
             <CircleCheck aria-label="Correct answer" className="h-4 w-4 text-success" />
          ) : isWrong ? (
             <CircleX aria-label="Incorrect answer" className="h-4 w-4 text-destructive" />
          ) : null
        )}
        {onExplain && hasResult && (
           <Button variant="ghost"
            type="button"
            onClick={() => onExplain(q)}
            title={`Explanation for question ${q}`}
            aria-label={`Explanation for question ${q}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary/25"
          >
            <Lightbulb className="h-3.5 w-3.5" />
           </Button>
        )}
      </span>
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
  onExplain,
  onQuestionActivate,
  activeQuestion,
  showNavigation = true,
}: MCQPanelProps) => {
  const rows = useRef<HTMLDivElement>(null);
  useEffect(() => {
    rows.current?.querySelector('[data-current-question="true"]')?.scrollIntoView?.({ block: "nearest" });
  }, [activeQuestion]);
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  const handleSelectAnswer = useCallback(
    (question: number, option: string) => onSelectAnswer(question, option),
    [onSelectAnswer]
  );

  return (
    <div className="glass-reading flex h-full flex-col rounded-none border-0">
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

      {!isSubmitted && showNavigation && onQuestionActivate && activeQuestion && <div className="space-y-3 border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="icon" aria-label="Previous question" aria-keyshortcuts="ArrowLeft" disabled={activeQuestion <= 1} onClick={() => onQuestionActivate(activeQuestion - 1)}><ChevronLeft /></Button>
          <span className="text-xs font-semibold" aria-live="polite">Question {activeQuestion} of {totalQuestions}</span>
          <Button variant="outline" size="icon" aria-label="Next question" aria-keyshortcuts="ArrowRight" disabled={activeQuestion >= totalQuestions} onClick={() => onQuestionActivate(activeQuestion + 1)}><ChevronRight /></Button>
        </div>
        <McqKeyboardHint />
      </div>}
      {/* Questions */}
      <ScrollArea className="flex-1">
        <div ref={rows} className="space-y-0.5 p-4">
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((q) => (
            <QuestionRow
              key={q}
              q={q}
              userAnswer={answers[q]}
              correctAnswer={correctAnswers[q]}
              onSelectAnswer={handleSelectAnswer}
              isSubmitted={isSubmitted}
              onExplain={onExplain}
              onQuestionActivate={onQuestionActivate}
              activeQuestion={activeQuestion}
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