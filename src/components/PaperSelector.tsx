import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Atom, FlaskConical, Microscope } from "lucide-react";

const getSupabase = () => import("@/integrations/supabase/client").then(m => m.supabase);
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PhysicsBackground from "@/components/PhysicsBackground";

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

const PaperSelector = () => {
  const navigate = useNavigate();

  const { data: papers, isLoading } = useQuery({
    queryKey: ["papers"],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("papers")
        .select("*")
        .order("year", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const levels = useMemo(() => {
    if (!papers) return [];
    const map = new Map<string, { level: string; count: number; years: number[] }>();
    papers.forEach((p) => {
      const existing = map.get(p.level);
      if (existing) {
        existing.count++;
        if (!existing.years.includes(p.year)) existing.years.push(p.year);
      } else {
        map.set(p.level, { level: p.level, count: 1, years: [p.year] });
      }
    });
    // Sort in a logical order
    const order = ["IGCSE", "AS Level", "A2 Level"];
    return Array.from(map.values()).sort(
      (a, b) => (order.indexOf(a.level) === -1 ? 99 : order.indexOf(a.level)) - (order.indexOf(b.level) === -1 ? 99 : order.indexOf(b.level))
    );
  }, [papers]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background bg-grid relative">
        <PhysicsBackground />
        <header className="relative border-b border-border/40">
          <div className="container py-10">
            <Skeleton className="h-8 w-20 mb-4" />
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div>
                <Skeleton className="h-8 w-64 mb-1" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
        </header>
        <main className="container relative py-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-7 flex flex-col gap-4">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <div>
                  <Skeleton className="h-6 w-28 mb-1" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <div className="flex gap-2 mt-auto">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-4 gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Physics — MCQ Practice</h1>
              <p className="text-muted-foreground text-sm">Select your level to browse past papers</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container relative py-10">
        {levels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Atom className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">No papers available yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {levels.map((l) => (
              <div
                key={l.level}
                className="glass-card-hover group cursor-pointer rounded-2xl p-7 flex flex-col gap-4"
                onClick={() => navigate(`/papers/${encodeURIComponent(l.level)}`)}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                  {levelIcons[l.level] || <Zap className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{l.level}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {levelDescriptions[l.level] || l.level}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <Badge variant="secondary" className="font-medium text-xs bg-secondary/60">
                    {l.count} paper{l.count !== 1 ? "s" : ""}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-border/40">
                    {Math.min(...l.years)}–{Math.max(...l.years)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PaperSelector;
