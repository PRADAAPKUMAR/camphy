import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const { data: answerKeys } = useQuery({
    queryKey: ["answer_keys", paperId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("answer_keys")
        .select("*")
        .eq("paper_id", paperId!)
        .order("question_number");
      if (error) throw error;
      return data;
    },
    enabled: !!paperId,
  });

  const handleSelectAnswer = (question: number, option: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [question]: option }));
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitted || !answerKeys) return;

    const correctMap: Record<number, string> = {};
    answerKeys.forEach((ak) => {
      correctMap[ak.question_number] = ak.correct_option;
    });
    setCorrectAnswersMap(correctMap);

    let correct = 0;
    for (let q = 1; q <= TOTAL_QUESTIONS; q++) {
      if (answers[q] === correctMap[q]) correct++;
    }
    setScore(correct);
    setIsSubmitted(true);

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
  }, [isSubmitted, answerKeys, answers, paperId]);

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
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-sm font-bold leading-tight">
              {paper.subject} — <span className="font-mono text-muted-foreground">{paper.paper_code}</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              {paper.level} · {paper.year} · {paper.session}
            </p>
          </div>
        </div>
        <Timer
          durationMinutes={45}
          onTimeUp={handleSubmit}
          isRunning={!isSubmitted}
        />
      </div>

      {/* Split view */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={70} minSize={40}>
          <PDFViewer url={paper.pdf_url} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={20}>
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
