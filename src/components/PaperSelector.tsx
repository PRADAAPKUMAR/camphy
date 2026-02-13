import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

const PaperSelector = () => {
  const navigate = useNavigate();

  const { data: papers, isLoading } = useQuery({
    queryKey: ["papers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("papers")
        .select("*")
        .order("year", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading papers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container py-8">
          <h1 className="text-3xl font-bold tracking-tight">
            MCQ Exam Practice
          </h1>
          <p className="mt-2 text-muted-foreground">
            Select a paper to start practicing
          </p>
        </div>
      </header>
      <main className="container py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {papers?.map((paper) => (
            <Card
              key={paper.id}
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => navigate(`/exam/${paper.id}`)}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{paper.subject}</CardTitle>
                </div>
                <CardDescription>{paper.paper_code}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{paper.level}</Badge>
                  <Badge variant="outline">{paper.year}</Badge>
                  <Badge variant="outline">{paper.session}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default PaperSelector;
