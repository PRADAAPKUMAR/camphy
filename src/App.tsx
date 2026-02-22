import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Index from "./pages/Index";
import SubjectPage from "./pages/SubjectPage";
import ExamPage from "./pages/ExamPage";
import MaterialsPage from "./pages/MaterialsPage";
import MaterialsLevelPage from "./pages/MaterialsLevelPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/papers" element={<Index />} />
          <Route path="/papers/:level" element={<SubjectPage />} />
          <Route path="/exam/:paperId" element={<ExamPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/materials/:level" element={<MaterialsLevelPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
