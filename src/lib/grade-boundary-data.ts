/** Reviewed Cambridge component thresholds only; never infer missing sessions. */
export interface ComponentThresholds {
  syllabus: "0625" | "9702";
  year: number;
  session: "s" | "m" | "w";
  component: string;
  maximum: 40;
  boundaries: readonly { grade: string; minimum: number }[];
  sourceUrl: string;
}

const series = (
  syllabus: ComponentThresholds["syllabus"],
  year: number,
  session: ComponentThresholds["session"],
  sourceUrl: string,
  rows: readonly (readonly [string, ...number[]])[],
): ComponentThresholds[] => rows.map(([component, ...marks]) => ({
  syllabus, year, session, component, maximum: 40, sourceUrl,
  boundaries: marks.map((minimum, index) => ({ grade: ["A", "B", "C", "D", "E", "F", "G"][index], minimum })),
}));

/** Transcribed from the individual-component tables, not overall option totals. */
export const COMPONENT_THRESHOLDS: readonly ComponentThresholds[] = [
  ...series("0625", 2025, "s", "https://www.cambridgeinternational.org/Images/741426-physics-0625-june-2025-grade-threshold-table.pdf", [
    ["21", 26, 22, 19, 18, 16, 15, 14],
    ["22", 27, 23, 19, 17, 15, 13, 11],
    ["23", 27, 25, 23, 20, 17, 15, 13],
  ]),
  ...series("0625", 2025, "w", "https://www.cambridgeinternational.org/Images/750712-physics-0625-november-2025-grade-threshold-table.pdf", [
    ["21", 27, 24, 21, 19, 17, 15, 13],
    ["22", 26, 23, 20, 18, 16, 14, 12],
    ["23", 27, 23, 20, 18, 16, 14, 12],
  ]),
  ...series("0625", 2024, "s", "https://www.cambridgeinternational.org/Images/716106-physics-0625-june-2024-grade-threshold-table.pdf", [
    ["21", 24, 21, 18, 16, 15, 14, 13],
    ["22", 25, 21, 17, 15, 14, 13, 12],
    ["23", 27, 25, 23, 20, 17, 15, 13],
  ]),
  ...series("0625", 2024, "w", "https://www.cambridgeinternational.org/Images/728881-physics-0625-november-2024-grade-threshold-table.pdf", [
    ["21", 26, 23, 20, 18, 16, 14, 12],
    ["22", 27, 23, 20, 18, 16, 14, 12],
    ["23", 27, 24, 21, 19, 17, 14, 11],
  ]),
  ...series("9702", 2025, "s", "https://www.cambridgeinternational.org/Images/740343-physics-9702-june-2025-grade-threshold-table.pdf", [
    ["11", 29, 26, 22, 19, 16], ["12", 30, 26, 22, 18, 15], ["13", 30, 26, 22, 19, 16],
  ]),
  ...series("9702", 2025, "w", "https://www.cambridgeinternational.org/Images/749728-physics-9702-november-2025-grade-threshold-table.pdf", [
    ["11", 29, 25, 22, 18, 15], ["12", 32, 27, 23, 20, 17], ["13", 29, 25, 22, 18, 15],
  ]),
  ...series("9702", 2024, "s", "https://www.cambridgeinternational.org/Images/715961-physics-9702-june-2024-grade-threshold-table.pdf", [
    ["11", 32, 29, 26, 22, 18], ["12", 30, 26, 22, 19, 15], ["13", 31, 28, 24, 21, 18],
  ]),
  ...series("9702", 2024, "w", "https://www.cambridgeinternational.org/Images/728015-physics-9702-november-2024-grade-threshold-table.pdf", [
    ["11", 29, 24, 20, 18, 14], ["12", 30, 25, 22, 19, 16], ["13", 29, 24, 20, 18, 14],
  ]),
];