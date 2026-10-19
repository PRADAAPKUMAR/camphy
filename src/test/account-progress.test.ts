import { beforeEach, describe, expect, it, vi } from "vitest";
const api = vi.hoisted(() => ({ invoke: vi.fn(), from: vi.fn(), getSession: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: api.invoke }, from: api.from, auth: { getSession: api.getSession } } }));
import { attemptEventKey, fetchAccountHistory, mergeLocalProgress, syncPerformanceRecord } from "@/lib/account-progress";
import { PERFORMANCE_KEY, readPerformanceHistory, restorePerformanceHistory, savePerformanceRecord, setPerformanceAccount, type PerformanceRecord } from "@/lib/performance-history";

const record: PerformanceRecord = { paperId: "paper", paperCode: "0625", level: "IGCSE", year: 2025, session: "May/June", score: 1, totalQuestions: 1, percentage: 100, completedAt: "2026-10-19T00:00:00.000Z", attemptMode: "question" };
beforeEach(() => { localStorage.clear(); setPerformanceAccount(null); vi.clearAllMocks(); });

describe("account progress consistency", () => {
  it("uses exactly the same id for auto-sync, repeated sync and importing guest history", async () => {
    const keys = new Set<string>();
    api.invoke.mockImplementation(async (_name, { body }) => {
      let imported = 0;
      for (const row of body.records) { if (!keys.has(row.event_key)) imported++; keys.add(row.event_key); }
      return { data: { imported, total: keys.size }, error: null };
    });
    localStorage.setItem(PERFORMANCE_KEY, JSON.stringify([record]));
    await syncPerformanceRecord(record);
    expect(await mergeLocalProgress()).toEqual({ imported: 0, total: 1 });
    await syncPerformanceRecord(record);
    expect([...keys]).toEqual([attemptEventKey(record)]);
  });
  it("reads only the signed-in user's learning activities, then restores a new device", async () => {
    const query = { eq: vi.fn(), in: vi.fn(), order: vi.fn(), limit: vi.fn().mockResolvedValue({ data: [{ payload: record }], error: null }) };
    query.eq.mockReturnValue(query); query.in.mockReturnValue(query); query.order.mockReturnValue(query);
    api.from.mockReturnValue({ select: vi.fn().mockReturnValue(query) });
    setPerformanceAccount("learner-a");
    expect(readPerformanceHistory()).toEqual([]);
    restorePerformanceHistory("learner-a", await fetchAccountHistory("learner-a"));
    expect(query.eq).toHaveBeenCalledWith("user_id", "learner-a");
    expect(readPerformanceHistory()).toEqual([record]);
    restorePerformanceHistory("learner-a", [record]);
    expect(readPerformanceHistory()).toHaveLength(1);
  });
  it("does not upload a previous account's attempt after a delayed session lookup", async () => {
    let release!: (value: unknown) => void;
    api.getSession.mockReturnValue(new Promise((resolve) => { release = resolve; }));
    setPerformanceAccount("learner-a");
    savePerformanceRecord(record);
    await vi.waitFor(() => expect(api.getSession).toHaveBeenCalledOnce());
    setPerformanceAccount("learner-b");
    release({ data: { session: { user: { id: "learner-b" } } } });
    await Promise.resolve(); await Promise.resolve();
    expect(api.invoke).not.toHaveBeenCalled();
  });
  it("keeps guest and account caches separate and ignores another account's late response", () => {
    localStorage.setItem(PERFORMANCE_KEY, JSON.stringify([record]));
    setPerformanceAccount("learner-a");
    expect(readPerformanceHistory()).toEqual([]);
    restorePerformanceHistory("learner-a", [record]);
    setPerformanceAccount("learner-b");
    restorePerformanceHistory("learner-a", [record]);
    expect(readPerformanceHistory()).toEqual([]);
    setPerformanceAccount("learner-a"); expect(readPerformanceHistory()).toEqual([record]);
    setPerformanceAccount(null); expect(readPerformanceHistory()).toEqual([record]);
  });
});
