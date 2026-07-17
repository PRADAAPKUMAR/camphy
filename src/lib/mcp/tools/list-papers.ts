import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { anonSupabase } from "../supabase";

export default defineTool({
  name: "list_papers",
  title: "List past papers",
  description:
    "List Cambridge past-paper MCQ practice papers on Physics HQ. Filter by level (IGCSE, AS LEVEL, A2 LEVEL), paper code, session (e.g. May/June, October/November), or year. Returns paper metadata and a URL to the PDF question paper.",
  inputSchema: {
    level: z.string().optional().describe("Filter by level, e.g. 'IGCSE', 'AS LEVEL', 'A2 LEVEL'."),
    paper_code: z.string().optional().describe("Filter by Cambridge paper code (e.g. '9702/12')."),
    session: z.string().optional().describe("Filter by exam session (e.g. 'May/June')."),
    year: z.number().int().optional().describe("Filter by year (e.g. 2023)."),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ level, paper_code, session, year, limit }) => {
    const supabase = anonSupabase();
    let q = supabase
      .from("papers")
      .select("id, level, subject, paper_code, session, year, pdf_url")
      .order("year", { ascending: false })
      .order("session", { ascending: true })
      .limit(limit ?? 50);

    if (level) q = q.eq("level", level);
    if (paper_code) q = q.eq("paper_code", paper_code);
    if (session) q = q.eq("session", session);
    if (typeof year === "number") q = q.eq("year", year);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { papers: data ?? [] },
    };
  },
});