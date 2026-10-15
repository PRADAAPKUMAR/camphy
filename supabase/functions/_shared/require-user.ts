import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const url = () => Deno.env.get("SUPABASE_URL") ?? "";
const anonKey = () => Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceKey = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export const serviceClient = () => createClient(url(), serviceKey());

export const requireUser = async (req: Request) => {
  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) throw new Error("UNAUTHENTICATED");
  const client = createClient(url(), anonKey(), { global: { headers: { Authorization: authorization } } });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("UNAUTHENTICATED");
  return data.user;
};

export const requireAdmin = async (req: Request) => {
  const user = await requireUser(req);
  const admin = serviceClient();
  const { data, error } = await admin.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
  if (error || data?.role !== "admin") throw new Error("FORBIDDEN");
  return { user, admin };
};
