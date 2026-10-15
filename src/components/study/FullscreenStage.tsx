import { ReactNode, useEffect } from "react";
import { Minimize2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

const FullscreenStage = ({ open, onClose, children }: Props) => {
  useEffect(() => {
    if (!open) return;
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/98 backdrop-blur-xl p-6">
      <button
        type="button"
        onClick={onClose}
        aria-label="Exit full screen"
        className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <Minimize2 className="h-4 w-4" /> Exit
      </button>
      <div className="flex w-full max-w-3xl flex-col items-center">{children}</div>
    </div>
  );
};

export default FullscreenStage;