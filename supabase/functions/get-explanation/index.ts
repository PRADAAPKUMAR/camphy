import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { paper_id, topic_paper_id, question } = await req.json();

    const q = Number(question);
    if (!q || q < 1 || q > 100) return json({ error: "Invalid question number" }, 400);

    const isTopic = typeof topic_paper_id === "string" && topic_paper_id.length > 0;
    const id = isTopic ? topic_paper_id : paper_id;
    if (typeof id !== "string" || !id) return json({ error: "Invalid paper id" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("question_explanations")
      .select("question_number, correct_option, explanation, option_a, option_b, option_c, option_d")
      .eq(isTopic ? "topic_paper_id" : "paper_id", id)
      .eq("question_number", q)
      .maybeSingle();

    if (error) return json({ error: "Could not load explanation" }, 500);
    if (!data) return json({ question: q, found: false }, 200);

    return json({
      question: q,
      found: true,
      correct_option: data.correct_option,
      explanation: data.explanation,
      options: {
        A: data.option_a,
        B: data.option_b,
        C: data.option_c,
        D: data.option_d,
      },
    });
  } catch {
    return json({ error: "Internal server error" }, 500);
  }
});
