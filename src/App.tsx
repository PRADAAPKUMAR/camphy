import { lazy, Suspense, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { usePageTransition } from "@/hooks/use-page-transition";
import RunningTimerBar from "@/components/study/RunningTimerBar";
import SiteNav from "@/components/SiteNav";

const TooltipProvider = lazy(() => import("@/components/ui/tooltip").then(m => ({ default: m.TooltipProvider })));
const SpeedInsights = lazy(() => import("@vercel/speed-insights/react").then(m => ({ default: m.SpeedInsights })));
const Analytics = lazy(() => import("@vercel/analytics/react").then(m => ({ default: m.Analytics })));
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));

const HomePage = lazy(() => import("./pages/HomePage"));
const Index = lazy(() => import("./pages/Index"));
const SubjectPage = lazy(() => import("./pages/SubjectPage"));
const ExamPage = lazy(() => import("./pages/ExamPage"));
const MaterialsPage = lazy(() => import("./pages/MaterialsPage"));
const MaterialsLevelPage = lazy(() => import("./pages/MaterialsLevelPage"));
const DriveViewerPage = lazy(() => import("./pages/DriveViewerPage"));
const TopicPracticePage = lazy(() => import("./pages/TopicPracticePage"));
const TopicLevelPage = lazy(() => import("./pages/TopicLevelPage"));
const TopicExamPage = lazy(() => import("./pages/TopicExamPage"));
const TopicalMcqPage = lazy(() => import("./pages/TopicalMcqPage"));
const TopicalMcqLevelPage = lazy(() => import("./pages/TopicalMcqLevelPage"));
const TopicalMcqSessionPage = lazy(() => import("./pages/TopicalMcqSessionPage"));
const TopicTheoryPage = lazy(() => import("./pages/TopicTheoryPage"));
const TheoryPapersPage = lazy(() => import("./pages/TheoryPapersPage"));
const TheoryLevelPage = lazy(() => import("./pages/TheoryLevelPage"));
const TheoryPaperPage = lazy(() => import("./pages/TheoryPaperPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const StudyToolsPage = lazy(() => import("./pages/StudyToolsPage"));
const PerformancePage = lazy(() => import("./pages/PerformancePage"));
const QuestionModePage = lazy(() => import("./pages/QuestionModePage"));
const AdminUploadPage = lazy(() => import("./pages/AdminUploadPage"));
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
    return () => { if (cIC) cIC(id as number); else window.clearTimeout(id as unknown as ReturnType<typeof setTimeout>); };
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <Toaster />
      <Sonner />
      <SpeedInsights />
      <Analytics />
    </Suspense>
  );
};

/** Router wrapper to enable page transitions */
const RouterContent = () => {
  usePageTransition();
  const { pathname } = useLocation();
  const navExcluded =
    /^\/(exam|question-mode|topic-exam)\//.test(pathname) ||
    /^\/topical-mcq\/[^/]+\/[^/]+\/?$/.test(pathname) ||
    pathname === "/view-drive" ||
    pathname.startsWith("/topic-theory/");

  return (
    <>
    {!navExcluded && <SiteNav />}
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
        <Route path="/question-mode/:paperId" element={<QuestionModePage />} />
        <Route path="/admin/upload" element={<AdminUploadPage />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/materials/:level" element={<MaterialsLevelPage />} />
        <Route path="/view-drive" element={<DriveViewerPage />} />
        <Route path="/topic-practice" element={<TopicPracticePage />} />
        <Route path="/topic-practice/:level" element={<TopicLevelPage />} />
        <Route path="/topic-exam/:paperId" element={<TopicExamPage />} />
        <Route path="/topical-mcq" element={<TopicalMcqPage />} />
        <Route path="/topical-mcq/:level" element={<TopicalMcqLevelPage />} />
        <Route path="/topical-mcq/:level/:topicSlug" element={<TopicalMcqSessionPage />} />
        <Route path="/topic-theory/:questionId" element={<TopicTheoryPage />} />
        <Route path="/theory-papers" element={<TheoryPapersPage />} />
        <Route path="/theory-papers/:level" element={<TheoryLevelPage />} />
        <Route path="/theory-paper/:paperId" element={<TheoryPaperPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/study-tools" element={<StudyToolsPage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
      <RunningTimerBar />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Suspense fallback={null}>
      <TooltipProvider>
        <DeferredShell />
        <BrowserRouter>
          <RouterContent />
        </BrowserRouter>
      </TooltipProvider>
    </Suspense>
  </QueryClientProvider>
);

export default App;
