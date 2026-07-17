import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { anonSupabase } from "../supabase";

export default defineTool({
  name: "list_study_materials",
  title: "List study materials",
  description:
    "List study materials (notes, revision resources) on Physics HQ. Filter by level, subject, or folder path. Each entry links to a file URL (often a Google Drive document).",
  inputSchema: {
    level: z.string().optional().describe("Filter by level (e.g. 'IGCSE')."),
    subject: z.string().optional().describe("Filter by subject."),
    folder_path: z.string().optional().describe("Filter by exact folder path."),
    search: z.string().optional().describe("Case-insensitive substring match on title."),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ level, subject, folder_path, search, limit }) => {
    const supabase = anonSupabase();
    let q = supabase
      .from("study_materials")
      .select("id, level, subject, title, description, file_type, file_url, folder_path")
      .order("level", { ascending: true })
      .order("title", { ascending: true })
      .limit(limit ?? 50);

    if (level) q = q.eq("level", level);
    if (subject) q = q.eq("subject", subject);
    if (folder_path) q = q.eq("folder_path", folder_path);
    if (search) q = q.ilike("title", `%${search}%`);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { materials: data ?? [] },
    };
  },
});