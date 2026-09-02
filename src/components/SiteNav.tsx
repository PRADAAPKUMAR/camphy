import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, MoreHorizontal, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import IstClock from "@/components/IstClock";


const PRIMARY_NAV = [
  { label: "Papers", to: "/papers" },
  { label: "Topic Practice", to: "/topic-practice" },
  { label: "Study Materials", to: "/materials" },
  { label: "Performance", to: "/performance" },
];

const SECONDARY_NAV = [
  { label: "Study Tools", to: "/study-tools" },
  { label: "About", to: "/about" },
];

const isActive = (pathname: string, to: string) =>
  pathname === to || (to !== "/" && pathname.startsWith(`${to}/`));

const SiteNav = () => {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const linkClass = (to: string) =>
    `rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors hover:bg-muted/30 hover:text-foreground ${
      isActive(pathname, to) ? "bg-muted/30 text-foreground" : "text-muted-foreground"
    }`;

  return (
    <nav className="relative z-40 border-b border-border/40 bg-background/85 backdrop-blur-xl">
      <div className="container flex items-center justify-between py-2">
        <Link to="/" className="flex items-center gap-2 text-sm font-extrabold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
            <Zap className="h-3.5 w-3.5 text-primary" />
          </span>
          Physics<span className="gradient-text">HQ</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {PRIMARY_NAV.map((item) => (
            <Link key={item.to} to={item.to} className={linkClass(item.to)}>
              {item.label}
            </Link>
          ))}
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMoreOpen((open) => !open)}
              onBlur={() => window.setTimeout(() => setMoreOpen(false), 120)}
              aria-label="More pages"
              aria-expanded={moreOpen}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {moreOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-border/40 bg-card/95 p-1 shadow-lg backdrop-blur">
                {SECONDARY_NAV.map((item) => (
                  <Link key={item.to} to={item.to} className={`block ${linkClass(item.to)}`}>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <span className="ml-2 border-l border-border/40 pl-3">
            <IstClock />
          </span>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <IstClock compact />
          <Button
            variant="ghost"
            size="icon"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="container flex flex-col gap-1 pb-4 md:hidden">
          {[...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={linkClass(item.to)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default SiteNav;