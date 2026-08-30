import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { compareSessions } from "@/lib/exam-sessions";

const getSupabase = () => import("@/integrations/supabase/client").then((m) => m.supabase);

const TheoryLevelPage = () => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const decodedLevel = decodeURIComponent(level ?? "");

  const { data: papers, isLoading } = useQuery({
    queryKey: ["theory_papers", decodedLevel],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("theory_papers")
        .select("*")
        .eq("level", decodedLevel);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!decodedLevel,
  });

  const sorted = useMemo(
    () =>
      [...(papers ?? [])].sort(
        (a, b) =>
          (b.year ?? 0) - (a.year ?? 0) ||
          compareSessions(a.session, b.session) ||
          (a.paper_code ?? "").localeCompare(b.paper_code ?? ""),
      ),
    [papers],
  );

  return (
    <div className="min-h-screen bg-background bg-grid">
      <header className="border-b border-border/40">
        <div className="container py-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/theory-papers")}
            className="mb-4 gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Levels
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
        ) : sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No theory papers have been uploaded for {decodedLevel} yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((p) => (
              <Link
                key={p.id}
                to={`/theory-paper/${p.id}`}
                className="glass-card-hover group flex flex-col gap-3 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-mono text-sm font-bold">{p.paper_code}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {p.session} {p.year}
                </p>
                <div className="mt-auto flex flex-wrap gap-2">
                  {p.question_storage_path && (
                    <Badge variant="outline" className="border-border/40 text-xs">
                      Questions
                    </Badge>
                  )}
                  {p.answer_storage_path && (
                    <Badge variant="outline" className="border-success/40 text-xs text-success">
                      Answer key
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TheoryLevelPage;
