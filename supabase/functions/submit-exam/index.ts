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
    const { paper_id, answers } = await req.json();

    // Validate input
    if (!paper_id || typeof paper_id !== "string") {
      return new Response(JSON.stringify({ error: "Invalid paper_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return new Response(JSON.stringify({ error: "Invalid answers" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch answer key server-side
    const { data: answerKey, error: akError } = await supabase
      .from("answer_keys")
      .select("*")
      .eq("paper_id", paper_id)
      .single();

    if (akError || !answerKey) {
      return new Response(JSON.stringify({ error: "Answer key not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compute score server-side
    const TOTAL_QUESTIONS = 40;
    let score = 0;
    const correctAnswers: Record<string, string> = {};

    for (let q = 1; q <= TOTAL_QUESTIONS; q++) {
      const key = `q${q}`;
      const correctValue = answerKey[key];
      if (typeof correctValue === "string") {
        correctAnswers[String(q)] = correctValue;
        if (answers[String(q)] === correctValue) {
          score++;
        }
      }
    }

    // Insert attempt
    const { error: insertError } = await supabase.from("attempts").insert({
      paper_id,
      score,
      total_questions: TOTAL_QUESTIONS,
      answers,
    });

    if (insertError) {
      return new Response(JSON.stringify({ error: "Failed to save attempt" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ score, total_questions: TOTAL_QUESTIONS, correct_answers: correctAnswers }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
