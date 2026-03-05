

## Issues Identified

1. **PDF not loading on mobile/tablet**: Mozilla's PDF.js viewer fails due to CORS restrictions — it cannot fetch the PDF URL from a different origin. The previous Google Docs viewer worked for mobile.

2. **Smart TV PDF loading failure**: Same CORS issue with PDF.js viewer. Google Docs viewer is also unreliable on TV browsers. Will use Google Docs viewer as primary fallback for all non-desktop, with a retry/fallback UI.

3. **Safari crash / app not loading**: `requestIdleCallback` is not available in Safari (only added in Safari 16.4+, and older Safari versions lack it). The current code references it without `window.` prefix, which can throw a ReferenceError in Safari, breaking the entire app.

## Plan

### 1. Fix Safari compatibility in `src/App.tsx`
- Change bare `requestIdleCallback` references to `window.requestIdleCallback` (or use `typeof requestIdleCallback !== 'undefined'`) to prevent ReferenceError in Safari versions that don't support it.

### 2. Rewrite `src/components/PDFViewer.tsx`
- **Mobile/Tablet**: Revert to Google Docs viewer (`https://docs.google.com/gview?embedded=true&url=...`) — this was working before.
- **Smart TV**: Use Google Docs viewer as well (best available option for limited TV browsers).
- **Desktop**: Keep native iframe with direct URL.
- **Add error/fallback UI**: Track iframe load state with `onLoad`/`onError`. Show a retry button and a "Open PDF directly" link if loading fails after a timeout (~10 seconds). Include a loading spinner while the PDF loads.
- Separate detection: `isMobile()` for phones/tablets, `isTV()` for smart TVs — both use Google Docs viewer.

### 3. Files changed
- `src/App.tsx` — Safari `requestIdleCallback` fix
- `src/components/PDFViewer.tsx` — Revert mobile viewer, add fallback UI

