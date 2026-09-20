import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { compareSessions } from "@/lib/exam-sessions";
import { gradeFromLevel, gradePath } from "@/lib/grades";
import { useSyncGrade } from "@/hooks/use-sync-grade";

const getSupabase = () => import("@/integrations/supabase/client").then((m) => m.supabase);

const TheoryLevelPage = () => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const decodedLevel = decodeURIComponent(level ?? "");
  const grade = gradeFromLevel(decodedLevel);
  useSyncGrade(decodedLevel);

  const { data: papers, isLoading } = useQuery({
    queryKey: ["theory_papers", decodedLevel],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("theory_papers")
        .select("*")
        .ilike("level", decodedLevel);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!decodedLevel,
  });

  const years = useMemo(
    () => [...new Set((papers ?? []).map((paper) => paper.year))].sort((a, b) => b - a),
    [papers],
  );

  const papersByYearAndSeries = useMemo(() => {
    const grouped = new Map<number, Map<string, typeof papers>>();
    (papers ?? []).forEach((paper) => {
      const yearGroup = grouped.get(paper.year) ?? new Map<string, typeof papers>();
      const seriesPapers = yearGroup.get(paper.session) ?? [];
      seriesPapers.push(paper);
      yearGroup.set(paper.session, seriesPapers);
      grouped.set(paper.year, yearGroup);
    });
    return grouped;
  }, [papers]);

  return (
    <div className="min-h-screen bg-background bg-grid">
      <header className="border-b border-border/40">
        <div className="container py-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(grade ? gradePath(grade) : "/")}
            className="mb-4 gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Grade Home
          </Button>
          <h1 className="text-3xl font-extrabold tracking-tight">{decodedLevel} — Theory Papers</h1>
          <p className="text-sm text-muted-foreground">
            Open a paper to read the questions, official answer key and explanations
          </p>
        </div>
      </header>

      <main className="container py-10">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : years.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No theory papers have been uploaded for {decodedLevel} yet.
          </p>
        ) : (
          <Tabs defaultValue={String(years[0])} className="w-full">
            <TabsList className="mb-6 flex h-auto flex-wrap gap-1 rounded-lg bg-muted/50 p-1.5">
              {years.map((year) => (
                <TabsTrigger
                  key={year}
                  value={String(year)}
                  className="rounded-md px-4 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {year}
                </TabsTrigger>
              ))}
            </TabsList>

            {years.map((year) => {
              const series = Array.from(papersByYearAndSeries.get(year)?.entries() ?? []).sort(
                ([a], [b]) => compareSessions(a, b),
              );
              return (
                <TabsContent key={year} value={String(year)} className="space-y-8">
                  {series.map(([session, sessionPapers]) => (
                    <section key={session} aria-labelledby={`series-${year}-${session}`}>
                      <h2
                        id={`series-${year}-${session}`}
                        className="mb-3 text-sm font-semibold uppercase text-muted-foreground"
                      >
                        {session}
                      </h2>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[...(sessionPapers ?? [])]
                          .sort((a, b) => a.paper_code.localeCompare(b.paper_code))
                          .map((paper) => (
                            <Link
                              key={paper.id}
                              to={`/theory-paper/${paper.id}`}
                              className="glass-card-hover group flex flex-col gap-3 rounded-2xl p-5"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <span className="font-mono text-sm font-bold">{paper.paper_code}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{paper.session} {paper.year}</p>
                              <div className="mt-auto flex flex-wrap gap-2">
                                {paper.question_storage_path && (
                                  <Badge variant="outline" className="border-border/40 text-xs">
                                    Questions
                                  </Badge>
                                )}
                                {paper.answer_storage_path && (
                                  <Badge variant="outline" className="border-success/40 text-xs text-success">
                                    Answer key
                                  </Badge>
                                )}
                              </div>
                            </Link>
                          ))}
                      </div>
                    </section>
                  ))}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default TheoryLevelPage;
