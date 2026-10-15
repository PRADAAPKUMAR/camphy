import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { level } = await req.json();
    if (typeof level !== "string" || !level.trim()) return json({ error: "Invalid level" }, 400);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: papers, error: paperError } = await supabase
      .from("theory_papers")
      .select("id, paper_code, session, year, question_storage_path")
      .ilike("level", level.trim())
      .not("question_storage_path", "is", null);
    if (paperError) return json({ error: paperError.message }, 400);
    const paperIds = (papers ?? []).map((paper) => paper.id);
    if (!paperIds.length) return json({ questions: [], topics: [] });

    const { data: mappings, error: mappingError } = await supabase
      .from("theory_question_mappings")
      .select("id, theory_paper_id, question_number, start_page, end_page, shared_page_warning, theory_question_topics(syllabus_topics(id, topic_code, topic_name))")
      .in("theory_paper_id", paperIds)
      .eq("verified", true)
      .order("question_number");
    if (mappingError) return json({ error: mappingError.message }, 400);

    const paths = [...new Set((papers ?? []).map((paper) => paper.question_storage_path).filter(Boolean))] as string[];
    const { data: signed, error: signedError } = await supabase.storage.from("theory-papers").createSignedUrls(paths, 60 * 60 * 3);
    if (signedError) return json({ error: signedError.message }, 400);
    const urls = new Map((signed ?? []).map((item) => [item.path, item.signedUrl]));
    const paperMap = new Map((papers ?? []).map((paper) => [paper.id, paper]));
    const topicMap = new Map<string, { id: string; topic_code: string; topic_name: string }>();
    const questions = (mappings ?? []).flatMap((mapping) => {
      const paper = paperMap.get(mapping.theory_paper_id);
      const topics = (mapping.theory_question_topics ?? []).flatMap((link: any) => link.syllabus_topics ? [link.syllabus_topics] : []);
      topics.forEach((topic: any) => topicMap.set(topic.id, topic));
      const question_url = paper?.question_storage_path ? urls.get(paper.question_storage_path) : null;
      return paper && question_url && topics.length ? [{
        mapping_id: mapping.id,
        paper_id: paper.id,
        question_number: mapping.question_number,
        start_page: mapping.start_page,
        end_page: mapping.end_page,
        shared_page_warning: mapping.shared_page_warning,
        paper_code: paper.paper_code,
        session: paper.session,
        year: paper.year,
        question_url,
        topics,
      }] : [];
    });
    return json({ questions, topics: [...topicMap.values()].sort((a, b) => a.topic_code.localeCompare(b.topic_code, undefined, { numeric: true })) });
  } catch {
    return json({ error: "Internal server error" }, 500);
  }
});