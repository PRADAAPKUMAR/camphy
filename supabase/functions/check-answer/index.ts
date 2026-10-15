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
    const { paper_id, question, answer } = await req.json();

    if (!paper_id || typeof paper_id !== "string") {
      return new Response(JSON.stringify({ error: "Invalid paper_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const q = Number(question);
    if (!q || q < 1 || q > 40) {
      return new Response(JSON.stringify({ error: "Invalid question number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only reveal the answer for a question the user has actually answered.
    if (typeof answer !== "string" || !["A", "B", "C", "D"].includes(answer)) {
      return new Response(JSON.stringify({ error: "Invalid answer" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const colName = `q${q}`;
    const { data: answerKey, error } = await supabase
      .from("answer_keys")
      .select(colName)
      .eq("paper_id", paper_id)
      .single();

    if (error || !answerKey) {
      return new Response(JSON.stringify({ error: "Answer key not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const correct = (answerKey as Record<string, string>)[colName];

    return new Response(
      JSON.stringify({ question: q, submitted: answer, is_correct: answer === correct, correct_answer: correct }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});