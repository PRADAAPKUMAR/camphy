import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Atom, ArrowRight, FlaskConical, Microscope } from "lucide-react";
import { GRADES, GRADE_KEYS, gradePath } from "@/lib/grades";
import { useTileTransition } from "@/hooks/use-tile-transition";

const PhysicsBackground = lazy(() => import("@/components/PhysicsBackground"));
const gradeIcons = { igcse: Microscope, as: FlaskConical, a2: Atom };

const HomePage = () => {
  const { tileProps } = useTileTransition();
  return <div className="relative min-h-screen bg-background bg-grid">
    <Suspense fallback={null}><PhysicsBackground /></Suspense>
    <header className="relative border-b border-border/40">
      <div className="container py-16 text-center sm:py-20">
        <p className="mb-3 font-mono text-xs font-semibold uppercase text-primary">Cambridge Physics</p>
        <h1 className="text-4xl font-extrabold sm:text-6xl">Physics<span className="gradient-text">HQ</span></h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">Select your grade to open its papers, practice, study materials and performance.</p>
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
