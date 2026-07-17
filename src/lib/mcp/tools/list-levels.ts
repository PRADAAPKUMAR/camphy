import { defineTool } from "@lovable.dev/mcp-js";
import { anonSupabase } from "../supabase";

export default defineTool({
  name: "list_levels",
  title: "List levels",
  description:
    "List the physics levels available on Physics HQ (e.g. IGCSE, AS LEVEL, A2 LEVEL) together with how many past papers, topic-wise MCQ practice sets, topic-wise theory questions, and study materials exist for each level.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const supabase = anonSupabase();
    const [papers, mcq, theory, materials] = await Promise.all([
      supabase.from("papers").select("level"),
      supabase.from("topicwise_mcq_papers").select("level"),
      supabase.from("topicwise_theory_questions").select("level"),
      supabase.from("study_materials").select("level"),
    ]);

    const err = papers.error || mcq.error || theory.error || materials.error;
    if (err) {
      return { content: [{ type: "text", text: err.message }], isError: true };
    }

    const levels = new Map<string, { papers: number; topic_mcq: number; topic_theory: number; materials: number }>();
    const bump = (row: { level: string }, key: "papers" | "topic_mcq" | "topic_theory" | "materials") => {
      const entry = levels.get(row.level) ?? { papers: 0, topic_mcq: 0, topic_theory: 0, materials: 0 };
      entry[key] += 1;
      levels.set(row.level, entry);
    };
    papers.data?.forEach((r) => bump(r as any, "papers"));
    mcq.data?.forEach((r) => bump(r as any, "topic_mcq"));
    theory.data?.forEach((r) => bump(r as any, "topic_theory"));
    materials.data?.forEach((r) => bump(r as any, "materials"));

    const result = Array.from(levels.entries())
      .map(([level, counts]) => ({ level, ...counts }))
      .sort((a, b) => a.level.localeCompare(b.level));

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: { levels: result },
    };
  },
});