export const GRADE_KEYS = ["igcse", "as", "a2"] as const;
export type GradeKey = (typeof GRADE_KEYS)[number];

export interface GradeDefinition {
  key: GradeKey;
  label: string;
  shortLabel: string;
  syllabus: string;
  description: string;
  dbLevel: string;
  worksheetLevel?: "IGCSE" | "AS LEVEL";
}

export const GRADES: Record<GradeKey, GradeDefinition> = {
  igcse: {
    key: "igcse",
    label: "IGCSE",
    shortLabel: "IGCSE",
    syllabus: "0625",
    description: "Cambridge IGCSE Physics",
    dbLevel: "IGCSE",
    worksheetLevel: "IGCSE",
  },
  as: {
    key: "as",
    label: "AS Level",
    shortLabel: "AS",
    syllabus: "9702",
    description: "Cambridge International AS Level Physics",
    dbLevel: "AS Level",
    worksheetLevel: "AS LEVEL",
  },
  a2: {
    key: "a2",
    label: "A2 Level",
    shortLabel: "A2",
    syllabus: "9702",
    description: "Cambridge International A Level Physics",
    dbLevel: "A2 Level",
  },
};

export const gradeFromLevel = (value?: string | null): GradeKey | null => {
  const normalized = decodeURIComponent(value ?? "").trim().toUpperCase().replace(/\s+/g, " ");
  if (["IGCSE", "IGCSE PHYSICS", "0625"].includes(normalized)) return "igcse";
  if (["AS", "AS LEVEL", "AS LEVEL PHYSICS"].includes(normalized)) return "as";
  if (["A2", "A2 LEVEL", "A LEVEL", "A LEVEL PHYSICS"].includes(normalized)) return "a2";
  return null;
};

export const isGradeKey = (value?: string): value is GradeKey =>
  !!value && GRADE_KEYS.includes(value.toLowerCase() as GradeKey);

export const gradePath = (grade: GradeKey) => `/grade/${grade}`;
export const gradeSectionPath = (grade: GradeKey, section: "mcq" | "theory" | "practice" | "materials" | "worksheet" | "performance") => {
  const definition = GRADES[grade];
  if (section === "mcq") return `/papers/${encodeURIComponent(definition.dbLevel)}`;
  if (section === "theory") return `/theory-papers/${encodeURIComponent(definition.dbLevel)}`;
  if (section === "practice") return `/topic-practice/${encodeURIComponent(definition.dbLevel)}`;
  if (section === "materials") return `/materials/${encodeURIComponent(definition.dbLevel)}`;
  if (section === "worksheet") return definition.worksheetLevel ? `/worksheet-generator/${grade}` : gradePath(grade);
  return `/performance/${grade}`;
};

export const equivalentGradePath = (pathname: string, grade: GradeKey) => {
  if (pathname.startsWith("/papers/")) return gradeSectionPath(grade, "mcq");
  if (pathname.startsWith("/theory-papers/")) return gradeSectionPath(grade, "theory");
  if (pathname.startsWith("/topic-practice/") || pathname.startsWith("/topical-mcq/")) return gradeSectionPath(grade, "practice");
  if (pathname.startsWith("/materials/")) return gradeSectionPath(grade, "materials");
  if (pathname.startsWith("/performance")) return gradeSectionPath(grade, "performance");
  if (pathname.startsWith("/worksheet-generator") && GRADES[grade].worksheetLevel) return gradeSectionPath(grade, "worksheet");
  return gradePath(grade);
};
