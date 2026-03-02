import { lazy, Suspense } from "react";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
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
  </QueryClientProvider>
);

export default App;
