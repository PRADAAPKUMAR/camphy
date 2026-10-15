import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "question-images";
const TTL_SECONDS = 60 * 60 * 3;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { paper_id } = await req.json();
    if (!paper_id || typeof paper_id !== "string") return json({ error: "Invalid paper_id" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rows, error } = await supabase
      .from("question_images")
      .select("question_number, storage_path")
      .eq("paper_id", paper_id)
      .order("question_number", { ascending: true });

    if (error) return json({ error: error.message, images: {} }, 200);
    if (!rows?.length) return json({ images: {} });

    const { data: signed, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(rows.map((r) => r.storage_path as string), TTL_SECONDS);

    if (signError) return json({ error: signError.message, images: {} }, 200);

    const byPath = new Map(
      (signed ?? []).map((s) => [s.path ?? "", s.signedUrl as string | null]),
    );
    const images: Record<string, string> = {};
    for (const row of rows) {
      const url = byPath.get(row.storage_path as string);
      if (url) images[String(row.question_number)] = url;
    }

    return json({ images, expires_in: TTL_SECONDS });
  } catch {
    return json({ error: "Internal server error", images: {} }, 500);
  }
});
