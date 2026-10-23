import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, Search, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export default function TheoryPdfReader({ url, start = 1, end, title, searchable = false }: { url: string; start?: number; end?: number; title: string; searchable?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(start);
  const [zoom, setZoom] = useState(1);
  const [term, setTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<number[]>([]);
  const [searched, setSearched] = useState(false);
  const [failed, setFailed] = useState(false);
  const searchRun = useRef(0);
  const last = Math.min(end ?? document?.numPages ?? start, document?.numPages ?? end ?? start);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(200, entry.contentRect.width - 24)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { setPage(start); setDocument(null); setFailed(false); setMatches([]); setSearched(false); searchRun.current += 1; }, [url, start, end]);
  const search = async () => {
    if (!document || !term.trim()) return;
    const run = ++searchRun.current;
    const query = term.trim().toLowerCase();
    setSearching(true);
    try {
      const found: number[] = [];
      for (let n = 1; n <= document.numPages; n++) {
        const text = await (await document.getPage(n)).getTextContent();
        if (text.items.map((item) => "str" in item ? item.str : "").join(" ").toLowerCase().includes(query)) found.push(n);
        if (run !== searchRun.current) return;
      }
      setMatches(found); setSearched(true);
      if (found[0]) setPage(found[0]);
    } catch { setMatches([]); setSearched(true); } finally { if (run === searchRun.current) setSearching(false); }
  };
  useEffect(() => () => { searchRun.current += 1; }, []);
  return <div className="flex min-h-0 flex-1 flex-col" aria-label={title}>
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/40 p-2">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" title="Previous PDF page" aria-label="Previous PDF page" disabled={!document || page <= start} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        <Input type="number" aria-label="PDF page number" min={start} max={last} value={page} onChange={(e) => { const n = Number(e.target.value); if (n >= start && n <= last) setPage(n); }} className="h-8 w-16 text-center" />
        <span className="text-xs text-muted-foreground">/ {document ? last : "…"}</span>
        <Button variant="ghost" size="icon" title="Next PDF page" aria-label="Next PDF page" disabled={!document || page >= last} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" title="Zoom out" aria-label="Zoom out" disabled={zoom <= .5} onClick={() => setZoom((n) => Math.max(.5, n - .25))}><ZoomOut className="h-4 w-4" /></Button>
        <span className="w-10 text-center text-xs">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" title="Zoom in" aria-label="Zoom in" disabled={zoom >= 2} onClick={() => setZoom((n) => Math.min(2, n + .25))}><ZoomIn className="h-4 w-4" /></Button>
        <Button asChild variant="ghost" size="icon"><a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${title} in new tab`} title="Open original PDF"><ExternalLink className="h-4 w-4" /></a></Button>
      </div>
      {searchable && <form className="flex w-full flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); void search(); }}>
        <Input value={term} onChange={(e) => { setTerm(e.target.value); setSearched(false); }} aria-label="Search mark scheme" placeholder="Search mark scheme" className="h-8 min-w-0 flex-1" />
        <Button type="submit" variant="outline" size="icon" aria-label="Find in mark scheme" title="Search" disabled={!document || searching || !term.trim()}>{searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
        {searched && <span role="status" className="text-xs text-muted-foreground">{matches.length ? `Found on ${matches.length} pages` : "No matches"}</span>}
        {matches.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => setPage(matches[(matches.indexOf(page) + 1) % matches.length])}>Next match</Button>}
      </form>}
    </div>
    <div ref={host} className="min-h-0 flex-1 overflow-auto bg-muted/30 p-3 [contain:paint] [isolation:isolate]">
      {failed ? <div className="space-y-3 p-6 text-center"><p className="text-sm text-muted-foreground">The PDF could not be displayed.</p><Button asChild variant="outline"><a href={url} target="_blank" rel="noopener noreferrer">Open original PDF</a></Button></div> : <Document file={url} onLoadSuccess={setDocument} onLoadError={() => setFailed(true)} loading={<div className="flex justify-center p-10"><Loader2 className="h-5 w-5 animate-spin text-grade" /></div>}>
        {document && (start > document.numPages ? <p className="text-sm text-destructive">This question's page mapping needs review.</p> : <Page pageNumber={page} width={width * zoom} loading={<Loader2 className="m-6 h-5 w-5 animate-spin text-grade" />} />)}
      </Document>}
    </div>
  </div>;
}