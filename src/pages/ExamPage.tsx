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
import { Skeleton } from "@/components/ui/skeleton";

const TOTAL_QUESTIONS = 40;

const ExamPage = () => {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, string>>({});

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

  const handleSelectAnswer = (question: number, option: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [question]: option }));
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitted) return;

    setIsSubmitted(true);

    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.functions.invoke("submit-exam", {
        body: { paper_id: paperId, answers },
      });

      if (error) throw error;

      setScore(data.score);
      // Convert string keys to number keys for correctAnswers
      const mapped: Record<number, string> = {};
      for (const [k, v] of Object.entries(data.correct_answers)) {
        mapped[Number(k)] = v as string;
      }
      setCorrectAnswers(mapped);
      toast.success(`Score: ${data.score}/${data.total_questions}`);
    } catch {
      toast.error("Failed to submit exam. Please try again.");
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
          {isSubmitted && Object.keys(correctAnswers).length > 0 ? (
            <ResultSummary
              score={score}
              totalQuestions={TOTAL_QUESTIONS}
              answers={answers}
              correctAnswers={correctAnswers}
            />
          ) : (
            <MCQPanel
              totalQuestions={TOTAL_QUESTIONS}
              answers={answers}
              correctAnswers={{}}
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
