import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Search, X, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const ALL_VALUE = "__all__";

const PaperSelector = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState(ALL_VALUE);
  const [subjectFilter, setSubjectFilter] = useState(ALL_VALUE);
  const [yearFilter, setYearFilter] = useState(ALL_VALUE);

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

  const levels = useMemo(
    () => [...new Set(papers?.map((p) => p.level) ?? [])].sort(),
    [papers]
  );
  const subjects = useMemo(
    () => [...new Set(papers?.map((p) => p.subject) ?? [])].sort(),
    [papers]
  );
  const years = useMemo(
    () => [...new Set(papers?.map((p) => p.year) ?? [])].sort((a, b) => b - a),
    [papers]
  );

  const filtered = useMemo(() => {
    if (!papers) return [];
    return papers.filter((p) => {
      if (levelFilter !== ALL_VALUE && p.level !== levelFilter) return false;
      if (subjectFilter !== ALL_VALUE && p.subject !== subjectFilter) return false;
      if (yearFilter !== ALL_VALUE && p.year !== Number(yearFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.subject.toLowerCase().includes(q) &&
          !p.paper_code.toLowerCase().includes(q) &&
          !p.session.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [papers, levelFilter, subjectFilter, yearFilter, search]);

  const hasFilters =
    search || levelFilter !== ALL_VALUE || subjectFilter !== ALL_VALUE || yearFilter !== ALL_VALUE;

  const clearFilters = () => {
    setSearch("");
    setLevelFilter(ALL_VALUE);
    setSubjectFilter(ALL_VALUE);
    setYearFilter(ALL_VALUE);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading papers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <header className="border-b bg-card">
        <div className="container py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              MCQ Exam Practice
            </h1>
          </div>
          <p className="text-muted-foreground max-w-lg">
            Browse past papers, practice under timed conditions, and track your scores instantly.
          </p>
        </div>
      </header>

      <main className="container py-8">
        {/* Filters bar */}
        <div className="mb-8 rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search papers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All Subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All Levels</SelectItem>
                {levels.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[120px] bg-background">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All Years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">No papers match your filters.</p>
            {hasFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((paper) => (
              <Card
                key={paper.id}
                className="group cursor-pointer border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
                onClick={() => navigate(`/exam/${paper.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{paper.subject}</CardTitle>
                      <CardDescription className="text-xs font-mono">{paper.paper_code}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="font-medium text-xs">{paper.level}</Badge>
                    <Badge variant="outline" className="text-xs">{paper.year}</Badge>
                    <Badge variant="outline" className="text-xs">{paper.session}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer count */}
        {filtered.length > 0 && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Showing {filtered.length} paper{filtered.length !== 1 ? "s" : ""}
          </p>
        )}
      </main>
    </div>
  );
};

export default PaperSelector;
