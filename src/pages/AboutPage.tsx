import { Link } from "react-router-dom";
import { ArrowLeft, Zap, Github, Mail, GraduationCap, Code2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background bg-grid">
      <header className="border-b border-border/40">
        <div className="container py-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary glow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">About Me</h1>
              <p className="text-sm text-muted-foreground">The story behind PhysicsHQ</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-12 max-w-3xl">
        <section className="glass-card rounded-2xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary text-2xl font-bold">
              PK
            </div>
            <div>
              <h2 className="text-2xl font-bold">PRADAAP KUMAR</h2>
              <p className="text-sm text-muted-foreground">Creator & Developer of PhysicsHQ</p>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Hi! I'm Pradaap — a physics student passionate about making exam preparation simpler,
            faster, and free for everyone. PhysicsHQ is a project I built to bring past papers,
            topic-wise practice, and study materials together in one clean, distraction-free place.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 mb-6">
          <div className="glass-card-hover rounded-xl p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 border border-success/20 text-success mb-4">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h3 className="font-semibold mb-1">Why I built this</h3>
            <p className="text-sm text-muted-foreground">
              Quality physics resources are often scattered or behind paywalls. PhysicsHQ keeps
              everything organized, fast, and 100% free.
            </p>
          </div>
          <div className="glass-card-hover rounded-xl p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 text-accent mb-4">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="font-semibold mb-1">Built with</h3>
            <p className="text-sm text-muted-foreground">
              React, Tailwind CSS, and Lovable Cloud — designed for instant feedback and a smooth
              study experience on any device.
            </p>
          </div>
        </section>

        <section className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Get in touch</h3>
          </div>
          <p className="text-muted-foreground mb-5">
            Found a bug, have feedback, or want to suggest new content? I'd love to hear from you.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="gap-2">
              <a href="mailto:pradaapkumar@gmail.com">
                <Mail className="h-4 w-4" /> Email
              </a>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <a href="https://github.com/" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" /> GitHub
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 mt-8">
        <div className="container py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} PhysicsHQ — Built by PRADAAP KUMAR.
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;