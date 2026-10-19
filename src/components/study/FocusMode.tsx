import { useState, useSyncExternalStore } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain, Maximize2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { studyTimerStore } from "@/lib/study-timer-store";
import FullscreenStage from "./FullscreenStage";

const FocusMode = () => {
  const { focus } = useSyncExternalStore(studyTimerStore.subscribe, studyTimerStore.getSnapshot);
  const { focusMin, breakMin, phase, left, running, sessions } = focus;
  const [full, setFull] = useState(false);

  const total = (phase === "focus" ? focusMin : breakMin) * 60;
  const pct = total ? Math.min(100, ((total - left) / total) * 100) : 0;
  const isFocus = phase === "focus";
  const ring = isFocus ? "var(--study-1)" : "var(--study-2)";
  const m = String(Math.floor(left / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");

  const adjust = (
    <div className="flex items-center gap-2">
      <Button variant="outline" className="gap-1.5" onClick={() => studyTimerStore.adjustFocus(-1)}>
        <Minus className="h-4 w-4" /> 1 min
      </Button>
      <Button variant="outline" className="gap-1.5" onClick={() => studyTimerStore.adjustFocus(1)}>
        <Plus className="h-4 w-4" /> 1 min
      </Button>
    </div>
  );

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="glass-card flex flex-col items-center rounded-2xl p-8">
          <div className="mb-6 flex items-center gap-2">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
              style={{ background: `hsl(${ring} / 0.12)`, color: `hsl(${ring})` }}
            >
              {isFocus ? <Brain className="h-3.5 w-3.5" /> : <Coffee className="h-3.5 w-3.5" />}
              {isFocus ? "Focus session" : "Break time"}
            </div>
            <button
              type="button"
              onClick={() => setFull(true)}
              aria-label="Full screen focus timer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Maximize2 className="h-3.5 w-3.5" /> Full screen
            </button>
          </div>

          <div
            className="relative flex h-56 w-56 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(hsl(${ring}) ${pct}%, hsl(var(--muted) / 0.5) ${pct}% 100%)`,
            }}
          >
            <div className="flex h-[13rem] w-[13rem] flex-col items-center justify-center rounded-full bg-card">
              <span className="font-mono text-5xl font-bold tabular-nums" style={{ color: `hsl(${ring})` }}>
                {m}:{s}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                {sessions} session{sessions === 1 ? "" : "s"} done
              </span>
            </div>
          </div>

          <div className="mt-6">{adjust}</div>

          <div className="mt-4 flex gap-3">
            <Button className="gap-2" onClick={() => studyTimerStore.toggleFocus()}>
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? "Pause" : "Start"}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => studyTimerStore.resetFocus()}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Button variant="secondary" onClick={() => studyTimerStore.skipPhase()}>
              Skip
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="mb-4 text-lg font-bold">Session settings</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="focus-min">
                Focus length (minutes)
              </label>
              <Input
                id="focus-min"
                type="number"
                min={1}
                max={180}
                value={focusMin}
                onChange={(e) =>
                  studyTimerStore.setFocusLengths(Math.max(1, Number(e.target.value) || 1), breakMin)
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="break-min">
                Break length (minutes)
              </label>
              <Input
                id="break-min"
                type="number"
                min={1}
                max={60}
                value={breakMin}
                onChange={(e) =>
                  studyTimerStore.setFocusLengths(focusMin, Math.max(1, Number(e.target.value) || 1))
                }
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                [25, 5],
                [50, 10],
                [90, 20],
              ].map(([f, b]) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => studyTimerStore.setFocusLengths(f, b, true)}
                  className="rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {f} / {b}
                </button>
              ))}
            </div>
            <p className="pt-2 text-xs leading-relaxed text-muted-foreground">
              Work in deep blocks, then rest. A chime plays when each block ends, the timer flips
              between focus and break automatically, and it keeps running while you browse other
              pages. Closing the tab resets it.
            </p>
          </div>
        </div>
      </div>

      <FullscreenStage open={full} onClose={() => setFull(false)}>
        <div
          className="mb-8 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold"
          style={{ background: `hsl(${ring} / 0.12)`, color: `hsl(${ring})` }}
        >
          {isFocus ? <Brain className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
          {isFocus ? "Focus session" : "Break time"}
        </div>
        <div
          className="relative flex h-[min(70vw,26rem)] w-[min(70vw,26rem)] items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(hsl(${ring}) ${pct}%, hsl(var(--muted) / 0.5) ${pct}% 100%)`,
          }}
        >
          <div className="flex h-[92%] w-[92%] flex-col items-center justify-center rounded-full bg-card">
            <span
              className="font-mono text-[clamp(3rem,12vw,8rem)] font-bold leading-none tabular-nums"
              style={{ color: `hsl(${ring})` }}
            >
              {m}:{s}
            </span>
            <span className="mt-3 text-sm text-muted-foreground">
              {sessions} session{sessions === 1 ? "" : "s"} done
            </span>
          </div>
        </div>
        <div className="mt-8">{adjust}</div>
        <div className="mt-4 flex gap-3">
          <Button size="lg" className="gap-2" onClick={() => studyTimerStore.toggleFocus()}>
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {running ? "Pause" : "Start"}
          </Button>
          <Button size="lg" variant="outline" className="gap-2" onClick={() => studyTimerStore.resetFocus()}>
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
          <Button size="lg" variant="secondary" onClick={() => studyTimerStore.skipPhase()}>
            Skip
          </Button>
        </div>
      </FullscreenStage>
    </>
  );
};

export default FocusMode;
