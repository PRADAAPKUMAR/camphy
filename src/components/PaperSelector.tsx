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
import { BookOpen, Search, X } from "lucide-react";
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading papers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container py-8">
          <h1 className="text-3xl font-bold tracking-tight">
            MCQ Exam Practice
          </h1>
          <p className="mt-2 text-muted-foreground">
            Select a paper to start practicing
          </p>
        </div>
      </header>
      <main className="container py-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by subject, code, or session…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[160px]">
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
            <SelectTrigger className="w-[140px]">
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
            <SelectTrigger className="w-[120px]">
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
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            No papers match your filters.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((paper) => (
              <Card
                key={paper.id}
                className="cursor-pointer transition-shadow hover:shadow-lg"
                onClick={() => navigate(`/exam/${paper.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{paper.subject}</CardTitle>
                  </div>
                  <CardDescription>{paper.paper_code}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{paper.level}</Badge>
                    <Badge variant="outline">{paper.year}</Badge>
                    <Badge variant="outline">{paper.session}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PaperSelector;
