import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
const getSupabase = () => import("@/integrations/supabase/client").then(m => m.supabase);
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, BookMarked, FileText, Folder, ChevronRight } from "lucide-react";
import PhysicsBackground from "@/components/PhysicsBackground";
import { Skeleton } from "@/components/ui/skeleton";
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
  const decodedLevel = decodeURIComponent(level || "");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPath, setCurrentPath] = useState<string[]>([]);

  const { data: materials, isLoading } = useQuery({
    queryKey: ["study_materials", decodedLevel],
    queryFn: async () => {
      const supabase = await getSupabase();
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

  // Parse folder_path into segments array
  const parsePath = (folderPath: string | null): string[] => {
    if (!folderPath) return [];
    return folderPath.split(",").map((s) => s.trim()).filter(Boolean);
  };

  // Get subfolders and files at the current path level
  const { subfolders, files } = useMemo(() => {
    if (!materials) return { subfolders: [], files: [] };

    const q = search.toLowerCase();
    const folderSet = new Set<string>();
    const currentFiles: typeof materials = [];

    for (const mat of materials) {
      const segments = parsePath(mat.folder_path);

      // Check if this item is within the current path
      const isUnderCurrentPath = currentPath.every(
        (seg, i) => segments[i] === seg
      );

      if (!isUnderCurrentPath) continue;

      if (segments.length > currentPath.length) {
        // This item is in a subfolder — collect the next folder name
        const nextFolder = segments[currentPath.length];
        if (!search || nextFolder.toLowerCase().includes(q)) {
          folderSet.add(nextFolder);
        }
      } else {
        // This item is at the current level (a file)
        if (
          !search ||
          mat.title.toLowerCase().includes(q) ||
          mat.subject.toLowerCase().includes(q) ||
          (mat.description ?? "").toLowerCase().includes(q)
        ) {
          currentFiles.push(mat);
        }
      }
    }

    // If searching, also include files from deeper levels that match
    if (search) {
      for (const mat of materials) {
        const segments = parsePath(mat.folder_path);
        const isUnderCurrentPath = currentPath.every(
          (seg, i) => segments[i] === seg
        );
        if (
          isUnderCurrentPath &&
          segments.length > currentPath.length &&
          (mat.title.toLowerCase().includes(q) ||
            mat.subject.toLowerCase().includes(q) ||
            (mat.description ?? "").toLowerCase().includes(q))
        ) {
          currentFiles.push(mat);
        }
      }
    }

    return {
      subfolders: Array.from(folderSet).sort(),
      files: currentFiles,
    };
  }, [materials, currentPath, search]);

  const navigateToFolder = (folderName: string) => {
    setCurrentPath((prev) => [...prev, folderName]);
    setSearch("");
  };

  const navigateToPathIndex = (index: number) => {
    setCurrentPath((prev) => prev.slice(0, index + 1));
    setSearch("");
  };

  const navigateToRoot = () => {
    setCurrentPath([]);
    setSearch("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background bg-grid relative">
        <PhysicsBackground />
        <header className="relative border-b border-border/40">
          <div className="container py-10">
            <Skeleton className="h-4 w-48 mb-5" />
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div>
                <Skeleton className="h-8 w-52 mb-1" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
          </div>
        </header>
        <main className="container relative py-8">
          <div className="glass-card rounded-xl p-4 mb-8">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <Skeleton className="h-3 w-16 mb-3" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-xl p-5 flex items-center gap-4">
                <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
                <Skeleton className="h-4 w-32" />
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
                <BreadcrumbLink asChild><Link to="/materials">Materials</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {currentPath.length === 0 ? (
                <BreadcrumbItem>
                  <BreadcrumbPage>{decodedLevel}</BreadcrumbPage>
                </BreadcrumbItem>
              ) : (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-pointer" onClick={navigateToRoot}>
                      {decodedLevel}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {currentPath.map((seg, i) => (
                    <span key={i} className="contents">
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        {i === currentPath.length - 1 ? (
                          <BreadcrumbPage>{seg}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink
                            className="cursor-pointer"
                            onClick={() => navigateToPathIndex(i)}
                          >
                            {seg}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </span>
                  ))}
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
              <BookMarked className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                {currentPath.length > 0
                  ? currentPath[currentPath.length - 1]
                  : `Materials — ${decodedLevel}`}
              </h1>
              <p className="text-sm text-muted-foreground">
                {subfolders.length > 0 && `${subfolders.length} folder${subfolders.length !== 1 ? "s" : ""}`}
                {subfolders.length > 0 && files.length > 0 && " · "}
                {files.length > 0 && `${files.length} file${files.length !== 1 ? "s" : ""}`}
                {subfolders.length === 0 && files.length === 0 && "Empty"}
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

        {/* Folders */}
        {subfolders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Folders</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subfolders.map((folder) => (
                <button
                  key={folder}
                  onClick={() => navigateToFolder(folder)}
                  className="glass-card-hover group rounded-xl p-5 flex items-center gap-4 text-left w-full transition-all"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                    <Folder className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold truncate">{folder}</h3>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Files */}
        {files.length > 0 && (
          <div>
            {subfolders.length > 0 && (
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Files</h2>
            )}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {files.map((mat) => {
                const isDriveLink = mat.file_url.startsWith("https://drive.google.com/file/d/");
                const handleClick = (e: React.MouseEvent) => {
                  if (isDriveLink) {
                    e.preventDefault();
                    navigate(`/view-drive?url=${encodeURIComponent(mat.file_url)}`);
                  }
                };
                return (
                  <a
                    key={mat.id}
                    href={mat.file_url}
                    target={isDriveLink ? undefined : "_blank"}
                    rel={isDriveLink ? undefined : "noopener noreferrer"}
                    onClick={handleClick}
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
                );
              })}
            </div>
          </div>
        )}

        {subfolders.length === 0 && files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <BookMarked className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">
              {search ? "No materials match your search." : "No materials found here."}
            </p>
            {search && (
              <Button variant="link" onClick={() => setSearch("")} className="mt-2 text-primary">
                Clear search
              </Button>
            )}
            {!search && currentPath.length > 0 && (
              <Button variant="link" onClick={navigateToRoot} className="mt-2 text-primary">
                Back to root
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MaterialsLevelPage;
