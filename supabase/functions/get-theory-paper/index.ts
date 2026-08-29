import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "theory-papers";
const TTL_SECONDS = 60 * 60 * 3;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { theory_paper_id } = await req.json();
    if (typeof theory_paper_id !== "string" || !theory_paper_id) {
      return json({ error: "Invalid theory_paper_id" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: paper, error } = await supabase
      .from("theory_papers")
      .select("*")
      .eq("id", theory_paper_id)
      .maybeSingle();
    if (error) return json({ error: error.message }, 400);
    if (!paper) return json({ error: "Paper not found" }, 404);

    const { data: explanations } = await supabase
      .from("theory_explanations")
      .select("id, question_number, part_label, order_index, explanation, image_path")
      .eq("theory_paper_id", theory_paper_id)
      .order("question_number", { ascending: true })
      .order("order_index", { ascending: true });

    const paths = [
      paper.question_storage_path,
      paper.answer_storage_path,
      ...(explanations ?? []).map((e) => e.image_path),
    ].filter((p): p is string => typeof p === "string" && p.length > 0);

    const signedByPath = new Map<string, string>();
    if (paths.length) {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(paths, TTL_SECONDS);
      for (const s of signed ?? []) {
        if (s.path && s.signedUrl) signedByPath.set(s.path, s.signedUrl);
      }
    }

    return json({
      paper,
      question_url: paper.question_storage_path
        ? signedByPath.get(paper.question_storage_path) ?? null
        : null,
      answer_url: paper.answer_storage_path
        ? signedByPath.get(paper.answer_storage_path) ?? null
        : null,
      explanations: (explanations ?? []).map((e) => ({
        ...e,
        image_url: e.image_path ? signedByPath.get(e.image_path) ?? null : null,
      })),
      expires_in: TTL_SECONDS,
    });
  } catch {
    return json({ error: "Internal server error" }, 500);
  }
});
