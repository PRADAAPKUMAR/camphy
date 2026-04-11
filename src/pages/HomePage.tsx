import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Zap, BookOpen, ClipboardList, ArrowRight, Orbit, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const PhysicsBackground = lazy(() => import("@/components/PhysicsBackground"));

const getSupabase = () => import("@/integrations/supabase/client").then(m => m.supabase);

const HomePage = () => {
  const navigate = useNavigate();

  // Single query fetches all counts in parallel
  const { data: counts } = useQuery({
    queryKey: ["home_counts"],
    queryFn: async () => {
      const supabase = await getSupabase();
      const [papers, materials, mcq, theory] = await Promise.all([
        supabase.from("papers").select("*", { count: "exact", head: true }),
        supabase.from("study_materials").select("*", { count: "exact", head: true }),
        supabase.from("topicwise_mcq_papers").select("*", { count: "exact", head: true }),
        supabase.from("topicwise_theory_questions").select("*", { count: "exact", head: true }),
      ]);
      return {
        papers: papers.count ?? 0,
        materials: materials.count ?? 0,
        topics: (mcq.count ?? 0) + (theory.count ?? 0),
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-background bg-grid relative">
      <Suspense fallback={null}>
        <PhysicsBackground />
      </Suspense>

      {/* Hero */}
      <header className="relative border-b border-border/40 pt-20 pb-16 overflow-hidden">
        {/* Orbiting electrons */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute -left-[120px] -top-[120px] h-[240px] w-[240px] rounded-full border border-primary/10 animate-[spin_12s_linear_infinite]">
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-primary/60 shadow-[0_0_12px_hsl(217_91%_60%/0.5)]" />
            </div>
            <div className="absolute -left-[180px] -top-[180px] h-[360px] w-[360px] rounded-full border border-accent/8 animate-[spin_18s_linear_infinite_reverse]">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-accent/50 shadow-[0_0_10px_hsl(199_89%_48%/0.4)]" />
            </div>
            <div className="absolute -left-[260px] -top-[260px] h-[520px] w-[520px] rounded-full border border-primary/5 animate-[spin_25s_linear_infinite]">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-primary/30 shadow-[0_0_8px_hsl(217_91%_60%/0.3)]" />
            </div>
          </div>
        </div>
        <div className="container relative text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 glow-md mb-6 animate-[pulse_3s_ease-in-out_infinite]">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl mb-4">
            Physics<span className="gradient-text">HQ</span>
          </h1>
          <p className="mx-auto max-w-md text-lg text-muted-foreground">
            Your one-stop platform for exam practice and study resources. Master every topic with confidence.
          </p>

          {/* Stats */}
          <div className="mt-12 flex flex-wrap justify-center gap-8">
            {[
              { value: counts ? `${counts.papers}+` : "...", label: "Past Papers" },
              { value: counts ? `${counts.materials}+` : "...", label: "Study Notes" },
              { value: "100%", label: "Free Access" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold gradient-text">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Feature cards */}
      <main className="container relative py-16">
        <div className="flex items-center gap-2 mb-8">
          <Orbit className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Explore</h2>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {/* MCQ Practice */}
          <div
            className="glass-card-hover group cursor-pointer rounded-xl p-6"
            onClick={() => navigate("/papers")}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary mb-5 transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:glow-sm">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">MCQ Exam Practice</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Browse past papers, practice under timed conditions, and get instant results with detailed review.
            </p>
            <Button variant="ghost" className="gap-2 px-0 text-primary">
              Start Practicing <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Topic-wise Practice */}
          <div
            className="glass-card-hover group cursor-pointer rounded-xl p-6"
            onClick={() => navigate("/topic-practice")}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 border border-success/20 text-success mb-5 transition-all group-hover:bg-success group-hover:text-success-foreground group-hover:glow-sm">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Topic-wise Practice</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Focus on specific topics with MCQ and theory questions to strengthen weak areas.
            </p>
            <Button variant="ghost" className="gap-2 px-0 text-success">
              Practice by Topic <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Study Materials */}
          <div
            className="glass-card-hover group cursor-pointer rounded-xl p-6"
            onClick={() => navigate("/materials")}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent mb-5 transition-all group-hover:bg-accent group-hover:text-accent-foreground group-hover:glow-sm">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Study Materials</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Access notes, guides, and reference documents organized by subject and level to support your learning.
            </p>
            <Button variant="ghost" className="gap-2 px-0 text-accent">
              Browse Materials <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="container py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} PhysicsHQ — Built by PRADAAP KUMAR.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
