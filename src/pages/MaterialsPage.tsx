import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
const getSupabase = () => import("@/integrations/supabase/client").then(m => m.supabase);
import { useNavigate, Link } from "react-router-dom";
import { BookMarked, Zap, Microscope, FlaskConical, Atom } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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

const MaterialsPage = () => {
  const navigate = useNavigate();

  const { data: materials, isLoading } = useQuery({
    queryKey: ["study_materials"],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("study_materials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const levels = useMemo(() => {
    if (!materials) return [];
    const map = new Map<string, { level: string; count: number }>();
    materials.forEach((m) => {
      const existing = map.get(m.level);
      if (existing) {
        existing.count++;
      } else {
        map.set(m.level, { level: m.level, count: 1 });
      }
    });
    const order = ["IGCSE", "AS Level", "A2 Level"];
    return Array.from(map.values()).sort(
      (a, b) =>
        (order.indexOf(a.level) === -1 ? 99 : order.indexOf(a.level)) -
        (order.indexOf(b.level) === -1 ? 99 : order.indexOf(b.level))
    );
  }, [materials]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background bg-grid relative">
        <div className="absolute inset-0 bg-radial-glow pointer-events-none" />
        <header className="relative border-b border-border/40">
          <div className="container py-10">
            <Skeleton className="h-4 w-32 mb-5" />
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div>
                <Skeleton className="h-8 w-48 mb-1" />
                <Skeleton className="h-4 w-56" />
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
                <Skeleton className="h-5 w-24 rounded-full mt-auto" />
              </div>
            ))}
          </div>
        </main>
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
                <BreadcrumbPage>Study Materials</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
              <BookOpen className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Study Materials</h1>
              <p className="text-muted-foreground text-sm">Select your level to browse resources</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container relative py-10">
        {levels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">No study materials available yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {levels.map((l) => (
              <div
                key={l.level}
                className="glass-card-hover group cursor-pointer rounded-2xl p-7 flex flex-col gap-4"
                onClick={() => navigate(`/materials/${encodeURIComponent(l.level)}`)}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent transition-all group-hover:bg-accent group-hover:text-accent-foreground">
                  {levelIcons[l.level] || <GraduationCap className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{l.level}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {levelDescriptions[l.level] || l.level}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <Badge variant="secondary" className="font-medium text-xs bg-secondary/60">
                    {l.count} resource{l.count !== 1 ? "s" : ""}
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

export default MaterialsPage;
