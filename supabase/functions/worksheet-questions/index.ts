import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "question-images";
const TTL_SECONDS = 60 * 30;
const MAX_COUNT = 40;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface Ref {
  paper_id: string;
  question_number: number;
}

/** Fisher-Yates on a copy. */
const shuffled = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** PostgREST caps rows at 1000 — page through everything. */
const fetchAll = async (build: (from: number, to: number) => any): Promise<any[]> => {
  const PAGE = 1000;
  const out: any[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const level = typeof body.level === "string" ? body.level : null;
    const source = typeof body.source === "string" ? body.source : "random";
    const paperId = typeof body.paper_id === "string" ? body.paper_id : null;
    const topicIds: string[] = Array.isArray(body.topic_ids)
      ? body.topic_ids.filter((t: unknown) => typeof t === "string")
      : [];
    const refs: Ref[] = Array.isArray(body.refs)
      ? body.refs
          .filter(
            (r: any) =>
              r && typeof r.paper_id === "string" && Number.isInteger(Number(r.question_number)),
          )
          .map((r: any) => ({ paper_id: r.paper_id, question_number: Number(r.question_number) }))
      : [];
    const requested = Math.min(MAX_COUNT, Math.max(1, Number(body.count) || 20));
    const shuffle = body.shuffle === true;
    const keepOrder = source === "paper" && !shuffle;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // --- papers in scope -------------------------------------------------
    let papersQuery = supabase.from("papers").select("id, level, paper_code, year, session");
    if (paperId) papersQuery = papersQuery.eq("id", paperId);
    else if (level) papersQuery = papersQuery.eq("level", level);
    const { data: papers, error: papersError } = await papersQuery;
    if (papersError) return json({ error: papersError.message }, 500);
    if (!papers?.length) return json({ pool_size: 0, items: [], excluded: [] });

    const paperById = new Map(papers.map((p) => [p.id as string, p]));
    const paperIds = papers.map((p) => p.id as string);

    // --- images (authoritative availability) -----------------------------
    const images = await fetchAll((from, to) =>
      supabase
        .from("question_images")
        .select("paper_id, question_number, storage_path")
        .in("paper_id", paperIds)
        .order("paper_id")
        .order("question_number")
        .range(from, to),
    );

    const pathOf = new Map<string, string>();
    for (const row of images) {
      pathOf.set(`${row.paper_id}:${row.question_number}`, row.storage_path as string);
    }

    // --- answer keys ------------------------------------------------------
    const keys = await fetchAll((from, to) =>
      supabase.from("answer_keys").select("*").in("paper_id", paperIds).order("paper_id").range(from, to),
    );
    const answerOf = new Map<string, string>();
    for (const row of keys) {
      for (let q = 1; q <= 40; q++) {
        const v = (row as Record<string, unknown>)[`q${q}`];
        if (typeof v === "string" && v.trim()) {
          answerOf.set(`${row.paper_id}:${q}`, v.trim().toUpperCase());
        }
      }
    }

    // --- topic mapping ----------------------------------------------------
    let allowedTopicIds: Set<string> | null = null;
    const topicOf = new Map<string, string>();
    if (source === "topic" && topicIds.length) {
      // include descendants of the chosen topics (topic -> subtopic -> leaf)
      const expanded = new Set(topicIds);
      let frontier = topicIds;
      for (let depth = 0; depth < 3 && frontier.length; depth++) {
        const { data: children } = await supabase
          .from("syllabus_topics")
          .select("id")
          .in("parent_topic_id", frontier);
        frontier = (children ?? []).map((c) => c.id as string).filter((id) => !expanded.has(id));
        frontier.forEach((id) => expanded.add(id));
      }
      allowedTopicIds = expanded;
    }

    {
      // Mappings are loaded for every source so the preview can show a topic
      // breakdown; only `topic` mode filters the pool by them.
      const mappings = await fetchAll((from, to) =>
        supabase
          .from("question_topic_mapping")
          .select("paper_id, question_number, syllabus_topic_id, mapping_type")
          .in("paper_id", paperIds)
          .eq("verified", true)
          .order("paper_id")
          .order("question_number")
          .range(from, to),
      );
      for (const m of mappings) {
        const k = `${m.paper_id}:${m.question_number}`;
        if (m.mapping_type === "primary" || !topicOf.has(k)) {
          if (!allowedTopicIds || allowedTopicIds.has(m.syllabus_topic_id as string)) {
            topicOf.set(k, m.syllabus_topic_id as string);
          }
        }
      }
    }

    // --- build the eligible pool -----------------------------------------
    let candidates: Ref[];
    const excluded: { paper_code: string; question_number: number; reason: string }[] = [];

    if (source === "mistakes") {
      candidates = [];
      for (const r of refs) {
        if (!paperById.has(r.paper_id)) continue;
        const k = `${r.paper_id}:${r.question_number}`;
        if (!pathOf.has(k)) {
          excluded.push({
            paper_code: String(paperById.get(r.paper_id)?.paper_code ?? ""),
            question_number: r.question_number,
            reason: "no question image",
          });
          continue;
        }
        if (!answerOf.has(k)) {
          excluded.push({
            paper_code: String(paperById.get(r.paper_id)?.paper_code ?? ""),
            question_number: r.question_number,
            reason: "no answer key entry",
          });
          continue;
        }
        candidates.push(r);
      }
    } else {
      candidates = [];
      for (const row of images) {
        const ref = { paper_id: row.paper_id as string, question_number: row.question_number as number };
        const k = `${ref.paper_id}:${ref.question_number}`;
        if (!answerOf.has(k)) {
          if (source === "paper") {
            excluded.push({
              paper_code: String(paperById.get(ref.paper_id)?.paper_code ?? ""),
              question_number: ref.question_number,
              reason: "no answer key entry",
            });
          }
          continue;
        }
        if (allowedTopicIds && !topicOf.has(k)) continue;
        candidates.push(ref);
      }
    }

    // dedupe
    const seen = new Set<string>();
    candidates = candidates.filter((c) => {
      const k = `${c.paper_id}:${c.question_number}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const poolSize = candidates.length;
    let picked: Ref[];
    if (keepOrder && requested >= poolSize) {
      picked = [...candidates].sort((a, b) => a.question_number - b.question_number);
    } else {
      picked = shuffled(candidates).slice(0, requested);
      if (keepOrder) picked.sort((a, b) => a.question_number - b.question_number);
      else if (!shuffle) {
        picked.sort(
          (a, b) =>
            a.paper_id.localeCompare(b.paper_id) || a.question_number - b.question_number,
        );
      }
    }

    if (!picked.length) return json({ pool_size: poolSize, items: [], excluded });

    // --- sign the images --------------------------------------------------
    const paths = picked.map((p) => pathOf.get(`${p.paper_id}:${p.question_number}`)!);
    const { data: signed, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, TTL_SECONDS);
    if (signError) return json({ error: signError.message }, 500);
    const urlOf = new Map((signed ?? []).map((s) => [s.path ?? "", s.signedUrl as string | null]));

    // --- topic labels for the picked set ----------------------------------
    const neededTopicIds = Array.from(
      new Set(picked.map((p) => topicOf.get(`${p.paper_id}:${p.question_number}`)).filter(Boolean)),
    ) as string[];
    const topicName = new Map<string, string>();
    if (neededTopicIds.length) {
      const { data: topics } = await supabase
        .from("syllabus_topics")
        .select("id, topic_name, topic_code")
        .in("id", neededTopicIds);
      for (const t of topics ?? []) topicName.set(t.id as string, String(t.topic_name));
    }

    const items = picked.map((p, i) => {
      const k = `${p.paper_id}:${p.question_number}`;
      const paper = paperById.get(p.paper_id)!;
      const topicId = topicOf.get(k) ?? null;
      return {
        worksheet_number: i + 1,
        paper_id: p.paper_id,
        paper_code: paper.paper_code,
        year: paper.year,
        session: paper.session,
        level: paper.level,
        question_number: p.question_number,
        correct_answer: answerOf.get(k) ?? null,
        topic_id: topicId,
        topic_name: topicId ? topicName.get(topicId) ?? null : null,
        image_url: urlOf.get(pathOf.get(k)!) ?? null,
      };
    });

    const broken = items.filter((it) => !it.image_url);
    for (const b of broken) {
      excluded.push({
        paper_code: String(b.paper_code),
        question_number: b.question_number,
        reason: "image could not be signed",
      });
    }

    return json({
      pool_size: poolSize,
      requested,
      items,
      excluded,
      expires_in: TTL_SECONDS,
    });
  } catch (e) {
    return json({ error: "Internal server error" }, 500);
  }
});
