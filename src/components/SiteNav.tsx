import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, ChevronDown, Menu, MoreHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import IstClock from "@/components/IstClock";
import logoAsset from "@/assets/physicshq-lightning.png.asset.json";
import { equivalentGradePath, gradeSectionPath, GRADES, GRADE_KEYS, type GradeKey } from "@/lib/grades";
import { useSelectedGrade } from "@/contexts/GradeContext";

const isActive = (pathname: string, to: string) => pathname === to || (to !== "/" && pathname.startsWith(`${to}/`));

const SiteNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { grade, setGrade } = useSelectedGrade();
  const [menuOpen, setMenuOpen] = useState(false);
  const primary = grade ? [
    { label: "Grade Home", to: `/grade/${grade}` },
    ...(GRADES[grade].hasMcqPapers ? [{ label: "MCQ Papers", to: gradeSectionPath(grade, "mcq") }] : []),
    { label: "Theory", to: gradeSectionPath(grade, "theory") },
    { label: "Practice", to: gradeSectionPath(grade, "practice") },
    { label: "Materials", to: gradeSectionPath(grade, "materials") },
  ] : [];
  const secondary = grade ? [
    ...(GRADES[grade].worksheetLevel ? [{ label: "Worksheet Generator", to: gradeSectionPath(grade, "worksheet") }] : []),
    { label: "Performance", to: gradeSectionPath(grade, "performance") },
    { label: "Study Tools", to: "/study-tools" }, { label: "About", to: "/about" },
  ] : [{ label: "Study Tools", to: "/study-tools" }, { label: "About", to: "/about" }];
  const linkClass = (to: string) => `rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors hover:bg-muted/30 hover:text-foreground ${isActive(pathname, to) ? "bg-muted/30 text-foreground" : "text-muted-foreground"}`;
  const switchGrade = (next: GradeKey) => { setGrade(next); navigate(equivalentGradePath(pathname, next)); setMenuOpen(false); };
  const switcher = <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-8 gap-1.5 border-border/50 px-2.5 text-xs" aria-label="Switch grade">{grade ? GRADES[grade].shortLabel : "Select grade"}<ChevronDown className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-44">{GRADE_KEYS.map((key) => <DropdownMenuItem key={key} onSelect={() => switchGrade(key)} className="justify-between"><span>{GRADES[key].label}</span>{grade === key && <Check className="h-4 w-4 text-primary" />}</DropdownMenuItem>)}</DropdownMenuContent>
  </DropdownMenu>;
  return <nav className="relative z-40 border-b border-border/40 bg-background/85 backdrop-blur-xl">
    <div className="container flex items-center justify-between gap-3 py-2">
      <Link to={grade ? `/grade/${grade}` : "/"} className="flex items-center gap-2 text-sm font-extrabold"><img src={logoAsset.url} alt="" className="h-7 w-7 object-contain" /><span>Physics<span className="gradient-text">HQ</span></span></Link>
      <div className="hidden items-center gap-1 lg:flex">{primary.map((item) => <Link key={item.to} to={item.to} className={linkClass(item.to)}>{item.label}</Link>)}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="More pages"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {secondary.map((item) => (
              <DropdownMenuItem key={item.to} asChild>
                <Link to={item.to} className={linkClass(item.to)}>{item.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {switcher}<span className="ml-1 border-l border-border/40 pl-3"><IstClock /></span>
      </div>
      <div className="flex items-center gap-2 lg:hidden">{switcher}<IstClock compact /><Button variant="ghost" size="icon" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((v) => !v)}>{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</Button></div>
    </div>
    {menuOpen && <div className="container flex flex-col gap-1 pb-4 lg:hidden">{[...primary, ...secondary].map((item) => <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={linkClass(item.to)}>{item.label}</Link>)}</div>}
  </nav>;
};
export default SiteNav;
