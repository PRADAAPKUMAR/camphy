

## Plan: Update PDFViewer Android Detection

Currently `isMobileOrTablet()` already matches Android via the regex `/android|iphone|ipad|ipod|mobile|tablet/i`, which routes to Google Docs Viewer. So Android devices are already covered.

However, the current code also matches iOS devices (iPhone/iPad) — which can render PDFs natively in Safari's iframe without needing Google Docs Viewer.

### Change in `src/components/PDFViewer.tsx`

Refine the viewer URL logic:
- **Android + TV**: Use Google Docs Viewer (`gview?embedded=true`)
- **iOS + Desktop**: Use native iframe (direct URL)

Update the `viewerUrl` memo to check `isAndroid()` or `isTV()` instead of the broad `isMobileOrTablet()`. This means iPhones/iPads will get the native viewer (which works well in Safari), while Android devices continue using Google Docs Viewer.

### Detection functions
```
isAndroid = () => /android/i.test(navigator.userAgent)
isTV = () => /smart-tv|smarttv|googletv|crkey|aftt|aftm|aftb|fire tv|silk|tv|hbbtv|netcast|viera|bravia|philipstv|roku/i.test(navigator.userAgent)
```

No other files need changes.

