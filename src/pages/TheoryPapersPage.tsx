import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Atom, FileText, FlaskConical, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { THEORY_LEVELS } from "@/lib/theory-filenames";

const getSupabase = () => import("@/integrations/supabase/client").then((m) => m.supabase);

const levelIcons: Record<string, React.ReactNode> = {
  IGCSE: <Microscope className="h-6 w-6" />,
  "AS Level": <FlaskConical className="h-6 w-6" />,
  "A2 Level": <Atom className="h-6 w-6" />,
};

const levelDescriptions: Record<string, string> = {
  IGCSE: "International General Certificate of Secondary Education",
  "AS Level": "Advanced Subsidiary Level",
  "A2 Level": "Advanced Level (Year 2)",
};

const TheoryPapersPage = () => {
  const navigate = useNavigate();
  const { tileProps, linkTileProps } = useTileTransition();

  const { data: papers, isLoading } = useQuery({
    queryKey: ["theory_papers"],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("theory_papers")
        .select("id, level, year")
        .order("year", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const map = new Map<string, { count: number; years: Set<number> }>();
    (papers ?? []).forEach((p) => {
      const entry = map.get(p.level) ?? { count: 0, years: new Set<number>() };
      entry.count += 1;
      entry.years.add(p.year);
      map.set(p.level, entry);
    });
    return map;
  }, [papers]);

  return (
    <div className="min-h-screen bg-background bg-grid">
      <header className="border-b border-border/40">
        <div className="container py-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-4 gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Theory Past Papers</h1>
              <p className="text-sm text-muted-foreground">
                Structured question papers with official answer keys and explanations
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-10">
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="glass-card flex flex-col gap-4 rounded-2xl p-7">
                  <Skeleton className="h-14 w-14 rounded-xl" />
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            : THEORY_LEVELS.map((level) => {
                const entry = stats.get(level);
                return (
                  <Link
                    key={level}
                    to={`/theory-papers/${encodeURIComponent(level)}`}
                    {...linkTileProps(`/theory-papers/${encodeURIComponent(level)}`)}
                    className="glass-card-hover group flex flex-col gap-4 rounded-2xl p-7"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                      {levelIcons[level]}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{level}</h2>
                      <p className="text-xs text-muted-foreground">{levelDescriptions[level]}</p>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-border/40 text-xs">
                        {entry?.count ?? 0} papers
                      </Badge>
                      {!!entry?.years.size && (
                        <Badge variant="outline" className="border-border/40 text-xs">
                          {entry.years.size} sessions
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
        </div>
      </main>
    </div>
  );
};

export default TheoryPapersPage;
