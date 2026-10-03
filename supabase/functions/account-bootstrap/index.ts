import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireUser, serviceClient } from "../_shared/require-user.ts";
import { z } from "npm:zod@3.25.76";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const Profile = z.object({
  full_name: z.string().trim().max(120).optional(), display_name: z.string().trim().max(60).optional(),
  avatar_url: z.string().url().max(1000).nullable().optional(), account_type: z.enum(["student", "teacher"]).optional(),
  grade: z.enum(["igcse", "as", "a2"]).nullable().optional(), school: z.string().trim().max(160).nullable().optional(),
  country: z.string().trim().max(80).nullable().optional(), preferences: z.record(z.unknown()).optional(), setup_completed: z.boolean().optional(),
});
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await requireUser(req); const admin = serviceClient();
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const parsed = Profile.safeParse(body?.profile ?? {}); if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const metadata = user.user_metadata ?? {};
    const base = { id: user.id, full_name: String(metadata.full_name ?? metadata.name ?? "").slice(0, 120), display_name: String(metadata.name ?? user.email?.split("@")[0] ?? "").slice(0, 60), avatar_url: typeof metadata.avatar_url === "string" ? metadata.avatar_url : null };
    const { error: createError } = await admin.from("profiles").upsert(base, { onConflict: "id", ignoreDuplicates: true });
    if (createError) return json({ error: createError.message }, 400);
    await admin.from("user_roles").upsert({ user_id: user.id, role: "user" }, { onConflict: "user_id", ignoreDuplicates: true });
    if (Object.keys(parsed.data).length) {
      const { error } = await admin.from("profiles").update(parsed.data).eq("id", user.id); if (error) return json({ error: error.message }, 400);
    }
    const [{ data: profile }, { data: role }] = await Promise.all([admin.from("profiles").select("*").eq("id", user.id).single(), admin.from("user_roles").select("role").eq("user_id", user.id).single()]);
    return json({ profile, role: role?.role ?? "user" });
  } catch (error) { const message = error instanceof Error ? error.message : "Request failed"; return json({ error: message }, message === "UNAUTHENTICATED" ? 401 : 500); }
});
