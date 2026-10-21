import { useLocation, Link, Navigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteFooter from "@/components/SiteFooter";
import { LEGAL_POLICIES, legalPolicyForPath } from "@/lib/legal-policies";

export default function LegalPolicyPage() {
  const { pathname } = useLocation();
  const policy = legalPolicyForPath(pathname.replace(/\/+$/, ""));
  if (!policy) return <Navigate to="/" replace />;
  const sections = Array.from(policy.html.matchAll(/<h2>(.*?)<\/h2>/g), (match) => match[1]);
  let sectionIndex = 0;
  const html = policy.html.replace(/<h2>/g, () => `<h2 id="policy-section-${sectionIndex++}">`);
  const next = LEGAL_POLICIES[(LEGAL_POLICIES.indexOf(policy) + 1) % LEGAL_POLICIES.length];

  return <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-card/30">
      <div className="container py-9 sm:py-12">
        <Button asChild variant="ghost" size="sm" className="mb-7 -ml-3 gap-2 text-muted-foreground"><Link to="/"><ArrowLeft className="h-4 w-4" />Home</Link></Button>
        <div className="flex items-start gap-4"><FileText className="mt-1 h-7 w-7 shrink-0 text-primary" aria-hidden="true" /><div>
          <p className="mb-3 font-mono text-xs uppercase text-muted-foreground">PhysicsHQ / Policies &amp; notices</p>
          <h1 className="max-w-3xl text-3xl leading-tight sm:text-4xl">{policy.title}</h1>
          <p className="mt-4 font-mono text-xs leading-6 text-muted-foreground">Prepared 21 October 2026 · Draft · Not yet effective</p>
        </div></div>
      </div>
    </header>
    <main className="container py-8 sm:py-12">
      <div role="note" className="mb-10 flex items-start gap-3 border-l-2 border-primary bg-primary/5 px-5 py-4 text-sm leading-7 text-muted-foreground">
        <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" /><p><strong className="text-foreground">Draft notice.</strong> Contact details, effective date and legal review are pending. These pages do not confirm copyright permission or an active parental-verification process.</p>
      </div>
      <div className="grid items-start gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
        <aside className="lg:sticky lg:top-24">
          <nav aria-label="Policy pages"><h2 className="mb-4 font-mono text-xs uppercase text-muted-foreground">Policies &amp; notices</h2>
            <ul className="space-y-1">{LEGAL_POLICIES.map((item) => <li key={item.slug}><Link to={`/${item.slug}`} aria-current={item.slug === policy.slug ? "page" : undefined} className={`block border-l-2 px-3 py-2.5 text-sm leading-6 transition-colors ${item.slug === policy.slug ? "border-primary bg-primary/5 text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{item.title}</Link></li>)}</ul>
          </nav>
          <nav aria-label="On this page" className="mt-8 hidden border-t border-border pt-6 lg:block"><h2 className="mb-3 font-mono text-xs uppercase text-muted-foreground">On this page</h2><ol className="space-y-2">{sections.map((section, i) => <li key={section}><a href={`#policy-section-${i}`} className="block py-1 text-xs leading-5 text-muted-foreground hover:text-primary">{section}</a></li>)}</ol></nav>
        </aside>
        <div className="min-w-0 max-w-3xl">
          <article aria-label={policy.title} className="legal-copy" dangerouslySetInnerHTML={{ __html: html }} />
          {next && <div className="mt-10 flex justify-end border-t border-border pt-6"><Button asChild variant="ghost" className="h-auto max-w-full gap-3 whitespace-normal py-3 text-left"><Link to={`/${next.slug}`}>{next.title}<ArrowRight className="h-4 w-4 shrink-0" /></Link></Button></div>}
        </div>
      </div>
    </main>
    <SiteFooter />
  </div>;
}