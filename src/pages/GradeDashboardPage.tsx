import GlassIcon from "@/components/GlassIcon";
import { Link, Navigate, useParams } from "react-router-dom";
import { Atom, BarChart3, BookOpen, ClipboardList, FilePlus2, FileText, FlaskConical, Gamepad2, Microscope, Target, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    ...(details.hasMcqPapers ? [{ section: "mcq" as const, title: "MCQ Past Papers", desc: "Full Cambridge multiple-choice papers by year and series.", icon: ClipboardList }] : []),
    { section: "theory" as const, title: "Theory Past Papers", desc: "Structured papers, official answers and explanations.", icon: FileText },
    { section: "practice" as const, title: "Practice", desc: "Strengthen individual topics with MCQ and theory sets.", icon: Target },
    { section: "materials" as const, title: "Study Materials", desc: "Open notes, revision guides and learning resources.", icon: BookOpen },
    ...(details.worksheetLevel ? [{ section: "worksheet" as const, title: "Worksheet Generator", desc: "Create custom printable MCQ worksheets and answer keys.", icon: FilePlus2 }] : []),
    ...(details.mappedTopicalLevel ? [{ section: "quiz" as const, title: "Classroom Quiz", desc: "Run a timed team MCQ game with live scoring.", icon: Gamepad2 }] : []),
    { section: "performance" as const, title: "Performance", desc: `Review only your ${details.label} attempts, topics and mistakes.`, icon: BarChart3 },
  ];

  return <div className="relative min-h-screen bg-background bg-grid">
    <PhysicsBackground />
    <header className="relative border-b border-border/40">
      <div className="container py-10 sm:py-14">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-grade"><ArrowLeft className="h-4 w-4" />All grades</Link>
        <div className="flex items-center gap-5">
          <GlassIcon icon={GradeIcon} size="lg" />
          <div><p className="mb-2 font-mono text-xs text-grade">Cambridge {details.syllabus}</p><h1 className="text-3xl font-extrabold sm:text-4xl">{details.label} Physics</h1><p className="mt-2 text-sm text-muted-foreground">{details.description}</p></div>
        </div>
      </div>
    </header>
    <main className="container relative py-10">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ section, title, desc, icon: Icon }) => {
          const to = gradeSectionPath(grade, section);
          return <Button variant="ghost" key={section} type="button" {...tileProps(to)} className="grade-tile group flex h-auto min-h-[240px] flex-col items-start whitespace-normal rounded-lg p-6 text-left focus-visible:ring-grade">
            <GlassIcon icon={Icon} className="mb-5" tone={section === "materials" ? "pink" : section === "performance" || section === "worksheet" ? "amber" : section === "theory" || section === "quiz" ? "violet" : "cyan"} />
            <h2 className="text-lg font-bold">{title}</h2><p className="mb-5 mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            <span className="mt-auto flex w-full items-center justify-between border-t border-grade/15 pt-4 text-sm font-semibold text-grade">Open <ArrowRight className="h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" /></span>
          </Button>;
        })}
      </div>
    </main>
  </div>;
};
export default GradeDashboardPage;
