import { useEffect, useState } from "react";
import { useLocation, Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, ChevronDown, Clock3, Cookie, Copyright, FileText, GraduationCap, Mail, Shield, Users } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import { LEGAL_POLICIES, legalPolicyForPath, POLICY_CONTACT, POLICY_UPDATED_AT, POLICY_UPDATED_LABEL } from "@/lib/legal-policies";
import "./legal-policy.css";

const presentation: Record<string, { label: string; description: string; icon: typeof Shield }> = {
  "privacy-policy": { label: "Privacy & data", description: "How your information is used, how it is protected, and the choices available to you.", icon: Shield },
  "terms-and-conditions": { label: "Using PhysicsHQ", description: "A shared understanding of how to use our learning resources, accounts and study tools.", icon: FileText },
  "copyright-policy": { label: "Content & ownership", description: "Respecting creators, understanding resource permissions, and reporting a copyright concern.", icon: Copyright },
  "educational-disclaimer": { label: "Learning guidance", description: "The role of our resources, practice results and grade estimates in your Physics preparation.", icon: GraduationCap },
  "cookie-policy": { label: "Your browser", description: "The browser technologies that support your sessions, preferences and learning progress.", icon: Cookie },
  "parental-consent-notice": { label: "For families", description: "Information for parents and guardians about student accounts, learning data and privacy choices.", icon: Users },
};
type Policy = typeof LEGAL_POLICIES[number];

