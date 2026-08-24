import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, GraduationCap, Atom, Target } from "lucide-react";
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
import { fetchBankTopics } from "@/lib/topical-bank";

const TILES = [
  { level: "IGCSE", label: "IGCSE", icon: Atom, blurb: "0625 multiple-choice past-paper questions" },
  {
    level: "AS LEVEL",
    label: "AS Level",
    icon: GraduationCap,
    blurb: "9702 multiple-choice past-paper questions",
  },
] as const;

/** Topical MCQ: past-paper MCQs grouped by mapped syllabus topic, per level. */
const TopicalMcqPage = () => {
  const navigate = useNavigate();

  const stats = useQuery({
    queryKey: ["topical-bank-stats"],
    queryFn: async () => {
      const entries = await Promise.all(
        TILES.map(async (t) => {
          const topics = await fetchBankTopics(t.level);
          return [
            t.level,
            {
              topics: topics.length,
              questions: topics.reduce((n, x) => n + x.questions.length, 0),
            },
          ] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, { topics: number; questions: number }>;
    },
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
                Past-paper MCQs sorted by syllabus topic, one question at a time
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container relative py-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {TILES.map(({ level, label, icon: Icon, blurb }) => {
            const stat = stats.data?.[level];
            return (
              <button
                key={level}
                type="button"
                onClick={() => navigate(`/topical-mcq/${encodeURIComponent(level)}`)}
                className="glass-card-hover group rounded-2xl p-6 text-left"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold">{label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {stats.isLoading ? (
                    <>
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-24" />
                    </>
                  ) : stat ? (
                    <>
                      <Badge variant="secondary" className="bg-secondary/60 text-xs font-medium">
                        {stat.topics} topics
                      </Badge>
                      <Badge variant="secondary" className="bg-secondary/60 text-xs font-medium">
                        {stat.questions} questions
                      </Badge>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      <Target className="mr-1 h-3 w-3" /> Coming soon
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default TopicalMcqPage;
