import { useEffect, useState } from "react";
import { ImageOff, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface QuestionCardProps {
  question: number;
  imageUrl?: string;
}

/** The question image itself, on a light plate so scanned JPGs stay readable. */
const QuestionImage = ({ question, imageUrl }: QuestionCardProps) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Auto-retry once on failure (covers transient network drops / token races).
  useEffect(() => {
    if (!failed || attempt > 0 || !imageUrl) return;
    const timer = window.setTimeout(() => {
      setFailed(false);
      setAttempt(1);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [failed, attempt, imageUrl]);

  if (!imageUrl) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-border/40 bg-muted/10 p-8 text-center">
        <ImageOff className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          No image uploaded for question {question} yet.
        </p>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-border/40 bg-muted/10 p-8 text-center">
        <ImageOff className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          The image for question {question} could not be loaded.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            setFailed(false);
            setLoaded(false);
            setAttempt((a) => a + 1);
          }}
        >
          <RotateCcw className="h-4 w-4" /> Reload image
        </Button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-white p-1.5 sm:p-2">
      {!loaded && <Skeleton className="h-[260px] w-full rounded-lg" />}
      <img
        key={attempt}
        src={imageUrl}
        alt={`Question ${question}`}
        loading="eager"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`mx-auto block h-auto w-full object-contain ${loaded ? "" : "hidden"}`}
      />
    </div>
  );
};

// Each source owns its loading state. Resetting it in a passive effect can hide
// an already-loaded cached image after onLoad has fired.
const QuestionCard = (props: QuestionCardProps) => <QuestionImage key={props.imageUrl ?? "missing"} {...props} />;

export default QuestionCard;
