import { useMemo } from "react";

interface PDFViewerProps {
  url: string;
}

const isAndroid = () => /android/i.test(navigator.userAgent);

const PDFViewer = ({ url }: PDFViewerProps) => {
  const viewerUrl = useMemo(() => {
    if (isAndroid()) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
    }
    return url;
  }, [url]);

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <iframe
        src={viewerUrl}
        className="h-full w-full border-0"
        title="PDF Viewer"
      />
    </div>
  );
};

export default PDFViewer;
