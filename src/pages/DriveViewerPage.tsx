import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const DriveViewerPage = () => {
  const [params] = useSearchParams();
  const url = params.get("url") || "";
  const title = params.get("title") || "Document";

  // Only allow Google Drive file links — never frame arbitrary URLs.
  const DRIVE_FILE_RE = /^https:\/\/(?:drive|docs)\.google\.com\/file\/d\/([A-Za-z0-9_-]+)(?:[/?#].*)?$/;
  const match = DRIVE_FILE_RE.exec(url);
  const embedUrl = match ? `https://drive.google.com/file/d/${match[1]}/preview` : null;

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border/40 px-4 py-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to={-1 as any} onClick={(e) => { e.preventDefault(); window.history.back(); }}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>
        <span className="text-base font-bold text-foreground truncate">{title}</span>
      </header>
      <div className="flex-1 w-full overflow-auto">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="h-full w-full border-0"
            title="Google Drive Viewer"
            allow="autoplay"
            sandbox="allow-scripts allow-same-origin allow-popups"
            style={{ minHeight: "100%", minWidth: "100%" }}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <p className="text-sm text-muted-foreground">
              This document link isn't a valid Google Drive file and can't be displayed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriveViewerPage;
