import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { CircleCheck, CircleX, Lightbulb } from "lucide-react";
import MathText from "@/components/MathText";

export interface ExplanationData {
  found: boolean;
  correct_option?: string | null;
  explanation?: string | null;
  options?: Partial<Record<"A" | "B" | "C" | "D", string | null>>;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: number | null;
  userAnswer?: string;
  isLoading: boolean;
  data: ExplanationData | null;
}

const OPTIONS = ["A", "B", "C", "D"] as const;

const ExplanationDialog = ({ open, onOpenChange, question, userAnswer, isLoading, data }: Props) => {
  const correct = data?.correct_option ?? undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden border-border/60 bg-card/95 p-0 backdrop-blur-xl sm:w-[92vw] sm:max-w-[92vw] lg:w-[90vw] lg:max-w-[1060px]"
      >
        <DialogHeader className="shrink-0 border-b border-border/50 px-4 py-4 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Lightbulb className="h-4 w-4 shrink-0 text-primary" />
            Question {question} — Explanation
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6 [scrollbar-width:thin]">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : !data?.found ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No explanation has been added for this question yet.
            </p>
          ) : (
            <div className="space-y-6 pr-1">
              {data.explanation && (
                <section className="rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-6">
                  <p className="mb-3 text-sm font-semibold tracking-tight text-primary">
                    Worked solution
                  </p>
                  <MathText
                    text={data.explanation}
                    className="space-y-3 text-[0.95rem] leading-7 [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-1"
                  />
                </section>
              )}

              <section className="space-y-3">
                <p className="text-sm font-semibold tracking-tight text-foreground">
                  Why each option
                </p>
                {OPTIONS.map((opt) => {
                  const body = data.options?.[opt];
                  if (!body) return null;
                  const isCorrect = correct === opt;
                  const isPicked = userAnswer === opt;
                  return (
                    <div
                      key={opt}
                      className={`flex gap-3 rounded-xl border p-3 sm:gap-4 sm:p-4 ${
                        isCorrect
                          ? "border-success/40 bg-success/5"
                          : isPicked
                            ? "border-destructive/40 bg-destructive/5"
                            : "border-border/40 bg-muted/20"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                          isCorrect
                            ? "bg-success text-success-foreground"
                            : isPicked
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {opt}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold">
                          {isCorrect ? (
                            <span className="flex items-center gap-1 text-success">
                              <CircleCheck className="h-3.5 w-3.5" /> Correct answer
                            </span>
                          ) : isPicked ? (
                            <span className="flex items-center gap-1 text-destructive">
                              <CircleX className="h-3.5 w-3.5" /> Your choice
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Incorrect</span>
                          )}
                        </div>
                        <MathText
                          text={body}
                          className="leading-7 [&_.katex-display]:overflow-x-auto"
                        />
                      </div>
                    </div>
                  );
                })}
              </section>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ExplanationDialog;
