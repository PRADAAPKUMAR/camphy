import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const getSupabase = () => import("@/integrations/supabase/client").then((m) => m.supabase);

const LEVEL_ORDER = ["IGCSE", "AS Level", "A2 Level"];

/** Topical MCQ: every topic-wise MCQ set, played one question at a time. */
const TopicalMcqPage = () => {
  const navigate = useNavigate();

  const { data: papers, isLoading } = useQuery({
    queryKey: ["topical-mcq-all"],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("topicwise_mcq_papers")
        .select("id, topic, level, total_questions, timer_minutes")
        .order("topic");
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const byLevel = useMemo(() => {
    const groups: Record<string, NonNullable<typeof papers>> = {};
    (papers ?? []).forEach((p) => {
      (groups[p.level] ??= []).push(p);
    });
    return Object.entries(groups).sort(
      ([a], [b]) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b),
    );
  }, [papers]);

  return (
    <div className="relative min-h-screen bg-background bg-grid">
      <PhysicsBackground />

      <header className="relative border-b border-border/40">
        <div className="container py-10">
          <Breadcrumb className="mb-5">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/topic-practice">Topic Practice</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Topical MCQ</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/topic-practice")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Topical MCQ</h1>
              <p className="text-sm text-muted-foreground">
                One question at a time with instant marking, per-topic
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
        ) : byLevel.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Target className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No topical MCQ sets available yet.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {byLevel.map(([level, list]) => (
              <section key={level}>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {level}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((paper) => (
                    <div
                      key={paper.id}
                      className="glass-card-hover group cursor-pointer rounded-xl p-5"
                      onClick={() => navigate(`/topical-mcq/${paper.id}`)}
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                          <LayoutGrid className="h-4 w-4" />
                        </div>
                        <h3 className="text-base font-semibold">{paper.topic}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="bg-secondary/60 text-xs font-medium">
                          {paper.total_questions} Qs
                        </Badge>
                        <Badge variant="secondary" className="bg-secondary/60 text-xs font-medium">
                          Question mode
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TopicalMcqPage;
