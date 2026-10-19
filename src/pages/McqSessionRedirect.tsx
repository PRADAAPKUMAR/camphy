import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { gradeFromLevel, gradeSectionPath, GRADES } from "@/lib/grades";
import { fetchBankTopics, slugifyTopic } from "@/lib/topical-bank";

/** Keep bookmarked PDF-session URLs usable after retiring the PDF player. */
const McqSessionRedirect = ({ topical = false }: { topical?: boolean }) => {
  const { paperId } = useParams<{ paperId: string }>();
  const { search, hash } = useLocation();
  const destination = useQuery({
    queryKey: ["legacy-mcq-destination", paperId],
    enabled: topical && !!paperId,
    retry: false,
    queryFn: async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: paper, error } = await supabase
        .from("topicwise_mcq_papers")
        .select("level, topic")
        .eq("id", paperId!)
        .single();
      if (error || !paper) throw new Error("Topic not found");
      const grade = gradeFromLevel(paper.level);
      const level = grade ? GRADES[grade].mappedTopicalLevel : undefined;
      if (!level) return grade ? gradeSectionPath(grade, "practice") : "/topical-mcq";
      const topics = await fetchBankTopics(level);
      const match = topics.find((topic) => slugifyTopic(topic.name) === slugifyTopic(paper.topic));
      const base = `/topical-mcq/${encodeURIComponent(level)}`;
      return match ? `${base}/${slugifyTopic(match.name)}` : base;
    },
  });

  if (!topical) return <Navigate to={`/question-mode/${paperId}${search}${hash}`} replace />;
  if (destination.isError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p>This MCQ set is no longer available. Choose a topic to practise in question mode.</p>
        <Button asChild><Link to="/topical-mcq">Browse MCQ topics</Link></Button>
      </main>
    );
  }
  if (!destination.data) return <Skeleton className="m-6 h-40 rounded-xl" aria-label="Opening question mode" />;
  return <Navigate to={destination.data} replace />;
};

export default McqSessionRedirect;
