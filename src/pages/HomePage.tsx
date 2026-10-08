import { lazy, Suspense, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Atom, ArrowRight, FlaskConical, Microscope } from "lucide-react";
import HomeAtomAnimation from "@/components/HomeAtomAnimation";
import { GRADES, GRADE_KEYS, gradePath } from "@/lib/grades";
import { normalizeLevel } from "@/lib/performance-history";
import { useTileTransition } from "@/hooks/use-tile-transition";

const PhysicsBackground = lazy(() => import("@/components/PhysicsBackground"));
const gradeIcons = { igcse: Microscope, as: FlaskConical, a2: Atom };
const getSupabase = () => import("@/integrations/supabase/client").then((module) => module.supabase);

const HomePage = () => {
  const { linkTileProps } = useTileTransition();
  const { data } = useQuery({
    queryKey: ["home_counts"],
    queryFn: async () => {
      const supabase = await getSupabase();
      const [papers, materials, mcq, theory, theoryPapers, explanationCounts] = await Promise.all([
        supabase.from("papers").select("level", { count: "exact" }),
        supabase.from("study_materials").select("*", { count: "exact", head: true }),
        supabase.from("topicwise_mcq_papers").select("*", { count: "exact", head: true }),
        supabase.from("topicwise_theory_questions").select("*", { count: "exact", head: true }),
        supabase.from("theory_papers").select("*", { count: "exact", head: true }),
        supabase.rpc("get_explanation_counts"),
      ]);
      const explanations = (explanationCounts.data ?? {}) as { mcq?: number; theory?: number };
      return {
        papers: (papers.count ?? 0) + (theoryPapers.count ?? 0),
        materials: materials.count ?? 0,
        topics: (mcq.count ?? 0) + (theory.count ?? 0),
        explanations: (explanations.mcq ?? 0) + (explanations.theory ?? 0),
        levels: (papers.data ?? []).map((row: { level: string }) => row.level),
      };
    },
    staleTime: 10 * 60 * 1000,
  });
  const levelsCount = useMemo(() => {
    const levels = new Set<string>();
    (data?.levels ?? []).forEach((level) => levels.add(normalizeLevel(level)));
    return levels.size;
  }, [data?.levels]);

  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-background">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-35" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <Suspense fallback={null}><PhysicsBackground /></Suspense>
      </div>

      <header className="relative flex flex-col justify-center overflow-hidden border-b border-border/30 px-4 pb-7 pt-6 sm:px-8 sm:py-10 lg:min-h-[360px]">
        <div className="relative z-10 mx-auto w-full max-w-[1120px] text-center">
          <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary sm:text-xs">Cambridge Physics</p>
          <div className="relative mx-auto flex min-h-24 w-fit items-center justify-center sm:min-h-28">
            <div className="absolute inset-0 scale-75 sm:scale-90 lg:scale-100"><HomeAtomAnimation /></div>
            <h1 className="relative text-4xl font-extrabold sm:text-5xl lg:text-6xl">Physics<span className="gradient-text">HQ</span></h1>
          </div>
          <p className="text-base font-semibold sm:mt-2 sm:text-xl">Master Physics. Practice Smarter.</p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Past papers, topic practice and revision for Cambridge IGCSE, AS &amp; A Level Physics.
          </p>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-[1184px] px-4 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
        <section aria-labelledby="grade-selection-heading">
          <div className="mb-5 sm:mb-6">
            <h2 id="grade-selection-heading" className="text-xl font-bold sm:text-2xl">Choose your grade</h2>
            <p className="mt-1 text-sm text-muted-foreground">Find the papers, practice and resources for your level.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3 md:gap-6">
            {GRADE_KEYS.map((key) => {
              const grade = GRADES[key];
              const Icon = gradeIcons[key];
              const to = gradePath(key);
              return (
                <Link
                  key={key}
                  to={to}
                  {...linkTileProps(to)}
                  aria-label={`Explore ${grade.label} Physics`}
                  className="group grid min-h-[136px] grid-cols-[44px_minmax(0,1fr)_20px] items-center gap-4 rounded-2xl border border-border/60 bg-card/90 p-4 text-left shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-200 hover:border-primary/40 hover:bg-card hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-safe:hover:-translate-y-0.5 md:flex md:min-h-[224px] md:flex-col md:items-stretch md:gap-0 md:p-6"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:bg-primary/20 md:mb-3">
                    <Icon className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] font-medium text-primary">SYLLABUS {grade.syllabus}</p>
                    <h3 className="mt-1 text-xl font-bold md:text-2xl">{grade.label}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground md:mt-2 md:leading-5">{grade.description}</p>
                  </div>
                  <span className="flex items-center justify-between text-sm font-semibold text-primary md:mt-auto md:pt-4">
                    <span className="hidden md:inline">Explore {grade.label}</span>
                    <ArrowRight className="h-5 w-5 shrink-0 transition-transform motion-safe:group-hover:translate-x-1 md:h-4 md:w-4" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="explanations-heading" className="mt-8 border-t border-border/40 pt-6 text-center sm:mt-10 sm:pt-8">
          <h2 id="explanations-heading" className="text-base font-semibold sm:text-lg">Learn from every question</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Every explanation breaks down the correct answer <span className="font-semibold text-foreground">and</span> why the wrong options fail — with formulas and calculations.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-3 sm:gap-x-8">
            {[
              { label: "Past papers", value: data?.papers },
              { label: "Topic sets", value: data?.topics },
              { label: "Resources", value: data?.materials },
              { label: "Worked explanations", value: data?.explanations },
              { label: "Levels", value: levelsCount || 3 },
            ].map((stat) => (
              <span key={stat.label} className="inline-flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                <span className="font-semibold tabular-nums text-foreground">{stat.value ?? "—"}</span>
                <span>{stat.label}</span>
              </span>
            ))}
          </div>
        </section>

        <div className="mt-5 flex flex-wrap justify-center gap-x-6 text-xs text-muted-foreground sm:mt-6">
          <Link to="/study-tools" className="inline-flex min-h-11 items-center rounded-md px-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Study Tools</Link>
          <Link to="/about" className="inline-flex min-h-11 items-center rounded-md px-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">About PhysicsHQ</Link>
        </div>
      </main>
    </div>
  );
};
export default HomePage;
