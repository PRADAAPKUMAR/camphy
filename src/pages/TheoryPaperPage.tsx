import { lazy, Suspense, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import TheoryExplanationDialog, {
  type TheoryExplanationPart,
} from "@/components/theory/TheoryExplanationDialog";

const PDFViewer = lazy(() => import("@/components/PDFViewer"));
const getSupabase = () => import("@/integrations/supabase/client").then((m) => m.supabase);

interface TheoryPaperPayload {
  paper: {
    id: string;
    level: string;
    paper_code: string;
    session: string;
    year: number;
    total_questions: number;
  };
  question_url: string | null;
  answer_url: string | null;
  explanations: TheoryExplanationPart[];
}

const TheoryPaperPage = () => {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["theory_paper_payload", paperId],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase.functions.invoke("get-theory-paper", {
        body: { theory_paper_id: paperId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as TheoryPaperPayload;
    },
    enabled: !!paperId,
    staleTime: 60 * 60 * 1000,
  });

  const partsByQuestion = useMemo(() => {
    const map = new Map<number, TheoryExplanationPart[]>();
    (data?.explanations ?? []).forEach((part) => {
      const list = map.get(part.question_number) ?? [];
      list.push(part);
      map.set(part.question_number, list);
    });
    return map;
  }, [data]);

  const questions = useMemo(() => {
    const total = data?.paper?.total_questions ?? 12;
    return Array.from({ length: Math.max(total, partsByQuestion.size) }, (_, i) => i + 1);
  }, [data, partsByQuestion]);

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <div className="flex items-center gap-3 border-b border-border/40 px-4 py-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-5 w-56" />
        </div>
        <Skeleton className="flex-1" />
      </div>
    );
  }

  if (!data?.paper) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="font-medium text-destructive">Paper not found</p>
        <Button variant="outline" onClick={() => navigate("/theory-papers")}>
          Back to theory papers
        </Button>
      </div>
    );
  }

  const { paper, question_url, answer_url } = data;

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/theory-papers">Theory</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/theory-papers/${encodeURIComponent(paper.level)}`}>
                    {paper.level}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {paper.paper_code} · {paper.session} {paper.year}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <span className="truncate font-mono text-sm font-semibold sm:hidden">
            {paper.paper_code}
          </span>
        </div>
        <Button variant="outline" size="sm" className="gap-2" disabled={!answer_url} asChild={!!answer_url}>
          {answer_url ? (
            <a href={answer_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" /> Official answer key
            </a>
          ) : (
            <span>
              <ExternalLink className="h-4 w-4" /> Answer key pending
            </span>
          )}
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div
          className={`min-h-0 flex-1 [contain:paint] [isolation:isolate] lg:w-[78%] ${
            openQuestion !== null ? "invisible" : ""
          }`}
        >
          {question_url ? (
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <PDFViewer url={question_url} />
            </Suspense>
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <p className="text-sm text-muted-foreground">
                The question paper PDF for this session hasn't been uploaded yet.
              </p>
            </div>
          )}
        </div>

        <aside className="max-h-[45vh] shrink-0 overflow-y-auto border-t border-border/40 p-4 lg:max-h-none lg:w-[22%] lg:border-l lg:border-t-0">
          <h2 className="mb-3 text-sm font-semibold">Explanations</h2>
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-2">
            {questions.map((q) => {
              const has = (partsByQuestion.get(q)?.length ?? 0) > 0;
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => setOpenQuestion(q)}
                  className={`flex items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                    has
                      ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                      : "border-border/40 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <Lightbulb className="h-3.5 w-3.5" /> Q{q}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Highlighted questions already have a worked explanation.
          </p>
        </aside>
      </div>

      <TheoryExplanationDialog
        open={openQuestion !== null}
        onOpenChange={(open) => !open && setOpenQuestion(null)}
        question={openQuestion}
        parts={openQuestion ? partsByQuestion.get(openQuestion) ?? [] : []}
      />
    </div>
  );
};

export default TheoryPaperPage;
