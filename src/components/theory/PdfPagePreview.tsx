import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

/** Render the extracted range locally, including on browsers without an embedded PDF viewer. */
export default function PdfPagePreview({ blob, startPage }: { blob: Blob; startPage: number }) {
  const [pages, setPages] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    let loadingTask: { destroy: () => Promise<void> } | undefined;
    setPages([]); setComplete(false); setFailed(false);
    const render = async () => {
      const pdfjs = await import("pdfjs-dist");
      const data = new Uint8Array(await blob.arrayBuffer());
      if (!active) return;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      const task = pdfjs.getDocument({ data, isEvalSupported: false });
      loadingTask = task;
      const document = await task.promise;
      for (let number = 1; number <= document.numPages; number += 1) {
        if (!active) return;
        const page = await document.getPage(number);
        const size = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(2, 1100 / size.width) });
        const canvas = window.document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas rendering is unavailable");
        await page.render({ canvasContext: context, viewport }).promise;
        const image = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not render page")), "image/png"));
        if (!active) return;
        urls.push(URL.createObjectURL(image));
        setPages([...urls]);
        page.cleanup();
      }
      if (active) setComplete(true);
    };
    render().catch(() => { if (active) setFailed(true); });
    return () => { active = false; void loadingTask?.destroy(); urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [blob]);

  return <div className="h-full space-y-4 overflow-y-auto bg-muted/20 p-3" aria-label="Question pages">
    {pages.map((url, index) => <figure key={url} className="mx-auto max-w-3xl">
      <figcaption className="mb-2 text-center text-xs text-muted-foreground">Original page {startPage + index}</figcaption>
      <a href={url} target="_blank" rel="noopener noreferrer" className="block rounded border border-border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Enlarge original page ${startPage + index}`}>
        <img src={url} alt={`Question preview, original page ${startPage + index}`} className="h-auto w-full" />
      </a>
    </figure>)}
    {failed ? <p role="alert" className="p-5 text-center text-sm">Pages could not be rendered here. Use Open PDF to view the question.</p> : !complete && <p role="status" className="flex items-center justify-center gap-2 p-5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Rendering question pages…</p>}
  </div>;
}
