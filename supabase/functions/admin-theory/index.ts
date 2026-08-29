import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "theory-papers";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SESSIONS: Record<string, string> = {
  s: "May/June",
  m: "February/March",
  w: "October/November",
};
const IGCSE_CODES = new Set(["0625", "0972", "0654", "0653"]);
const FILE_RE = /^([0-9]{4})_([smw])([0-9]{2})_(qp|ms)_([0-9]{1,2})\.pdf$/i;

const parseName = (filename: string) => {
  const name = (filename ?? "").trim().split("/").pop() ?? "";
  const m = FILE_RE.exec(name);
  if (!m) return null;
  const [, syllabus_code, letter, yy, kindRaw, component] = m;
  const level = IGCSE_CODES.has(syllabus_code)
    ? "IGCSE"
    : Number(component[0]) >= 4
      ? "A2 Level"
      : "AS Level";
  return {
    syllabus_code,
    session: SESSIONS[letter.toLowerCase()] ?? "May/June",
    year: 2000 + Number(yy),
    component,
    paper_code: `${syllabus_code}/${component}`,
    kind: kindRaw.toLowerCase() as "qp" | "ms",
    level,
    slug: `${syllabus_code}_${letter.toLowerCase()}${yy}_${component}`,
  };
};

const decode = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const passcode = Deno.env.get("ADMIN_UPLOAD_PASSCODE");
    if (!passcode) return json({ error: "Admin passcode is not configured" }, 500);

    const body = await req.json();
    if (typeof body?.passcode !== "string" || body.passcode !== passcode) {
      return json({ error: "Invalid passcode" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const action = body.action ?? "list";

    if (action === "list") {
      const { data, error } = await supabase
        .from("theory_papers")
        .select("*")
        .order("year", { ascending: false })
        .order("paper_code", { ascending: true });
      if (error) return json({ error: error.message }, 400);
      return json({ papers: data ?? [] });
    }

    // Upload one PDF; level/session/year/component come from the filename.
    if (action === "upload_pdf") {
      const { filename, data_base64, level_override } = body;
      const parsed = parseName(filename);
      if (!parsed) {
        return json(
          {
            error:
              "Filename must look like 9702_s23_qp_22.pdf or 9702_s23_ms_22.pdf",
          },
          400,
        );
      }
      if (typeof data_base64 !== "string" || !data_base64) {
        return json({ error: "Missing file data" }, 400);
      }

      const bytes = decode(data_base64);
      if (!bytes.byteLength) return json({ error: "Empty file" }, 400);

      const level = typeof level_override === "string" && level_override
        ? level_override
        : parsed.level;
      const storage_path = `${parsed.kind}/${parsed.slug}_${parsed.kind}.pdf`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(storage_path, bytes, { contentType: "application/pdf", upsert: true });
      if (upErr) return json({ error: upErr.message }, 400);

      // Find (or create) the paper this file belongs to, then attach the file.
      const { data: existing } = await supabase
        .from("theory_papers")
        .select("id")
        .eq("syllabus_code", parsed.syllabus_code)
        .eq("session", parsed.session)
        .eq("year", parsed.year)
        .eq("component", parsed.component)
        .maybeSingle();

      const fileField = parsed.kind === "qp" ? "question_storage_path" : "answer_storage_path";

      if (existing?.id) {
        const { error } = await supabase
          .from("theory_papers")
          .update({ [fileField]: storage_path, level })
          .eq("id", existing.id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true, paper_id: existing.id, paired: true, ...parsed, level });
      }

      const { data: inserted, error } = await supabase
        .from("theory_papers")
        .insert({
          level,
          syllabus_code: parsed.syllabus_code,
          paper_code: parsed.paper_code,
          component: parsed.component,
          session: parsed.session,
          year: parsed.year,
          [fileField]: storage_path,
        })
        .select("id")
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, paper_id: inserted.id, paired: false, ...parsed, level });
    }

    if (action === "update_paper") {
      const { paper_id, level, total_questions } = body;
      if (typeof paper_id !== "string") return json({ error: "Invalid paper_id" }, 400);
      const payload: Record<string, unknown> = {};
      if (typeof level === "string" && level) payload.level = level;
      if (Number.isInteger(Number(total_questions))) {
        payload.total_questions = Number(total_questions);
      }
      const { error } = await supabase.from("theory_papers").update(payload).eq("id", paper_id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "delete_paper") {
      const { paper_id } = body;
      if (typeof paper_id !== "string") return json({ error: "Invalid paper_id" }, 400);
      const { data: row } = await supabase
        .from("theory_papers")
        .select("question_storage_path, answer_storage_path")
        .eq("id", paper_id)
        .maybeSingle();
      const paths = [row?.question_storage_path, row?.answer_storage_path].filter(
        (p): p is string => typeof p === "string" && !!p,
      );
      if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
      const { error } = await supabase.from("theory_papers").delete().eq("id", paper_id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "list_explanations") {
      const { paper_id } = body;
      if (typeof paper_id !== "string") return json({ error: "Invalid paper_id" }, 400);
      const { data, error } = await supabase
        .from("theory_explanations")
        .select("*")
        .eq("theory_paper_id", paper_id)
        .order("question_number", { ascending: true })
        .order("order_index", { ascending: true });
      if (error) return json({ error: error.message }, 400);

      const paths = (data ?? [])
        .map((r) => r.image_path)
        .filter((p): p is string => typeof p === "string" && !!p);
      const signedByPath = new Map<string, string>();
      if (paths.length) {
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrls(paths, 60 * 60);
        for (const s of signed ?? []) {
          if (s.path && s.signedUrl) signedByPath.set(s.path, s.signedUrl);
        }
      }
      return json({
        explanations: (data ?? []).map((r) => ({
          ...r,
          image_url: r.image_path ? signedByPath.get(r.image_path) ?? null : null,
        })),
      });
    }

    // Create or update one explanation part (optionally with an image).
    if (action === "save_explanation") {
      const {
        id,
        paper_id,
        question_number,
        part_label,
        order_index,
        explanation,
        image_base64,
        image_content_type,
      } = body;
      if (typeof paper_id !== "string") return json({ error: "Invalid paper_id" }, 400);
      const q = Number(question_number);
      if (!Number.isInteger(q) || q < 1 || q > 60) {
        return json({ error: "question_number must be 1-60" }, 400);
      }

      let image_path: string | undefined;
      if (typeof image_base64 === "string" && image_base64) {
        const type = typeof image_content_type === "string" && image_content_type.startsWith("image/")
          ? image_content_type
          : "image/png";
        const ext = type === "image/jpeg" ? "jpg" : type === "image/webp" ? "webp" : "png";
        const safeLabel = String(part_label ?? "").replace(/[^a-zA-Z0-9]/g, "") || "main";
        image_path = `explanations/${paper_id}/${q}_${safeLabel}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(image_path, decode(image_base64), { contentType: type, upsert: true });
        if (upErr) return json({ error: upErr.message }, 400);
      }

      const payload: Record<string, unknown> = {
        theory_paper_id: paper_id,
        question_number: q,
        part_label: typeof part_label === "string" ? part_label : "",
        order_index: Number.isInteger(Number(order_index)) ? Number(order_index) : 0,
        explanation: explanation ?? null,
      };
      if (image_path) payload.image_path = image_path;
      if (body.remove_image === true) payload.image_path = null;

      const { error } = typeof id === "string" && id
        ? await supabase.from("theory_explanations").update(payload).eq("id", id)
        : await supabase.from("theory_explanations").insert(payload);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "delete_explanation") {
      const { id } = body;
      if (typeof id !== "string") return json({ error: "Invalid id" }, 400);
      const { data: row } = await supabase
        .from("theory_explanations")
        .select("image_path")
        .eq("id", id)
        .maybeSingle();
      if (row?.image_path) await supabase.storage.from(BUCKET).remove([row.image_path as string]);
      const { error } = await supabase.from("theory_explanations").delete().eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch {
    return json({ error: "Internal server error" }, 500);
  }
});
