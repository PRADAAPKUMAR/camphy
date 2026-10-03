import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireUser, serviceClient } from "../_shared/require-user.ts";
import { z } from "npm:zod@3.25.76";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const RecordSchema = z.object({ event_key: z.string().min(8).max(180), activity_type: z.enum(["paper","topic","question","worksheet","theory_pdf","favourite"]), occurred_at: z.string().datetime(), payload: z.record(z.unknown()) });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await requireUser(req); const parsed = z.object({ records: z.array(RecordSchema).max(200) }).safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const admin = serviceClient(); let imported = 0;
    for (const record of parsed.data.records) {
      const { data, error } = await admin.from("user_activity").upsert({ user_id: user.id, ...record }, { onConflict: "user_id,event_key", ignoreDuplicates: true }).select("id");
      if (error) return json({ error: error.message }, 400); if (data?.length) imported += 1;
    }
    const { data: rows } = await admin.from("user_activity").select("activity_type,payload,occurred_at").eq("user_id", user.id);
    let attempted = 0, correct = 0, mcq = 0, theory = 0, worksheets = 0, topical = 0; let lastActive: string | null = null;
    for (const row of rows ?? []) { const p = row.payload as Record<string, unknown>; const total = Number(p.totalQuestions ?? 0); const score = Number(p.score ?? 0); if (["paper","topic","question"].includes(row.activity_type)) { attempted += total; correct += score; mcq += 1; } if (row.activity_type === "theory_pdf") theory += 1; if (row.activity_type === "worksheet") worksheets += 1; if (row.activity_type === "theory_pdf") topical += 1; if (!lastActive || row.occurred_at > lastActive) lastActive = row.occurred_at; }
    const usage_summary = { last_active_at: lastActive, total_questions_attempted: attempted, correct_total: correct, incorrect_total: Math.max(0, attempted - correct), current_streak: 0, longest_streak: 0, mcq_total: mcq, theory_total: theory, worksheet_total: worksheets, topical_pdf_total: topical, recent_topics: [], performance: {} };
    await admin.from("profiles").update({ usage_summary }).eq("id", user.id);
    return json({ imported, total: rows?.length ?? 0, usage_summary });
  } catch (error) { const message = error instanceof Error ? error.message : "Request failed"; return json({ error: message }, message === "UNAUTHENTICATED" ? 401 : 500); }
});
