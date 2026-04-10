import { useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
const getSupabase = () => import("@/integrations/supabase/client").then(m => m.supabase);

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

const TopicExamPage = () => {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, string>>({});

  const { data: paper, isLoading: paperLoading } = useQuery({
    queryKey: ["topicwise_mcq_paper", paperId],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("topicwise_mcq_papers")
        .select("*")
        .eq("id", paperId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!paperId,
  });

  const totalQuestions = paper?.total_questions ?? 40;

  const handleSelectAnswer = useCallback(async (question: number, option: string) => {
    if (isSubmitted || answers[question]) return;
    setAnswers((prev) => ({ ...prev, [question]: option }));

    // Check the answer immediately via edge function
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.functions.invoke("check-topic-answer", {
        body: { paper_id: paperId, question },
      });
      if (error) throw error;
      setCorrectAnswers((prev) => ({ ...prev, [question]: data.correct_answer }));
    } catch {
      // Silently fail — answer will just not show correct/wrong
    }
  }, [isSubmitted, answers, paperId]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.functions.invoke("submit-topic-exam", {
        body: { paper_id: paperId, answers },
      });

      if (error) throw error;

      setScore(data.score);
      const mapped: Record<number, string> = {};
      for (const [k, v] of Object.entries(data.correct_answers)) {
        mapped[Number(k)] = v as string;
      }
      setCorrectAnswers(mapped);
      toast.success(`Score: ${data.score}/${data.total_questions}`);
    } catch {
      toast.error("Failed to submit. Please try again.");
      setIsSubmitted(false);
    }
  }, [isSubmitted, answers, paperId]);

  if (paperLoading) {
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
        <Button variant="outline" onClick={() => navigate("/topic-practice")}>
          Back to Topics
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-card px-5 py-3 shadow-sm">
        <div className="flex items-center gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/topic-practice">Topics</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/topic-practice/${encodeURIComponent(paper.level)}`}>{paper.level}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{paper.topic}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Timer
          durationMinutes={paper.timer_minutes}
          onTimeUp={handleSubmit}
          isRunning={!isSubmitted}
        />
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={78} minSize={40}>
          <div className="flex h-full flex-col bg-muted/30">
            <iframe
              src={paper.pdf_url.replace(/\/file\/d\/([^/]+).*/, "/file/d/$1/preview")}
              className="h-full w-full border-0"
              title="Google Drive Viewer"
              allow="autoplay"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={22} minSize={18}>
          {isSubmitted && Object.keys(correctAnswers).length > 0 ? (
            <ResultSummary
              score={score}
              totalQuestions={totalQuestions}
              answers={answers}
              correctAnswers={correctAnswers}
            />
          ) : (
            <MCQPanel
              totalQuestions={totalQuestions}
              answers={answers}
              correctAnswers={correctAnswers}
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
