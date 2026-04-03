import { useSearchParams } from "react-router-dom";
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
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <span className="text-sm font-medium text-foreground truncate">{title}</span>
      </header>
      <iframe
        src={embedUrl}
        className="flex-1 w-full border-0"
        title={title}
        allow="autoplay"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default DriveViewerPage;
