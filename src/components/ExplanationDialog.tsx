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
      <DialogContent className="max-w-2xl border-border/60 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-primary" />
            Question {question} — Explanation
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-3">
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
            <div className="space-y-5">
              {data.explanation && (
                <section className="rounded-xl border border-border/50 bg-muted/30 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Worked solution
                  </p>
                  <MathText text={data.explanation} />
                </section>
              )}

              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                      className={`flex gap-3 rounded-xl border p-3 ${
                        isCorrect
                          ? "border-success/40 bg-success/5"
                          : isPicked
                            ? "border-destructive/40 bg-destructive/5"
                            : "border-border/40 bg-muted/20"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
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
                        <div className="mb-1 flex items-center gap-2 text-xs font-semibold">
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
                        <MathText text={body} />
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
