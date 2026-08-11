import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { paper_id, kind } = await req.json();

    if (!paper_id || typeof paper_id !== "string") {
      return new Response(JSON.stringify({ error: "Invalid paper_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isTopic = kind === "topic";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let total = 40;
    if (isTopic) {
      const { data: paper } = await supabase
        .from("topicwise_mcq_papers")
        .select("total_questions")
        .eq("id", paper_id)
        .single();
      total = paper?.total_questions ?? 40;
    }

    const { data: answerKey, error } = await supabase
      .from(isTopic ? "topicwise_mcq_answer_keys" : "answer_keys")
      .select("*")
      .eq("paper_id", paper_id)
      .single();

    if (error || !answerKey) {
      return new Response(JSON.stringify({ error: "Answer key not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const correct_answers: Record<string, string> = {};
    for (let q = 1; q <= total; q++) {
      const v = (answerKey as Record<string, unknown>)[`q${q}`];
      if (typeof v === "string" && v) correct_answers[String(q)] = v;
    }

    return new Response(
      JSON.stringify({ total_questions: total, correct_answers }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
