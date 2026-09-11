## Technical details

- Store the uploaded bitmap through the project asset flow and import its URL for the navigation and PDF loader. The artwork will not be redrawn.
- Keep the site’s real brand styling: Inter, extra-bold weight, tight tracking, with a print-safe solid treatment in PDFs. jsPDF cannot reproduce the website gradient text reliably for printing, so the PDF brand will use embedded Inter ExtraBold where feasible and a deterministic bold fallback if font loading fails.
- Extend worksheet metadata with the resolved title and marks preference. The PDF uses the number of successfully loaded questions, so the denominator always matches the actual worksheet.
- Reserve first-page question space from the new full header baseline. On page breaks, reset to the compact continuation-header baseline instead of the current top margin. The existing “fit whole image or move it” calculation stays unchanged apart from that baseline.
- Add `Name`, `Class`, `Date`, and `Time` lines without placing answers on the student copy.
- Keep the answer-key list and optional source traceability unchanged beneath its new branded heading.

## Verification

- Add focused automated checks for title defaults, custom-title precedence, marks on/off, `/10`, `/20`, `/40`, first-page versus continuation headers, and answer-key title reuse.
- Verify the generator interface at mobile and desktop widths.
- Generate and visually inspect representative PDF fixtures, checking logo quality, writable marks space, no student answers, intact aspect ratios, and no split question images.
- Recheck the multi-topic request payload and combined-topic summary to confirm the header work did not alter selection behaviour.
