import { useMemo, memo } from "react";

interface PDFViewerProps {
  url: string;
}

const isMobileOrTV = () => {
  const ua = navigator.userAgent;
  return /android|iphone|ipad|ipod|mobile|smart-tv|smarttv|googletv|crkey|aftt|aftm|aftb|fire tv|silk/i.test(ua);
};

const PDFViewer = memo(({ url }: PDFViewerProps) => {
  const viewerUrl = useMemo(() => {
    if (isMobileOrTV()) {
      // Use Mozilla's PDF.js viewer for smooth multi-page scrolling on mobile & TV
      return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`;
    }
    return url;
  }, [url]);

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <iframe
        src={viewerUrl}
        className="h-full w-full border-0"
        title="PDF Viewer"
        allow="fullscreen"
        style={{ WebkitOverflowScrolling: "touch", overflowY: "auto" }}
      />
    </div>
  );
});

PDFViewer.displayName = "PDFViewer";

export default PDFViewer;