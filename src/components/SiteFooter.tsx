import { Link } from "react-router-dom";
import { ArrowRight, ArrowUp, BookOpen, Mail, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GRADES, GRADE_KEYS, gradePath } from "@/lib/grades";
import { LEGAL_POLICIES, POLICY_CONTACT, POLICY_UPDATED_AT, POLICY_UPDATED_LABEL } from "@/lib/legal-policies";

const linkClass = "inline-flex min-h-10 items-center gap-2 text-sm leading-6 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-primary focus-visible:outline-offset-4";

export default function SiteFooter() {
  return <footer className="relative mt-8 overflow-hidden border-t border-border/60 bg-card/25">
    <div className="pointer-events-none absolute -left-24 top-0 h-64 w-96 rounded-full bg-primary/5 blur-3xl" aria-hidden="true" />
    <div className="container relative py-10 sm:py-14">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-5 border-b border-border/60 pb-8">
        <div><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Make your next session count</p><p className="text-xl text-foreground sm:text-2xl">A little practice. A clearer understanding.</p></div>
        <Button asChild variant="outline" className="h-11 gap-3 rounded-xl px-5"><Link to="/"><BookOpen className="h-4 w-4" aria-hidden="true" />Explore all grades<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Button>
      </div>
      <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.7fr_0.7fr_1.2fr]">
        <div>
          <Link to="/" aria-label="PhysicsHQ home" className="inline-flex items-center gap-2 text-2xl text-foreground"><Zap className="h-7 w-7 text-primary" aria-hidden="true" /><span>Physics<span className="gradient-text">HQ</span></span></Link>
          <p className="mt-4 max-w-64 text-sm leading-7 text-muted-foreground">A home for Cambridge IGCSE, AS &amp; A Level Physics practice and revision.</p>
          <div className="mt-5 inline-flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2 font-mono text-[10px] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />Cambridge 0625 / 9702</div>
          <div className="mt-4"><a href={`mailto:${POLICY_CONTACT.email}`} className={`${linkClass} break-all`}><Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{POLICY_CONTACT.email}</a></div>
        </div>
        <nav aria-label="Footer learning levels"><h2 className="mb-3 text-sm text-foreground">Find your level</h2><ul>{GRADE_KEYS.map((key) => <li key={key} data-grade={key}><Link to={gradePath(key)} className={`${linkClass} group`}><span className="h-1.5 w-1.5 rounded-full bg-grade" aria-hidden="true" />{GRADES[key].label}<ArrowRight className="h-3.5 w-3.5 text-grade motion-safe:transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" /></Link></li>)}</ul></nav>
        <nav aria-label="Footer website links"><h2 className="mb-3 text-sm text-foreground">Explore PhysicsHQ</h2><ul><li><Link to="/about" className={linkClass}>About the creator</Link></li><li><Link to="/study-tools" className={linkClass}>Study tools</Link></li><li><Link to="/auth" className={linkClass}>Your account</Link></li></ul></nav>
        <nav aria-label="Footer legal policies"><div className="mb-3 flex flex-wrap items-center gap-2"><h2 className="text-sm text-foreground">Policies &amp; notices</h2><span className="rounded-full border border-border/70 px-2 py-0.5 text-[9px] text-muted-foreground">Review copies</span></div><ul>{LEGAL_POLICIES.map((policy) => <li key={policy.slug}><Link to={`/${policy.slug}`} className={linkClass}>{policy.title}</Link></li>)}</ul><p className="mt-3 text-[10px] text-muted-foreground">Updated <time dateTime={POLICY_UPDATED_AT}>{POLICY_UPDATED_LABEL}</time></p></nav>
      </div>
      <div className="mt-10 flex flex-wrap items-end justify-between gap-5 border-t border-border/60 pt-6">
        <div className="max-w-2xl"><p className="text-xs text-foreground">© {new Date().getFullYear()} PhysicsHQ · Created by {POLICY_CONTACT.creator}</p><p className="mt-2 text-[11px] leading-6 text-muted-foreground">Independent educational platform. Not affiliated with or endorsed by Cambridge International Education. Third-party materials belong to their respective rights holders.</p></div>
        <Button variant="ghost" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })} className="min-h-10 shrink-0 gap-2 text-xs text-muted-foreground">Back to top<ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /></Button>
      </div>
    </div>
  </footer>;
}
