import { GlassIcon } from "@/components/ui/glass-icon";
import { lazy, Suspense, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Atom, ArrowRight, FlaskConical, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import HomeAtomAnimation from "@/components/HomeAtomAnimation";
import { GRADES, GRADE_KEYS, gradePath } from "@/lib/grades";
import { normalizeLevel } from "@/lib/performance-history";
import { useTileTransition } from "@/hooks/use-tile-transition";

const PhysicsBackground = lazy(() => import("@/components/PhysicsBackground"));
const gradeIcons = { igcse: Microscope, as: FlaskConical, a2: Atom };
const getSupabase = () => import("@/integrations/supabase/client").then((module) => module.supabase);

const HomePage = () => {
  const { tileProps } = useTileTransition();
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

  return <div className="relative min-h-screen overflow-x-clip bg-background bg-grid">
    <Suspense fallback={null}><PhysicsBackground /></Suspense>
    <header className="relative flex flex-col justify-center border-b border-border/40 px-0 pb-10 pt-12 sm:pb-12 sm:pt-16 lg:min-h-[520px]">
      <div className="container relative z-10 text-center">
        <p className="mb-3 font-mono text-xs font-semibold uppercase text-primary">Cambridge Physics</p>
        <div className="relative mx-auto flex min-h-28 w-fit items-center justify-center sm:min-h-36">
          <HomeAtomAnimation />
          <h1 className="relative text-4xl font-extrabold sm:text-5xl">Physics<span className="gradient-text">HQ</span></h1>
        </div>
        <p className="mt-2 text-lg font-semibold sm:text-xl">Master Physics. Practice Smarter.</p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Cambridge IGCSE, AS &amp; A Level Physics learning, revision and examination practice.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
          {[
            { label: "Past papers", value: data?.papers },
            { label: "Topic sets", value: data?.topics },
            { label: "Resources", value: data?.materials },
            { label: "Worked explanations", value: data?.explanations },
            { label: "Levels", value: levelsCount || 3 },
          ].map((stat) => (
            <span key={stat.label} className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/40 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm sm:text-sm">
              <span className="inline-block min-w-[4ch] text-right font-bold tabular-nums text-primary sm:text-base">{stat.value ?? "—"}</span>
              <span>{stat.label}</span>
            </span>
          ))}
        </div>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
          Every explanation breaks down the correct answer <span className="font-semibold text-foreground">and</span> why the wrong options fail — with formulas and calculations.
        </p>
      </div>
    </header>
    <main className="container relative py-8 sm:py-10">
      <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-3">
        {GRADE_KEYS.map((key) => {
          const grade = GRADES[key]; const Icon = gradeIcons[key]; const to = gradePath(key);
           return <Button variant="ghost" key={key} data-grade={key} type="button" {...tileProps(to)} className="grade-tile group flex h-auto min-h-[270px] flex-col items-stretch whitespace-normal rounded-lg p-7 text-left focus-visible:ring-grade">
             <div className="mb-6 flex items-center justify-between gap-3">
               <GlassIcon className="grade-crest h-12 w-12 shrink-0"><Icon className="!h-6 !w-6" /></GlassIcon>
               <span className="rounded-md border border-border/60 bg-background/40 px-2.5 py-2 font-mono text-[10px] text-muted-foreground">Cambridge {grade.syllabus}</span>
             </div>
             <h2 className="text-3xl font-extrabold text-foreground">{grade.label}</h2>
             <p className="mb-6 mt-3 min-h-10 text-sm leading-relaxed text-muted-foreground">{grade.description}</p>
             <span className="mt-auto flex items-center justify-between border-t border-grade/20 pt-4 text-sm font-semibold text-grade">Explore {grade.label}<ArrowRight className="motion-safe:transition-transform motion-safe:group-hover:translate-x-1" /></span>
          </Button>;
        })}
      </div>
      <div className="mx-auto mt-10 flex max-w-5xl justify-center gap-6 text-xs text-muted-foreground">
        <Link to="/study-tools" className="transition-colors hover:text-foreground">Study Tools</Link>
        <Link to="/about" className="transition-colors hover:text-foreground">About PhysicsHQ</Link>
      </div>
    </main>
  </div>;
};
export default HomePage;
