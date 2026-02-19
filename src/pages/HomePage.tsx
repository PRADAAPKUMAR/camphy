import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpen, FileText, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden border-b bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25 mb-6">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
            Physics<span className="gradient-text">HQ</span>
          </h1>
          <p className="mx-auto max-w-md text-lg text-muted-foreground">
            Your one-stop platform for exam practice and study resources. Master every topic with confidence.
          </p>
        </div>
      </header>

      {/* Feature cards */}
      <main className="container py-16">
        <div className="grid gap-8 sm:grid-cols-2 max-w-3xl mx-auto">
          {/* MCQ Practice */}
          <Card
            className="group cursor-pointer border bg-card transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
            onClick={() => navigate("/papers")}
          >
            <CardHeader className="pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <FileText className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-bold">MCQ Exam Practice</CardTitle>
              <CardDescription>
                Browse past papers, practice under timed conditions, and get instant results with detailed review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="gap-2 px-0 text-primary group-hover:gap-3 transition-all">
                Start Practicing <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Study Materials */}
          <Card
            className="group cursor-pointer border bg-card transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
            onClick={() => navigate("/materials")}
          >
            <CardHeader className="pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent mb-4 transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <BookOpen className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-bold">Study Materials</CardTitle>
              <CardDescription>
                Access notes, guides, and reference documents organized by subject and level to support your learning.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="gap-2 px-0 text-accent group-hover:gap-3 transition-all">
                Browse Materials <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50">
        <div className="container py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} PhysicsHQ — Built for learners.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
