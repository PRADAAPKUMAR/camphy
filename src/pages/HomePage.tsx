import { lazy, Suspense, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Zap,
  BookOpen,
  ClipboardList,
  ArrowRight,
  Target,
  CalendarClock,
  BarChart3,
  Lightbulb,
  Menu,
  X,
  Microscope,
  FlaskConical,
  Atom,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeLevel } from "@/lib/performance-history";

const PhysicsBackground = lazy(() => import("@/components/PhysicsBackground"));

const getSupabase = () => import("@/integrations/supabase/client").then((m) => m.supabase);

const NAV = [
  { label: "Papers", to: "/papers" },
  { label: "Topic Practice", to: "/topic-practice" },
  { label: "Study Materials", to: "/materials" },
  { label: "Performance", to: "/performance" },
  { label: "Study Tools", to: "/study-tools" },
];

const levelIcons: Record<string, React.ReactNode> = {
  IGCSE: <Microscope className="h-5 w-5" />,
  "AS Level": <FlaskConical className="h-5 w-5" />,
  "A2 Level": <Atom className="h-5 w-5" />,
};

const levelBlurbs: Record<string, string> = {
  IGCSE: "Cambridge IGCSE Physics papers, topic questions and notes.",
  "AS Level": "Cambridge AS Level Physics practice and revision resources.",
  "A2 Level": "Cambridge A2 Level Physics practice and revision resources.",
};

const HomePage = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const levels = useMemo(() => {
    const order = ["IGCSE", "AS Level", "A2 Level"];
    const set = new Map<string, string>();
    (data?.levels ?? []).forEach((raw) => {
      const display = normalizeLevel(raw);
      if (!set.has(display)) set.set(display, raw);
    });
    return Array.from(set.entries())
      .map(([display, raw]) => ({ display, raw }))
      .sort((a, b) => order.indexOf(a.display) - order.indexOf(b.display));
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
      desc: "Practice Physics questions organized by topic.",
      to: "/topic-practice",
      icon: <Target className="h-6 w-6" />,
      tone: "success",
    },
    {
      title: "Study Materials",
      desc: "Physics notes, revision resources and study materials.",
      to: "/materials",
      icon: <BookOpen className="h-6 w-6" />,
      tone: "accent",
    },
    {
      title: "Performance",
      desc: "Track your practice progress.",
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
    { title: "Practice", desc: "Past papers and topic-wise questions.", icon: <ClipboardList className="h-5 w-5" /> },
    { title: "Revise", desc: "Study materials and Physics resources.", icon: <BookOpen className="h-5 w-5" /> },
    { title: "Understand", desc: "Question explanations and worked reasoning.", icon: <Lightbulb className="h-5 w-5" /> },
    { title: "Track", desc: "Monitor your practice performance.", icon: <BarChart3 className="h-5 w-5" /> },
  ];

  return (
    <div className="relative min-h-screen bg-background bg-grid">
      <Suspense fallback={null}>
        <PhysicsBackground />
      </Suspense>

      {/* Navigation */}
      <nav className="relative border-b border-border/40">
        <div className="container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </span>
            Physics<span className="gradient-text">HQ</span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {menuOpen && (
          <div className="container flex flex-col gap-1 pb-4 md:hidden">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border/40 pt-16 pb-12">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute -left-[120px] -top-[120px] h-[240px] w-[240px] rounded-full border border-primary/10 animate-[spin_12s_linear_infinite]">
              <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary/60 shadow-[0_0_12px_hsl(217_91%_60%/0.5)]" />
            </div>
            <div className="absolute -left-[180px] -top-[180px] h-[360px] w-[360px] rounded-full border border-accent/8 animate-[spin_18s_linear_infinite_reverse]">
              <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-accent/50 shadow-[0_0_10px_hsl(199_89%_48%/0.4)]" />
            </div>
            <div className="absolute -left-[260px] -top-[260px] h-[520px] w-[520px] rounded-full border border-primary/5 animate-[spin_25s_linear_infinite]" />
          </div>
        </div>

        <div className="container relative text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/20 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5 text-primary" /> Cambridge IGCSE · AS &amp; A Level
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
            Physics<span className="gradient-text">HQ</span>
          </h1>
          <p className="mt-3 text-xl font-semibold sm:text-2xl">Master Physics. Practice Smarter.</p>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Cambridge IGCSE and AS &amp; A Level Physics learning, revision and examination practice.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="gap-2" onClick={() => navigate("/papers")}>
              Start Practicing <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2" onClick={() => navigate("/materials")}>
              Browse Study Materials
            </Button>
          </div>

          {/* Statistics */}
          <div className="mt-10 flex flex-wrap justify-center gap-x-10 gap-y-6">
            {[
              { value: data ? `${data.papers}+` : "—", label: "Past Papers" },
              { value: data ? `${data.topics}+` : "—", label: "Topic Question Sets" },
              { value: data ? `${data.materials}+` : "—", label: "Study Resources" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold gradient-text sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="container relative py-14">
        {/* Primary actions */}
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

        {/* Choose your level */}
        {levels.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Choose your level
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {levels.map((l) => (
                <button
                  key={l.display}
                  type="button"
                  onClick={() => navigate(`/papers/${encodeURIComponent(l.raw)}`)}
                  className="glass-card-hover group rounded-xl p-6 text-left"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                    {levelIcons[l.display] ?? <Zap className="h-5 w-5" />}
                  </div>
                  <h3 className="mb-1 text-lg font-bold">{l.display} Physics</h3>
                  <p className="text-sm text-muted-foreground">
                    {levelBlurbs[l.display] ?? `Cambridge ${l.display} Physics practice.`}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* What students can do */}
        <section className="mt-16">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            What you can do here
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((c) => (
              <div key={c.title} className="glass-card rounded-xl p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-muted/20 text-primary">
                  {c.icon}
                </div>
                <h3 className="mb-1 font-bold">{c.title}</h3>
                <p className="text-sm text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
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
          <p>© {new Date().getFullYear()} PhysicsHQ — Built by PRADAAP KUMAR. Free access for all students.</p>
          <div className="flex items-center gap-4">
            <Link to="/performance" className="font-medium transition-colors hover:text-foreground">
              Performance
            </Link>
            <Link to="/study-tools" className="font-medium transition-colors hover:text-foreground">
              Study Tools
            </Link>
            <Link to="/about" className="font-medium transition-colors hover:text-foreground">
              About Me
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;