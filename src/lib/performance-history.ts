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
}

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