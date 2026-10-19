import { PERFORMANCE_KEY, performanceAccount, readPerformanceHistory, restorePerformanceHistory, type PerformanceRecord } from "@/lib/performance-history";
import { supabase } from "@/integrations/supabase/client";
import { gradeFromLevel } from "@/lib/grades";

export const MERGE_DECISION_KEY = "physicshq:progress-merge-decision";
const hash = (value: string) => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
};
export const attemptEventKey = (record: PerformanceRecord) => `activity-${hash(JSON.stringify([record.paperId, record.completedAt, record.score, record.totalQuestions, record.attemptMode]))}`;
const activity = (record: PerformanceRecord) => ({
  event_key: attemptEventKey(record),
  activity_type: record.practiceType === "topic" ? "topic" : record.attemptMode === "question" ? "question" : "paper",
  occurred_at: record.completedAt,
  payload: record,
});
const isRecord = (value: unknown): value is PerformanceRecord => {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<PerformanceRecord>;
  return typeof record.paperId === "string" && typeof record.completedAt === "string" && typeof record.percentage === "number";
};
/** Anonymous records remain separate until the user chooses to import them. */
export const localRecords = (): PerformanceRecord[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(PERFORMANCE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter(isRecord) : [];
  } catch { return []; }
};

export const fetchAccountHistory = async (userId: string): Promise<PerformanceRecord[]> => {
  const { data, error } = await supabase.from("user_activity").select("payload")
    .eq("user_id", userId).in("activity_type", ["paper", "topic", "question"])
    .order("occurred_at", { ascending: false }).limit(200);
  if (error) throw error;
  return (data ?? []).map((row) => row.payload as unknown).filter(isRecord);
};

const upload = async (records: PerformanceRecord[]) => {
  const { data, error } = await supabase.functions.invoke("account-progress", { body: { records: records.map(activity) } });
  if (error || data?.error) throw new Error(data?.error ?? error?.message ?? "Progress could not be synced");
  return data as { imported: number; total: number };
};
export const mergeLocalProgress = async () => {
  const id = performanceAccount();
  // Include previously failed signed-in uploads; every path uses the same idempotency key.
  const records = [...localRecords(), ...readPerformanceHistory()];
  const unique = [...new Map(records.map((record) => [attemptEventKey(record), record])).values()];
  let imported = 0, total = 0;
  for (let start = 0; start < unique.length; start += 200) {
    if (performanceAccount() !== id) throw new Error("The active account changed. Please start the import again.");
    const result = await upload(unique.slice(start, start + 200));
    imported += result.imported; total = result.total;
  }
  if (id && performanceAccount() === id) restorePerformanceHistory(id, await fetchAccountHistory(id));
  return { imported, total };
};
export const syncPerformanceRecord = (record: PerformanceRecord) => upload([record]);

export const deleteAccountHistory = async (userId: string, level?: string) => {
  let query = supabase.from("user_activity").delete().eq("user_id", userId).in("activity_type", ["paper", "topic", "question"]);
  if (level) {
    const grade = gradeFromLevel(level);
    const aliases = grade === "igcse" ? ["IGCSE", "IGCSE PHYSICS", "0625"]
      : grade === "as" ? ["AS", "AS LEVEL", "AS LEVEL PHYSICS"]
        : grade === "a2" ? ["A2", "A2 LEVEL", "A LEVEL", "A LEVEL PHYSICS"] : null;
    query = aliases ? query.or(aliases.map((alias) => `payload->>level.ilike.${alias}`).join(",")) : query.ilike("payload->>level", level);
  }
  const { error } = await query;
  if (error) throw error;
  await upload([]); // Refresh the protected aggregate after deleting the user's own records.
};
