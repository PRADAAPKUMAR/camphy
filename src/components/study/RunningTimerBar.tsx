import { useSyncExternalStore } from "react";
import { Link, useLocation } from "react-router-dom";
import { Pause, Play, Plus, Minus, Timer as TimerIcon } from "lucide-react";
import { colorHsl } from "@/lib/study-colors";
import { studyTimerStore } from "@/lib/study-timer-store";

const fmt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

/** Floating pill showing timers that keep running while browsing other pages */
const RunningTimerBar = () => {
  const state = useSyncExternalStore(studyTimerStore.subscribe, studyTimerStore.getSnapshot);
  const { pathname } = useLocation();
  if (pathname === "/study-tools") return null;

  const active = state.timers.filter((t) => t.running || t.left < t.total).slice(0, 3);
  const focusActive = state.focus.running;
  if (active.length === 0 && !focusActive) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[min(92vw,44rem)] -translate-x-1/2">
      <div className="glass-card flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
        <Link
          to="/study-tools"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <TimerIcon className="h-4 w-4" /> Study Tools
        </Link>
        {focusActive && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {state.focus.phase === "focus" ? "Focus" : "Break"}
            </span>
            <span
              className="font-mono text-sm font-bold tabular-nums"
              style={{ color: `hsl(var(--study-1))` }}
            >
              {fmt(state.focus.left)}
            </span>
            <button
              onClick={() => studyTimerStore.toggleFocus()}
              aria-label="Pause focus timer"
              className="text-muted-foreground hover:text-foreground"
            >
              <Pause className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {active.map((t) => (
          <div key={t.id} className="flex items-center gap-2">
            <span className="max-w-[9rem] truncate text-xs text-muted-foreground">{t.label}</span>
            <span
              className={`font-mono text-sm font-bold tabular-nums ${t.left === 0 ? "animate-pulse" : ""}`}
              style={{
                color: t.left === 0 ? `hsl(var(--destructive))` : `hsl(${colorHsl(t.color)})`,
              }}
            >
              {fmt(t.left)}
            </span>
            <button
              onClick={() => studyTimerStore.adjustTimer(t.id, -1)}
              aria-label="Subtract one minute"
              className="text-muted-foreground hover:text-foreground"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => studyTimerStore.adjustTimer(t.id, 1)}
              aria-label="Add one minute"
              className="text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => studyTimerStore.toggleTimer(t.id)}
              aria-label={t.running ? "Pause timer" : "Start timer"}
              className="text-muted-foreground hover:text-foreground"
            >
              {t.running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RunningTimerBar;
