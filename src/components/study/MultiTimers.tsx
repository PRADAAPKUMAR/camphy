import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, X, Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STUDY_COLORS, colorHsl } from "@/lib/study-colors";

interface TimerItem {
  id: string;
  label: string;
  total: number; // seconds
  left: number;
  running: boolean;
  color: string;
}

const beep = () => {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
    setTimeout(() => ctx.close(), 900);
  } catch { /* audio unavailable */ }
};

const fmt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

const PRESETS = [
  { label: "Paper 1 — MCQ", minutes: 45 },
  { label: "Paper 2 — AS Theory", minutes: 75 },
  { label: "Paper 4 — A2 Theory", minutes: 120 },
  { label: "Quick Drill", minutes: 15 },
];

const MultiTimers = () => {
  const [timers, setTimers] = useState<TimerItem[]>([]);
  const [label, setLabel] = useState("");
  const [minutes, setMinutes] = useState("45");
  const doneRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const anyRunning = timers.some((t) => t.running && t.left > 0);
    if (!anyRunning) return;
    const id = window.setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => (t.running && t.left > 0 ? { ...t, left: t.left - 1 } : t)),
      );
    }, 1000);
    return () => window.clearInterval(id);
  }, [timers]);

  useEffect(() => {
    timers.forEach((t) => {
      if (t.left === 0 && !doneRef.current.has(t.id)) {
        doneRef.current.add(t.id);
        beep();
      }
    });
  }, [timers]);

  const addTimer = useCallback((name: string, mins: number) => {
    const total = Math.max(1, Math.round(mins)) * 60;
    const idx = Math.floor(Math.random() * STUDY_COLORS.length);
    setTimers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: name.trim() || `Timer ${prev.length + 1}`,
        total,
        left: total,
        running: true,
        color: STUDY_COLORS[idx].key,
      },
    ]);
  }, []);

  const toggle = (id: string) =>
    setTimers((p) => p.map((t) => (t.id === id ? { ...t, running: !t.running } : t)));
  const reset = (id: string) => {
    doneRef.current.delete(id);
    setTimers((p) => p.map((t) => (t.id === id ? { ...t, left: t.total, running: false } : t)));
  };
  const remove = (id: string) => setTimers((p) => p.filter((t) => t.id !== id));

  return (
    <div className="space-y-6">
      {/* Creator */}
      <div className="glass-card rounded-2xl p-5">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            addTimer(label, Number(minutes) || 45);
            setLabel("");
          }}
        >
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Timer name (e.g. Physics Paper 1)"
            className="sm:flex-1"
          />
          <Input
            type="number"
            min={1}
            max={600}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="Minutes"
            className="sm:w-32"
          />
          <Button type="submit" className="gap-2">
            <Plus className="h-4 w-4" /> Add Timer
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => addTimer(p.label, p.minutes)}
              className="rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {p.label} · {p.minutes}m
            </button>
          ))}
        </div>
      </div>

      {timers.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No timers running. Add one above or tap a preset to time a full paper.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {timers.map((t) => {
            const pct = t.total ? (t.left / t.total) * 100 : 0;
            const hsl = colorHsl(t.color);
            const finished = t.left === 0;
            return (
              <div
                key={t.id}
                className="glass-card rounded-2xl p-5"
                style={{ borderColor: `hsl(${hsl} / 0.35)` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-tight">{t.label}</p>
                  <button
                    onClick={() => remove(t.id)}
                    aria-label="Remove timer"
                    className="text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p
                  className={`mt-3 font-mono text-4xl font-bold tabular-nums ${finished ? "animate-pulse" : ""}`}
                  style={{ color: finished ? `hsl(var(--destructive))` : `hsl(${hsl})` }}
                >
                  {fmt(t.left)}
                </p>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted/50">
                  <div
                    className="h-full rounded-full transition-[width] duration-1000 ease-linear"
                    style={{ width: `${pct}%`, background: `hsl(${hsl})` }}
                  />
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 gap-1.5"
                    onClick={() => toggle(t.id)}
                    disabled={finished}
                  >
                    {t.running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {t.running ? "Pause" : "Start"}
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => reset(t.id)}>
                    <RotateCcw className="h-3.5 w-3.5" /> Reset
                  </Button>
                </div>
                {finished && (
                  <p className="mt-3 text-xs font-semibold text-destructive">Time up — pens down!</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiTimers;