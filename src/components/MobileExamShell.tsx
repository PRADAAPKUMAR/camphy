import { ReactNode, useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import MCQPanel from "@/components/MCQPanel";

import MCQOptionGroup from "@/components/question-mode/MCQOptionGroup";
import RollingNumber from "@/components/motion/RollingNumber";

interface MobileExamShellProps {
  breadcrumb: ReactNode;
  timer: ReactNode;
  pdf: ReactNode;
  totalQuestions: number;
  answers: Record<number, string>;
  correctAnswers: Record<number, string>;
  onSelectAnswer: (question: number, option: string) => void;
  onSubmit: () => void;
  isSubmitted: boolean;
  onExplain?: (question: number) => void;
  resultPanel?: ReactNode;
  onQuestionActivate?: (question: number) => void;
}

const MobileExamShell = ({
  breadcrumb,
  timer,
  pdf,
  totalQuestions,
  answers,
  correctAnswers,
  onSelectAnswer,
  onSubmit,
  isSubmitted,
  onExplain,
  resultPanel,
  onQuestionActivate,
}: MobileExamShellProps) => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(1);

  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  useEffect(() => {
    if (isSubmitted) setOpen(true);
  }, [isSubmitted]);
  useEffect(() => {
    if (!isSubmitted) onQuestionActivate?.(current);
  }, [current, isSubmitted, onQuestionActivate]);

  const userAnswer = answers[current];
  const correct = correctAnswers[current];

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      {/* Compact top bar */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-card px-3 py-2 shadow-sm">
        <div className="min-w-0 flex-1 truncate text-xs [&_*]:truncate">{breadcrumb}</div>
        <div className="shrink-0 text-sm">{timer}</div>
      </div>

      {/* PDF fills remaining space */}
      <div className="relative min-h-0 flex-1">{pdf}</div>

      {/* Answers launcher */}
      <Drawer open={open} onOpenChange={setOpen}>
        <div className="shrink-0 border-t bg-card px-3 pb-[env(safe-area-inset-bottom)] pt-2">
          <DrawerTrigger asChild>
            <Button
              className="h-12 w-full justify-between font-semibold"
              aria-label="Open answer sheet"
            >
              <span className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Answer Sheet
              </span>
              <span className="font-mono text-xs">
                <RollingNumber value={`${answeredCount} / ${totalQuestions} · ${progress}%`} />
              </span>
            </Button>
          </DrawerTrigger>
        </div>

        <DrawerContent className="h-[88dvh] max-h-[88dvh] p-0">
          <div className="flex h-full min-h-0 flex-col">
            {isSubmitted && resultPanel ? (
              <div className="min-h-0 flex-1 overflow-hidden">{resultPanel}</div>
            ) : (
              <>
                {/* Quick question navigation */}
                <div className="shrink-0 border-b px-3 pb-3 pt-1">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11"
                      aria-label="Previous question"
                      disabled={current <= 1}
                      onClick={() => setCurrent((c) => Math.max(1, c - 1))}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <p className="text-sm font-semibold">
                      Question <RollingNumber value={current} /> of {totalQuestions}
                    </p>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11"
                      aria-label="Next question"
                      disabled={current >= totalQuestions}
                      onClick={() => setCurrent((c) => Math.min(totalQuestions, c + 1))}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                  <MCQOptionGroup question={current} userAnswer={userAnswer} correctAnswer={correct} disabled={isSubmitted} onSelect={(opt) => {
                    onSelectAnswer(current, opt);
                    if (current < totalQuestions) setTimeout(() => setCurrent((c) => Math.min(totalQuestions, c + 1)), 250);
                  }} />
                </div>

                {/* Full answer sheet (reused component) */}
                <div className="min-h-0 flex-1 overflow-hidden">
                  <MCQPanel
                    totalQuestions={totalQuestions}
                    answers={answers}
                    correctAnswers={correctAnswers}
                    onSelectAnswer={onSelectAnswer}
                    onSubmit={onSubmit}
                    isSubmitted={isSubmitted}
                    onExplain={onExplain}
                    onQuestionActivate={onQuestionActivate}
                  />
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default MobileExamShell;
