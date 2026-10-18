import { GlassIcon } from "@/components/ui/glass-icon";
import { Link, useSearchParams } from "react-router-dom";
import { Timer as TimerIcon, Brain, CalendarDays, ArrowLeft } from "lucide-react";
import MultiTimers from "@/components/study/MultiTimers";
import FocusMode from "@/components/study/FocusMode";
import TimetableScheduler from "@/components/study/TimetableScheduler";

const TABS = [
  { key: "timers", label: "Exam Timers", icon: TimerIcon, color: "var(--study-1)" },
  { key: "focus", label: "Focus Mode", icon: Brain, color: "var(--study-4)" },
  { key: "timetable", label: "Timetable", icon: CalendarDays, color: "var(--study-3)" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const StudyToolsPage = () => {
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get("tab");
  const tab: TabKey = TABS.some((item) => item.key === requestedTab) ? requestedTab as TabKey : "timers";
  const setTab = (next: TabKey) => setParams((current) => { const result = new URLSearchParams(current); result.set("tab", next); return result; });

  return (
    <div className="min-h-screen bg-background page-transition">
      <header className="relative overflow-hidden border-b border-border/40 bg-radial-glow">
        <div className="container relative py-10">
          <Link
            to="/"
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Study <span className="gradient-text">Tools</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Run several exam timers side by side, lock into focus sessions, and build a colourful
            weekly study timetable you can download as a PDF.
          </p>

          <nav className="mt-7 flex flex-wrap gap-2">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  aria-pressed={active}
                  className="glass-study-tab inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: active ? `hsl(${t.color} / 0.15)` : "transparent",
                    borderColor: active ? `hsl(${t.color} / 0.45)` : "hsl(var(--border))",
                    color: active ? `hsl(${t.color})` : "hsl(var(--muted-foreground))",
                  }}
                >
                  <GlassIcon icon={t.icon} className="h-7 w-7 rounded-lg text-current [&>svg]:h-4 [&>svg]:w-4" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="container py-10">
        {tab === "timers" && <MultiTimers />}
        {tab === "focus" && <FocusMode />}
        {tab === "timetable" && <TimetableScheduler />}
      </main>
    </div>
  );
};

export default StudyToolsPage;