export interface PaperPreset {
  label: string;
  minutes: number;
}

export interface PresetGroup {
  level: string;
  color: string; // css var token
  papers: PaperPreset[];
}

/** Cambridge Physics paper durations, grouped by level */
export const PAPER_PRESETS: PresetGroup[] = [
  {
    level: "IGCSE",
    color: "var(--study-6)",
    papers: [
      { label: "IGCSE P1 — Multiple Choice", minutes: 45 },
      { label: "IGCSE P2 — Multiple Choice (Ext)", minutes: 45 },
      { label: "IGCSE P3 — Theory (Core)", minutes: 75 },
      { label: "IGCSE P4 — Theory (Extended)", minutes: 75 },
      { label: "IGCSE P5 — Practical Test", minutes: 75 },
      { label: "IGCSE P6 — Alternative to Practical", minutes: 60 },
    ],
  },
  {
    level: "AS Level",
    color: "var(--study-1)",
    papers: [
      { label: "AS P1 — Multiple Choice", minutes: 75 },
      { label: "AS P2 — AS Structured Questions", minutes: 75 },
      { label: "AS P3 — Advanced Practical Skills", minutes: 120 },
    ],
  },
  {
    level: "A2 Level",
    color: "var(--study-4)",
    papers: [
      { label: "A2 P4 — A Level Structured Questions", minutes: 120 },
      { label: "A2 P5 — Planning, Analysis & Evaluation", minutes: 75 },
    ],
  },
  {
    level: "Quick drills",
    color: "var(--study-3)",
    papers: [
      { label: "Quick Drill", minutes: 15 },
      { label: "Topic Sprint", minutes: 30 },
      { label: "Mixed Practice", minutes: 60 },
    ],
  },
];
