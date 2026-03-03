import { useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
const getSupabase = () => import("@/integrations/supabase/client").then(m => m.supabase);
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

const TOTAL_QUESTIONS = 40;

const ExamPage = () => {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswersMap, setCorrectAnswersMap] = useState<
    Record<number, string>
  >({});

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

  const { data: answerKey } = useQuery({
    queryKey: ["answer_keys", paperId],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("answer_keys")
        .select("*")
        .eq("paper_id", paperId!)
        .single();
      if (error) throw error;
      // Build correct answers map immediately
      const map: Record<number, string> = {};
      for (let q = 1; q <= TOTAL_QUESTIONS; q++) {
        const val = (data as any)[`q${q}`];
        if (val) map[q] = val;
      }
      setCorrectAnswersMap(map);
      return data;
    },
    enabled: !!paperId,
  });

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
      answers: answers as any,
    });
    if (error) {
      toast.error("Failed to save attempt");
    } else {
      toast.success(`Score: ${correct}/${TOTAL_QUESTIONS}`);
    }
  }, [isSubmitted, answerKey, answers, paperId, correctAnswersMap]);

  if (paperLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading exam...</p>
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
