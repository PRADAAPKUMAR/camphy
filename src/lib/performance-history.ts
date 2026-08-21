export const PERFORMANCE_KEY = "physicshq:performance-history";

export interface PerformanceRecord {
  paperId: string;
  paperCode: string;
  level: string;
  year: number | null;
  session: string | null;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
  /** "paper" = past paper attempt, "topic" = topic practice attempt. Legacy records default to "paper". */
  practiceType?: "paper" | "topic";
  /** Topic name for topic-practice attempts only. */
  topic?: string | null;
  /** e.g. "0625 2026-2028" / "9702 2025-2027". Optional on legacy records. */
  syllabusVersion?: string | null;
  /** syllabus_topics.id when the attempt maps to a single syllabus topic. */
  primaryTopicId?: string | null;
  /**
   * Per-question outcome, kept so topic accuracy can be derived later from
   * verified question_topic_mapping rows. Keyed by question number.
   */
  questionResults?: Record<number, boolean>;
  /** Seconds spent on each question (Question mode only). */
  questionTimes?: Record<number, number>;
  /** "sheet" = PDF + answer sheet, "question" = one-question-at-a-time mode. */
  attemptMode?: "sheet" | "question";
}

export const practiceTypeOf = (r: PerformanceRecord): "paper" | "topic" =>
  r.practiceType === "topic" ? "topic" : "paper";

export interface WrongQuestionSet {
  paperId: string;
  paperCode: string;
  level: string;
  year: number | null;
  session: string | null;
  questions: number[];
  lastAttempt: string;
}

/**
 * Past-paper questions the student got wrong, grouped by paper. A question that
 * was later answered correctly drops out of the set.
 */
export const collectWrongQuestions = (records: PerformanceRecord[]): WrongQuestionSet[] => {
  const byPaper = new Map<string, WrongQuestionSet & { outcomes: Map<number, { ok: boolean; at: string }> }>();

  [...records]
    .filter((r) => practiceTypeOf(r) === "paper" && r.questionResults)
    .sort((a, b) => +new Date(a.completedAt) - +new Date(b.completedAt))
    .forEach((r) => {
      const entry =
        byPaper.get(r.paperId) ??
        {
          paperId: r.paperId,
          paperCode: r.paperCode,
          level: r.level,
          year: r.year ?? null,
          session: r.session ?? null,
          questions: [],
          lastAttempt: r.completedAt,
          outcomes: new Map<number, { ok: boolean; at: string }>(),
        };
      entry.lastAttempt = r.completedAt;
      Object.entries(r.questionResults ?? {}).forEach(([q, ok]) => {
        entry.outcomes.set(Number(q), { ok: !!ok, at: r.completedAt });
      });
      byPaper.set(r.paperId, entry);
    });

  return Array.from(byPaper.values())
    .map(({ outcomes, ...rest }) => ({
      ...rest,
      questions: Array.from(outcomes.entries())
        .filter(([, v]) => !v.ok)
        .map(([q]) => q)
        .sort((a, b) => a - b),
    }))
    .filter((s) => s.questions.length > 0)
    .sort((a, b) => +new Date(b.lastAttempt) - +new Date(a.lastAttempt));
};

/** Average seconds per question across Question-mode attempts (0 when unknown). */
export const averageSecondsPerQuestion = (records: PerformanceRecord[]) => {
  let total = 0;
  let count = 0;
  records.forEach((r) => {
    Object.values(r.questionTimes ?? {}).forEach((s) => {
      if (typeof s === "number" && s > 0 && s < 3600) {
        total += s;
        count++;
      }
    });
  });
  return count ? Math.round(total / count) : 0;
};

export const normalizeLevel = (level: string) => {
  const l = (level ?? "").trim().toUpperCase();
  if (l === "IGCSE") return "IGCSE";
  if (l === "AS LEVEL" || l === "AS") return "AS Level";
  if (l === "A2 LEVEL" || l === "A2") return "A2 Level";
  return level;
};

export const readPerformanceHistory = (): PerformanceRecord[] => {
  try {
    const raw = localStorage.getItem(PERFORMANCE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r) => r && typeof r.percentage === "number");
  } catch {
    return [];
  }
};

export const savePerformanceRecord = (record: PerformanceRecord) => {
  try {
    const history = readPerformanceHistory();
    history.push(record);
    localStorage.setItem(PERFORMANCE_KEY, JSON.stringify(history.slice(-200)));
  } catch {
    // ignore quota / privacy-mode failures
  }
};

export const clearPerformanceHistory = () => {
  try {
    localStorage.removeItem(PERFORMANCE_KEY);
  } catch {
    // ignore
  }
};