import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lightbulb } from "lucide-react";
import MathText from "@/components/MathText";

export interface TheoryExplanationPart {
  id: string;
  question_number: number;
  part_label: string | null;
  order_index: number;
  explanation: string | null;
  image_url?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: number | null;
  parts: TheoryExplanationPart[];
}

const TheoryExplanationDialog = ({ open, onOpenChange, question, parts }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex max-h-[85vh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden border-border/60 bg-card p-0 [contain:paint] [isolation:isolate] sm:w-[92vw] sm:max-w-[92vw] lg:w-[90vw] lg:max-w-[1060px]">
      <DialogHeader className="shrink-0 border-b border-border/50 px-4 py-4 sm:px-6">
        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Lightbulb className="h-4 w-4 shrink-0 text-primary" />
          Question {question} — Explanation
        </DialogTitle>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6 [scrollbar-width:thin]">
        {parts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No explanation has been added for this question yet.
          </p>
        ) : (
          <div className="space-y-5 pr-1">
            {parts.map((part) => (
              <section
                key={part.id}
                className="rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-6"
              >
                <p className="mb-3 text-sm font-semibold tracking-tight text-primary">
                  {part.part_label?.trim()
                    ? `Part ${part.part_label}`
                    : `Question ${part.question_number}`}
                </p>
                {part.explanation && (
                  <MathText
                    text={part.explanation}
                    className="space-y-3 text-[0.95rem] leading-7 [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-1"
                  />
                )}
                {part.image_url && (
                  <img
                    src={part.image_url}
                    alt={`Diagram for question ${part.question_number}${part.part_label ? ` part ${part.part_label}` : ""}`}
                    loading="lazy"
                    className="mt-4 w-full rounded-xl border border-border/40 bg-background/60"
                  />
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </DialogContent>
  </Dialog>
);

export default TheoryExplanationDialog;
