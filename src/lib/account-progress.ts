import { PERFORMANCE_KEY, type PerformanceRecord } from "@/lib/performance-history";
import { supabase } from "@/integrations/supabase/client";
export const MERGE_DECISION_KEY = "physicshq:progress-merge-decision";
const hash = (value: string) => { let h = 2166136261; for (let i = 0; i < value.length; i += 1) h = Math.imul(h ^ value.charCodeAt(i), 16777619); return (h >>> 0).toString(36); };
export const localRecords = (): PerformanceRecord[] => { try { const value = JSON.parse(localStorage.getItem(PERFORMANCE_KEY) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; } };
export const mergeLocalProgress = async () => {
  const records = localRecords().map((record) => ({ event_key: `local-${hash(JSON.stringify([record.paperId, record.completedAt, record.score, record.totalQuestions, record.attemptMode]))}`, activity_type: record.practiceType === "topic" ? "topic" : record.attemptMode === "question" ? "question" : "paper", occurred_at: record.completedAt, payload: record }));
  const { data, error } = await supabase.functions.invoke("account-progress", { body: { records } }); if (error || data?.error) throw new Error(data?.error ?? error?.message); return data as { imported: number; total: number };
};
export const syncPerformanceRecord = async (record: PerformanceRecord) => {
  const event_key = `activity-${hash(JSON.stringify([record.paperId, record.completedAt, record.score, record.totalQuestions, record.attemptMode]))}`;
  await supabase.functions.invoke("account-progress", { body: { records: [{ event_key, activity_type: record.practiceType === "topic" ? "topic" : record.attemptMode === "question" ? "question" : "paper", occurred_at: record.completedAt, payload: record }] } });
};
