import { useMemo, memo } from "react";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDFViewerProps {
  url: string;
  title?: string;
}

const isAndroid = () => /android/i.test(navigator.userAgent);

const PDFViewer = memo(({ url, title = "Physics question paper" }: PDFViewerProps) => {
  const viewerUrl = useMemo(() => {
    if (isAndroid()) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
    }
    return url;
  }, [url]);

  return (
    <div className="flex h-full flex-col bg-muted/30 [contain:paint] [isolation:isolate] [transform:translateZ(0)]">
      <div className="flex shrink-0 justify-end border-b border-border px-2 py-1">
        <Button asChild variant="ghost" size="sm"><a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${title} in a new tab`}><ExternalLink className="mr-2 h-4 w-4" />Open PDF</a></Button>
      </div>
      <iframe
        src={viewerUrl}
        className="min-h-0 flex-1 w-full border-0 [transform:translateZ(0)]"
        title={title}
        loading="lazy"
      />
    </div>
  );
});

PDFViewer.displayName = "PDFViewer";

export default PDFViewer;