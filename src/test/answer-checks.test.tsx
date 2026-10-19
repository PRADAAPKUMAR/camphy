import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAnswerChecks } from "@/hooks/use-answer-checks";

describe("final answer marking", () => {
  it("waits for instant-feedback checks before finalising and shares the same request", async () => {
    let release!: (answer: string) => void;
    const resolve = vi.fn(() => new Promise<string>((done) => { release = done; }));
    const { result } = renderHook(() => useAnswerChecks(resolve));
    const instant = result.current.check(1, "A");
    const finish = result.current.complete({ 1: "A" }, {});
    const done = vi.fn();
    void finish.then(done);
    await act(async () => { await Promise.resolve(); });
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(done).not.toHaveBeenCalled();
    await act(async () => { release("A"); await instant; });
    expect(await finish).toEqual({ 1: "A" });
  });
  it("never converts unavailable marks to wrong answers and allows retry", async () => {
    const resolve = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce("B");
    const { result } = renderHook(() => useAnswerChecks(resolve));
    await expect(result.current.complete({ 1: "B" }, {})).rejects.toThrow("offline");
    expect(await result.current.complete({ 1: "B" }, {})).toEqual({ 1: "B" });
    expect(resolve).toHaveBeenCalledTimes(2);
  });
  it("uses prefetched keys and rejects malformed fallback answers", async () => {
    const resolve = vi.fn().mockResolvedValue("invalid");
    const { result } = renderHook(() => useAnswerChecks(resolve));
    expect(await result.current.complete({ 1: "A" }, { 1: "A" })).toEqual({ 1: "A" });
    expect(resolve).not.toHaveBeenCalled();
    await expect(result.current.complete({ 2: "B" }, {})).rejects.toThrow("Answer key unavailable");
  });
});
