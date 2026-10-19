import { useCallback, useRef } from "react";

const validAnswer = (value: unknown): value is string => typeof value === "string" && /^[A-D]$/.test(value);

/** Share in-flight checks between instant feedback and final submission. Failed checks can be retried. */
export function useAnswerChecks(resolve: (question: number, answer: string) => Promise<string>) {
  const resolver = useRef(resolve);
  resolver.current = resolve;
  const pending = useRef(new Map<number, Promise<string>>());
  const checked = useRef<Record<number, string>>({});
  const check = useCallback((question: number, answer: string) => {
    if (checked.current[question]) return Promise.resolve(checked.current[question]);
    const existing = pending.current.get(question);
    if (existing) return existing;
    const request = Promise.resolve().then(() => resolver.current(question, answer)).then((correct) => {
      if (!validAnswer(correct)) throw new Error("Answer key unavailable");
      checked.current[question] = correct;
      return correct;
    }).finally(() => pending.current.delete(question));
    pending.current.set(question, request);
    return request;
  }, []);
  const complete = useCallback(async (answers: Record<number, string>, known: Record<number, string>) => {
    const resolved = await Promise.all(Object.entries(answers).map(async ([q, answer]) => {
      const question = Number(q);
      return [question, validAnswer(known[question]) ? known[question] : await check(question, answer)] as const;
    }));
    return { ...known, ...Object.fromEntries(resolved) };
  }, [check]);
  return { check, complete };
}
