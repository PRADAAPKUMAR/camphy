import SplitFlapDisplay from "@/components/SplitFlapDisplay";
import GlassIcon from "@/components/GlassIcon";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, ChevronRight, Clock3, Crown, Flag, Gamepad2, Lightbulb, Medal, Plus, RotateCcw, Trophy, Users, X } from "lucide-react";
import { toast } from "sonner";
import ExplanationDialog from "@/components/ExplanationDialog";
import { useExplanation } from "@/hooks/use-explanation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import QuestionCard from "@/components/question-mode/QuestionCard";
import { GRADES, isGradeKey, type GradeKey } from "@/lib/grades";
import {
  fetchWorksheetSelection,
  fetchWorksheetTopics,
  type WorksheetItem,
  type WorksheetTopicGroup,
} from "@/lib/worksheet";

const OPTIONS = ["A", "B", "C", "D"] as const;
const TEAM_STYLES = ["primary", "accent", "success", "study-3", "study-4", "study-5"] as const;
type QuizSource = "random" | "topic";
type Phase = "setup" | "question" | "reveal" | "results";

interface Team {
  id: string;
  name: string;
  score: number;
  correct: number;
}

interface TeamAnswer {
  option: string;
  secondsLeft: number;
  points?: number;
}

const makeTeams = (count: number): Team[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `team-${index + 1}`,
    name: `Team ${index + 1}`,
    score: 0,
    correct: 0,
  }));

const fmtTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

const teamTone = (index: number) => {
  const token = TEAM_STYLES[index] ?? "primary";
  return {
    borderColor: `hsl(var(--${token}) / 0.45)`,
    backgroundColor: `hsl(var(--${token}) / 0.1)`,
    color: `hsl(var(--${token}))`,
  };
};

const rankTeams = (teams: Team[]) => {
  const sorted = [...teams].sort((a, b) => b.score - a.score || b.correct - a.correct || a.name.localeCompare(b.name));
  let previousScore: number | null = null;
  let previousRank = 0;
  return sorted.map((team, index) => {
    const rank = previousScore === team.score ? previousRank : index + 1;
    previousScore = team.score;
    previousRank = rank;
    return { ...team, rank };
  });
};

