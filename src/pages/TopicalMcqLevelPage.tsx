import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, LayoutGrid, Target } from "lucide-react";
import PhysicsBackground from "@/components/PhysicsBackground";
import { Badge } from "@/components/ui/badge";
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
import { fetchBankTopics, slugifyTopic } from "@/lib/topical-bank";
import { displayLevel } from "@/lib/syllabus";

/** Topics of one level's past-paper MCQ bank. */
const TopicalMcqLevelPage = () => {
  const { level = "" } = useParams<{ level: string }>();
  const navigate = useNavigate();

  const { data: topics, isLoading } = useQuery({
    queryKey: ["topical-bank-topics", level],
    queryFn: () => fetchBankTopics(level),
    enabled: !!level,
    staleTime: 30 * 60 * 1000,
  });

  return (
    <div className="relative min-h-screen bg-background bg-grid">
      <PhysicsBackground />

      <header className="relative border-b border-border/40">
        <div className="container py-10">
          <Breadcrumb className="mb-5">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/topical-mcq">Topical MCQ</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{displayLevel(level)}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/topical-mcq")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                {displayLevel(level)} Topical MCQ
              </h1>
              <p className="text-sm text-muted-foreground">
                Questions grouped from mapped past-paper MCQs
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container relative py-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card rounded-xl p-5">
                <Skeleton className="mb-3 h-9 w-9 rounded-lg" />
                <Skeleton className="mb-2 h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : !topics?.length ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Target className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">
              No mapped MCQ questions for this level yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => (
              <button
                key={topic.name}
                type="button"
                className="glass-card-hover group rounded-xl p-5 text-left"
                onClick={() =>
                  navigate(
                    `/topical-mcq/${encodeURIComponent(level)}/${slugifyTopic(topic.name)}`,
                  )
                }
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                    <LayoutGrid className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-semibold">{topic.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-secondary/60 text-xs font-medium">
                    {topic.questions.length} Qs
                  </Badge>
                  {topic.subtopics.length > 0 && (
                    <Badge variant="secondary" className="bg-secondary/60 text-xs font-medium">
                      {topic.subtopics.length} subtopics
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TopicalMcqLevelPage;
