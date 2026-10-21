import { Link } from "react-router-dom";
import { ArrowRight, ArrowUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GRADES, GRADE_KEYS, gradePath } from "@/lib/grades";
import { LEGAL_POLICIES } from "@/lib/legal-policies";

const linkClass = "inline-flex min-h-9 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-primary focus-visible:outline-offset-4";

export default function SiteFooter() {
  return <footer className="relative border-t border-border bg-background/95">
    <div className="container py-12 sm:py-16">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.25fr] lg:gap-8">
        <div>
          <Link to="/" aria-label="PhysicsHQ home" className="inline-flex items-center gap-2 text-3xl text-foreground">
            <Zap className="h-7 w-7 text-primary" aria-hidden="true" />
            <span>Physics<span className="gradient-text">HQ</span></span>
          </Link>
          <p className="mt-4 max-w-64 text-sm leading-7 text-muted-foreground">Cambridge IGCSE, AS &amp; A Level Physics.</p>
          <p className="mt-3 text-sm text-foreground">Master Physics. Practice Smarter.</p>
          <span className="mt-5 inline-block font-mono text-xs text-muted-foreground">0625 / 9702</span>
        </div>
        <nav aria-label="Footer learning levels">
          <h2 className="mb-4 text-base text-foreground">Your level</h2>
          <ul className="space-y-2">{GRADE_KEYS.map((key) => <li key={key} data-grade={key}>
            <Link to={gradePath(key)} className={`${linkClass} group`}><span className="h-1.5 w-1.5 rounded-full bg-grade" aria-hidden="true" />{GRADES[key].label}<ArrowRight className="h-3.5 w-3.5 text-grade motion-safe:transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" /></Link>
          </li>)}</ul>
        </nav>
        <nav aria-label="Footer website links">
          <h2 className="mb-4 text-base text-foreground">PhysicsHQ</h2>
          <ul className="space-y-2"><li><Link to="/about" className={linkClass}>About PhysicsHQ</Link></li><li><Link to="/study-tools" className={linkClass}>Study Tools</Link></li><li><Link to="/auth" className={linkClass}>Sign in / Register</Link></li></ul>
        </nav>
        <nav aria-label="Footer legal policies">
          <h2 className="mb-4 text-base text-foreground">Policies &amp; notices <span className="ml-1 font-mono text-[10px] text-muted-foreground">DRAFTS</span></h2>
          <ul className="space-y-1">{LEGAL_POLICIES.map((policy) => <li key={policy.slug}><Link to={`/${policy.slug}`} className={linkClass}>{policy.title}</Link></li>)}</ul>
        </nav>
      </div>
      <div className="mt-10 flex flex-wrap items-start justify-between gap-6 border-t border-border pt-6">
        <div className="space-y-2"><p className="text-xs text-muted-foreground">© {new Date().getFullYear()} PhysicsHQ</p><p className="max-w-2xl text-xs leading-6 text-muted-foreground">Independent educational platform. Not affiliated with or endorsed by Cambridge International Education. Third-party materials belong to their respective rights holders.</p></div>
        <Button variant="ghost" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })} className="shrink-0 gap-2 text-muted-foreground">Back to top<ArrowUp className="h-4 w-4" /></Button>
      </div>
    </div>
  </footer>;
}