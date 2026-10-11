// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { Script, createContext } from "node:vm";
import ts from "typescript";
import { z } from "zod";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Execute the actual Deno handlers with an in-memory client. No live writes or credentials.
let identity: { id: string } | null;
let role: string;
let dbError: boolean;
let inserted: unknown;
const queries: { table: string; columns?: string; filters: unknown[] }[] = [];
const client = {
  auth: { getUser: async () => ({ data: { user: identity }, error: identity ? null : new Error("invalid token") }) },
  from(table: string) {
    const record = { table, columns: undefined as string | undefined, filters: [] as unknown[] };
    queries.push(record);
    const result = () => ({ data: table === "user_roles" ? { role } : table === "topicwise_mcq_papers" ? { total_questions: 3 } : { q1: "A", q2: "B", q3: "C", q40: "D" }, error: dbError ? new Error("database unavailable") : null });
    const chain = {
      select(columns: string) { record.columns = columns; return chain; },
      eq(column: string, value: unknown) { record.filters.push([column, value]); return chain; },
      single: async () => result(), maybeSingle: async () => result(),
      insert: async (value: unknown) => { inserted = value; return { error: dbError ? new Error("save failed") : null }; },
    };
    return chain;
  },
};

type Handler = (request: Request) => Promise<Response>;
function loadFunction(name: string): Handler {
  let handler: Handler | undefined;
  const load = (file: string): Record<string, unknown> => {
    const module = { exports: {} };
    const code = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const context = createContext({
      module, exports: module.exports, Request, Response, Headers, Error, console,
      fetch: vi.fn(() => { throw new Error("Unexpected network access in isolated test"); }),
      Deno: { env: { get: () => "test-only" }, serve: (fn: Handler) => { handler = fn; } },
      require: (specifier: string) => {
        if (specifier.includes("/cors")) return { corsHeaders: {} };
        if (specifier.includes("supabase-js")) return { createClient: () => client };
        if (specifier.includes("zod")) return { z };
        if (specifier.startsWith(".")) return load(resolve(dirname(file), specifier));
        throw new Error(`Unexpected import: ${specifier}`);
      },
    });
    new Script(code, { filename: file }).runInContext(context);
    return module.exports;
  };
  load(resolve(`supabase/functions/${name}/index.ts`));
  if (!handler) throw new Error(`Handler not registered: ${name}`);
  return handler;
}
const request = (body: unknown, signedIn = false) => new Request("http://localhost/test", { method: "POST", headers: { "Content-Type": "application/json", ...(signedIn ? { Authorization: "Bearer test-only" } : {}) }, body: JSON.stringify(body) });

beforeEach(() => { identity = null; role = "user"; dbError = false; inserted = undefined; queries.length = 0; });

describe("actual admin authorization handlers", () => {
  for (const name of ["admin-table-editor", "admin-theory", "admin-upload-question"]) {
    it(`${name} rejects anonymous requests before reading content`, async () => {
      const response = await loadFunction(name)(request({ action: "tables" }));
      expect(response.status).toBe(401); await response.text();
      expect(queries).toHaveLength(0);
    });
    it(`${name} rejects a signed-in non-admin even if the body claims admin`, async () => {
      identity = { id: "normal-user" };
      const response = await loadFunction(name)(request({ action: "tables", role: "admin" }, true));
      expect(response.status).toBe(403); await response.text();
      expect(queries.map((entry) => entry.table)).toEqual(["user_roles"]);
      expect(queries[0].filters).toEqual([["user_id", "normal-user"]]);
    });
  }
  it("fails closed when role lookup fails", async () => {
    identity = { id: "admin-user" }; role = "admin"; dbError = true;
    const response = await loadFunction("admin-table-editor")(request({ action: "tables" }, true));
    expect(response.status).toBe(403); await response.text();
  });
  it("allows a verified admin through the role boundary", async () => {
    identity = { id: "admin-user" }; role = "admin";
    const response = await loadFunction("admin-table-editor")(request({ action: "tables" }, true));
    // Schema fetch is intentionally unavailable in this isolated test, but permission was granted.
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("Administrator access required");
  });
});

describe("optional account boundaries", () => {
  for (const name of ["account-bootstrap", "account-progress", "delete-account"]) {
    it(`${name} rejects an unauthenticated request without writes`, async () => {
      const response = await loadFunction(name)(request({ records: [] }));
      expect(response.status).toBe(401); await response.text(); expect(queries).toHaveLength(0);
    });
  }
  it("rejects oversized sync batches", async () => {
    identity = { id: "normal-user" };
    const response = await loadFunction("account-progress")(request({ records: Array.from({ length: 201 }, () => ({})) }, true));
    expect(response.status).toBe(400); await response.text(); expect(queries).toHaveLength(0);
  });
});

describe("server-computed exam scores and answer disclosure", () => {
  for (const name of ["submit-exam", "submit-topic-exam"]) {
    it(`${name} rejects empty answers`, async () => {
      const response = await loadFunction(name)(request({ paper_id: "paper", answers: {} }));
      expect(response.status).toBe(400); await response.text(); expect(queries).toHaveLength(0);
    });
    it(`${name} ignores a claimed score and reveals only answered questions`, async () => {
      const response = await loadFunction(name)(request({ paper_id: "paper", answers: { "1": "A", "2": "D" }, score: 40 }));
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.score).toBe(1); expect(data.correct_answers).toEqual({ "1": "A", "2": "B" });
      if (name === "submit-exam") expect(inserted).toMatchObject({ score: 1, total_questions: 40 });
    });
    it(`${name} handles an unavailable answer key`, async () => {
      dbError = true;
      const response = await loadFunction(name)(request({ paper_id: "paper", answers: { "1": "A" } }));
      expect(response.status).toBe(404); await response.text(); expect(inserted).toBeUndefined();
    });
  }
  for (const name of ["check-answer", "check-topic-answer"]) {
    it(`${name} requires a valid committed option`, async () => {
      const response = await loadFunction(name)(request({ paper_id: "paper", question: 1, answer: "invalid" }));
      expect(response.status).toBe(400); await response.text(); expect(queries).toHaveLength(0);
    });
    it(`${name} queries only the requested answer column`, async () => {
      const response = await loadFunction(name)(request({ paper_id: "paper", question: 1, answer: "A" }));
      expect(response.status).toBe(200); const data = await response.json();
      expect(data.correct_answer).toBe("A"); expect(data.is_correct).toBe(true);
      expect(queries[0].columns).toBe("q1"); expect(data.correct_answers).toBeUndefined();
    });
  }
  it("full-key prefetch preserves anonymous instant-feedback behavior but omits internal fields", async () => {
    const response = await loadFunction("get-answer-key")(request({ paper_id: "paper" }));
    expect(response.status).toBe(200); const data = await response.json();
    expect(Object.keys(data).sort()).toEqual(["correct_answers", "total_questions"]);
    expect(data.correct_answers["1"]).toBe("A");
  });
});