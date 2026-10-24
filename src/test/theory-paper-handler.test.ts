// @vitest-environment node
import { readFileSync } from "node:fs";
import { Script, createContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";
function handler(failMarks = false) {
  let serve: ((req: Request) => Promise<Response>) | undefined;
  const client = {
    from(table: string) {
      const result = { data: table === "theory_papers" ? { id: "paper", question_storage_path: "q.pdf", answer_storage_path: "ms.pdf" } : table === "theory_question_part_marks" ? [{ question_number: 1, part_label: "a", order_index: 1, marks: 4 }] : [{ id: "explanation", question_number: 1, part_label: "a", order_index: 1, explanation: "$F=ma$", image_path: null }], error: failMarks && table === "theory_question_part_marks" ? new Error("unavailable") : null };
      const chain = { select: () => chain, eq: () => chain, order: () => chain, maybeSingle: async () => result, then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve) }; return chain;
    },
    storage: { from: () => ({ createSignedUrls: async (paths: string[]) => ({ data: paths.map((path) => ({ path, signedUrl: `https://example.test/${path}` })), error: null }) }) },
  };
  const code = ts.transpileModule(readFileSync("supabase/functions/get-theory-paper/index.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Script(code).runInContext(createContext({ exports: {}, Request, Response, Map, console, Deno: { env: { get: () => "test-only" }, serve: (fn: typeof serve) => { serve = fn; } }, require: () => ({ createClient: () => client }) }));
  if (!serve) throw new Error("No handler");
  return serve;
}
describe("actual theory paper payload", () => {
  it("returns signed question and official answer URLs, explanations and exact subdivision marks", async () => {
    const response = await handler()(new Request("http://localhost/test", { method: "POST", body: JSON.stringify({ theory_paper_id: "paper" }) }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.question_url).toBe("https://example.test/q.pdf"); expect(data.answer_url).toBe("https://example.test/ms.pdf");
    expect(data.part_marks).toEqual([{ question_number: 1, part_label: "a", order_index: 1, marks: 4 }]);
    expect(data.part_marks[0].source_sha256).toBeUndefined();
    expect(data.explanations[0].explanation).toBe("$F=ma$");
  });
  it("does not misreport failed marks reads as missing content", async () => {
    const response = await handler(true)(new Request("http://localhost/test", { method: "POST", body: JSON.stringify({ theory_paper_id: "paper" }) }));
    expect(response.status).toBe(500); expect((await response.json()).error).toBe("Could not load subdivision marks");
  });
});