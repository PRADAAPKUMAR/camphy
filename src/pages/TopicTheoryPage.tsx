import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const getSupabase = () => import("@/integrations/supabase/client").then(m => m.supabase);

const TopicTheoryPage = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();

  const { data: question, isLoading } = useQuery({
    queryKey: ["topicwise_theory_question", questionId],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("topicwise_theory_questions")
        .select("*")
        .eq("id", questionId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!questionId,
  });

  // Convert Google Drive link to embeddable preview
  const getEmbedUrl = (url: string) =>
    url.replace(/\/file\/d\/([^/]+).*/, "/file/d/$1/preview");

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <div className="flex items-center gap-3 border-b border-border/40 px-4 py-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="flex-1" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-destructive font-medium">Question not found</p>
        <Button variant="outline" onClick={() => navigate("/topic-practice")}>
          Back to Topics
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border/40 px-4 py-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/topic-practice">Topics</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/topic-practice/${encodeURIComponent(question.level)}`}>{question.level}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{question.topic}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => window.open(question.answer_pdf_url, "_blank")}
        >
          <ExternalLink className="h-4 w-4" /> View Answer Key
        </Button>
      </header>
      <div className="flex-1 w-full overflow-auto">
        <iframe
          src={getEmbedUrl(question.question_pdf_url)}
          className="h-full w-full border-0"
          title={`${question.topic} — Questions`}
          allow="autoplay"
          sandbox="allow-scripts allow-same-origin allow-popups"
          style={{ minHeight: "100%", minWidth: "100%" }}
        />
      </div>
    </div>
  );
};

export default TopicTheoryPage;
