import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "question-images";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const admin = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const passcode = Deno.env.get("ADMIN_UPLOAD_PASSCODE");
    if (!passcode) return json({ error: "Admin passcode is not configured" }, 500);

    const body = await req.json();
    if (typeof body?.passcode !== "string" || body.passcode !== passcode) {
      return json({ error: "Invalid passcode" }, 401);
    }

    const supabase = admin();
    const action = body.action ?? "upload";

    // Verify the passcode only.
    if (action === "verify") return json({ ok: true });

    // Which questions of a paper already have an image.
    if (action === "status") {
      if (typeof body.paper_id !== "string") return json({ error: "Invalid paper_id" }, 400);
      const { data, error } = await supabase
        .from("question_images")
        .select("question_number")
        .eq("paper_id", body.paper_id)
        .order("question_number", { ascending: true });
      if (error) return json({ error: error.message }, 400);
      return json({ questions: (data ?? []).map((r) => r.question_number) });
    }

    // Upload one question image (base64 payload) and upsert its row.
    if (action === "upload") {
      const { paper_id, question_number, content_type, data_base64, width, height } = body;
      if (typeof paper_id !== "string") return json({ error: "Invalid paper_id" }, 400);
      const q = Number(question_number);
      if (!Number.isInteger(q) || q < 1 || q > 100) {
        return json({ error: "question_number must be 1-100" }, 400);
      }
      if (typeof data_base64 !== "string" || !data_base64) {
        return json({ error: "Missing image data" }, 400);
      }

      const bytes = Uint8Array.from(atob(data_base64), (c) => c.charCodeAt(0));
      if (!bytes.byteLength) return json({ error: "Empty image" }, 400);

      const type = typeof content_type === "string" && content_type.startsWith("image/")
        ? content_type
        : "image/jpeg";
      const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
      const storage_path = `${paper_id}/${q}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storage_path, bytes, { contentType: type, upsert: true });
      if (uploadError) return json({ error: uploadError.message }, 400);

      const { error: rowError } = await supabase
        .from("question_images")
        .upsert(
          {
            paper_id,
            question_number: q,
            storage_path,
            width: Number.isFinite(Number(width)) ? Number(width) : null,
            height: Number.isFinite(Number(height)) ? Number(height) : null,
          },
          { onConflict: "paper_id,question_number" },
        );
      if (rowError) return json({ error: rowError.message }, 400);

      return json({ ok: true, question_number: q, storage_path });
    }

    // Remove a question image.
    if (action === "delete") {
      const { paper_id, question_number } = body;
      if (typeof paper_id !== "string") return json({ error: "Invalid paper_id" }, 400);
      const q = Number(question_number);
      const { data: row } = await supabase
        .from("question_images")
        .select("storage_path")
        .eq("paper_id", paper_id)
        .eq("question_number", q)
        .maybeSingle();
      if (row?.storage_path) {
        await supabase.storage.from(BUCKET).remove([row.storage_path as string]);
      }
      const { error } = await supabase
        .from("question_images")
        .delete()
        .eq("paper_id", paper_id)
        .eq("question_number", q);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    // Save / update the explanation for a question.
    if (action === "save_explanation") {
      const { paper_id, question_number, correct_option, explanation, option_a, option_b, option_c, option_d } = body;
      if (typeof paper_id !== "string") return json({ error: "Invalid paper_id" }, 400);
      const q = Number(question_number);
      if (!Number.isInteger(q)) return json({ error: "Invalid question_number" }, 400);

      const { data: existing } = await supabase
        .from("question_explanations")
        .select("id")
        .eq("paper_id", paper_id)
        .eq("question_number", q)
        .maybeSingle();

      const payload = {
        paper_id,
        question_number: q,
        correct_option: correct_option ?? null,
        explanation: explanation ?? null,
        option_a: option_a ?? null,
        option_b: option_b ?? null,
        option_c: option_c ?? null,
        option_d: option_d ?? null,
      };

      const { error } = existing?.id
        ? await supabase.from("question_explanations").update(payload).eq("id", existing.id)
        : await supabase.from("question_explanations").insert(payload);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    // Set / fix the verified syllabus topic mapping of a question.
    if (action === "save_mapping") {
      const { paper_id, question_number, syllabus_topic_id } = body;
      if (typeof paper_id !== "string" || typeof syllabus_topic_id !== "string") {
        return json({ error: "Invalid mapping payload" }, 400);
      }
      const q = Number(question_number);
      if (!Number.isInteger(q)) return json({ error: "Invalid question_number" }, 400);

      const { data: existing } = await supabase
        .from("question_topic_mapping")
        .select("id")
        .eq("paper_id", paper_id)
        .eq("question_number", q)
        .eq("mapping_type", "primary")
        .maybeSingle();

      const { error } = existing?.id
        ? await supabase
            .from("question_topic_mapping")
            .update({ syllabus_topic_id, verified: true })
            .eq("id", existing.id)
        : await supabase.from("question_topic_mapping").insert({
            paper_id,
            question_number: q,
            syllabus_topic_id,
            mapping_type: "primary",
            verified: true,
          });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch {
    return json({ error: "Internal server error" }, 500);
  }
});
