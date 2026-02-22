import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, BookOpen, FileText } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const MaterialsLevelPage = () => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const decodedLevel = decodeURIComponent(level || "");
  const [search, setSearch] = useState("");

  const { data: materials, isLoading } = useQuery({
    queryKey: ["study_materials", decodedLevel],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_materials")
        .select("*")
        .eq("level", decodedLevel)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!decodedLevel,
  });

  const filtered = useMemo(() => {
    if (!materials) return [];
    if (!search) return materials;
    const q = search.toLowerCase();
    return materials.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        (m.description ?? "").toLowerCase().includes(q)
    );
  }, [materials, search]);

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

      <header className="relative border-b border-border/40">
        <div className="container py-10">
          <Breadcrumb className="mb-5">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/materials">Materials</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{decodedLevel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
              <BookOpen className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Materials — {decodedLevel}</h1>
              <p className="text-sm text-muted-foreground">
                {materials?.length ?? 0} resource{(materials?.length ?? 0) !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container relative py-8">
        {/* Search */}
        <div className="mb-8 glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search materials…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50 border-border/40"
              />
            </div>
            {search && (
              <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
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
                ? "No materials found for this level."
                : "No materials match your search."}
            </p>
            {search && (
              <Button variant="link" onClick={() => setSearch("")} className="mt-2 text-primary">
                Clear search
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

export default MaterialsLevelPage;
