## Implementation

### 1. Establish one grade model

- Create one canonical grade registry for route keys, display labels, database aliases, syllabus codes, icons, and feature availability.
- Normalize existing variations such as `AS`, `AS LEVEL`, and `AS Level` before comparing or linking.
- Add a small grade-state provider that reads the URL first and remembers the last valid grade locally. Direct links also update the remembered grade.

### 2. Replace the home page with grade selection

- Redesign `/` as three prominent grade choices: IGCSE, AS Level, and A2 Level.
- Each choice opens a grade dashboard at a stable, shareable grade URL.
- Move the current feature tiles off the general home page and onto the selected grade dashboard.

### 3. Build each grade dashboard

- Present the six requested destinations as grade-aware tiles, with counts where existing data already supplies them.
- IGCSE and AS show all six tiles.
- A2 omits Worksheet Generator rather than showing an unavailable action.
- Practice opens the selected grade’s existing practice choices, keeping both mapped topical MCQ and theory practice accessible where content exists.

### 4. Make navigation grade-aware

- Replace the current general-purpose links with grade-scoped links while a grade is active.
- Add the requested header grade switcher; changing it keeps the student in the equivalent section when that section exists, otherwise it opens the new grade dashboard.
- Update breadcrumbs, in-page back buttons, empty-state actions, footer links, and “keep improving” links to return to the active grade rather than an all-grade selector.
- Keep old public links working by resolving their level and forwarding users into the corresponding grade-aware experience.

### 5. Scope the destination pages

- **MCQ and Theory Papers:** enter directly at the chosen grade; preserve year and series grouping.
- **Practice:** remove repeated grade picking and filter both MCQ and theory choices to the active grade.
- **Study Materials:** enter the active grade’s folder browser; preserve folder URL state and Drive viewer behavior.
- **Worksheet Generator:** inherit IGCSE or AS from the grade dashboard, remove the redundant grade selector in this entry flow, and reset dependent selections safely when switching grade.
- **Performance:** filter all summaries, charts, topics, mistakes, and recent attempts to the active grade. Clearing history remains an explicit all-history action only if clearly labelled; otherwise it clears the visible grade’s history.
- Detail and exam pages synchronize the active grade from the loaded paper/question so direct links and browser-back navigation remain consistent.

### 6. Compatibility and verification

- Update route prefetching and transition destinations for the new grade dashboard paths.
- Verify IGCSE, AS, and A2 on desktop and mobile.
- Test switching grades from every main section, browser back/forward, refresh, and direct links.
- Confirm no page unexpectedly returns to an all-grade list.
- Confirm A2 has no worksheet tile, while IGCSE and AS worksheet requests use the selected grade.
- Confirm performance records never leak between grade views and existing saved history remains readable.