const ClassroomQuizPage = () => {
  const { grade: rawGrade } = useParams<{ grade: string }>();
  const navigate = useNavigate();
  const validGrade = isGradeKey(rawGrade) ? (rawGrade.toLowerCase() as GradeKey) : null;
  const supported = validGrade === "igcse" || validGrade === "as";
  const grade = supported ? validGrade : null;
  const level = grade ? GRADES[grade].worksheetLevel : null;

  const [phase, setPhase] = useState<Phase>("setup");
  const [source, setSource] = useState<QuizSource>("random");
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>(makeTeams(2));
  const [questionCount, setQuestionCount] = useState(10);
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState<WorksheetItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [answers, setAnswers] = useState<Record<string, TeamAnswer>>({});
  const [answeredQuestionCount, setAnsweredQuestionCount] = useState(0);
  const [loadingGame, setLoadingGame] = useState(false);
  const revealGuard = useRef(false);
  const [history, setHistory] = useState<Record<number, Record<string, TeamAnswer>>>({});
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const questionNavRef = useRef<HTMLDivElement>(null);
  const questionContentRef = useRef<HTMLElement>(null);

  const { data: topicGroups, isLoading: topicsLoading } = useQuery({
    queryKey: ["classroom-quiz-topics", level],
    queryFn: () => fetchWorksheetTopics(level ?? ""),
    enabled: !!level && source === "topic",
    staleTime: 30 * 60 * 1000,
  });

  const selectedSet = useMemo(() => new Set(selectedTopicIds), [selectedTopicIds]);
  const currentQuestion = questions[current];
  const reviewing = viewIndex !== null;
  const shownIndex = viewIndex ?? current;
  const shownQuestion = questions[shownIndex];
  const explanationSource = useMemo(
    () => shownQuestion?.paper_id ? { paper_id: shownQuestion.paper_id } : null,
    [shownQuestion?.paper_id],
  );
  const explanation = useExplanation(explanationSource);
  const ranked = useMemo(() => rankTeams(teams), [teams]);
  const allAnswered = teams.length > 0 && teams.every((team) => answers[team.id]);

  // Preload every question image so "Next" is instant.
  useEffect(() => {
    questions.forEach((q) => {
      if (!q.image_url) return;
      const img = new Image();
      img.decoding = "async";
      img.src = q.image_url;
    });
  }, [questions]);

  const reveal = useCallback(() => {
    if (revealGuard.current || phase !== "question" || !currentQuestion) return;
    revealGuard.current = true;
    const correct = currentQuestion.correct_answer?.toUpperCase();
    const scored = { ...answers };
    teams.forEach((team) => {
      const answer = answers[team.id];
      if (answer && answer.option === correct) {
        scored[team.id] = { ...answer, points: 1000 + Math.round((answer.secondsLeft / duration) * 500) };
      }
    });
    setTeams((previous) =>
      previous.map((team) => {
        const answer = scored[team.id];
        if (!answer?.points) return team;
        return { ...team, score: team.score + answer.points, correct: team.correct + 1 };
      }),
    );
    setAnswers(scored);
    setHistory((h) => ({ ...h, [current]: scored }));
    setAnsweredQuestionCount((count) => count + 1);
    setPhase("reveal");
  }, [answers, current, currentQuestion, duration, phase, teams]);

  useEffect(() => {
    if (phase !== "question" || viewIndex !== null) return;
    if (allAnswered) {
      reveal();
      return;
    }
    if (secondsLeft <= 0) {
      reveal();
      return;
    }
    const timer = window.setTimeout(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [allAnswered, phase, reveal, secondsLeft, viewIndex]);


  const setTeamCount = (count: number) => {
    setTeams((previous) => {
      if (count <= previous.length) return previous.slice(0, count);
      return [...previous, ...makeTeams(count).slice(previous.length)];
    });
  };

  const updateTeamName = (id: string, name: string) =>
    setTeams((previous) => previous.map((team) => (team.id === id ? { ...team, name } : team)));

  const toggleTopic = (group: WorksheetTopicGroup, checked: boolean) => {
    setSelectedTopicIds((previous) => {
      const next = new Set(previous);
      group.ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return Array.from(next);
    });
  };

  const startGame = async () => {
    if (source === "topic" && !selectedTopicIds.length) {
      toast.error("Select at least one topic");
      return;
    }
    if (teams.some((team) => !team.name.trim())) {
      toast.error("Give every team a name");
      return;
    }
    setLoadingGame(true);
    try {
      const result = await fetchWorksheetSelection({
        level,
        source,
        topic_ids: source === "topic" ? selectedTopicIds : [],
        count: questionCount,
        shuffle: true,
      });
      if (result.error) throw new Error(result.error);
      const playable = result.items.filter((item) => item.image_url && item.correct_answer);
      if (!playable.length) throw new Error("No playable questions were found");
      setQuestions(playable);
      setTeams((previous) => previous.map((team) => ({ ...team, name: team.name.trim(), score: 0, correct: 0 })));
      setCurrent(0);
      setAnsweredQuestionCount(0);
      setAnswers({});
      setHistory({});
      setViewIndex(null);
      setSecondsLeft(duration);
      revealGuard.current = false;
      setPhase("question");
      if (playable.length < questionCount) toast.warning(`Only ${playable.length} playable questions are available`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start the quiz");
    } finally {
      setLoadingGame(false);
    }
  };

  const recordAnswer = (teamId: string, option: string) => {
    if (phase !== "question" || answers[teamId]) return;
    setAnswers((previous) => ({ ...previous, [teamId]: { option, secondsLeft } }));
  };

  const nextQuestion = () => {
    if (current >= questions.length - 1) {
      setPhase("results");
      return;
    }
    setViewIndex(null);
    setCurrent((value) => value + 1);
    setAnswers({});
    setSecondsLeft(duration);
    revealGuard.current = false;
    setPhase("question");
  };

  useEffect(() => {
    questionContentRef.current?.scrollTo({ top: 0 });
    questionNavRef.current?.querySelector<HTMLElement>('[aria-current="step"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [shownIndex]);

  const restart = () => {
    setPhase("setup");
    setQuestions([]);
    setAnswers({});
    setCurrent(0);
    setAnsweredQuestionCount(0);
    setTeams((previous) => previous.map((team) => ({ ...team, score: 0, correct: 0 })));
  };

  if (!grade || !level) return <Navigate to={validGrade ? `/grade/${validGrade}` : "/"} replace />;

  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-background bg-grid page-transition">
        <header className="border-b border-border/40 bg-radial-glow">
          <div className="container py-8 sm:py-10">
            <Button variant="ghost" size="sm" className="mb-4 gap-2 text-muted-foreground" onClick={() => navigate(`/grade/${grade}`)}>
              <ArrowLeft className="h-4 w-4" /> {GRADES[grade].label} home
            </Button>
            <div className="flex items-center gap-4">
              <GlassIcon name="quiz" tone="violet" />
              <div><p className="font-mono text-xs text-primary">{GRADES[grade].label} · Classroom activity</p><h1 className="text-3xl font-extrabold sm:text-4xl">Classroom Quiz</h1></div>
            </div>
          </div>
        </header>
        <main className="container grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-7">
            <div>
              <h2 className="mb-3 text-lg font-bold">Question selection</h2>
              <div className="grid grid-cols-2 gap-3">
                {(["random", "topic"] as QuizSource[]).map((value) => (
                  <Button key={value} variant={source === value ? "default" : "outline"} className="h-14" onClick={() => setSource(value)}>
                    {value === "random" ? "Random mix" : "Topical"}
                  </Button>
                ))}
              </div>
              {source === "topic" && (
                <div className="mt-4 max-h-80 space-y-2 overflow-y-auto rounded-lg border border-border/50 bg-card/40 p-3">
                  {topicsLoading ? <Skeleton className="h-32 w-full" /> : (topicGroups ?? []).map((group) => {
                    const checked = group.ids.some((id) => selectedSet.has(id));
                    return <label key={group.key} className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 hover:bg-muted/30">
                      <Checkbox checked={checked} onCheckedChange={(value) => toggleTopic(group, value === true)} />
                      <span className="min-w-0 flex-1 text-sm font-medium">{group.name}</span>
                      <Badge variant="secondary">{group.count}</Badge>
                    </label>;
                  })}
                  {!topicsLoading && !(topicGroups ?? []).length && <p className="p-4 text-center text-sm text-muted-foreground">No playable topical questions yet.</p>}
                </div>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Teams</h2><Badge variant="outline">{teams.length} teams</Badge></div>
              <div className="grid gap-3 sm:grid-cols-2">
                {teams.map((team, index) => <div key={team.id} className="flex items-center gap-2 rounded-lg border p-2" style={teamTone(index)}>
                  <Users className="ml-1 h-4 w-4 shrink-0" /><Input value={team.name} maxLength={24} aria-label={`Team ${index + 1} name`} onChange={(event) => updateTeamName(team.id, event.target.value)} className="border-0 bg-transparent focus-visible:ring-1" />
                  {teams.length > 2 && <Button variant="ghost" size="icon" aria-label={`Remove ${team.name}`} onClick={() => setTeams((previous) => previous.filter((item) => item.id !== team.id))}><X className="h-4 w-4" /></Button>}
                </div>)}
              </div>
              {teams.length < 6 && <Button variant="outline" className="mt-3 gap-2" onClick={() => setTeamCount(teams.length + 1)}><Plus className="h-4 w-4" /> Add team</Button>}
            </div>
          </section>

          <aside className="glass-card h-fit rounded-xl p-6">
            <h2 className="mb-6 text-lg font-bold">Game settings</h2>
            <div className="space-y-6">
              <div><div className="mb-2 flex items-center justify-between"><Label htmlFor="question-count">Questions</Label><strong>{questionCount}</strong></div><Slider id="question-count" min={5} max={40} step={5} value={[questionCount]} onValueChange={(value) => setQuestionCount(value[0] ?? 10)} /></div>
              <div><div className="mb-2 flex items-center justify-between"><Label htmlFor="timer-duration">Time per question</Label><strong>{duration}s</strong></div><Slider id="timer-duration" min={10} max={120} step={5} value={[duration]} onValueChange={(value) => setDuration(value[0] ?? 30)} /></div>
              <div className="rounded-lg border border-border/40 bg-muted/20 p-4 text-sm text-muted-foreground"><p className="font-semibold text-foreground">Scoring</p><p className="mt-1">1,000 points for a correct answer, plus up to 500 speed points.</p></div>
              <Button size="lg" className="w-full gap-2" disabled={loadingGame} onClick={startGame}><Gamepad2 className="h-5 w-5" /> {loadingGame ? "Preparing questions…" : "Start quiz"}</Button>
            </div>
          </aside>
        </main>
      </div>
    );
  }

  if (phase === "results") {
    return <div className="min-h-screen bg-background bg-grid px-4 py-8 page-transition">
      <main className="mx-auto max-w-4xl">
        <div className="mb-8 text-center"><Trophy className="mx-auto mb-4 h-14 w-14 text-primary" /><p className="font-mono text-xs text-primary">FINAL RESULTS</p><h1 className="mt-1 text-4xl font-extrabold">{ranked[0]?.rank === ranked[1]?.rank ? "It’s a tie!" : `${ranked[0]?.name} wins!`}</h1></div>
        <div className="space-y-3">{ranked.map((team, index) => <div key={team.id} className={`glass-card flex items-center gap-4 rounded-xl p-5 ${team.rank === 1 ? "border-primary/50 glow-sm" : ""}`}>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-lg font-black">{team.rank === 1 ? <Crown className="h-6 w-6 text-primary" /> : team.rank}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-lg font-bold">{team.name}</p><p className="text-sm text-muted-foreground">{team.correct}/{answeredQuestionCount} correct</p></div>
          <p className="text-2xl font-black tabular-nums">{team.score.toLocaleString()}</p>
        </div>)}</div>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><Button size="lg" className="gap-2" onClick={restart}><RotateCcw className="h-4 w-4" /> Play again</Button><Button size="lg" variant="outline" onClick={() => navigate(`/grade/${grade}`)}>Grade home</Button></div>
      </main>
    </div>;
  }

  const shownPhase = reviewing ? "reveal" : phase;
  const shownAnswers = reviewing ? history[shownIndex] ?? {} : answers;

  return <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-background bg-grid page-transition">
    <header className="shrink-0 border-b border-border/40 bg-background/90 px-2 py-2 backdrop-blur-xl sm:px-4">
      <div className="mx-auto max-w-[1500px] space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0"><p className="font-mono text-[10px] text-primary sm:text-xs">QUESTION {shownIndex + 1} OF {questions.length}</p><h1 className="text-base font-bold sm:text-lg">Classroom Quiz</h1></div>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="gap-2"><Flag className="h-4 w-4" /> End quiz</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End the quiz now?</AlertDialogTitle>
                <AlertDialogDescription>Current scores will be kept. An unanswered question will not earn points.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Continue quiz</AlertDialogCancel><AlertDialogAction onClick={() => setPhase("results")}>Show results</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <section aria-labelledby="quiz-leaderboard-heading" className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/60 p-2">
          <h2 id="quiz-leaderboard-heading" className="flex shrink-0 items-center gap-2 text-xs font-bold sm:text-sm"><Medal className="h-4 w-4 text-primary" /><span className="sr-only sm:not-sr-only">Live leaderboard</span></h2>
          <ol className="flex min-w-0 flex-1 gap-2 overflow-x-auto" aria-live="polite" aria-atomic="true">
            {ranked.map((team) => <li key={team.id} className="flex min-w-32 flex-1 items-center gap-2 rounded-lg bg-muted/20 px-3 py-2 text-xs sm:text-sm"><span className="font-black text-muted-foreground">{team.rank}</span><span className="min-w-0 flex-1 truncate font-semibold" title={team.name}>{team.name}</span><strong className="tabular-nums">{team.score.toLocaleString()}</strong></li>)}
          </ol>
        </section>
      </div>
    </header>

    <main className="mx-auto grid min-h-0 w-full max-w-[1500px] flex-1 grid-cols-[minmax(0,1fr)_minmax(144px,38%)] gap-2 p-2 md:grid-cols-[minmax(0,1fr)_320px] md:gap-4 md:p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section ref={questionContentRef} aria-label="Question content" tabIndex={0} className="min-h-0 min-w-0 space-y-3 overflow-y-auto overscroll-contain rounded-xl pb-2 focus-visible:outline-offset-[-2px]">
        {reviewing && <div className="space-y-2 rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs sm:text-sm">
          <p className="font-semibold">Reviewing question {shownIndex + 1} — timer paused</p>
          <Button size="sm" className="h-auto min-h-9 whitespace-normal" onClick={() => setViewIndex(null)}>Back to live question {current + 1}</Button>
        </div>}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-card/60 px-3 py-2 text-xs sm:text-sm">
          <Badge className="max-w-full break-all font-mono text-[10px] sm:text-sm">{shownQuestion?.paper_code ?? "—"}</Badge>
          {(shownQuestion?.session || shownQuestion?.year) && <span className="text-muted-foreground">{[shownQuestion?.session, shownQuestion?.year].filter(Boolean).join(" ")}</span>}
          <Badge variant="secondary">Question {shownQuestion?.question_number}</Badge>
          {shownQuestion?.topic_name && <Badge variant="outline">{shownQuestion.topic_name}</Badge>}
        </div>
        <QuestionCard question={shownQuestion?.question_number ?? shownIndex + 1} imageUrl={shownQuestion?.image_url ?? undefined} />
      </section>

      <aside aria-label="Quiz controls" className="flex min-h-0 min-w-0 flex-col gap-2 md:gap-3">
        <div className={`flex shrink-0 flex-wrap items-center justify-center gap-2 rounded-xl border px-2 py-3 font-mono text-xl font-black tabular-nums sm:text-3xl ${secondsLeft <= 5 && phase === "question" && !reviewing ? "border-destructive/50 bg-destructive/10 text-destructive animate-pulse" : "border-primary/30 bg-primary/10 text-primary"}`}>
          <Clock3 className="hidden h-5 w-5 sm:block" /><SplitFlapDisplay value={fmtTime(secondsLeft)} label="Quiz time remaining" />
          {reviewing && <span className="w-full text-center text-[10px] font-normal">Paused for review</span>}
        </div>
        <div role="region" aria-label="Team answers" className={`grid min-h-0 flex-1 content-start gap-1.5 rounded-xl p-0.5 md:gap-2 ${teams.length > 3 ? "grid-cols-2" : "grid-cols-1"}`}>
          {teams.map((team, index) => {
            const answer = shownAnswers[team.id];
            return <div key={team.id} role="group" aria-label={`${team.name} answers`} className="min-w-0 rounded-xl border p-1 md:p-2" style={teamTone(index)}>
              <div className="mb-1 flex min-w-0 items-center justify-between gap-1"><p className="min-w-0 truncate text-[10px] font-bold md:text-xs" title={team.name}>{team.name}</p>{shownPhase === "reveal" && teams.length > 3 ? <span className={`shrink-0 text-[9px] font-bold md:text-[10px] ${answer?.points ? "text-success" : "text-muted-foreground"}`} title={answer?.points ? `+${answer.points.toLocaleString()} points` : "No points"}>{answer?.points ? `+${answer.points}` : "0"}</span> : answer && <Badge variant="secondary" className="shrink-0 px-1 text-[9px]" aria-label={`Locked ${answer.option}`} title={`Locked ${answer.option}`}>{answer.option}</Badge>}</div>
              <div className={`grid gap-1 ${teams.length > 3 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-4"}`}>{OPTIONS.map((option) => {
                const selected = answer?.option === option;
                const correct = shownPhase === "reveal" && shownQuestion?.correct_answer === option;
                const wrong = shownPhase === "reveal" && selected && !correct;
                return <Button key={option} variant={correct ? "default" : wrong ? "destructive" : selected ? "secondary" : "outline"} className={`${teams.length > 3 ? "h-7 text-xs md:h-8 md:text-base" : "h-9 text-sm md:h-10 md:text-lg"} px-0 font-black ${correct ? "bg-success text-success-foreground" : ""}`} disabled={shownPhase !== "question" || !!answer} aria-label={`${team.name} option ${option}`} aria-pressed={selected} onClick={() => recordAnswer(team.id, option)}>{option}</Button>;
              })}</div>
              {shownPhase === "reveal" && teams.length <= 3 && <p className={`mt-1 text-right text-[10px] font-bold md:text-xs ${answer?.points ? "text-success" : "text-muted-foreground"}`}>{answer?.points ? `+${answer.points.toLocaleString()} points` : "No points"}</p>}
            </div>;
          })}
        </div>
        <div className="shrink-0 space-y-2">
          <p className="text-center text-[10px] text-muted-foreground md:text-xs">{Object.keys(answers).length}/{teams.length} teams locked</p>
          {shownPhase === "reveal" && <div className="flex items-center justify-center gap-1 rounded-lg border border-success/40 bg-success/10 p-2 text-center text-xs font-bold text-success md:text-sm"><Check className="hidden h-4 w-4 shrink-0 md:block" />Correct answer: {shownQuestion?.correct_answer}</div>}
          {shownPhase === "reveal" && <Button variant="outline" className="h-auto min-h-10 w-full gap-1 whitespace-normal px-2 text-xs md:text-sm" onClick={() => shownQuestion && explanation.openExplanation(shownQuestion.question_number)}><Lightbulb className="hidden h-4 w-4 md:block" />View explanation</Button>}
          {reviewing
            ? <Button className="h-auto min-h-10 w-full gap-1 whitespace-normal px-2 text-xs md:text-sm" onClick={() => setViewIndex(shownIndex + 1 >= current ? null : shownIndex + 1)}>{shownIndex + 1 >= current ? "Back to live" : "Next reviewed"}<ChevronRight className="h-4 w-4 shrink-0" /></Button>
            : phase === "reveal" ? <Button className="h-auto min-h-10 w-full gap-1 whitespace-normal px-2 text-xs md:text-sm" onClick={nextQuestion}>{current >= questions.length - 1 ? "Show final results" : "Next question"}<ChevronRight className="h-4 w-4 shrink-0" /></Button>
              : <Button variant="outline" className="h-auto min-h-10 w-full whitespace-normal px-2 text-xs md:text-sm" onClick={reveal}>End answering now</Button>}
        </div>
      </aside>
    </main>

    <nav aria-label="Quiz questions" className="shrink-0 border-t border-border/40 bg-background/90 px-2 py-2 backdrop-blur-xl sm:px-4">
      <div className="mx-auto flex max-w-[1500px] items-center gap-2">
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" aria-label="Previous question" disabled={shownIndex === 0} onClick={() => setViewIndex(shownIndex - 1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h2 className="hidden text-xs font-bold sm:block">Questions</h2>
        <div ref={questionNavRef} className="flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 py-1">{questions.map((_, i) => {
          const done = i < current || (i === current && phase === "reveal");
          return <button key={i} type="button" disabled={i > current} onClick={() => setViewIndex(i === current ? null : i)} aria-label={`Go to question ${i + 1}`} aria-current={i === shownIndex ? "step" : undefined}
            className={`h-9 w-9 shrink-0 rounded-lg border text-xs font-semibold tabular-nums ${i === shownIndex ? "ring-2 ring-primary" : ""} ${done ? "border-primary/40 bg-primary/20 text-foreground" : i === current ? "border-primary/60 text-primary" : "border-border/40 bg-muted/20 text-muted-foreground opacity-50"}`}>{i + 1}</button>;
        })}</div>
      </div>
    </nav>
    <ExplanationDialog open={explanation.open} onOpenChange={explanation.setOpen} question={explanation.question} isLoading={explanation.isLoading} data={explanation.data} />
  </div>;

};

export default ClassroomQuizPage;