import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, BookOpen, ArrowLeft, FileText, Download } from "lucide-react";

const ALL_VALUE = "__all__";

const MaterialsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState(ALL_VALUE);
  const [levelFilter, setLevelFilter] = useState(ALL_VALUE);

  const { data: materials, isLoading } = useQuery({
    queryKey: ["study_materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_materials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const subjects = useMemo(
    () => [...new Set(materials?.map((m) => m.subject) ?? [])].sort(),
    [materials]
  );
  const levels = useMemo(
    () => [...new Set(materials?.map((m) => m.level) ?? [])].sort(),
    [materials]
  );

  const filtered = useMemo(() => {
    if (!materials) return [];
    return materials.filter((m) => {
      if (subjectFilter !== ALL_VALUE && m.subject !== subjectFilter) return false;
      if (levelFilter !== ALL_VALUE && m.level !== levelFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !m.title.toLowerCase().includes(q) &&
          !m.subject.toLowerCase().includes(q) &&
          !(m.description ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [materials, subjectFilter, levelFilter, search]);

  const hasFilters = search || subjectFilter !== ALL_VALUE || levelFilter !== ALL_VALUE;

  const clearFilters = () => {
    setSearch("");
    setSubjectFilter(ALL_VALUE);
    setLevelFilter(ALL_VALUE);
  };

  const fileIcon = (type: string) => {
    return <FileText className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-4 gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <BookOpen className="h-5 w-5 text-accent-foreground" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Study Materials</h1>
          </div>
          <p className="text-muted-foreground max-w-lg">
            Find notes, guides, and reference documents to support your studies.
          </p>
        </div>
      </header>

      <main className="container py-8">
        {/* Filters */}
        <div className="mb-8 rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search materials…"
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
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                <X className="mr-1 h-4 w-4" /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">
              {materials && materials.length === 0
                ? "No study materials have been added yet."
                : "No materials match your search."}
            </p>
            {hasFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((mat) => (
              <Card
                key={mat.id}
                className="group border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      {fileIcon(mat.file_type)}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base font-semibold truncate">{mat.title}</CardTitle>
                      {mat.description && (
                        <CardDescription className="text-xs line-clamp-2">{mat.description}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="font-medium text-xs">{mat.subject}</Badge>
                      <Badge variant="outline" className="text-xs">{mat.level}</Badge>
                      <Badge variant="outline" className="text-xs uppercase">{mat.file_type}</Badge>
                    </div>
                    <a
                      href={mat.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Showing {filtered.length} material{filtered.length !== 1 ? "s" : ""}
          </p>
        )}
      </main>
    </div>
  );
};

export default MaterialsPage;
