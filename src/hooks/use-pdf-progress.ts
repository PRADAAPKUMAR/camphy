import { useCallback, useEffect, useRef, useState } from "react";
import type { PdfProgressReporter, PdfProgressUpdate } from "@/lib/pdf-progress";

export interface PdfProgressState extends PdfProgressUpdate {
  action: string;
  status: "working" | "complete" | "error";
}

export const usePdfProgress = () => {
  const [state, setState] = useState<PdfProgressState | null>(null);
  const locked = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const reset = useCallback(() => { if (!locked.current) setState(null); }, []);
  const run = useCallback(async (action: string, task: (report: PdfProgressReporter) => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    if (mounted.current) setState({ action, percent: 0, message: "Preparing…", status: "working" });
    const report: PdfProgressReporter = async (update) => {
      if (mounted.current) setState({ ...update, action, status: update.percent === 100 ? "complete" : "working" });
      // Yield for a paint before CPU-heavy PDF work; only completion has a short visual hold.
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      await new Promise<void>((resolve) => setTimeout(resolve, update.percent === 100 && !reduced ? 240 : 0));
    };
    try { await task(report); }
    catch (error) {
      if (mounted.current) setState({ action, percent: 0, message: "Could not finish. Please try again.", status: "error" });
      throw error;
    } finally { locked.current = false; }
  }, []);
  return { state, run, reset };
};