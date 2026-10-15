export const STUDY_COLORS = [
  { key: "study-1", label: "Blue", hsl: "217 91% 60%" },
  { key: "study-2", label: "Green", hsl: "152 60% 45%" },
  { key: "study-3", label: "Amber", hsl: "32 95% 58%" },
  { key: "study-4", label: "Violet", hsl: "280 70% 65%" },
  { key: "study-5", label: "Pink", hsl: "340 80% 62%" },
  { key: "study-6", label: "Cyan", hsl: "190 85% 52%" },
] as const;

export type StudyColorKey = (typeof STUDY_COLORS)[number]["key"];

export const colorHsl = (key: string) =>
  STUDY_COLORS.find((c) => c.key === key)?.hsl ?? STUDY_COLORS[0].hsl;

/** Convert an "H S% L%" token into rgb triplet for jsPDF */
export const hslToRgb = (hsl: string): [number, number, number] => {
  const [h, s, l] = hsl.replace(/%/g, "").split(/\s+/).map(Number);
  const sN = s / 100;
  const lN = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sN * Math.min(lN, 1 - lN);
  const f = (n: number) => lN - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
};