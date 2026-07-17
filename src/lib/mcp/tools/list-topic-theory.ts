import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { anonSupabase } from "../supabase";

export default defineTool({
  name: "list_topic_theory_questions",
  title: "List topic-wise theory questions",
  description:
    "List topic-wise theory (structured) question sets on Physics HQ. Each entry has a question PDF and a matching answer-key PDF. Optionally filter by level or topic substring.",
  inputSchema: {
    level: z.string().optional().describe("Filter by level (e.g. 'A2 LEVEL')."),
    topic: z.string().optional().describe("Case-insensitive substring match on topic."),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ level, topic, limit }) => {
    const supabase = anonSupabase();
    let q = supabase
      .from("topicwise_theory_questions")
      .select("id, level, topic, question_pdf_url, answer_pdf_url")
      .order("level", { ascending: true })
      .order("topic", { ascending: true })
      .limit(limit ?? 50);

    if (level) q = q.eq("level", level);
    if (topic) q = q.ilike("topic", `%${topic}%`);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { questions: data ?? [] },
    };
  },
});