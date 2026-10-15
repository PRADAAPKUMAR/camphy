import { useState } from "react";
import { Link } from "react-router-dom";
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
  const [tab, setTab] = useState<TabKey>("timers");

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
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all"
                  style={{
                    background: active ? `hsl(${t.color} / 0.15)` : "transparent",
                    borderColor: active ? `hsl(${t.color} / 0.45)` : "hsl(var(--border))",
                    color: active ? `hsl(${t.color})` : "hsl(var(--muted-foreground))",
                  }}
                >
                  <t.icon className="h-4 w-4" />
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