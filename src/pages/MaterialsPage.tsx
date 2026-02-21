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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, BookOpen, ArrowLeft, FileText } from "lucide-react";

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
    <div className="min-h-screen bg-background bg-grid relative">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-border/40">
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
              <BookOpen className="h-5 w-5 text-accent" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Study Materials</h1>
          </div>
          <p className="text-muted-foreground max-w-lg">
            Find notes, guides, and reference documents to support your studies.
          </p>
        </div>
      </header>

      <main className="container relative py-8">
        {/* Filters */}
        <div className="mb-8 glass-card rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search materials…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50 border-border/40"
              />
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[160px] bg-background/50 border-border/40">
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
              <SelectTrigger className="w-[140px] bg-background/50 border-border/40">
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
              <a
                key={mat.id}
                href={mat.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card-hover group rounded-xl p-5 block cursor-pointer no-underline text-inherit"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 text-accent">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate">{mat.title}</h3>
                    {mat.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{mat.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="font-medium text-xs bg-secondary/60">{mat.subject}</Badge>
                  <Badge variant="outline" className="text-xs border-border/40">{mat.level}</Badge>
                  <Badge variant="outline" className="text-xs uppercase border-border/40">{mat.file_type}</Badge>
                </div>
              </a>
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
