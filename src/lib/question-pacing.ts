export const BOTTLENECK_SECONDS = 120;

export const paperDurationMinutes = (level: string) =>
  /^AS(?:\s|$)/i.test(level.trim()) ? 75 : 45;

export const formatPacingTime = (seconds: number) => {
  const value = Math.max(0, Math.round(seconds));
  return `${Math.floor(value / 60)}m ${String(value % 60).padStart(2, "0")}s`;
};

/** Accumulates active visits, excluding hidden tabs and post-answer review. */
export class QuestionPacingClock {
  private milliseconds: Record<number, number> = {};
  private active: number | null = null;
  private started: number | null = null;
  private locked = new Set<number>();

  constructor(private now: () => number = () => performance.now()) {}

  pause() {
    if (this.active !== null && this.started !== null) {
      this.milliseconds[this.active] = (this.milliseconds[this.active] ?? 0) + Math.max(0, this.now() - this.started);
    }
    this.started = null;
  }

  activate(question: number | null, running: boolean) {
    this.pause();
    this.active = question;
    if (question !== null && running && !this.locked.has(question)) this.started = this.now();
  }

  commit(question: number) {
    if (this.active === question) this.pause();
    this.locked.add(question);
  }

  snapshot() {
    const values = { ...this.milliseconds };
    if (this.active !== null && this.started !== null) {
      values[this.active] = (values[this.active] ?? 0) + Math.max(0, this.now() - this.started);
    }
    return Object.fromEntries(Object.entries(values).filter(([, ms]) => ms > 0).map(([q, ms]) => [Number(q), Math.max(1, Math.round(ms / 1000))]));
  }
}

export const pacingSummary = (times: Record<number, number>, questions: number[]) => {
  const entries = questions.flatMap((q) => {
    const seconds = times[q];
    return typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0 ? [{ question: q, seconds }] : [];
  }).sort((a, b) => a.seconds - b.seconds || a.question - b.question);
  return {
    count: entries.length,
    average: entries.length ? entries.reduce((sum, entry) => sum + entry.seconds, 0) / entries.length : 0,
    fastest: entries[0],
    slowest: entries[entries.length - 1],
    bottlenecks: entries.filter((entry) => entry.seconds > BOTTLENECK_SECONDS),
  };
};