import { lazy, Suspense, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ClipboardList,
  ArrowRight,
  Target,
  BarChart3,
  Lightbulb,
  CalendarClock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeLevel } from "@/lib/performance-history";

const PhysicsBackground = lazy(() => import("@/components/PhysicsBackground"));

const getSupabase = () => import("@/integrations/supabase/client").then((m) => m.supabase);

const HomePage = () => {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["home_counts"],
    queryFn: async () => {
      const supabase = await getSupabase();
      const [papers, materials, mcq, theory] = await Promise.all([
        supabase.from("papers").select("level", { count: "exact" }),
        supabase.from("study_materials").select("*", { count: "exact", head: true }),
        supabase.from("topicwise_mcq_papers").select("*", { count: "exact", head: true }),
        supabase.from("topicwise_theory_questions").select("*", { count: "exact", head: true }),
      ]);
      return {
        papers: papers.count ?? 0,
        materials: materials.count ?? 0,
        topics: (mcq.count ?? 0) + (theory.count ?? 0),
        levels: (papers.data ?? []).map((r: { level: string }) => r.level),
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  const levelsCount = useMemo(() => {
    const set = new Set<string>();
    (data?.levels ?? []).forEach((raw) => set.add(normalizeLevel(raw)));
    return set.size;
  }, [data?.levels]);

  const primaryActions = [
    {
      title: "Past Papers",
      desc: "Practice complete Cambridge examination papers.",
      to: "/papers",
      icon: <ClipboardList className="h-6 w-6" />,
      tone: "primary",
    },
    {
      title: "Topic Practice",
      desc: "Practice Physics questions by topic.",
      to: "/topic-practice",
      icon: <Target className="h-6 w-6" />,
      tone: "success",
    },
    {
      title: "Study Materials",
      desc: "Access Physics notes and revision resources.",
      to: "/materials",
      icon: <BookOpen className="h-6 w-6" />,
      tone: "accent",
    },
    {
      title: "Performance",
      desc: "Track your practice progress on this device.",
      to: "/performance",
      icon: <BarChart3 className="h-6 w-6" />,
      tone: "primary",
    },
  ] as const;

  const toneClasses: Record<string, string> = {
    primary:
      "bg-primary/10 border-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
    success:
      "bg-success/10 border-success/20 text-success group-hover:bg-success group-hover:text-success-foreground",
    accent:
      "bg-accent/10 border-accent/20 text-accent group-hover:bg-accent group-hover:text-accent-foreground",
  };

  const capabilities = [
    { title: "Practice", icon: <ClipboardList className="h-5 w-5" /> },
    { title: "Revise", icon: <BookOpen className="h-5 w-5" /> },
    { title: "Understand", icon: <Lightbulb className="h-5 w-5" /> },
    { title: "Track", icon: <BarChart3 className="h-5 w-5" /> },
  ];

  return (
    <div className="relative min-h-screen bg-background bg-grid">
      <Suspense fallback={null}>
        <PhysicsBackground />
      </Suspense>

      {/* Hero */}
      <header className="relative flex min-h-[calc(100vh-56px)] flex-col justify-center border-b border-border/40 pb-24 pt-36">
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute -left-[120px] -top-[120px] h-[240px] w-[240px] rounded-full border border-primary/10 animate-[spin_12s_linear_infinite]">
              <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary/60 shadow-[0_0_12px_hsl(217_91%_60%/0.5)]" />
            </div>
            <div className="absolute -left-[180px] -top-[180px] h-[360px] w-[360px] rounded-full border border-accent/8 animate-[spin_18s_linear_infinite_reverse]">
              <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-accent/50 shadow-[0_0_10px_hsl(199_89%_48%/0.4)]" />
            </div>
            <div className="absolute -left-[220px] -top-[220px] h-[440px] w-[440px] rounded-full border border-primary/5 animate-[spin_25s_linear_infinite]" />
          </div>
        </div>

        <div className="container relative z-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
            Physics<span className="gradient-text">HQ</span>
          </h1>
          <p className="mt-3 text-xl font-semibold sm:text-2xl">Master Physics. Practice Smarter.</p>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Cambridge IGCSE & AS Level Physics learning, revision and examination practice.
          </p>

          {/* Quiet stats row */}
          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <span>{data ? `${data.papers}+ past papers` : "Past papers"}</span>
            <span className="text-border/60">·</span>
            <span>{data ? `${data.topics}+ topic sets` : "Topic sets"}</span>
            <span className="text-border/60">·</span>
            <span>{data ? `${data.materials}+ resources` : "Resources"}</span>
            <span className="text-border/60">·</span>
            <span>{levelsCount || 3} levels</span>
          </div>
        </div>
      </header>

      <main className="container relative py-14">
        {/* Four primary destinations */}
        <section>
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Start here
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {primaryActions.map((a) => (
              <button
                key={a.to}
                type="button"
                onClick={() => navigate(a.to)}
                className="glass-card-hover group rounded-xl p-6 text-left"
              >
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border transition-all group-hover:glow-sm ${toneClasses[a.tone]}`}
                >
                  {a.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold">{a.title}</h3>
                <p className="text-sm text-muted-foreground">{a.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Open <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Supporting message */}
        <section className="mt-16 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {capabilities.map((c) => (
              <div
                key={c.title}
                className="flex items-center gap-2 text-sm font-semibold text-foreground"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-muted/20 text-primary">
                  {c.icon}
                </span>
                {c.title}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Designed for Cambridge IGCSE & AS Level Physics.
          </p>
        </section>

        {/* Study tools — secondary */}
        <section className="mt-12">
          <div
            className="glass-card-hover group flex flex-col gap-3 rounded-xl p-5 sm:flex-row sm:items-center sm:justify-between"
            onClick={() => navigate("/study-tools")}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/study-tools")}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
                style={{
                  background: "hsl(var(--study-3) / 0.12)",
                  borderColor: "hsl(var(--study-3) / 0.25)",
                  color: "hsl(var(--study-3))",
                }}
              >
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold">Study Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Focus timer, countdown timer, Pomodoro and timetable tools.
                </p>
              </div>
            </div>
            <Button variant="ghost" className="gap-2 self-start sm:self-auto" style={{ color: "hsl(var(--study-3))" }}>
              Open <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} PhysicsHQ — Built by PRADAAP KUMAR.</p>
          <div className="flex items-center gap-4">
            <Link to="/performance" className="font-medium transition-colors hover:text-foreground">
              Performance
            </Link>
            <Link to="/study-tools" className="font-medium transition-colors hover:text-foreground">
              Study Tools
            </Link>
            <Link to="/about" className="inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground">
              <User className="h-3 w-3" /> About Me
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
