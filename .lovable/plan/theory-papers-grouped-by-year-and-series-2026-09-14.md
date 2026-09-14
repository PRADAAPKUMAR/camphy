# Theory papers grouped by year and series

## What will change
- Keep the existing Theory Past Papers level selection unchanged.
- On each theory level page, replace the flat paper list with year tabs, newest first.
- Within each selected year, group papers into Cambridge series sections such as February/March, May/June, and October/November.
- Keep each paper card’s question-paper and answer-key availability labels and existing navigation.
- Add matching loading and empty states without changing unrelated theory functionality.

## Technical details
- Reuse the existing session ordering helper used by MCQ past papers.
- Build year and series groups from the existing `theory_papers` query; no database changes are required.
- Sort papers consistently by paper code within each series.
- Verify the page builds and renders correctly at the current mobile viewport and desktop size.
