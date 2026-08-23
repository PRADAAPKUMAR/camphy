import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ChevronLeft, ChevronRight, Lightbulb, Timer as TimerIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import QuestionStrip from "@/components/question-mode/QuestionStrip";
import OptionButtons from "@/components/question-mode/OptionButtons";
import ResultSummary from "@/components/ResultSummary";
import ExplanationDialog from "@/components/ExplanationDialog";
import { useExplanation } from "@/hooks/use-explanation";
import { savePerformanceRecord } from "@/lib/performance-history";
import { syllabusVersionForLevel } from "@/lib/syllabus";
import { useTopicPracticeMap } from "@/hooks/use-syllabus";

const getSupabase = () => import("@/integrations/supabase/client").then((m) => m.supabase);

const fmtSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const drivePreview = (url: string) => url.replace(/\/file\/d\/([^/]+).*/, "/file/d/$1/preview");

/** Topical MCQ set played with the Question mode UI (one question at a time). */
const TopicalMcqQuestionModePage = () => {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, string>>({});
  const [times, setTimes] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(0);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const shownAt = useRef<number>(Date.now());

  const explanation = useExplanation(paperId ? { topic_paper_id: paperId } : null);
  const { data: topicMap } = useTopicPracticeMap();

  const { data: paper, isLoading } = useQuery({
    queryKey: ["topicwise-mcq-paper", paperId],
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

  const { data: answerKeyMap } = useQuery({
    queryKey: ["topic-answer-key", paperId],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase.functions.invoke("get-answer-key", {
        body: { paper_id: paperId, kind: "topic" },
      });
      if (error) throw error;
      const map: Record<number, string> = {};
      for (const [k, v] of Object.entries((data?.correct_answers ?? {}) as Record<string, string>)) {
        map[Number(k)] = v;
      }
      return map;
    },
    enabled: !!paperId,
    staleTime: Infinity,
  });

  const totalQuestions = paper?.total_questions ?? 40;
  const questions = useMemo(
    () => Array.from({ length: totalQuestions }, (_, i) => i + 1),
    [totalQuestions],
  );

  const currentQuestion = questions[Math.min(current, questions.length - 1)] ?? 1;
  const answeredCount = Object.keys(answers).length;

  useEffect(() => {
    shownAt.current = Date.now();
  }, [currentQuestion]);

  useEffect(() => {
    if (finished) return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [finished]);

  const goTo = useCallback(
    (question: number) => {
      const idx = questions.indexOf(question);
      if (idx >= 0) setCurrent(idx);
    },
    [questions],
  );

  const handleSelect = useCallback(
    (option: string) => {
      const q = currentQuestion;
      if (finished || answers[q]) return;
      const spent = Math.max(1, Math.round((Date.now() - shownAt.current) / 1000));
      setTimes((prev) => ({ ...prev, [q]: spent }));
      setAnswers((prev) => ({ ...prev, [q]: option }));

      const known = answerKeyMap?.[q];
      if (known) {
        setCorrectAnswers((prev) => ({ ...prev, [q]: known }));
        return;
      }
      (async () => {
        try {
          const supabase = await getSupabase();
          const { data, error } = await supabase.functions.invoke("check-topic-answer", {
            body: { paper_id: paperId, question: q, answer: option },
          });
          if (error) throw error;
          if (data?.correct_answer) {
            setCorrectAnswers((prev) => ({ ...prev, [q]: data.correct_answer }));
          }
        } catch {
          toast.error("Could not check that answer");
        }
      })();
    },
    [currentQuestion, finished, answers, answerKeyMap, paperId],
  );

  const finish = useCallback(() => {
    if (finished) return;
    setFinished(true);
    const key = { ...answerKeyMap, ...correctAnswers };
    let score = 0;
    Object.entries(answers).forEach(([q, a]) => {
      if (key[Number(q)] === a) score++;
    });
    setCorrectAnswers((prev) => ({ ...prev, ...key }));

    if (paper && paperId && answeredCount > 0) {
      savePerformanceRecord({
        paperId,
        paperCode: paper.topic ?? "Topical MCQ",
        level: paper.level ?? "",
        year: null,
        session: null,
        score,
        totalQuestions: questions.length,
        percentage: questions.length ? Math.round((score / questions.length) * 100) : 0,
        completedAt: new Date().toISOString(),
        practiceType: "topic",
        topic: paper.topic ?? null,
        attemptMode: "question",
        syllabusVersion: syllabusVersionForLevel(paper.level),
        primaryTopicId:
          topicMap?.find((m) => m.topic === paper.topic && m.level === paper.level)
            ?.syllabus_topic_id ?? null,
        questionResults: Object.fromEntries(
          Object.entries(answers).map(([q, a]) => [Number(q), key[Number(q)] === a]),
        ),
        questionTimes: times,
      });
    }
    toast.success(`Score: ${score}/${questions.length}`);
  }, [
    finished,
    answerKeyMap,
    correctAnswers,
    answers,
    paper,
    paperId,
    questions,
    times,
    answeredCount,
    topicMap,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="mb-6 h-6 w-64" />
        <Skeleton className="mb-4 h-[50dvh] w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="font-medium text-destructive">Topic set not found</p>
        <Button variant="outline" onClick={() => navigate("/topical-mcq")}>
          Back to Topical MCQ
        </Button>
      </div>
    );
  }

  const score = Object.entries(answers).filter(([q, a]) => correctAnswers[Number(q)] === a).length;

  return (
    <div className="min-h-screen bg-background bg-grid">
      <header className="border-b border-border/40">
        <div className="flex w-full flex-wrap items-center justify-between gap-3 px-2 py-3 sm:px-4">
          <div className="min-w-0">
            <Breadcrumb className="mb-1">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/topical-mcq">Topical MCQ</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {paper.level} — {paper.topic}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <p className="text-xs text-muted-foreground">
              Question mode · {answeredCount}/{questions.length} answered
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 border-border/40 font-mono text-xs">
              <TimerIcon className="h-3.5 w-3.5" /> {fmtSeconds(elapsed)}
            </Badge>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
              <Link to={`/topic-exam/${paper.id}`}>
                <ArrowLeft className="h-4 w-4" /> PDF exam
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="w-full px-2 py-3 sm:px-4">
        {finished ? (
          <div className="mx-auto max-w-3xl">
            <div className="glass-card overflow-hidden rounded-2xl">
              <div className="h-[70dvh]">
                <ResultSummary
                  score={score}
                  totalQuestions={questions.length}
                  answers={answers}
                  correctAnswers={correctAnswers}
                  onExplain={explanation.openExplanation}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate("/performance")}>
                View performance
              </Button>
              <Button variant="outline" onClick={() => navigate("/topical-mcq")}>
                More topics
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous question"
                  disabled={current <= 0}
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <p className="text-sm font-semibold">
                  Question {currentQuestion}
                  <span className="text-muted-foreground">
                    {" "}
                    ({current + 1} of {questions.length})
                  </span>
                </p>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next question"
                  disabled={current >= questions.length - 1}
                  onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="h-[60dvh] overflow-hidden rounded-xl border border-border/40 bg-muted/20">
                <iframe
                  src={drivePreview(paper.pdf_url)}
                  className="h-full w-full border-0"
                  title={`${paper.topic} questions`}
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              </div>

              <OptionButtons
                question={currentQuestion}
                userAnswer={answers[currentQuestion]}
                correctAnswer={correctAnswers[currentQuestion]}
                onSelect={handleSelect}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={!answers[currentQuestion]}
                  onClick={() => explanation.openExplanation(currentQuestion)}
                >
                  <Lightbulb className="h-4 w-4" /> Explain this question
                </Button>
                {current < questions.length - 1 ? (
                  <Button className="gap-2" onClick={() => setCurrent((c) => c + 1)}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button className="gap-2" onClick={finish}>
                    Finish &amp; see results
                  </Button>
                )}
              </div>
            </div>

            <aside className="space-y-4">
              <div className="glass-card rounded-2xl p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Progress
                </p>
                <QuestionStrip
                  questions={questions}
                  current={currentQuestion}
                  answers={answers}
                  correctAnswers={correctAnswers}
                  onJump={goTo}
                />
                <Button className="mt-4 w-full" variant="secondary" onClick={finish}>
                  Finish now
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Answers lock as soon as you pick one, and marking is instant. Time spent per
                question is saved to your performance page.
              </p>
            </aside>
          </div>
        )}
      </main>

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

export default TopicalMcqQuestionModePage;
