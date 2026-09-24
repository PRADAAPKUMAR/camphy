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

  const { data: topicGroups, isLoading: topicsLoading } = useQuery({
    queryKey: ["classroom-quiz-topics", level],
    queryFn: () => fetchWorksheetTopics(level ?? ""),
    enabled: !!level && source === "topic",
    staleTime: 30 * 60 * 1000,
  });

  const selectedSet = useMemo(() => new Set(selectedTopicIds), [selectedTopicIds]);
  const currentQuestion = questions[current];
  const explanationSource = useMemo(
    () => currentQuestion?.paper_id ? { paper_id: currentQuestion.paper_id } : null,
    [currentQuestion?.paper_id],
  );
  const explanation = useExplanation(explanationSource);
  const ranked = useMemo(() => rankTeams(teams), [teams]);
  const allAnswered = teams.length > 0 && teams.every((team) => answers[team.id]);

  const reveal = useCallback(() => {
    if (revealGuard.current || phase !== "question" || !currentQuestion) return;
    revealGuard.current = true;
    const correct = currentQuestion.correct_answer?.toUpperCase();
    const scored = { ...answers };
    setTeams((previous) =>
      previous.map((team) => {
        const answer = answers[team.id];
        if (!answer || answer.option !== correct) return team;
        const speedPoints = Math.round((answer.secondsLeft / duration) * 500);
        const points = 1000 + speedPoints;
        scored[team.id] = { ...answer, points };
        return { ...team, score: team.score + points, correct: team.correct + 1 };
      }),
    );
    setAnswers(scored);
    setAnsweredQuestionCount((count) => count + 1);
    setPhase("reveal");
  }, [answers, currentQuestion, duration, phase]);

  useEffect(() => {
    if (phase !== "question") return;
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
  }, [allAnswered, phase, reveal, secondsLeft]);

  if (!grade || !level) return <Navigate to={validGrade ? `/grade/${validGrade}` : "/"} replace />;

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
    setCurrent((value) => value + 1);
    setAnswers({});
    setSecondsLeft(duration);
    revealGuard.current = false;
    setPhase("question");
  };

  const restart = () => {
    setPhase("setup");
    setQuestions([]);
    setAnswers({});
    setCurrent(0);
    setAnsweredQuestionCount(0);
    setTeams((previous) => previous.map((team) => ({ ...team, score: 0, correct: 0 })));
  };

  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-background bg-grid page-transition">
        <header className="border-b border-border/40 bg-radial-glow">
          <div className="container py-8 sm:py-10">
            <Button variant="ghost" size="sm" className="mb-4 gap-2 text-muted-foreground" onClick={() => navigate(`/grade/${grade}`)}>
              <ArrowLeft className="h-4 w-4" /> {GRADES[grade].label} home
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Gamepad2 className="h-7 w-7" /></div>
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

  return <div className="min-h-screen bg-background bg-grid page-transition">
    <header className="border-b border-border/40 bg-background/90 px-3 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
        <div><p className="font-mono text-xs text-primary">QUESTION {current + 1} OF {questions.length}</p><h1 className="text-lg font-bold">Classroom Quiz</h1></div>
        <div className={`flex min-w-32 items-center justify-center gap-2 rounded-lg border px-5 py-2 font-mono text-2xl font-black tabular-nums ${secondsLeft <= 5 && phase === "question" ? "border-destructive/50 bg-destructive/10 text-destructive animate-pulse" : "border-primary/30 bg-primary/10 text-primary"}`}><Clock3 className="h-5 w-5" />{fmtTime(secondsLeft)}</div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden text-sm sm:inline-flex">{Object.keys(answers).length}/{teams.length} locked</Badge>
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
      </div>
    </header>
    <main className="mx-auto grid max-w-[1500px] gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_390px] lg:p-5">
      <section className="space-y-4">
        <QuestionCard question={current + 1} imageUrl={currentQuestion?.image_url ?? undefined} />
        {phase === "reveal" && <div className="flex items-center justify-center gap-3 rounded-xl border border-success/40 bg-success/10 p-4 text-lg font-bold text-success"><Check className="h-6 w-6" /> Correct answer: {currentQuestion?.correct_answer}</div>}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{teams.map((team, index) => {
          const answer = answers[team.id];
          return <div key={team.id} className="rounded-xl border bg-card/70 p-3" style={teamTone(index)}>
            <div className="mb-3 flex items-center justify-between gap-2"><p className="truncate font-bold">{team.name}</p>{answer ? <Badge variant="secondary">Locked {answer.option}</Badge> : <span className="text-xs text-muted-foreground">Choose answer</span>}</div>
            <div className="grid grid-cols-4 gap-2">{OPTIONS.map((option) => {
              const selected = answer?.option === option;
              const correct = phase === "reveal" && currentQuestion?.correct_answer === option;
              const wrong = phase === "reveal" && selected && !correct;
              return <Button key={option} variant={correct ? "default" : wrong ? "destructive" : selected ? "secondary" : "outline"} className={`h-12 px-0 text-lg font-black ${correct ? "bg-success text-success-foreground" : ""}`} disabled={phase !== "question" || !!answer} onClick={() => recordAnswer(team.id, option)}>{option}</Button>;
            })}</div>
            {phase === "reveal" && <p className={`mt-2 text-right text-sm font-bold ${answer?.points ? "text-success" : "text-muted-foreground"}`}>{answer?.points ? `+${answer.points.toLocaleString()} points` : "No points"}</p>}
          </div>;
        })}</div>
        {phase === "reveal" && <div className="grid gap-3 sm:grid-cols-2">
          <Button size="lg" variant="outline" className="gap-2" onClick={() => explanation.openExplanation(currentQuestion.question_number)}><Lightbulb className="h-5 w-5" /> View explanation</Button>
          <Button size="lg" className="gap-2" onClick={nextQuestion}>{current >= questions.length - 1 ? "Show final results" : "Next question"}<ChevronRight className="h-5 w-5" /></Button>
        </div>}
      </section>
      <aside className="space-y-4">
        <div className="glass-card rounded-xl p-4"><div className="mb-3 flex items-center gap-2"><Medal className="h-5 w-5 text-primary" /><h2 className="font-bold">Live leaderboard</h2></div><div className="space-y-2">{ranked.map((team) => <div key={team.id} className="flex items-center gap-3 rounded-lg bg-muted/20 p-3"><span className="w-6 text-center font-black text-muted-foreground">{team.rank}</span><span className="min-w-0 flex-1 truncate font-semibold">{team.name}</span><strong className="tabular-nums">{team.score.toLocaleString()}</strong></div>)}</div></div>
        {phase === "question" && <Button variant="outline" className="w-full" onClick={reveal}>End answering now</Button>}
      </aside>
    </main>
    <ExplanationDialog open={explanation.open} onOpenChange={explanation.setOpen} question={explanation.question} isLoading={explanation.isLoading} data={explanation.data} />
  </div>;
};

export default ClassroomQuizPage;