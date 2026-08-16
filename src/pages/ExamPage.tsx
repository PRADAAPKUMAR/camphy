import { useState, useCallback, lazy, Suspense } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
const getSupabase = () => import("@/integrations/supabase/client").then(m => m.supabase);
const PDFViewer = lazy(() => import("@/components/PDFViewer"));
import MCQPanel from "@/components/MCQPanel";
import ResultSummary from "@/components/ResultSummary";
import Timer from "@/components/Timer";
import ExplanationDialog from "@/components/ExplanationDialog";
import { useExplanation } from "@/hooks/use-explanation";
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
import { useIsMobile } from "@/hooks/use-mobile";
import MobileExamShell from "@/components/MobileExamShell";

const TOTAL_QUESTIONS = 40;
const CACHE_TTL = 30 * 60 * 1000;
const cacheKey = (paperId: string) => `physicshq:answer-key:${paperId}`;

const readCachedKey = (paperId?: string): Record<number, string> | undefined => {
  if (!paperId) return undefined;
  try {
    const raw = sessionStorage.getItem(cacheKey(paperId));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { timestamp: number; answers: Record<string, string> };
    if (!parsed?.timestamp || Date.now() - parsed.timestamp > CACHE_TTL) return undefined;
    const map: Record<number, string> = {};
    for (const [k, v] of Object.entries(parsed.answers ?? {})) map[Number(k)] = v;
    return Object.keys(map).length ? map : undefined;
  } catch {
    return undefined;
  }
};

const writeCachedKey = (paperId: string, answers: Record<number, string>) => {
  try {
    sessionStorage.setItem(cacheKey(paperId), JSON.stringify({ timestamp: Date.now(), answers }));
  } catch {
    // ignore quota / privacy-mode failures
  }
};

const ExamPage = () => {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, string>>({});
  const explanation = useExplanation(paperId ? { paper_id: paperId } : null);

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

  // Prefetch the whole key once so feedback on selection is instant.
  const { data: answerKeyMap } = useQuery({
    queryKey: ["answer-key", paperId],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase.functions.invoke("get-answer-key", {
        body: { paper_id: paperId, kind: "paper" },
      });
      if (error) throw error;
      const map: Record<number, string> = {};
      for (const [k, v] of Object.entries((data?.correct_answers ?? {}) as Record<string, string>)) {
        map[Number(k)] = v;
      }
      if (paperId) writeCachedKey(paperId, map);
      return map;
    },
    enabled: !!paperId,
    staleTime: Infinity,
    initialData: () => readCachedKey(paperId),
  });

  // The correct answer for a question is only revealed after the user commits
  // an answer for that question.
  const handleSelectAnswer = useCallback((question: number, option: string) => {
    if (isSubmitted || answers[question]) return;
    setAnswers((prev) => ({ ...prev, [question]: option }));
    const known = answerKeyMap?.[question];
    if (known) {
      setCorrectAnswers((prev) => ({ ...prev, [question]: known }));
      return;
    }
    (async () => {
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase.functions.invoke("check-answer", {
          body: { paper_id: paperId, question, answer: option },
        });
        if (error) throw error;
        if (data?.correct_answer) {
          setCorrectAnswers((prev) => ({ ...prev, [question]: data.correct_answer }));
        }
      } catch {
        toast.error("Could not check that answer");
      }
    })();
  }, [isSubmitted, answers, paperId, answerKeyMap]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    if (Object.keys(answers).length === 0) {
      setScore(0);
      toast.info("No answers submitted");
      return;
    }

    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.functions.invoke("submit-exam", {
        body: { paper_id: paperId, answers },
      });
      if (error) throw error;
      const mapped: Record<number, string> = {};
      for (const [k, v] of Object.entries((data.correct_answers ?? {}) as Record<string, string>)) {
        mapped[Number(k)] = v;
      }
      setCorrectAnswers(mapped);
      setScore(data.score);
      toast.success(`Score: ${data.score}/${TOTAL_QUESTIONS}`);
    } catch {
      if (answerKeyMap) {
        let s = 0;
        for (const [q, a] of Object.entries(answers)) {
          if (answerKeyMap[Number(q)] === a) s++;
        }
        setCorrectAnswers(answerKeyMap);
        setScore(s);
        toast.success(`Score: ${s}/${TOTAL_QUESTIONS}`);
      } else {
        toast.error("Could not submit your answers");
      }
    }
  }, [isSubmitted, answers, paperId, answerKeyMap]);

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
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <PDFViewer url={paper.pdf_url} />
          </Suspense>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={22} minSize={18}>
          {isSubmitted && Object.keys(correctAnswers).length > 0 ? (
            <ResultSummary
              score={score}
              totalQuestions={TOTAL_QUESTIONS}
              answers={answers}
              correctAnswers={correctAnswers}
              onExplain={explanation.openExplanation}
            />
          ) : (
            <MCQPanel
              totalQuestions={TOTAL_QUESTIONS}
              answers={answers}
              correctAnswers={correctAnswers}
              onSelectAnswer={handleSelectAnswer}
              onSubmit={handleSubmit}
              isSubmitted={isSubmitted}
              onExplain={explanation.openExplanation}
            />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      <ExplanationDialog
        open={explanation.open}
        onOpenChange={explanation.setOpen}
        question={explanation.question}
        userAnswer={explanation.question ? answers[explanation.question] : undefined}
        isLoading={explanation.isLoading}
        data={explanation.data}
      />
    </div>
  );
};

export default ExamPage;
