interface PDFViewerProps {
  url: string;
}

const PDFViewer = ({ url }: PDFViewerProps) => {
  return (
    <div className="flex h-full flex-col bg-muted/30">
      <iframe
        src={url}
        className="h-full w-full border-0"
        title="PDF Viewer"
      />
    </div>
  );
};

export default PDFViewer;
