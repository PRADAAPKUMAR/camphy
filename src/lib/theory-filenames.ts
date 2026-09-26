/**
 * Cambridge past-paper filename parsing.
 *
 * Supported shape: <syllabus>_<session><yy>_<kind>_<component>.pdf
 *   9702_s23_qp_22.pdf  -> question paper, 9702/22, May/June 2023
 *   9702_s23_ms_22.pdf  -> mark scheme (official answer key) for the same paper
 */

export type TheoryFileKind = "qp" | "ms";

export interface ParsedTheoryFilename {
  syllabus_code: string;
  session: string;
  year: number;
  component: string;
  paper_code: string;
  kind: TheoryFileKind;
  level: string;
  /** Groups a question paper with its matching mark scheme. */
  key: string;
}

const SESSIONS: Record<string, string> = {
  s: "May/June",
  m: "February/March",
  w: "October/November",
};

const FILE_RE = /^([0-9]{4})_([smw])([0-9]{2})_(qp|ms)_([0-9]{1,2})\.pdf$/i;

/** IGCSE Physics syllabus codes (Cambridge + Cambridge International variants). */
const IGCSE_CODES = new Set(["0625", "0972", "0654", "0653"]);

export const levelForPaper = (syllabusCode: string, component: string): string => {
  if (IGCSE_CODES.has(syllabusCode)) return "IGCSE";
  const first = Number(component[0]);
  if (first >= 4) return "A2 Level";
  return "AS Level";
};

export const sessionLabel = (letter: string) => SESSIONS[letter.toLowerCase()] ?? "May/June";

export const parseTheoryFilename = (filename: string): ParsedTheoryFilename | null => {
  const name = filename.trim().split("/").pop() ?? filename;
  const match = FILE_RE.exec(name);
  if (!match) return null;

  const [, syllabus_code, sessionLetter, yy, kindRaw, component] = match;
  const kind = kindRaw.toLowerCase() as TheoryFileKind;
  const year = 2000 + Number(yy);
  const session = sessionLabel(sessionLetter);

  return {
    syllabus_code,
    session,
    year,
    component,
    paper_code: `${syllabus_code}/${component}`,
    kind,
    level: levelForPaper(syllabus_code, component),
    key: `${syllabus_code}_${sessionLetter.toLowerCase()}${yy}_${component}`,
  };
};

export const THEORY_LEVELS = ["IGCSE", "AS Level", "A2 Level"] as const;
