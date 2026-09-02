import { useMemo, memo } from "react";

interface PDFViewerProps {
  url: string;
}

const isAndroid = () => /android/i.test(navigator.userAgent);

const PDFViewer = memo(({ url }: PDFViewerProps) => {
  const viewerUrl = useMemo(() => {
    if (isAndroid()) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
    }
    return url;
  }, [url]);

  return (
    <div className="flex h-full flex-col bg-muted/30 [contain:paint] [isolation:isolate] [transform:translateZ(0)]">
      <iframe
        src={viewerUrl}
        className="h-full w-full border-0 [transform:translateZ(0)]"
        title="PDF Viewer"
        loading="lazy"
      />
    </div>
  );
});

PDFViewer.displayName = "PDFViewer";

export default PDFViewer;