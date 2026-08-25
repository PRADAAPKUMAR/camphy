import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Lightbulb, Timer as TimerIcon } from "lucide-react";
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
import QuestionCard from "@/components/question-mode/QuestionCard";
import QuestionStrip from "@/components/question-mode/QuestionStrip";
import OptionButtons from "@/components/question-mode/OptionButtons";
import ResultSummary from "@/components/ResultSummary";
import ExplanationDialog, { type ExplanationData } from "@/components/ExplanationDialog";
import { useQuestionImages } from "@/hooks/use-question-images";
import { savePerformanceRecord } from "@/lib/performance-history";
import { displayLevel, syllabusVersionForLevel } from "@/lib/syllabus";
import { buildTopicalSet } from "@/lib/topical-bank";

const getSupabase = () => import("@/integrations/supabase/client").then((m) => m.supabase);

const fmtSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Question mode over past-paper MCQs mapped to one syllabus topic. */
const TopicalMcqSessionPage = () => {
  const { level = "", topicSlug = "" } = useParams<{ level: string; topicSlug: string }>();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, string>>({});
  const [times, setTimes] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(0);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const shownAt = useRef<number>(Date.now());

  const [explainOpen, setExplainOpen] = useState(false);
  const [explainQuestion, setExplainQuestion] = useState<number | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainData, setExplainData] = useState<ExplanationData | null>(null);

  const { data: set, isLoading } = useQuery({
    queryKey: ["topical-set", level, topicSlug],
    queryFn: () => buildTopicalSet(level, topicSlug),
    enabled: !!level && !!topicSlug,
    staleTime: 30 * 60 * 1000,
  });

  const items = set?.questions ?? [];
  const topicName = set?.topic?.name ?? "Topic";
  const questions = useMemo(() => items.map((q) => q.index), [items]);
  const currentItem = items[Math.min(current, Math.max(items.length - 1, 0))];
  const answeredCount = Object.keys(answers).length;

  const { data: images } = useQuestionImages(currentItem?.paperId);

  // Prefetch the answer keys of every paper the set draws from.
  const { data: keyByIndex } = useQuery({
    queryKey: ["topical-set-keys", level, topicSlug, items.length],
    enabled: items.length > 0,
    staleTime: Infinity,
    queryFn: async () => {
      const supabase = await getSupabase();
      const paperIds = Array.from(new Set(items.map((q) => q.paperId)));
      const keys = await Promise.all(
        paperIds.map(async (paperId) => {
          const { data } = await supabase.functions.invoke("get-answer-key", {
            body: { paper_id: paperId },
          });
          return [paperId, (data?.correct_answers ?? {}) as Record<string, string>] as const;
        }),
      );
      const byPaper = Object.fromEntries(keys);
      const map: Record<number, string> = {};
      items.forEach((q) => {
        const answer = byPaper[q.paperId]?.[String(q.questionNumber)];
        if (answer) map[q.index] = answer;
      });
      return map;
    },
  });

  useEffect(() => {
    shownAt.current = Date.now();
  }, [current]);

  useEffect(() => {
    if (finished) return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [finished]);

  const handleSelect = useCallback(
    (option: string) => {
      const idx = currentItem?.index;
      if (!idx || finished || answers[idx]) return;
      const spent = Math.max(1, Math.round((Date.now() - shownAt.current) / 1000));
      setTimes((prev) => ({ ...prev, [idx]: spent }));
      setAnswers((prev) => ({ ...prev, [idx]: option }));

      const known = keyByIndex?.[idx];
      if (known) {
        setCorrectAnswers((prev) => ({ ...prev, [idx]: known }));
        return;
      }
      (async () => {
        try {
          const supabase = await getSupabase();
          const { data, error } = await supabase.functions.invoke("check-answer", {
            body: {
              paper_id: currentItem.paperId,
              question: currentItem.questionNumber,
              answer: option,
            },
          });
          if (error) throw error;
          if (data?.correct_answer) {
            setCorrectAnswers((prev) => ({ ...prev, [idx]: data.correct_answer }));
          }
        } catch {
          toast.error("Could not check that answer");
        }
      })();
    },
    [currentItem, finished, answers, keyByIndex],
  );

  const openExplanation = useCallback(
    async (index: number) => {
      const item = items.find((q) => q.index === index);
      if (!item) return;
      setExplainQuestion(index);
      setExplainOpen(true);
      setExplainData(null);
      setExplainLoading(true);
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase.functions.invoke("get-explanation", {
          body: { paper_id: item.paperId, question: item.questionNumber },
        });
        if (error) throw error;
        setExplainData(data as ExplanationData);
      } catch {
        toast.error("Could not load the explanation");
        setExplainData({ found: false });
      } finally {
        setExplainLoading(false);
      }
    },
    [items],
  );

  const finish = useCallback(() => {
    if (finished || !items.length) return;
    setFinished(true);
    const key = { ...keyByIndex, ...correctAnswers };
    let score = 0;
    Object.entries(answers).forEach(([q, a]) => {
      if (key[Number(q)] === a) score++;
    });
    setCorrectAnswers((prev) => ({ ...prev, ...key }));

    if (answeredCount > 0) {
      savePerformanceRecord({
        paperId: `topical:${level}:${topicSlug}`,
        paperCode: topicName,
        level,
        year: null,
        session: null,
        score,
        totalQuestions: items.length,
        percentage: Math.round((score / items.length) * 100),
        completedAt: new Date().toISOString(),
        practiceType: "topic",
        topic: topicName,
        attemptMode: "question",
        syllabusVersion: syllabusVersionForLevel(level),
        primaryTopicId: set?.topic?.id ?? null,
        questionResults: Object.fromEntries(
          Object.entries(answers).map(([q, a]) => [Number(q), key[Number(q)] === a]),
        ),
        questionTimes: times,
      });
    }
    toast.success(`Score: ${score}/${items.length}`);
  }, [
    finished,
    items,
    keyByIndex,
    correctAnswers,
    answers,
    answeredCount,
    level,
    topicSlug,
    topicName,
    set,
    times,
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

  if (!set?.topic || !items.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <p className="font-medium text-destructive">
          No mapped questions found for this topic yet.
        </p>
        <Button variant="outline" onClick={() => navigate(`/topical-mcq/${encodeURIComponent(level)}`)}>
          Back to topics
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
                  <BreadcrumbLink asChild>
                    <Link to={`/topical-mcq/${encodeURIComponent(level)}`}>
                      {displayLevel(level)}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{topicName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <p className="text-xs text-muted-foreground">
              Question mode · {answeredCount}/{items.length} answered
            </p>
          </div>
          <Badge variant="outline" className="gap-1 border-border/40 font-mono text-xs">
            <TimerIcon className="h-3.5 w-3.5" /> {fmtSeconds(elapsed)}
          </Badge>
        </div>
      </header>

      <main className="w-full px-2 py-3 sm:px-4">
        {finished ? (
          <div className="mx-auto max-w-3xl">
            <div className="glass-card overflow-hidden rounded-2xl">
              <div className="h-[70dvh]">
                <ResultSummary
                  score={score}
                  totalQuestions={items.length}
                  answers={answers}
                  correctAnswers={correctAnswers}
                  onExplain={openExplanation}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate("/performance")}>
                View performance
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/topical-mcq/${encodeURIComponent(level)}`)}
              >
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
                <div className="min-w-0 text-center">
                  <p className="text-sm font-semibold">
                    Question {current + 1}
                    <span className="text-muted-foreground"> of {items.length}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {currentItem.paperCode} · {currentItem.session} {currentItem.year} · Q
                    {currentItem.questionNumber}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next question"
                  disabled={current >= items.length - 1}
                  onClick={() => setCurrent((c) => Math.min(items.length - 1, c + 1))}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <QuestionCard
                question={currentItem.questionNumber}
                imageUrl={images?.[currentItem.questionNumber]}
              />

              <OptionButtons
                question={currentItem.index}
                userAnswer={answers[currentItem.index]}
                correctAnswer={correctAnswers[currentItem.index]}
                onSelect={handleSelect}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={!answers[currentItem.index]}
                  onClick={() => openExplanation(currentItem.index)}
                >
                  <Lightbulb className="h-4 w-4" /> Explain this question
                </Button>
                {current < items.length - 1 ? (
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
                  current={currentItem.index}
                  answers={answers}
                  correctAnswers={correctAnswers}
                  onJump={(q) => setCurrent(Math.max(0, questions.indexOf(q)))}
                />
                <Button className="mt-4 w-full" variant="secondary" onClick={finish}>
                  Finish now
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Questions come from mapped {displayLevel(level)} MCQ past papers for {topicName}.
                Answers lock as soon as you pick one and marking is instant.
              </p>
            </aside>
          </div>
        )}
      </main>

      <ExplanationDialog
        open={explainOpen}
        onOpenChange={setExplainOpen}
        question={explainQuestion}
        userAnswer={explainQuestion ? answers[explainQuestion] : undefined}
        isLoading={explainLoading}
        data={explainData}
      />
    </div>
  );
};

export default TopicalMcqSessionPage;
