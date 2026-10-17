import { Check, Loader2, TriangleAlert, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PdfProgressState } from "@/hooks/use-pdf-progress";

interface ActionProps {
  state: PdfProgressState | null;
  action: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  onClick: () => void;
  outline?: boolean;
}

export const PdfProgressButton = ({ state, action, label, icon: Icon, disabled, onClick, outline }: ActionProps) => {
  const current = state?.action === action ? state : null;
  const active = current?.status === "working" || current?.status === "complete";
  return <Button onClick={onClick} disabled={disabled} variant={outline ? "outline" : "default"}
    aria-busy={current?.status === "working"} className={`pdf-action relative h-11 w-full min-w-0 overflow-hidden gap-2 ${active ? "pdf-action-active" : ""}`}>
    {active && <span aria-hidden="true" className="pdf-action-fill absolute inset-0 origin-left" style={{ transform: `scaleX(${current.percent / 100})` }} />}
    <span className="relative flex min-w-0 items-center justify-center gap-2">
      {current?.status === "complete" ? <Check className="pdf-complete-check h-4 w-4 shrink-0" /> : current?.status === "working" ? <Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" /> : <Icon className="h-4 w-4 shrink-0" />}
      <span className="whitespace-normal text-center leading-tight">{current?.status === "complete" ? "Ready!" : current?.status === "working" ? `Preparing · ${current.percent}%` : label}</span>
    </span>
  </Button>;
};

export const PdfGenerationProgress = ({ state }: { state: PdfProgressState | null }) => {
  if (!state) return null;
  const error = state.status === "error";
  const stage = state.percent < 60 ? 0 : state.percent < 85 ? 1 : state.percent < 100 ? 2 : 3;
  return <div className="pdf-progress-hud mt-3 min-w-0 rounded-lg border border-grade-border p-3">
    <div className="flex items-start gap-2 text-sm" role="status" aria-live="polite" aria-atomic="true">
      {error ? <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> : state.status === "complete" ? <Check className="pdf-complete-check mt-0.5 h-4 w-4 shrink-0 text-grade" /> : null}
      <span className="min-w-0 flex-1 break-words">{state.message}</span>
      {!error && <span className="shrink-0 font-mono text-xs text-grade">{state.percent}%</span>}
    </div>
    {!error && <>
      <div role="progressbar" aria-label="PDF preparation" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.percent} aria-valuetext={state.message} className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="pdf-progress-beam h-full origin-left rounded-full" style={{ transform: `scaleX(${state.percent / 100})` }} />
      </div>
      <div aria-hidden="true" className="mt-2 grid grid-cols-4 gap-2 text-[10px] sm:text-xs">
        {["Assets", "Pages", "Compile", "Ready"].map((label, index) => <span key={label} className={index <= stage ? "text-grade" : "text-muted-foreground"}>{label}</span>)}
      </div>
    </>}
  </div>;
};