

## COMPLETED: Update PDFViewer Android Detection

Updated `src/components/PDFViewer.tsx` to properly handle PDF viewing on different devices:

1. **Android + TV devices**: Now automatically use Google Docs Viewer from the start
2. **iOS + Desktop**: Continue to use native iframe with direct PDF URL

### Implementation Details

- Removed the fallback/retry logic for Android devices
- Simplified the component by removing `useGoogleFallback` state
- Android and TV devices now immediately load PDFs through Google Docs Viewer
- iOS devices render PDFs natively in Safari
- Desktop browsers use native PDF rendering

### Detection Functions
```typescript
isAndroid = () => /android/i.test(navigator.userAgent)
isTV = () => /smart-tv|smarttv|googletv|crkey|aftt|aftm|aftb|fire tv|silk|tv|hbbtv|netcast|viera|bravia|philipstv|roku/i.test(navigator.userAgent)
```

This ensures Android mobile and TV users can view PDFs side-by-side with the answer sheet without needing to open the PDF in a separate page.

