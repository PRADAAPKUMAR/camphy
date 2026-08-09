import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Phase = "focus" | "break";

const beep = () => {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    setTimeout(() => ctx.close(), 800);
  } catch { /* audio unavailable */ }
};

const FocusMode = () => {
  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [phase, setPhase] = useState<Phase>("focus");
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const switching = useRef(false);

  const total = (phase === "focus" ? focusMin : breakMin) * 60;

  const switchPhase = useCallback(() => {
    if (switching.current) return;
    switching.current = true;
    beep();
    const next: Phase = phase === "focus" ? "break" : "focus";
    if (phase === "focus") setSessions((s) => s + 1);
    setPhase(next);
    setLeft((next === "focus" ? focusMin : breakMin) * 60);
    setTimeout(() => { switching.current = false; }, 100);
  }, [phase, focusMin, breakMin]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running && left === 0) switchPhase();
  }, [left, running, switchPhase]);

  const reset = () => {
    setRunning(false);
    setPhase("focus");
    setLeft(focusMin * 60);
  };

  const pct = total ? ((total - left) / total) * 100 : 0;
  const isFocus = phase === "focus";
  const ring = isFocus ? "var(--study-1)" : "var(--study-2)";
  const m = String(Math.floor(left / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="glass-card flex flex-col items-center rounded-2xl p-8">
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
          style={{ background: `hsl(${ring} / 0.12)`, color: `hsl(${ring})` }}
        >
          {isFocus ? <Brain className="h-3.5 w-3.5" /> : <Coffee className="h-3.5 w-3.5" />}
          {isFocus ? "Focus session" : "Break time"}
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

        <div className="mt-8 flex gap-3">
          <Button className="gap-2" onClick={() => setRunning((r) => !r)}>
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {running ? "Pause" : "Start"}
          </Button>
          <Button variant="outline" className="gap-2" onClick={reset}>
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
          <Button variant="secondary" onClick={switchPhase}>
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
              onChange={(e) => {
                const v = Math.max(1, Number(e.target.value) || 1);
                setFocusMin(v);
                if (phase === "focus" && !running) setLeft(v * 60);
              }}
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
              onChange={(e) => {
                const v = Math.max(1, Number(e.target.value) || 1);
                setBreakMin(v);
                if (phase === "break" && !running) setLeft(v * 60);
              }}
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
                onClick={() => {
                  setFocusMin(f);
                  setBreakMin(b);
                  setRunning(false);
                  setPhase("focus");
                  setLeft(f * 60);
                }}
                className="rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {f} / {b}
              </button>
            ))}
          </div>
          <p className="pt-2 text-xs leading-relaxed text-muted-foreground">
            Work in deep blocks, then rest. A chime plays when each block ends, and the timer flips
            between focus and break automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FocusMode;