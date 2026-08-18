import { lazy, Suspense, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Target, ListChecks, Trophy, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  readPerformanceHistory,
  clearPerformanceHistory,
  normalizeLevel,
  type PerformanceRecord,
} from "@/lib/performance-history";

const PhysicsBackground = lazy(() => import("@/components/PhysicsBackground"));
const ScoreTrendChart = lazy(() => import("@/components/performance/ScoreTrendChart"));

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="glass-card rounded-2xl p-5">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
      {icon}
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
};

const avg = (nums: number[]) => (nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0);

const PerformancePage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<PerformanceRecord[]>(() => readPerformanceHistory());

  const sorted = useMemo(
    () => [...history].sort((a, b) => +new Date(b.completedAt) - +new Date(a.completedAt)),
    [history],
  );

  const stats = useMemo(() => {
    const totalQ = history.reduce((s, r) => s + (r.totalQuestions || 0), 0);
    const totalScore = history.reduce((s, r) => s + (r.score || 0), 0);
    const pcts = history.map((r) => r.percentage);
    return {
      accuracy: totalQ ? Math.round((totalScore / totalQ) * 100) : 0,
      papers: history.length,
      questions: totalQ,
      best: pcts.length ? Math.max(...pcts) : 0,
      lowest: pcts.length ? Math.min(...pcts) : 0,
      average: avg(pcts),
    };
  }, [history]);

  const byLevel = useMemo(() => {
    const map = new Map<string, { level: string; attempts: number; score: number; total: number }>();
    history.forEach((r) => {
      const level = normalizeLevel(r.level);
      const cur = map.get(level) ?? { level, attempts: 0, score: 0, total: 0 };
      cur.attempts++;
      cur.score += r.score || 0;
      cur.total += r.totalQuestions || 0;
      map.set(level, cur);
    });
    const order = ["IGCSE", "AS Level", "A2 Level"];
    return Array.from(map.values()).sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level));
  }, [history]);

  const trend = useMemo(
    () =>
      [...sorted]
        .slice(0, 20)
        .reverse()
        .map((r, i) => ({ name: `#${i + 1}`, date: fmtDate(r.completedAt), percentage: r.percentage })),
    [sorted],
  );

  const comparison = useMemo(() => {
    if (history.length < 10) return null;
    const chrono = [...sorted].reverse();
    const half = Math.floor(chrono.length / 2);
    const previous = avg(chrono.slice(0, half).map((r) => r.percentage));
    const recent = avg(chrono.slice(half).map((r) => r.percentage));
    return { previous, recent, delta: recent - previous };
  }, [history.length, sorted]);

  const onClear = () => {
    clearPerformanceHistory();
    setHistory([]);
  };

  return (
    <div className="relative min-h-screen bg-background bg-grid">
      <Suspense fallback={null}>
        <PhysicsBackground />
      </Suspense>

      <header className="relative border-b border-border/40">
        <div className="container py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-4 gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Button>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Performance</h1>
                <p className="text-sm text-muted-foreground">
                  Your practice progress, stored privately on this device.
                </p>
              </div>
            </div>
            {history.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" /> Clear My History
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear your local history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes the practice records saved in this browser only. Nothing else is affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onClear}>Clear history</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </header>

      <main className="container relative py-10">
        {history.length === 0 ? (
          <div className="glass-card mx-auto max-w-lg rounded-2xl p-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <Target className="h-7 w-7" />
            </div>
            <h2 className="mb-2 text-xl font-bold">Your Physics performance dashboard is ready.</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Complete your first practice paper to start tracking your progress.
            </p>
            <Button onClick={() => navigate("/papers")} className="gap-2">
              Start Practicing
            </Button>
          </div>
        ) : (
          <div className="space-y-10">
            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard icon={<Target className="h-5 w-5" />} label="Overall Accuracy" value={`${stats.accuracy}%`} />
              <StatCard icon={<ListChecks className="h-5 w-5" />} label="Papers Attempted" value={`${stats.papers}`} />
              <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Questions Attempted" value={`${stats.questions}`} />
              <StatCard icon={<Trophy className="h-5 w-5" />} label="Best Score" value={`${stats.best}%`} />
            </section>

            {byLevel.length > 0 && (
              <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Performance by level
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {byLevel.map((l) => {
                    const pct = l.total ? Math.round((l.score / l.total) * 100) : 0;
                    return (
                      <div key={l.level} className="glass-card rounded-2xl p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="font-bold">{l.level}</h3>
                          <Badge variant="secondary" className="bg-secondary/60 text-xs">
                            {l.attempts} attempt{l.attempts !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <p className="mb-2 text-2xl font-bold gradient-text">{pct}%</p>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="grid gap-6 lg:grid-cols-5">
              <section className="glass-card rounded-2xl p-5 lg:col-span-3">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Score trend
                </h2>
                <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted/20" />}>
                  <ScoreTrendChart data={trend} />
                </Suspense>
              </section>

              <section className="glass-card rounded-2xl p-5 lg:col-span-2">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Your progress
                </h2>
                <dl className="space-y-3 text-sm">
                  {[
                    ["Average Score", `${stats.average}%`],
                    ["Best Score", `${stats.best}%`],
                    ["Lowest Score", `${stats.lowest}%`],
                    ["Total Attempts", `${stats.papers}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between border-b border-border/30 pb-2">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
                {comparison ? (
                  <div className="mt-4 rounded-xl border border-border/40 bg-muted/10 p-4 text-sm">
                    <div className="mb-1 flex items-center gap-2 font-medium">
                      <TrendingUp className="h-4 w-4 text-primary" /> Recent vs earlier
                    </div>
                    <p className="text-muted-foreground">
                      Recent average: {comparison.recent}% · Previous average: {comparison.previous}%
                    </p>
                    <p className="mt-1 font-semibold">
                      {comparison.delta >= 0 ? "+" : ""}
                      {comparison.delta} percentage points
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Complete at least 10 papers to compare recent and earlier performance.
                  </p>
                )}
              </section>
            </div>

            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Recent attempts
              </h2>
              <div className="space-y-3">
                {sorted.slice(0, 10).map((r, i) => (
                  <div
                    key={`${r.paperId}-${r.completedAt}-${i}`}
                    className="glass-card flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {r.paperCode}
                        {r.session || r.year ? ` — ${[r.session, r.year].filter(Boolean).join(" ")}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {normalizeLevel(r.level)} · {fmtDate(r.completedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {r.score}/{r.totalQuestions}
                      </span>
                      <Badge variant="outline" className="border-border/40 text-xs">
                        {r.percentage}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Records are saved only in this browser. <Link to="/papers" className="underline">Practice more papers</Link>.
        </p>
      </main>
    </div>
  );
};

export default PerformancePage;