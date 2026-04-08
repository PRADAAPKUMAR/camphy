import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Target, ScrollText, FileText, ArrowLeft } from "lucide-react";
import PhysicsBackground from "@/components/PhysicsBackground";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const getSupabase = () => import("@/integrations/supabase/client").then(m => m.supabase);

const TopicLevelPage = () => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const decodedLevel = decodeURIComponent(level || "");

  const { data: mcqPapers, isLoading: mcqLoading } = useQuery({
    queryKey: ["topicwise_mcq", decodedLevel],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("topicwise_mcq_papers")
        .select("*")
        .eq("level", decodedLevel)
        .order("topic");
      if (error) throw error;
      return data;
    },
    enabled: !!decodedLevel,
  });

  const { data: theoryQuestions, isLoading: theoryLoading } = useQuery({
    queryKey: ["topicwise_theory", decodedLevel],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("topicwise_theory_questions")
        .select("*")
        .eq("level", decodedLevel)
        .order("topic");
      if (error) throw error;
      return data;
    },
    enabled: !!decodedLevel,
  });

  const isLoading = mcqLoading || theoryLoading;

  const mcqTopics = useMemo(() => {
    if (!mcqPapers) return [];
    return [...new Set(mcqPapers.map((p) => p.topic))].sort();
  }, [mcqPapers]);

  const theoryTopics = useMemo(() => {
    if (!theoryQuestions) return [];
    return [...new Set(theoryQuestions.map((q) => q.topic))].sort();
  }, [theoryQuestions]);

  const hasMCQ = mcqTopics.length > 0;
  const hasTheory = theoryTopics.length > 0;
  const defaultTab = hasMCQ ? "mcq" : "theory";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background bg-grid relative">
        <PhysicsBackground />
        <header className="relative border-b border-border/40">
          <div className="container py-10">
            <Skeleton className="h-4 w-40 mb-5" />
            <Skeleton className="h-10 w-64 mb-2" />
          </div>
        </header>
        <main className="container relative py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card rounded-xl p-5">
                <Skeleton className="h-9 w-9 rounded-lg mb-3" />
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid relative">
      <PhysicsBackground />

      <header className="relative border-b border-border/40">
        <div className="container py-10">
          <Breadcrumb className="mb-5">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/topic-practice">Topic Practice</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{decodedLevel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/topic-practice")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{decodedLevel} — Topic Practice</h1>
              <p className="text-sm text-muted-foreground">
                {mcqTopics.length} MCQ topics · {theoryTopics.length} Theory topics
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container relative py-8">
        {!hasMCQ && !hasTheory ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Target className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">No topics available for this level yet.</p>
          </div>
        ) : (
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="mb-6 bg-muted/50 p-1.5 rounded-lg">
              {hasMCQ && (
                <TabsTrigger value="mcq" className="px-6 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                  MCQ Practice
                </TabsTrigger>
              )}
              {hasTheory && (
                <TabsTrigger value="theory" className="px-6 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                  Theory Questions
                </TabsTrigger>
              )}
            </TabsList>

            {hasMCQ && (
              <TabsContent value="mcq">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {mcqPapers?.map((paper) => (
                    <div
                      key={paper.id}
                      className="glass-card-hover group cursor-pointer rounded-xl p-5"
                      onClick={() => navigate(`/topic-exam/${paper.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                          <ScrollText className="h-4 w-4" />
                        </div>
                        <h3 className="text-base font-semibold">{paper.topic}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="font-medium text-xs bg-secondary/60">
                          {paper.total_questions} Qs
                        </Badge>
                        <Badge variant="secondary" className="font-medium text-xs bg-secondary/60">
                          {paper.timer_minutes} min
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}

            {hasTheory && (
              <TabsContent value="theory">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {theoryQuestions?.map((q) => (
                    <div
                      key={q.id}
                      className="glass-card-hover group cursor-pointer rounded-xl p-5"
                      onClick={() => navigate(`/topic-theory/${q.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 text-accent transition-all group-hover:bg-accent group-hover:text-accent-foreground">
                          <FileText className="h-4 w-4" />
                        </div>
                        <h3 className="text-base font-semibold">{q.topic}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default TopicLevelPage;
