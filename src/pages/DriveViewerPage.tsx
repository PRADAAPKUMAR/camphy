import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const DriveViewerPage = () => {
  const [params] = useSearchParams();
  const url = params.get("url") || "";
  const title = params.get("title") || "Document";

  // Convert Google Drive file link to embeddable preview
  const embedUrl = url.replace(/\/file\/d\/([^/]+).*/, "/file/d/$1/preview");

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
        <iframe
          src={embedUrl}
          className="h-full w-full border-0"
          title="Google Drive Viewer"
          allow="autoplay"
          sandbox="allow-scripts allow-same-origin allow-popups"
          style={{ minHeight: "100%", minWidth: "100%" }}
        />
      </div>
    </div>
  );
};

export default DriveViewerPage;
