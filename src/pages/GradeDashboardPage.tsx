import { Link, Navigate, useParams } from "react-router-dom";
import { Atom, BarChart3, BookOpen, ClipboardList, FilePlus2, FileText, FlaskConical, Microscope, Target, ArrowRight } from "lucide-react";
import PhysicsBackground from "@/components/PhysicsBackground";
import { GRADES, gradeSectionPath, isGradeKey, type GradeKey } from "@/lib/grades";
import { useTileTransition } from "@/hooks/use-tile-transition";

const icons = { igcse: Microscope, as: FlaskConical, a2: Atom };

const GradeDashboardPage = () => {
  const { grade: rawGrade } = useParams<{ grade: string }>();
  const { tileProps } = useTileTransition();
  if (!isGradeKey(rawGrade)) return <Navigate to="/" replace />;
  const grade = rawGrade.toLowerCase() as GradeKey;
  const details = GRADES[grade];
  const GradeIcon = icons[grade];
  const items = [
    { section: "mcq" as const, title: "MCQ Past Papers", desc: "Full Cambridge multiple-choice papers by year and series.", icon: ClipboardList, tone: "primary" },
    { section: "theory" as const, title: "Theory Past Papers", desc: "Structured papers, official answers and explanations.", icon: FileText, tone: "accent" },
    { section: "practice" as const, title: "Practice", desc: "Strengthen individual topics with MCQ and theory sets.", icon: Target, tone: "success" },
    { section: "materials" as const, title: "Study Materials", desc: "Open notes, revision guides and learning resources.", icon: BookOpen, tone: "accent" },
    ...(details.worksheetLevel ? [{ section: "worksheet" as const, title: "Worksheet Generator", desc: "Create custom printable MCQ worksheets and answer keys.", icon: FilePlus2, tone: "primary" }] : []),
    { section: "performance" as const, title: "Performance", desc: `Review only your ${details.label} attempts, topics and mistakes.`, icon: BarChart3, tone: "success" },
  ];
  const tones: Record<string, string> = {
    primary: "border-primary/20 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
    accent: "border-accent/20 bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground",
    success: "border-success/20 bg-success/10 text-success group-hover:bg-success group-hover:text-success-foreground",
  };

  return <div className="relative min-h-screen bg-background bg-grid">
    <PhysicsBackground />
    <header className="relative border-b border-border/40">
      <div className="container py-10 sm:py-14">
        <Link to="/" className="mb-5 inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">All grades</Link>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><GradeIcon className="h-7 w-7" /></div>
          <div><p className="font-mono text-xs text-primary">Cambridge {details.syllabus}</p><h1 className="text-3xl font-extrabold sm:text-4xl">{details.label} Physics</h1><p className="mt-1 text-sm text-muted-foreground">Choose what you want to work on.</p></div>
        </div>
      </div>
    </header>
    <main className="container relative py-10">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ section, title, desc, icon: Icon, tone }) => {
          const to = gradeSectionPath(grade, section);
          return <button key={section} type="button" {...tileProps(to)} className="glass-card-hover group flex min-h-52 flex-col rounded-xl p-6 text-left">
            <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border transition-all ${tones[tone]}`}><Icon className="h-6 w-6" /></div>
            <h2 className="text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-primary">Open <ArrowRight className="h-4 w-4" /></span>
          </button>;
        })}
      </div>
    </main>
  </div>;
};
export default GradeDashboardPage;
