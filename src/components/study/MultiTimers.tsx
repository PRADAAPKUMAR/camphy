import { useState, useSyncExternalStore } from "react";
import { Play, Pause, RotateCcw, X, Plus, Bell, Maximize2, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { colorHsl } from "@/lib/study-colors";
import { studyTimerStore } from "@/lib/study-timer-store";
import { PAPER_PRESETS } from "@/lib/paper-presets";
import FullscreenStage from "./FullscreenStage";

const fmt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

const MultiTimers = () => {
  const state = useSyncExternalStore(studyTimerStore.subscribe, studyTimerStore.getSnapshot);
  const timers = state.timers;
  const [label, setLabel] = useState("");
  const [minutes, setMinutes] = useState("45");
  const [fullId, setFullId] = useState<string | null>(null);

  const fullTimer = timers.find((t) => t.id === fullId) || null;

  return (
    <div className="space-y-6">
      {/* Creator */}
      <div className="glass-card rounded-2xl p-5">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            studyTimerStore.addTimer(label, Number(minutes) || 45);
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

        <div className="mt-5 space-y-4">
          {PAPER_PRESETS.map((group) => (
            <div key={group.level}>
              <p
                className="mb-2 text-xs font-bold uppercase tracking-wide"
                style={{ color: `hsl(${group.color})` }}
              >
                {group.level}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.papers.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => studyTimerStore.addTimer(p.label, p.minutes)}
                    className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:text-foreground"
                    style={{
                      borderColor: `hsl(${group.color} / 0.35)`,
                      background: `hsl(${group.color} / 0.08)`,
                      color: `hsl(${group.color})`,
                    }}
                  >
                    {p.label} · {p.minutes}m
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Timers keep running while you browse other pages. Closing the tab clears them.
        </p>
      </div>

      {timers.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No timers running. Add one above or tap a paper preset to time a full paper.
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
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => setFullId(t.id)}
                      aria-label="Full screen timer"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => studyTimerStore.removeTimer(t.id)}
                      aria-label="Remove timer"
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
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

                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 px-2 text-xs"
                    onClick={() => studyTimerStore.adjustTimer(t.id, -1)}
                    aria-label="Subtract one minute"
                  >
                    <Minus className="h-3.5 w-3.5" /> 1 min
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 px-2 text-xs"
                    onClick={() => studyTimerStore.adjustTimer(t.id, 1)}
                    aria-label="Add one minute"
                  >
                    <Plus className="h-3.5 w-3.5" /> 1 min
                  </Button>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 gap-1.5"
                    onClick={() => studyTimerStore.toggleTimer(t.id)}
                    disabled={finished}
                  >
                    {t.running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {t.running ? "Pause" : "Start"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => studyTimerStore.resetTimer(t.id)}
                  >
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

      <FullscreenStage open={!!fullTimer} onClose={() => setFullId(null)}>
        {fullTimer && (
          <>
            <p className="mb-6 text-center text-lg font-semibold text-muted-foreground">
              {fullTimer.label}
            </p>
            <p
              className={`font-mono text-[clamp(3.5rem,17vw,12rem)] font-bold leading-none tabular-nums ${
                fullTimer.left === 0 ? "animate-pulse" : ""
              }`}
              style={{
                color:
                  fullTimer.left === 0
                    ? `hsl(var(--destructive))`
                    : `hsl(${colorHsl(fullTimer.color)})`,
              }}
            >
              {fmt(fullTimer.left)}
            </p>
            <div className="mt-10 h-3 w-full max-w-xl overflow-hidden rounded-full bg-muted/50">
              <div
                className="h-full rounded-full transition-[width] duration-1000 ease-linear"
                style={{
                  width: `${fullTimer.total ? (fullTimer.left / fullTimer.total) * 100 : 0}%`,
                  background: `hsl(${colorHsl(fullTimer.color)})`,
                }}
              />
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                variant="outline"
                className="gap-2"
                onClick={() => studyTimerStore.adjustTimer(fullTimer.id, -1)}
              >
                <Minus className="h-4 w-4" /> 1 min
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="gap-2"
                onClick={() => studyTimerStore.toggleTimer(fullTimer.id)}
                disabled={fullTimer.left === 0}
              >
                {fullTimer.running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {fullTimer.running ? "Pause" : "Start"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2"
                onClick={() => studyTimerStore.adjustTimer(fullTimer.id, 1)}
              >
                <Plus className="h-4 w-4" /> 1 min
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2"
                onClick={() => studyTimerStore.resetTimer(fullTimer.id)}
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            </div>
            {fullTimer.left === 0 && (
              <p className="mt-6 text-sm font-semibold text-destructive">Time up — pens down!</p>
            )}
          </>
        )}
      </FullscreenStage>
    </div>
  );
};

export default MultiTimers;
