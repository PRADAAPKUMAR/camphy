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

    // Save attempt
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading exam...</p>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">Paper not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-2">
        <div>
          <h2 className="font-semibold">
            {paper.subject} — {paper.paper_code}
          </h2>
          <p className="text-xs text-muted-foreground">
            {paper.level} · {paper.year} · {paper.session}
          </p>
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
