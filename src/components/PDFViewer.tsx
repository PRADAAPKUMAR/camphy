import { useMemo, memo, useState, useCallback, useEffect } from "react";

interface PDFViewerProps {
  url: string;
}

const isAndroid = () =>
  /android/i.test(navigator.userAgent);

const isTV = () =>
  /smart-tv|smarttv|googletv|crkey|aftt|aftm|aftb|fire tv|silk|tv|hbbtv|netcast|viera|bravia|philipstv|roku/i.test(navigator.userAgent);

const LOAD_TIMEOUT = 12000;

const PDFViewer = memo(({ url }: PDFViewerProps) => {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [retryKey, setRetryKey] = useState(0);
  const androidDevice = isAndroid();
  const tvDevice = isTV();

  const viewerUrl = useMemo(() => {
    if (androidDevice || tvDevice) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
    }
    return url;
  }, [androidDevice, tvDevice, url]);

  // Timeout fallback if onLoad never fires
  useEffect(() => {
    if (status !== "loading") return;
    const timer = setTimeout(() => {
      setStatus((s) => (s === "loading" ? "error" : s));
    }, LOAD_TIMEOUT);
    return () => clearTimeout(timer);
  }, [retryKey, status]);

  const handleRetry = useCallback(() => {
    setStatus("loading");
    setRetryKey((k) => k + 1);
  }, []);

  const handleFrameError = useCallback(() => {
    setStatus("error");
  }, []);

  return (
    <div className="flex h-full flex-col bg-muted/30 relative">
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading PDF…</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90">
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <p className="text-sm text-muted-foreground">
              PDF failed to load. This can happen on some devices.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                Open PDF directly
              </a>
            </div>
          </div>
        </div>
      )}

      <iframe
        key={retryKey}
        src={viewerUrl}
        className="h-full w-full border-0"
        title="PDF Viewer"
        allow="fullscreen"
        onLoad={() => setStatus("loaded")}
        onError={handleFrameError}
        style={{ WebkitOverflowScrolling: "touch", overflowY: "auto" }}
      />
    </div>
  );
});

PDFViewer.displayName = "PDFViewer";

export default PDFViewer;
