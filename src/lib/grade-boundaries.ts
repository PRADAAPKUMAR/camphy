import { gradeFromLevel } from "@/lib/grades";
import { canonicalSession } from "@/lib/mcq-filenames";
import { COMPONENT_THRESHOLDS, type ComponentThresholds } from "@/lib/grade-boundary-data";

export interface BoundaryPaper {
  level: string | null;
  year: number | null;
  session: string | null;
  paper_code: string | null;
}

export type GradeEstimate =
  | { available: false; reason: string }
  | {
      available: true;
      grade: string;
      threshold: ComponentThresholds;
      nextGrade: { grade: string; marksNeeded: number; minimum: number } | null;
    };

/** Existing paper labels encode the variant, not the full component number. */
export const componentForBoundary = (paper: BoundaryPaper): string | null => {
  const grade = gradeFromLevel(paper.level);
  const code = (paper.paper_code ?? "").trim().toUpperCase().replace(/[\s_-]+/g, "");
  if (grade === "as") {
    const variant = code.match(/^V([123])$/);
    if (variant) return `1${variant[1]}`;
    return /^1[123]$/.test(code) ? code : null;
  }
  if (grade === "igcse") {
    const variant = code.match(/^(CORE|EXTENDED)MCQV([123])$/);
    if (variant) return `${variant[1] === "CORE" ? "1" : "2"}${variant[2]}`;
    return /^[12][123]$/.test(code) ? code : null;
  }
  return null;
};

export const estimateComponentGrade = (
  paper: BoundaryPaper,
  score: number,
  totalQuestions: number,
): GradeEstimate => {
  if (totalQuestions !== 40 || !Number.isInteger(score) || score < 0 || score > 40) {
    return { available: false, reason: "A complete 40-question paper is required." };
  }
  const grade = gradeFromLevel(paper.level);
  const component = componentForBoundary(paper);
  const session = canonicalSession(paper.session);
  if (!component || !session || !paper.year || (grade !== "igcse" && grade !== "as")) {
    return { available: false, reason: "This paper could not be matched to a Cambridge component." };
  }
  const syllabus = grade === "igcse" ? "0625" : "9702";
  const threshold = COMPONENT_THRESHOLDS.find(
    (row) => row.syllabus === syllabus && row.year === paper.year && row.session === session && row.component === component,
  );
  if (!threshold) {
    return { available: false, reason: "Verified thresholds for this paper are not yet available." };
  }
  const boundaries = [...threshold.boundaries].sort((a, b) => b.minimum - a.minimum);
  const achievedIndex = boundaries.findIndex((boundary) => score >= boundary.minimum);
  const achieved = boundaries[achievedIndex];
  const next = achievedIndex === -1 ? boundaries.at(-1) : boundaries[achievedIndex - 1];
  return {
    available: true,
    grade: achieved?.grade ?? "U",
    threshold,
    nextGrade: next ? { grade: next.grade, minimum: next.minimum, marksNeeded: next.minimum - score } : null,
  };
};