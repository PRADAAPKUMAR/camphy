import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireUser, serviceClient } from "../_shared/require-user.ts";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try { const user = await requireUser(req); const admin = serviceClient(); await admin.from("user_activity").delete().eq("user_id", user.id); await admin.from("user_roles").delete().eq("user_id", user.id); await admin.from("profiles").delete().eq("id", user.id); const { error } = await admin.auth.admin.deleteUser(user.id); if (error) return json({ error: error.message }, 400); return json({ deleted: true }); }
  catch (error) { const message = error instanceof Error ? error.message : "Request failed"; return json({ error: message }, message === "UNAUTHENTICATED" ? 401 : 500); }
});
