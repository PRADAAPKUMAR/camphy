import {
  Atom, BarChart3, BookOpen, CalendarDays, ClipboardList, FilePlus2,
  FileText, FlaskConical, Folder, Gamepad2, Microscope, Target, Timer,
  UserRound, Brain, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const symbols = {
  atom: Atom, microscope: Microscope, flask: FlaskConical, papers: ClipboardList,
  theory: FileText, practice: Target, materials: BookOpen, worksheet: FilePlus2,
  quiz: Gamepad2, performance: BarChart3, timer: Timer, account: UserRound,
  calendar: CalendarDays, focus: Brain, folder: Folder,
};

export type GlassIconName = keyof typeof symbols;
export type GlassIconTone = "blue" | "violet" | "cyan" | "amber" | "green" | "pink" | "grade";

interface GlassIconProps {
  name?: GlassIconName;
  icon?: LucideIcon;
  tone?: GlassIconTone;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Decorative layered artwork; its adjacent heading supplies the accessible name. */
export default function GlassIcon({ name = "atom", icon, tone = "grade", size = "md", className }: GlassIconProps) {
  const Icon = icon ?? symbols[name];
  return (
    <span aria-hidden="true" className={cn("glass-icon", `glass-icon--${size}`, className)} data-tone={tone}>
      <span className="glass-icon__light" />
      <span className="glass-icon__back" />
      <span className="glass-icon__face"><Icon strokeWidth={1.6} /></span>
      <span className="glass-icon__spark" />
    </span>
  );
}
