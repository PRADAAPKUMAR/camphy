import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface QuestionCardProps {
  question: number;
  imageUrl?: string;
}

/** The question image itself, on a light plate so scanned JPGs stay readable. */
const QuestionCard = ({ question, imageUrl }: QuestionCardProps) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [imageUrl]);

  if (!imageUrl || failed) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-border/40 bg-muted/10 p-8 text-center">
        <ImageOff className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          No image uploaded for question {question} yet.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-white p-1.5 sm:p-2">
      {!loaded && <Skeleton className="h-[260px] w-full rounded-lg" />}
      <img
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

export default QuestionCard;
