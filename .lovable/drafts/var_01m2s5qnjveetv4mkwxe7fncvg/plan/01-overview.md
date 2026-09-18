# Grade-first PhysicsHQ navigation

## Goal

Reorganize PhysicsHQ around **IGCSE, AS Level, and A2 Level**. The home page becomes a focused grade selector. Choosing a grade opens its dashboard with the resources available for that grade:

- MCQ Past Papers
- Theory Past Papers
- Practice
- Study Materials
- Worksheet Generator
- Performance

The active grade remains selected while students move between pages or use back navigation. A grade switcher in the header lets them change grade without returning home.

## Confirmed behavior

- **A2 Level:** hide Worksheet Generator because the current generator supports only IGCSE and AS.
- **Grade switching:** use a compact grade switcher in the header.
- Preserve the existing dark-blue PhysicsHQ visual identity, animations, paper grouping, practice modes, material folders, PDF generation, and local performance history.
- No database structure changes are required.
