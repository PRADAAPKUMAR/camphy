import { Link } from "react-router-dom";
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Cpu,
  Award,
  Lightbulb,
  Sparkles,
  CheckCircle2,
  Atom,
  Microscope,
  Target,
  Users,
} from "lucide-react";

const qualifications = [
  "Master's Degree in Electronics and Communication",
  "Bachelor's Degree in Physics",
  "Bachelor of Education (B.Ed.)",
];

const curricula = [
  { name: "Cambridge IGCSE Physics", code: "0625" },
  { name: "Cambridge AS & A Level Physics", code: "9702" },
  { name: "IB DP Physics", code: "HL / SL" },
  { name: "CBSE Physics", code: "XI – XII" },
];

const techStack = [
  "Arduino Uno",
  "ESP32 & ESP8266",
  "AI-assisted learning tools",
  "Physics simulations & digital content",
];

const achievements = [
  "Produced multiple A* and A grade achievers in IGCSE and AS Level Physics",
  "Completed IB DP Physics Category 1 training",
  "Member of the Indian Association of Physics Teachers",
  "Active participant in educational workshops, webinars, and teacher development programs",
];

const philosophy = [
  { icon: Lightbulb, label: "Conceptual clarity" },
  { icon: Atom, label: "Real-world application" },
  { icon: Microscope, label: "Inquiry-based learning" },
  { icon: Target, label: "Critical thinking & problem-solving" },
  { icon: Users, label: "Student-centered learning" },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background bg-grid">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container py-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary text-2xl font-bold glow-md shrink-0">
              SPK
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-2">
                About the Educator
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-2">
                S. Pradaap <span className="gradient-text">Kumar</span>
              </h1>
              <p className="text-muted-foreground">
                Physics Educator · 14+ years · Cambridge & IB DP Specialist
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-12 max-w-5xl space-y-6">
        {/* Intro */}
        <section className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Introduction
            </h2>
          </div>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              I am <span className="text-foreground font-semibold">S. Pradaap Kumar</span>, an
              experienced Physics educator with over{" "}
              <span className="text-foreground font-semibold">14 years of teaching expertise</span>{" "}
              across Higher Secondary, IGCSE, AS & A Level, and IB DP Physics. I am passionate
              about making Physics conceptually clear, application-oriented, and engaging through
              modern teaching methodologies, simulations, experiments, and technology integration.
            </p>
            <p>
              Currently, I teach Cambridge International Physics at a private institution and
              mentor students for academic excellence. Over the years, my students have
              consistently achieved outstanding results — including multiple{" "}
              <span className="text-foreground font-semibold">A* and A grades</span> in IGCSE and
              AS Level Physics examinations.
            </p>
          </div>
        </section>

        {/* Qualifications + Curricula */}
        <div className="grid gap-6 md:grid-cols-2">
          <section className="glass-card rounded-2xl p-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary mb-5">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold mb-4">Academic Background</h3>
            <ul className="space-y-3">
              {qualifications.map((q) => (
                <li key={q} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{q}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="glass-card rounded-2xl p-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 border border-success/20 text-success mb-5">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold mb-4">Curricula Taught</h3>
            <ul className="space-y-3">
              {curricula.map((c) => (
                <li
                  key={c.name}
                  className="flex items-center justify-between gap-3 text-sm border-b border-border/30 last:border-0 pb-2 last:pb-0"
                >
                  <span className="text-foreground">{c.name}</span>
                  <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded-md bg-muted/40 border border-border/40">
                    {c.code}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Technology */}
        <section className="glass-card rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Technology in Education</h3>
              <p className="text-xs text-muted-foreground">
                Bridging Physics with hands-on electronics and modern tools
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {techStack.map((t) => (
              <div
                key={t}
                className="flex items-center gap-2.5 rounded-xl border border-border/40 bg-muted/10 px-4 py-3 text-sm"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_hsl(199_89%_48%/0.6)]" />
                <span className="text-foreground">{t}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-5 leading-relaxed">
            I'm passionate about developing high-quality Physics study materials, interactive
            learning resources, and educational websites — designed to help students build strong
            conceptual understanding and exam confidence.
          </p>
        </section>

        {/* Achievements */}
        <section className="glass-card rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold">Achievements</h3>
          </div>
          <ul className="space-y-3">
            {achievements.map((a) => (
              <li key={a} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span className="text-muted-foreground leading-relaxed">{a}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Philosophy */}
        <section className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Teaching Philosophy
            </h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-6">
            I believe Physics is best learned through curiosity, visualization, experimentation,
            and structured analytical thinking.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {philosophy.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="glass-card-hover rounded-xl p-4 flex items-center gap-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 mt-8">
        <div className="container py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} PhysicsHQ — Built by S. PRADAAP KUMAR.
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;