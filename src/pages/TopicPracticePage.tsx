import GlassIcon from "@/components/GlassIcon";
import { useTileTransition } from "@/hooks/use-tile-transition";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Target, ArrowLeft } from "lucide-react";
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
import { BANK_LEVELS, fetchBankTopics } from "@/lib/topical-bank";
import { gradeFromLevel, GRADES, normalizeGradeLabel } from "@/lib/grades";

const getSupabase = () => import("@/integrations/supabase/client").then(m => m.supabase);

const levelOrder = ["IGCSE", "AS Level", "A Level"];

const levelIcons: Record<string, React.ReactNode> = {
  IGCSE: <GlassIcon name="microscope" tone="blue" />,
  "AS Level": <GlassIcon name="flask" tone="amber" />,
  "A Level": <GlassIcon name="atom" tone="green" />,
};

const TopicPracticePage = () => {
  const navigate = useNavigate();
  const { tileProps } = useTileTransition();

  const { data: mcqLevels, isLoading: mcqLoading } = useQuery({
    queryKey: ["question-mode-topic-counts"],
    queryFn: async () => Object.fromEntries(await Promise.all(
      BANK_LEVELS.map(async (level) => [level, (await fetchBankTopics(level)).length] as const),
    )),
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
      data.forEach((r) => {
        const grade = gradeFromLevel(r.level);
        const level = grade ? GRADES[grade].practiceLevel : r.level;
        counts[level] = (counts[level] || 0) + 1;
      });
      return counts;
    },
  });

  const isLoading = mcqLoading || theoryLoading;

  const levels = Array.from(
    new Set([
      ...Object.keys(mcqLevels || {}),
      ...Object.keys(theoryLevels || {}),
    ])
  ).sort((a, b) => levelOrder.indexOf(normalizeGradeLabel(a)) - levelOrder.indexOf(normalizeGradeLabel(b)));

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
            <div
              className="glass-card-hover group cursor-pointer rounded-2xl p-7"
              {...tileProps("/topical-mcq")}
            >
              <div className="mb-2 shrink-0">
                <GlassIcon name="practice" tone="cyan" />
              </div>
              <h3 className="text-xl font-bold mb-1">Topical MCQ</h3>
              <p className="text-sm text-muted-foreground">
                One question at a time with instant marking
              </p>
            </div>
            {levels.map((lvl) => (
              <div
                key={lvl}
                className="glass-card-hover group cursor-pointer rounded-2xl p-7"
                {...tileProps(`/topic-practice/${encodeURIComponent(lvl)}`)}
              >
                <div className="mb-2 shrink-0">
                  {levelIcons[normalizeGradeLabel(lvl)] || <Target className="h-5 w-5" />}
                </div>
                <h3 className="text-xl font-bold mb-1">{normalizeGradeLabel(lvl)}</h3>
                <p className="text-sm text-muted-foreground">
                  {mcqLevels?.[lvl] ?? 0} MCQ topics · {theoryLevels?.[lvl] ?? 0} Theory
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
