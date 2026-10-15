import { lazy, Suspense, useEffect, useState } from "react";
import { ExternalLink, Eye, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createTheoryQuestionPreview, type TheoryTopicalQuestion } from "@/lib/theory-topical-pdf";

const PdfPagePreview = lazy(() => import("./PdfPagePreview"));

interface Props {
  question: TheoryTopicalQuestion | null;
  selected: boolean;
  onClose: () => void;
  onAdd: (id: string) => void;
}

export default function TheoryQuestionPreview({ question, selected, onClose, onAdd }: Props) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setBlob(null); setUrl(null); setError(false);
    if (!question) return;
    let active = true;
    let objectUrl: string | undefined;
    const controller = new AbortController();
    createTheoryQuestionPreview(question, controller.signal).then((blob) => {
      if (!active) return;
      setBlob(blob);
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [question, attempt]);

  return <Dialog open={!!question} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="flex h-[90dvh] max-h-[90dvh] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-3 overflow-hidden p-4 sm:p-6">
      <DialogHeader className="shrink-0 pr-6">
        <DialogTitle className="flex items-center gap-2"><Eye className="h-4 w-4" />Question {question?.question_number} preview</DialogTitle>
        <DialogDescription>{question?.paper_code} · {question?.session} {question?.year} · Original pages {question?.start_page}–{question?.end_page}</DialogDescription>
      </DialogHeader>
      {question?.shared_page_warning && <p className="shrink-0 text-xs text-muted-foreground">This question shares pages with another question. Both may appear in the preview and generated PDF.</p>}
      {url && <div className="flex shrink-0 justify-end"><Button variant="outline" size="sm" asChild><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Open PDF</a></Button></div>}
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
        {blob ? <Suspense fallback={<p role="status" className="p-5 text-sm">Preparing page preview…</p>}><PdfPagePreview blob={blob} startPage={question?.start_page ?? 1} /></Suspense> : error ? <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center"><p className="text-sm">The question preview could not be loaded.</p><Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>Try again</Button></div> : <div role="status" className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading question pages…</div>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Original PDF pages, with diagrams and equations preserved.</p>
        <Button disabled={selected || !question} className="gap-2" onClick={() => { if (question) onAdd(question.mapping_id); }}><Plus className="h-4 w-4" />{selected ? "Already in your PDF" : "Add to your PDF"}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