function PolicyDocument({ policy }: { policy: Policy }) {
  const navigate = useNavigate();
  const details = presentation[policy.slug];
  const Icon = details.icon;
  const [activeSection, setActiveSection] = useState(policy.sections[0]?.id ?? "");
  const index = LEGAL_POLICIES.indexOf(policy);
  const previous = LEGAL_POLICIES[index - 1];
  const next = LEGAL_POLICIES[index + 1];

  useEffect(() => {
    const sections = policy.sections.map((section) => document.getElementById(section.id)).filter((section): section is HTMLElement => !!section);
    let frame = 0;
    const update = () => {
      frame = 0;
      const passed = sections.filter((section) => section.getBoundingClientRect().top <= 160);
      const current = passed[passed.length - 1] ?? sections[0];
      if (current) setActiveSection(current.id);
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const initial = requestAnimationFrame(() => {
      const target = sections.find((section) => `#${section.id}` === window.location.hash);
      if (target) target.scrollIntoView();
      else window.scrollTo({ top: 0, behavior: "instant" });
      update();
    });
    window.addEventListener("scroll", scroll, { passive: true });
    return () => { window.removeEventListener("scroll", scroll); cancelAnimationFrame(initial); cancelAnimationFrame(frame); };
  }, [policy]);

  const contents = (mobile = false) => <ol className="policy-contents">{policy.sections.map((section, i) => <li key={section.id}>
    <a href={`#${section.id}`} aria-current={activeSection === section.id ? "location" : undefined} onClick={(event) => {
      if (mobile) event.currentTarget.closest("details")?.removeAttribute("open");
    }}><span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>{section.title}</a>
  </li>)}</ol>;

  return <div className="policy-page min-h-screen bg-background">
    <header className="policy-hero border-b border-border/60">
      <div className="container py-8 sm:py-12">
        <Link to="/" className="policy-back"><ArrowLeft className="h-4 w-4" aria-hidden="true" />All grades<span aria-hidden="true">/</span>Policies &amp; notices</Link>
        <div className="mt-8 flex items-start gap-5 sm:mt-10 sm:gap-7">
          <div className="policy-hero-icon hidden sm:grid"><Icon className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" /></div>
          <div className="min-w-0 max-w-3xl">
            <p className="policy-eyebrow">{details.label}</p>
            <h1 className="mt-3 text-3xl leading-tight sm:text-5xl">{policy.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{details.description}</p>
            <div className="policy-metadata mt-6">
              <span><CalendarDays aria-hidden="true" />Updated <time dateTime={POLICY_UPDATED_AT}>{POLICY_UPDATED_LABEL}</time></span>
              <span><Clock3 aria-hidden="true" />{policy.readingMinutes} min read</span>
              <span className="policy-review-label">Review copy</span>
            </div>
          </div>
        </div>
      </div>
    </header>
    <main className="container py-6 sm:py-10">
      <div className="mb-6 lg:hidden">
        <label htmlFor="policy-picker" className="policy-eyebrow mb-2 block">Explore our policies</label>
        <div className="relative"><select id="policy-picker" value={policy.slug} onChange={(event) => navigate(`/${event.target.value}`)} className="policy-picker">
          {LEGAL_POLICIES.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}
        </select><ChevronDown className="pointer-events-none absolute right-4 top-4 h-4 w-4 text-muted-foreground" aria-hidden="true" /></div>
      </div>
      <div className="policy-layout">
        <aside className="hidden lg:block">
          <div className="policy-sidebar">
            <nav aria-label="Policy pages"><h2 className="policy-eyebrow mb-4">Policies &amp; notices</h2><ul className="space-y-1">{LEGAL_POLICIES.map((item) => {
              const ItemIcon = presentation[item.slug].icon;
              return <li key={item.slug}><Link to={`/${item.slug}`} aria-current={item.slug === policy.slug ? "page" : undefined} className="policy-document-link"><ItemIcon aria-hidden="true" /><span>{item.title}</span>{item.slug === policy.slug && <ArrowRight className="ml-auto" aria-hidden="true" />}</Link></li>;
            })}</ul></nav>
            <div className="policy-contact-note"><p className="text-sm text-foreground">A question about this notice?</p><p className="mt-2 text-xs leading-6 text-muted-foreground">{POLICY_CONTACT.email ? "Contact the creator for help with your request." : "Public contact details are being confirmed. This copy remains under review."}</p>
              {POLICY_CONTACT.email ? <a href={`mailto:${POLICY_CONTACT.email}`} className="mt-3 inline-flex items-center gap-2 text-sm text-primary"><Mail className="h-4 w-4" aria-hidden="true" />Email PhysicsHQ</a> : <Link to="/about" className="mt-3 inline-flex items-center gap-2 text-sm text-primary">Meet the creator<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
            </div>
          </div>
        </aside>
        <div className="min-w-0">
          <details className="policy-mobile-contents mb-5 xl:hidden"><summary>In this notice<ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>{contents(true)}</details>
          <article aria-label={policy.title} className="policy-paper">
            <div className="policy-paper-heading"><span>PhysicsHQ</span><span>{String(index + 1).padStart(2, "0")} / {String(LEGAL_POLICIES.length).padStart(2, "0")}</span></div>
            {policy.introduction && <div className="legal-copy mb-8" dangerouslySetInnerHTML={{ __html: policy.introduction }} />}
            {policy.sections.map((section, i) => <section key={section.id} aria-labelledby={section.id} className="policy-section">
              <div className="policy-section-heading"><span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><h2 id={section.id}>{section.title}</h2></div>
              <div className="legal-copy" dangerouslySetInnerHTML={{ __html: section.html }} />
            </section>)}
            <div role="note" className="policy-review-note"><FileText className="h-4 w-4 shrink-0" aria-hidden="true" /><p>Review copy · Updated {POLICY_UPDATED_LABEL}. {POLICY_CONTACT.email ? "These notices remain under review." : "Contact details are being confirmed."} These notices do not establish copyright permission or verify parental consent.</p></div>
          </article>
          <nav aria-label="Continue reading policies" className="mt-5 grid gap-3 sm:grid-cols-2">
            {previous ? <Link className="policy-next-link" to={`/${previous.slug}`}><ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" /><span><small>Previous notice</small>{previous.title}</span></Link> : <Link className="policy-next-link" to="/"><ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" /><span><small>Keep exploring</small>Back to all grades</span></Link>}
            {next && <Link className="policy-next-link sm:text-right" to={`/${next.slug}`}><span className="flex-1"><small>Next notice</small>{next.title}</span><ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link>}
          </nav>
        </div>
        <aside className="hidden xl:block"><nav aria-label="On this page" className="policy-sidebar"><h2 className="policy-eyebrow mb-5">In this notice</h2>{contents()}</nav></aside>
      </div>
    </main>
    <SiteFooter />
  </div>;
}

export default function LegalPolicyPage() {
  const { pathname } = useLocation();
  const policy = legalPolicyForPath(pathname);
  if (!policy) return <Navigate to="/" replace />;
  return <PolicyDocument key={policy.slug} policy={policy} />;
}
