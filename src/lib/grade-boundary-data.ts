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

export const COMPONENT_THRESHOLDS: readonly ComponentThresholds[] = [];