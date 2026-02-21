import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PaperSelector = () => {
  const navigate = useNavigate();

  const { data: papers, isLoading } = useQuery({
    queryKey: ["papers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("papers")
        .select("*")
        .order("year", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const subjects = useMemo(() => {
    if (!papers) return [];
    const map = new Map<string, { subject: string; level: string; count: number; years: number[] }>();
    papers.forEach((p) => {
      const existing = map.get(p.subject);
      if (existing) {
        existing.count++;
        if (!existing.years.includes(p.year)) existing.years.push(p.year);
      } else {
        map.set(p.subject, { subject: p.subject, level: p.level, count: 1, years: [p.year] });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.subject.localeCompare(b.subject));
  }, [papers]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid relative">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

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
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">MCQ Exam Practice</h1>
          </div>
          <p className="text-muted-foreground max-w-lg">
            Choose a subject to start practicing past papers under timed conditions.
          </p>
        </div>
      </header>

      <main className="container relative py-8">
        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">No subjects available yet.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <div
                key={s.subject}
                className="glass-card-hover group cursor-pointer rounded-xl p-6"
                onClick={() => navigate(`/papers/${encodeURIComponent(s.subject)}`)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{s.subject}</h3>
                    <p className="text-xs text-muted-foreground">{s.level}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="font-medium text-xs bg-secondary/60">
                    {s.count} paper{s.count !== 1 ? "s" : ""}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-border/40">
                    {Math.min(...s.years)}–{Math.max(...s.years)}
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
