import type { ComponentPropsWithoutRef } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type GlassIconProps = ComponentPropsWithoutRef<"span"> & { icon?: LucideIcon };

/** Decorative glass holder for the site's Lucide icons. Label the containing link/button. */
export function GlassIcon({ icon: Icon, children, className, ...props }: GlassIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("glass-icon inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-grade", className)}
      {...props}
    >
      {Icon ? <Icon className="h-5 w-5" /> : children}
    </span>
  );
}
