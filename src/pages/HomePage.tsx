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

  return <div className="relative min-h-screen bg-background bg-grid">
    <Suspense fallback={null}><PhysicsBackground /></Suspense>
    <header className="relative flex min-h-[calc(100vh-56px)] flex-col justify-center border-b border-border/40 pb-24 pt-36">
      <div className="container relative z-10 text-center">
        <p className="mb-3 font-mono text-xs font-semibold uppercase text-primary">Cambridge Physics</p>
        <div className="relative mx-auto flex min-h-40 w-fit items-center justify-center sm:min-h-52">
          <HomeAtomAnimation />
          <h1 className="relative text-4xl font-extrabold sm:text-6xl">Physics<span className="gradient-text">HQ</span></h1>
        </div>
        <p className="mt-3 text-xl font-semibold sm:text-2xl">Master Physics. Practice Smarter.</p>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Cambridge IGCSE, AS &amp; A Level Physics learning, revision and examination practice.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {[
            { label: "Past papers", value: data?.papers },
            { label: "Topic sets", value: data?.topics },
            { label: "Resources", value: data?.materials },
            { label: "Worked explanations", value: data?.explanations },
            { label: "Levels", value: levelsCount || 3 },
          ].map((stat) => (
            <span key={stat.label} className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur-sm">
              <span className="text-base font-bold text-primary">{stat.value ?? "—"}</span>
              <span>{stat.label}</span>
            </span>
          ))}
        </div>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
          Every explanation breaks down the correct answer <span className="font-semibold text-foreground">and</span> why the wrong options fail — with formulas and calculations.
        </p>
      </div>
    </header>
    <main className="container relative py-10 sm:py-14">
      <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-3">
        {GRADE_KEYS.map((key) => {
          const grade = GRADES[key]; const Icon = gradeIcons[key]; const to = gradePath(key);
          return <button key={key} type="button" {...tileProps(to)} className="glass-card-hover group flex min-h-72 flex-col rounded-xl p-7 text-left">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="h-7 w-7" /></div>
            <p className="font-mono text-xs text-primary">{grade.syllabus}</p>
            <h2 className="mt-1 text-2xl font-extrabold">{grade.label}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{grade.description}</p>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-primary">Choose grade <ArrowRight className="h-4 w-4" /></span>
          </button>;
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
