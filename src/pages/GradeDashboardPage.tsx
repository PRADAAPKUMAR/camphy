import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BarChart3, BookOpen, Brain, CalendarDays, ChevronRight, ClipboardList, FilePlus2, FileText, Gamepad2, RotateCcw, Target, Timer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GRADES, gradeFromLevel, gradeSectionPath, isGradeKey, type GradeKey } from "@/lib/grades";
import { collectWrongQuestions, readPerformanceHistory } from "@/lib/performance-history";

function ResourceLink({ to, title, description, icon: Icon }: { to: string; title: string; description: string; icon: LucideIcon }) {
  return <Link to={to} className="workspace-resource">
    <span className="workspace-resource-icon"><Icon className="h-5 w-5" aria-hidden="true" /></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description}</span></span>
    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
  </Link>;
}

function GradeWorkspace({ grade }: { grade: GradeKey }) {
  const details = GRADES[grade];
  const [history] = useState(() => readPerformanceHistory().filter((record) => gradeFromLevel(record.level) === grade));
  const latest = [...history].sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))[0];
  const retry = details.hasMcqPapers ? collectWrongQuestions(history)[0] : undefined;
  const total = history.reduce((sum, record) => sum + record.totalQuestions, 0);
  const correct = history.reduce((sum, record) => sum + record.score, 0);
  const practice = gradeSectionPath(grade, "practice");

  return <div className="study-workspace min-h-screen bg-background" data-grade={grade}>
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-7 sm:px-8 sm:pt-10">
      <header className="mb-7 sm:mb-9">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Your study space</p>
          <Link to="/" className="workspace-text-link text-xs"><ArrowLeft className="h-3.5 w-3.5" />All grades</Link>
        </div>
        <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-extrabold sm:text-4xl">{details.label} Physics</h1><span className="rounded-md border border-grade/20 bg-grade/5 px-2.5 py-1 font-mono text-[10px] text-grade">Cambridge {details.syllabus}</span></div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">A little practice. A clearer understanding. Start where you are.</p>
      </header>

      <div className="grid items-stretch gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section aria-labelledby="next-step" className="workspace-panel relative overflow-hidden p-6 sm:p-8">
          <span className="absolute inset-y-0 left-0 w-1 bg-grade" aria-hidden="true" />
          <div className="mb-6 flex items-center gap-2 text-xs font-medium text-grade"><Target className="h-4 w-4" />Your next step</div>
          <h2 id="next-step" className="text-2xl font-bold">{retry ? "Turn mistakes into progress." : "Build confidence, one topic at a time."}</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{retry ? `${retry.questions.length} ${retry.questions.length === 1 ? "question to revisit" : "questions to revisit"} from ${retry.paperCode}. Take another look, then explore the explanation.` : "Choose a topic to work on, practise at your own pace, and make room for the ideas that need another look."}</p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link className="workspace-primary" to={retry ? `/question-mode/${retry.paperId}?qs=${retry.questions.join(",")}` : practice}>{retry ? <RotateCcw className="h-4 w-4" /> : <Target className="h-4 w-4" />}{retry ? "Retry mistakes" : "Choose a topic"}<ArrowRight className="h-4 w-4" /></Link>
            <Link to={retry ? practice : gradeSectionPath(grade, "theory")} className="workspace-text-link text-sm">{retry ? "Browse topics" : "Explore past papers"}</Link>
          </div>
        </section>

        <section aria-labelledby="recent-performance" className="workspace-panel flex flex-col p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3"><h2 id="recent-performance" className="flex items-center gap-2 text-sm font-semibold"><BarChart3 className="h-4 w-4 text-muted-foreground" />Recent performance</h2><Link to={gradeSectionPath(grade, "performance")} className="workspace-text-link text-xs">View progress<ArrowRight className="h-3.5 w-3.5" /></Link></div>
          {history.length ? <>
            <dl className="my-6 grid grid-cols-3 gap-3">
              {[['Accuracy', total ? `${Math.round(correct / total * 100)}%` : '—'], ['Attempts', String(history.length)], ['Questions', String(total)]].map(([label, value]) => <div key={label}><dt className="text-[11px] text-muted-foreground">{label}</dt><dd className="mt-2 font-mono text-2xl font-semibold tabular-nums">{value}</dd></div>)}
            </dl>
            {latest && <div className="mt-auto border-t border-border/50 pt-4"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Latest attempt</p><div className="mt-2 flex items-start justify-between gap-4"><span className="min-w-0 break-words text-xs">{latest.paperCode}{latest.year ? ` · ${latest.year}` : ""}</span><span className="shrink-0 font-mono text-xs tabular-nums text-grade">{latest.score}/{latest.totalQuestions}</span></div></div>}
          </> : <div className="flex flex-1 flex-col justify-center py-6"><p className="text-lg font-semibold">Your progress starts here.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Complete a practice session to see your results and find what to work on next.</p></div>}
          <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">Based on {details.label} attempts saved in this browser.</p>
        </section>
      </div>

      <section aria-labelledby="study-resources" className="mt-8 sm:mt-10">
        <div className="mb-4 flex items-baseline justify-between gap-3"><h2 id="study-resources" className="text-base font-semibold">Make it your study session</h2><span className="hidden text-xs text-muted-foreground sm:inline">Questions, explanations, and a place to begin.</span></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="workspace-panel overflow-hidden"><div className="workspace-section-label">Past papers</div>
            {details.hasMcqPapers && <ResourceLink to={gradeSectionPath(grade, "mcq")} title="MCQ past papers" description="Full papers, organised by year and series." icon={ClipboardList} />}
            <ResourceLink to={gradeSectionPath(grade, "theory")} title="Theory past papers" description="Structured questions, official answers, and explanations." icon={FileText} />
          </div>
          <div className="workspace-panel overflow-hidden"><div className="workspace-section-label">Learn & practise</div>
            <ResourceLink to={practice} title="Practice by topic" description="Spend more time on the ideas that need it." icon={Target} />
            <ResourceLink to={gradeSectionPath(grade, "materials")} title="Study materials" description="Notes, revision guides, and learning resources." icon={BookOpen} />
          </div>
        </div>
      </section>

      <section aria-labelledby="study-tools" className="mt-8">
        <h2 id="study-tools" className="mb-4 text-base font-semibold">Find your focus</h2>
        <div className="workspace-tools workspace-panel grid overflow-hidden sm:grid-cols-3">
          <ResourceLink to="/study-tools?tab=timers" title="Exam timers" description="Make time for a full paper." icon={Timer} />
          <ResourceLink to="/study-tools?tab=focus" title="Focus mode" description="One task. A little breathing room." icon={Brain} />
          <ResourceLink to="/study-tools?tab=timetable" title="Timetable" description="Give your revision a rhythm." icon={CalendarDays} />
        </div>
      </section>

      {(details.worksheetLevel || details.mappedTopicalLevel) && <section aria-labelledby="teacher-tools" className="mt-8 border-t border-border/50 pt-6">
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 id="teacher-tools" className="text-sm font-semibold">For teachers & group study</h2><p className="text-xs text-muted-foreground">Prepare a worksheet or bring the class together.</p></div>
        <div className="workspace-teacher-links grid gap-3 sm:grid-cols-2">
          {details.worksheetLevel && <ResourceLink to={gradeSectionPath(grade, "worksheet")} title="Worksheet generator" description="Printable questions with a separate answer key." icon={FilePlus2} />}
          {details.mappedTopicalLevel && <ResourceLink to={gradeSectionPath(grade, "quiz")} title="Classroom quiz" description="A timed team game, with room for discussion." icon={Gamepad2} />}
        </div>
      </section>}
      <footer className="mt-10 flex items-center justify-between border-t border-border/40 pt-5 text-[11px] text-muted-foreground"><span>PhysicsHQ · Cambridge Physics</span><Link className="workspace-text-link" to="/about">About PhysicsHQ<ArrowRight className="h-3 w-3" /></Link></footer>
    </main>
  </div>;
}

export default function GradeDashboardPage() {
  const { grade } = useParams<{ grade: string }>();
  if (!isGradeKey(grade)) return <Navigate to="/" replace />;
  return <GradeWorkspace key={grade.toLowerCase()} grade={grade.toLowerCase() as GradeKey} />;
}
