import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const DriveViewerPage = () => {
  const [params] = useSearchParams();
  const url = params.get("url") || "";

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
        <span className="text-sm text-muted-foreground truncate">Google Drive Viewer</span>
      </header>
      <iframe
        src={embedUrl}
        className="flex-1 w-full border-0"
        title="Google Drive Viewer"
        allow="autoplay"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
};

export default DriveViewerPage;
