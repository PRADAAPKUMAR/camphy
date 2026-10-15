/**
 * Global study-timer store. Lives outside React so timers keep ticking while the
 * user navigates between pages. Persisted in sessionStorage, which is wiped when
 * the tab is closed — so closing the tab resets everything.
 */
import { STUDY_COLORS } from "@/lib/study-colors";

export interface TimerItem {
  id: string;
  label: string;
  total: number; // seconds
  left: number;
  running: boolean;
  color: string;
}

export type Phase = "focus" | "break";

export interface FocusState {
  focusMin: number;
  breakMin: number;
  phase: Phase;
  left: number;
  running: boolean;
  sessions: number;
}

export interface StudyTimerState {
  timers: TimerItem[];
  focus: FocusState;
  savedAt: number;
}

const KEY = "physicshq:study-timers";

const initialFocus = (): FocusState => ({
  focusMin: 25,
  breakMin: 5,
  phase: "focus",
  left: 25 * 60,
  running: false,
  sessions: 0,
});

const beep = (freq: number) => {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
    setTimeout(() => ctx.close(), 900);
  } catch {
    /* audio unavailable */
  }
};

const load = (): StudyTimerState => {
  const fresh: StudyTimerState = { timers: [], focus: initialFocus(), savedAt: Date.now() };
  if (typeof window === "undefined") return fresh;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw) as StudyTimerState;
    const elapsed = Math.max(0, Math.floor((Date.now() - (parsed.savedAt || Date.now())) / 1000));
    // catch up on time that passed while the page was unmounted / reloading
    parsed.timers = (parsed.timers || []).map((t) =>
      t.running ? { ...t, left: Math.max(0, t.left - elapsed) } : t,
    );
    if (parsed.focus?.running) {
      parsed.focus = { ...parsed.focus, left: Math.max(0, parsed.focus.left - elapsed) };
    }
    return { ...fresh, ...parsed, focus: { ...initialFocus(), ...parsed.focus } };
  } catch {
    return fresh;
  }
};

let state: StudyTimerState = load();
const listeners = new Set<() => void>();
const doneTimers = new Set<string>();

const persist = () => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
  } catch {
    /* storage unavailable */
  }
};

const emit = () => {
  persist();
  listeners.forEach((l) => l());
};

const set = (updater: (s: StudyTimerState) => StudyTimerState) => {
  state = updater(state);
  ensureTicking();
  emit();
};

let intervalId: number | null = null;

const tick = () => {
  let changed = false;
  const timers = state.timers.map((t) => {
    if (t.running && t.left > 0) {
      changed = true;
      const left = t.left - 1;
      if (left === 0 && !doneTimers.has(t.id)) {
        doneTimers.add(t.id);
        beep(880);
      }
      return { ...t, left };
    }
    return t;
  });

  let focus = state.focus;
  if (focus.running) {
    changed = true;
    if (focus.left <= 1) {
      beep(660);
      const next: Phase = focus.phase === "focus" ? "break" : "focus";
      focus = {
        ...focus,
        phase: next,
        sessions: focus.phase === "focus" ? focus.sessions + 1 : focus.sessions,
        left: (next === "focus" ? focus.focusMin : focus.breakMin) * 60,
      };
    } else {
      focus = { ...focus, left: focus.left - 1 };
    }
  }

  if (!changed) {
    stopTicking();
    return;
  }
  state = { ...state, timers, focus };
  emit();
};

const startTicking = () => {
  if (intervalId !== null) return;
  intervalId = window.setInterval(tick, 1000);
};
const stopTicking = () => {
  if (intervalId === null) return;
  window.clearInterval(intervalId);
  intervalId = null;
};
const ensureTicking = () => {
  const active =
    state.focus.running || state.timers.some((t) => t.running && t.left > 0);
  if (active) startTicking();
  else stopTicking();
};

if (typeof window !== "undefined") {
  ensureTicking();
  window.addEventListener("pagehide", persist);
  window.addEventListener("visibilitychange", persist);
}

export const studyTimerStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => state,

  /* ---- multi timers ---- */
  addTimer(name: string, minutes: number) {
    const total = Math.max(1, Math.round(minutes)) * 60;
    const color = STUDY_COLORS[Math.floor(Math.random() * STUDY_COLORS.length)].key;
    set((s) => ({
      ...s,
      timers: [
        ...s.timers,
        {
          id: crypto.randomUUID(),
          label: name.trim() || `Timer ${s.timers.length + 1}`,
          total,
          left: total,
          running: true,
          color,
        },
      ],
    }));
  },
  toggleTimer(id: string) {
    set((s) => ({
      ...s,
      timers: s.timers.map((t) => (t.id === id ? { ...t, running: !t.running } : t)),
    }));
  },
  resetTimer(id: string) {
    doneTimers.delete(id);
    set((s) => ({
      ...s,
      timers: s.timers.map((t) => (t.id === id ? { ...t, left: t.total, running: false } : t)),
    }));
  },
  /** Nudge a running (or paused) timer by whole minutes, e.g. +1 / -1 */
  adjustTimer(id: string, deltaMinutes: number) {
    const delta = deltaMinutes * 60;
    if (delta > 0) doneTimers.delete(id);
    set((s) => ({
      ...s,
      timers: s.timers.map((t) =>
        t.id === id
          ? {
              ...t,
              left: Math.max(0, t.left + delta),
              total: Math.max(60, t.total + (delta > 0 ? delta : 0), t.left + delta),
            }
          : t,
      ),
    }));
  },
  removeTimer(id: string) {
    doneTimers.delete(id);
    set((s) => ({ ...s, timers: s.timers.filter((t) => t.id !== id) }));
  },

  /* ---- focus mode ---- */
  toggleFocus() {
    set((s) => ({ ...s, focus: { ...s.focus, running: !s.focus.running } }));
  },
  resetFocus() {
    set((s) => ({
      ...s,
      focus: { ...s.focus, running: false, phase: "focus", left: s.focus.focusMin * 60 },
    }));
  },
  skipPhase() {
    set((s) => {
      const next: Phase = s.focus.phase === "focus" ? "break" : "focus";
      return {
        ...s,
        focus: {
          ...s.focus,
          phase: next,
          sessions: s.focus.phase === "focus" ? s.focus.sessions + 1 : s.focus.sessions,
          left: (next === "focus" ? s.focus.focusMin : s.focus.breakMin) * 60,
        },
      };
    });
  },
  adjustFocus(deltaMinutes: number) {
    set((s) => ({
      ...s,
      focus: { ...s.focus, left: Math.max(0, s.focus.left + deltaMinutes * 60) },
    }));
  },
  setFocusLengths(focusMin: number, breakMin: number, restart = false) {
    set((s) => {
      const f = { ...s.focus, focusMin, breakMin };
      if (restart) {
        f.running = false;
        f.phase = "focus";
        f.left = focusMin * 60;
      } else if (!s.focus.running) {
        f.left = (s.focus.phase === "focus" ? focusMin : breakMin) * 60;
      }
      return { ...s, focus: f };
    });
  },
};
