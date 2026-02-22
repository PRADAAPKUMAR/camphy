import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const SubjectPage = () => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const decodedLevel = decodeURIComponent(level || "");

  const { data: papers, isLoading } = useQuery({
    queryKey: ["papers", decodedLevel],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("papers")
        .select("*")
        .eq("level", decodedLevel)
        .order("year", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!decodedLevel,
  });

  const years = useMemo(() => {
    if (!papers) return [];
    return [...new Set(papers.map((p) => p.year))].sort((a, b) => b - a);
  }, [papers]);

  const papersByYear = useMemo(() => {
    if (!papers) return {};
    const map: Record<number, typeof papers> = {};
    papers.forEach((p) => {
      if (!map[p.year]) map[p.year] = [];
      map[p.year].push(p);
    });
    return map;
  }, [papers]);

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
                <BreadcrumbLink asChild><Link to="/papers">Levels</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{decodedLevel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Physics — {decodedLevel}</h1>
              <p className="text-sm text-muted-foreground">
                {papers?.length ?? 0} paper{(papers?.length ?? 0) !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container relative py-8">
        {years.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">No papers found for this level.</p>
          </div>
        ) : (
          <Tabs defaultValue={String(years[0])} className="w-full">
            <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-muted/50 p-1.5 rounded-lg">
              {years.map((y) => (
                <TabsTrigger
                  key={y}
                  value={String(y)}
                  className="px-4 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
                >
                  {y}
                </TabsTrigger>
              ))}
            </TabsList>

            {years.map((y) => (
              <TabsContent key={y} value={String(y)}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {papersByYear[y]?.map((paper) => (
                    <div
                      key={paper.id}
                      className="glass-card-hover group cursor-pointer rounded-xl p-5"
                      onClick={() => navigate(`/exam/${paper.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold font-mono">{paper.paper_code}</h3>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="font-medium text-xs bg-secondary/60">
                          {paper.session}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default SubjectPage;
