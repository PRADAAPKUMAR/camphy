import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, Target, FileText, ArrowLeft } from "lucide-react";
import PhysicsBackground from "@/components/PhysicsBackground";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

const getSupabase = () => import("@/integrations/supabase/client").then(m => m.supabase);

const levelOrder = ["IGCSE", "AS Level", "A2 Level"];

const levelIcons: Record<string, React.ReactNode> = {
  IGCSE: <FlaskConical className="h-5 w-5" />,
  "AS Level": <Target className="h-5 w-5" />,
  "A2 Level": <FileText className="h-5 w-5" />,
};

const TopicPracticePage = () => {
  const navigate = useNavigate();

  const { data: mcqLevels, isLoading: mcqLoading } = useQuery({
    queryKey: ["topicwise_mcq_levels"],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("topicwise_mcq_papers")
        .select("level");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((r: any) => { counts[r.level] = (counts[r.level] || 0) + 1; });
      return counts;
    },
  });

  const { data: theoryLevels, isLoading: theoryLoading } = useQuery({
    queryKey: ["topicwise_theory_levels"],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("topicwise_theory_questions")
        .select("level");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((r: any) => { counts[r.level] = (counts[r.level] || 0) + 1; });
      return counts;
    },
  });

  const isLoading = mcqLoading || theoryLoading;

  const levels = Array.from(
    new Set([
      ...Object.keys(mcqLevels || {}),
      ...Object.keys(theoryLevels || {}),
    ])
  ).sort((a, b) => levelOrder.indexOf(a) - levelOrder.indexOf(b));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background bg-grid relative">
        <PhysicsBackground />
        <header className="relative border-b border-border/40">
          <div className="container py-10">
            <Skeleton className="h-4 w-40 mb-5" />
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </header>
        <main className="container relative py-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-7 flex flex-col gap-4">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-4 w-full" />
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
                <BreadcrumbPage>Topic-wise Practice</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Topic-wise Practice</h1>
              <p className="text-sm text-muted-foreground">Practice MCQ and theory questions organized by topic</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container relative py-8">
        {levels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Target className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">No topic-wise questions available yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {levels.map((lvl) => (
              <div
                key={lvl}
                className="glass-card-hover group cursor-pointer rounded-2xl p-7"
                onClick={() => navigate(`/topic-practice/${encodeURIComponent(lvl)}`)}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary mb-4 transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:glow-sm">
                  {levelIcons[lvl] || <Target className="h-5 w-5" />}
                </div>
                <h3 className="text-xl font-bold mb-1">{lvl}</h3>
                <p className="text-sm text-muted-foreground">
                  {mcqLevels?.[lvl] ?? 0} MCQ · {theoryLevels?.[lvl] ?? 0} Theory
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TopicPracticePage;
