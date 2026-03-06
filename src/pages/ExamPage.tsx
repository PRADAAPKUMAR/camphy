import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
const getSupabase = () => import("@/integrations/supabase/client").then(m => m.supabase);
import { Database } from "@/integrations/supabase/types";
import PDFViewer from "@/components/PDFViewer";
import MCQPanel from "@/components/MCQPanel";
import ResultSummary from "@/components/ResultSummary";
import Timer from "@/components/Timer";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

const TOTAL_QUESTIONS = 40;
type AnswerKeyRow = Database["public"]["Tables"]["answer_keys"]["Row"];

const ExamPage = () => {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const { data: paper, isLoading: paperLoading } = useQuery({
    queryKey: ["paper", paperId],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("papers")
        .select("*")
        .eq("id", paperId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!paperId,
  });

  const { data: answerKey, isLoading: answerKeyLoading } = useQuery({
    queryKey: ["answer_keys", paperId],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("answer_keys")
        .select("*")
        .eq("paper_id", paperId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!paperId,
  });

  const correctAnswersMap = useMemo(() => {
    if (!answerKey) return {};

    const map: Record<number, string> = {};
    for (let q = 1; q <= TOTAL_QUESTIONS; q++) {
      const key = `q${q}` as keyof AnswerKeyRow;
      const value = answerKey[key];
      if (typeof value === "string") {
        map[q] = value;
      }
    }

    return map;
  }, [answerKey]);

  const handleSelectAnswer = (question: number, option: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [question]: option }));
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitted || !answerKey) return;

    let correct = 0;
    for (let q = 1; q <= TOTAL_QUESTIONS; q++) {
      if (answers[q] === correctAnswersMap[q]) correct++;
    }
    setScore(correct);
    setIsSubmitted(true);

    const supabase = await getSupabase();
    const { error } = await supabase.from("attempts").insert({
      paper_id: paperId!,
      score: correct,
      total_questions: TOTAL_QUESTIONS,
      answers,
    });
    if (error) {
      toast.error("Failed to save attempt");
    } else {
      toast.success(`Score: ${correct}/${TOTAL_QUESTIONS}`);
    }
  }, [isSubmitted, answerKey, answers, paperId, correctAnswersMap]);

  if (paperLoading || answerKeyLoading) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <div className="flex items-center justify-between border-b bg-card px-5 py-3 shadow-sm">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="flex flex-1">
          <div className="flex-1 p-4">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
          <div className="w-[22%] min-w-[200px] border-l border-border/40 p-4 space-y-3">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <div className="flex gap-1.5 flex-1">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-8 flex-1 rounded-md" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-destructive font-medium">Paper not found</p>
        <Button variant="outline" onClick={() => navigate("/papers")}>
          Back to Papers
        </Button>
      </div>
    );
  }

  if (!answerKey) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-destructive font-medium">Answer key not found for this paper</p>
        <Button variant="outline" onClick={() => navigate("/papers")}>Back to Papers</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b bg-card px-5 py-3 shadow-sm">
        <div className="flex items-center gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/papers">Levels</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to={`/papers/${encodeURIComponent(paper.level)}`}>{paper.level}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{paper.paper_code} — {paper.session} {paper.year}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Timer
          durationMinutes={paper.level.toUpperCase() === "AS LEVEL" ? 75 : 45}
          onTimeUp={handleSubmit}
          isRunning={!isSubmitted}
        />
      </div>

      {/* Split view */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={78} minSize={40}>
          <PDFViewer url={paper.pdf_url} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={22} minSize={18}>
          {isSubmitted ? (
            <ResultSummary
              score={score}
              totalQuestions={TOTAL_QUESTIONS}
              answers={answers}
              correctAnswers={correctAnswersMap}
            />
          ) : (
            <MCQPanel
              totalQuestions={TOTAL_QUESTIONS}
              answers={answers}
              correctAnswers={correctAnswersMap}
              onSelectAnswer={handleSelectAnswer}
              onSubmit={handleSubmit}
              isSubmitted={isSubmitted}
            />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ExamPage;
