import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
}

const PDFViewer = ({ url }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);

  return (
    <div className="flex h-full flex-col bg-muted/30">
      {/* Controls */}
      <div className="flex items-center justify-center gap-4 border-b bg-card px-4 py-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          Page {pageNumber} of {numPages || "..."}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
          disabled={pageNumber >= numPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* PDF */}
      <div className="flex flex-1 items-start justify-center overflow-auto p-4">
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              Loading PDF...
            </div>
          }
          error={
            <div className="flex h-64 items-center justify-center text-destructive">
              Failed to load PDF
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            width={Math.min(800, window.innerWidth * 0.6)}
            renderTextLayer
            renderAnnotationLayer
          />
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;
