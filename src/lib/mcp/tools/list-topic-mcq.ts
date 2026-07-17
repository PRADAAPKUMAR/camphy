import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { anonSupabase } from "../supabase";

export default defineTool({
  name: "list_topic_mcq_practice",
  title: "List topic-wise MCQ practice",
  description:
    "List topic-wise MCQ practice papers on Physics HQ. Each entry is a set of multiple-choice questions on a single physics topic, with a PDF and a suggested timer. Optionally filter by level or topic substring.",
  inputSchema: {
    level: z.string().optional().describe("Filter by level (e.g. 'AS LEVEL')."),
    topic: z.string().optional().describe("Case-insensitive substring match on topic (e.g. 'kinematics')."),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ level, topic, limit }) => {
    const supabase = anonSupabase();
    let q = supabase
      .from("topicwise_mcq_papers")
      .select("id, level, topic, total_questions, timer_minutes, pdf_url")
      .order("level", { ascending: true })
      .order("topic", { ascending: true })
      .limit(limit ?? 50);

    if (level) q = q.eq("level", level);
    if (topic) q = q.ilike("topic", `%${topic}%`);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { papers: data ?? [] },
    };
  },
});