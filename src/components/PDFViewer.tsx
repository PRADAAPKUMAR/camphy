interface PDFViewerProps {
  url: string;
}

const PDFViewer = ({ url }: PDFViewerProps) => {
  const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <iframe
        src={googleViewerUrl}
        className="h-full w-full border-0"
        title="PDF Viewer"
        allow="autoplay"
      />
    </div>
  );
};

export default PDFViewer;
