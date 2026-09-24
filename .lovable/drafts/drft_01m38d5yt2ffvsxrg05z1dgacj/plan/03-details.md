## Implementation details

- Reuse the existing explanation data flow and dialog, keyed by each worksheet item’s `paper_id` and original `question_number`.
- Place the explanation action beside the post-reveal next-question action.
- Add a confirmation dialog for ending an active quiz to prevent accidental taps.
- Preserve ties, rankings, speed points, restart, and grade navigation.
- Verify explanations only appear after reveal and early completion reaches the existing results board.
