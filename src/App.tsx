import { lazy, Suspense, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const TooltipProvider = lazy(() => import("@/components/ui/tooltip").then(m => ({ default: m.TooltipProvider })));
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));

const HomePage = lazy(() => import("./pages/HomePage"));
const Index = lazy(() => import("./pages/Index"));
const SubjectPage = lazy(() => import("./pages/SubjectPage"));
const ExamPage = lazy(() => import("./pages/ExamPage"));
const MaterialsPage = lazy(() => import("./pages/MaterialsPage"));
const MaterialsLevelPage = lazy(() => import("./pages/MaterialsLevelPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/** Deferred shell components that aren't needed for first paint */
const DeferredShell = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const rIC = typeof window !== 'undefined' && 'requestIdleCallback' in window ? window.requestIdleCallback : undefined;
    const cIC = typeof window !== 'undefined' && 'cancelIdleCallback' in window ? window.cancelIdleCallback : undefined;
    const id = rIC ? rIC(() => setReady(true)) : window.setTimeout(() => setReady(true), 100);
    return () => { if (cIC) cIC(id as number); else window.clearTimeout(id as ReturnType<typeof setTimeout>); };
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <Toaster />
      <Sonner />
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Suspense fallback={null}>
      <TooltipProvider>
        <DeferredShell />
        <BrowserRouter>
          <Suspense fallback={
            <div className="min-h-screen bg-background">
              <div className="border-b border-border/40">
                <div className="container py-10">
                  <div className="h-4 w-32 rounded bg-muted animate-pulse mb-5" />
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
                    <div>
                      <div className="h-8 w-48 rounded bg-muted animate-pulse mb-1" />
                      <div className="h-4 w-56 rounded bg-muted animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="container py-10">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
                  {[1,2,3].map(i=>(
                    <div key={i} className="rounded-2xl border border-border/40 bg-muted/10 p-7 flex flex-col gap-4">
                      <div className="h-14 w-14 rounded-xl bg-muted animate-pulse" />
                      <div className="h-6 w-28 rounded bg-muted animate-pulse" />
                      <div className="h-4 w-full rounded bg-muted animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/papers" element={<Index />} />
              <Route path="/papers/:level" element={<SubjectPage />} />
              <Route path="/exam/:paperId" element={<ExamPage />} />
              <Route path="/materials" element={<MaterialsPage />} />
              <Route path="/materials/:level" element={<MaterialsLevelPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </Suspense>
  </QueryClientProvider>
);

export default App;
