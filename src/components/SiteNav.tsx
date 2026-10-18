import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, ChevronDown, LogIn, LogOut, Menu, Shield, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { equivalentGradePath, gradeSectionPath, GRADES, GRADE_KEYS, type GradeKey } from "@/lib/grades";
import { useSelectedGrade } from "@/contexts/GradeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const isActive = (pathname: string, to: string) => pathname === to || (to !== "/" && pathname.startsWith(`${to}/`));

const SiteNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { grade, setGrade } = useSelectedGrade();
  const { user, profile, role, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); menuButton.current?.focus(); }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  const primary = grade ? [
    { label: "Overview", to: `/grade/${grade}` },
    { label: "Topics", to: gradeSectionPath(grade, "practice") },
    { label: "Materials", to: gradeSectionPath(grade, "materials") },
    { label: "Progress", to: gradeSectionPath(grade, "performance") },
  ] : [];
  const secondary = grade ? [
    { label: "Study tools", to: "/study-tools" },
    ...(GRADES[grade].worksheetLevel ? [{ label: "Worksheet generator", to: gradeSectionPath(grade, "worksheet") }] : []),
    ...(GRADES[grade].mappedTopicalLevel ? [{ label: "Classroom quiz", to: gradeSectionPath(grade, "quiz") }] : []),
    { label: "All grades", to: "/" }, { label: "About PhysicsHQ", to: "/about" },
  ] : [{ label: "Study tools", to: "/study-tools" }, { label: "About PhysicsHQ", to: "/about" }];
  const selected = (to: string) => isActive(pathname, to)
    || (to === (grade && gradeSectionPath(grade, "practice")) && /^\/(topical-mcq|topic-exam|topic-theory)\//.test(pathname));
  const linkClass = (to: string) => `workspace-nav-link ${selected(to) ? "workspace-nav-active" : ""}`;
  const papersActive = /^\/(papers|theory-papers|theory-topical|theory-paper)\//.test(pathname);
  const papers = grade && (GRADES[grade].hasMcqPapers ? <DropdownMenu>
    <DropdownMenuTrigger asChild><button type="button" className={`workspace-nav-link ${papersActive ? "workspace-nav-active" : ""}`} aria-label="Browse papers">Papers<ChevronDown className="h-3 w-3" /></button></DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-52">
      <DropdownMenuItem asChild><Link to={gradeSectionPath(grade, "mcq")}>MCQ past papers</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link to={gradeSectionPath(grade, "theory")}>Theory past papers</Link></DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu> : <Link to={gradeSectionPath(grade, "theory")} className={`workspace-nav-link ${papersActive ? "workspace-nav-active" : ""}`} aria-current={papersActive ? "page" : undefined}>Papers</Link>);
  const switchGrade = (next: GradeKey) => { setGrade(next); navigate(equivalentGradePath(pathname, next)); setMenuOpen(false); };
  const switcher = <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="min-h-11 gap-1.5 border-border/50 px-2.5 text-xs" aria-label="Switch grade">{grade ? GRADES[grade].shortLabel : "Select grade"}<ChevronDown className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-44">{GRADE_KEYS.map((key) => <DropdownMenuItem key={key} onSelect={() => switchGrade(key)} className="justify-between"><span>{GRADES[key].label}</span>{grade === key && <Check className="h-4 w-4 text-primary" />}</DropdownMenuItem>)}</DropdownMenuContent>
  </DropdownMenu>;
  const account = user ? <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Account menu"><Avatar className="h-8 w-8"><AvatarImage src={profile?.avatar_url ?? undefined} alt="" /><AvatarFallback>{(profile?.display_name || user.email || "U").slice(0, 1).toUpperCase()}</AvatarFallback></Avatar></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel className="truncate">{profile?.display_name || user.email}</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem asChild><Link to="/profile"><UserRound className="mr-2 h-4 w-4" />Profile &amp; preferences</Link></DropdownMenuItem>{role === "admin" && <DropdownMenuItem asChild><Link to="/admin/upload"><Shield className="mr-2 h-4 w-4" />Admin console</Link></DropdownMenuItem>}<DropdownMenuSeparator /><DropdownMenuItem onSelect={() => void signOut()}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent>
  </DropdownMenu> : <Button variant="outline" size="sm" className="min-h-11 px-2 sm:px-3" asChild><Link to={`/auth?returnTo=${encodeURIComponent(pathname)}`} aria-label="Sign in"><LogIn className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Sign in</span></Link></Button>;
  return <nav aria-label="Main navigation" className="glass-nav workspace-nav relative z-40 border-b border-border/60 bg-background" data-grade={grade ?? undefined}>
    <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
      <div className="flex min-w-0 items-center gap-3 sm:gap-5">
        <Link to={grade ? `/grade/${grade}` : "/"} className="workspace-brand flex shrink-0 items-center gap-2 text-sm font-extrabold" aria-label="PhysicsHQ home"><img src="/favicon.png" alt="" width="26" height="26" className="h-[26px] w-[26px] object-contain" /><span className="hidden min-[370px]:inline">Physics<span className="text-primary">HQ</span></span></Link>
        <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
        {switcher}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <Link to="/study-tools" className="workspace-text-link hidden text-xs sm:inline-flex">Study tools</Link>
        {account}
        <Button ref={menuButton} type="button" variant="ghost" size="icon" className="workspace-menu-button min-h-11 min-w-11" aria-expanded={menuOpen} aria-controls="workspace-menu" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</Button>
      </div>
    </div>
    {grade && <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:gap-3 sm:px-8" aria-label="Study sections">
      <Link to={primary[0].to} className={linkClass(primary[0].to)} aria-current={selected(primary[0].to) ? "page" : undefined}>Overview</Link>
      {papers}
      {primary.slice(1).map((item) => <Link key={item.to} to={item.to} className={linkClass(item.to)} aria-current={selected(item.to) ? "page" : undefined}>{item.label}</Link>)}
    </div>}
    {menuOpen && <div id="workspace-menu" className="glass-menu-panel border-t border-border/50 bg-background"><div className="mx-auto grid max-w-6xl gap-1 px-4 py-3 sm:grid-cols-3 sm:px-8">{secondary.map((item) => <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className="workspace-menu-link" aria-current={isActive(pathname, item.to) ? "page" : undefined}>{item.label}</Link>)}</div></div>}
  </nav>;
};
export default SiteNav;
