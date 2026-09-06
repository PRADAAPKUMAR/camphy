/**
 * Cambridge MCQ question-image filename parsing.
 *
 * Recognised shape (separators can be `_`, `-`, space or `.`):
 *   9702_s23_12_q07.jpg  -> AS LEVEL, V2, May/June 2023, question 7
 *   0625_w22_22_q7.png   -> IGCSE, EXTENDED MCQ-V2, Oct/Nov 2022, question 7
 *
 * The parsed paper description is matched against the existing `papers` rows,
 * so images can be dropped in bulk and routed to the right paper folder.
 */

export interface ParsedMcqImageName {
  syllabus_code: string;
  session: string;
  year: number;
  component: string;
  level: string;
  paper_code: string;
  question: number | null;
}

const IGCSE_CODES = new Set(["0625", "0972", "0654", "0653"]);

const SESSIONS: Record<string, string> = {
  s: "May / June",
  m: "Feb/March",
  w: "October / November",
};

export const sessionFromLetter = (letter: string) => SESSIONS[letter.toLowerCase()] ?? null;

/** Question number from a filename (`q07`, `question-7`, trailing `-07`). */
export const questionFromName = (base: string): number | null => {
  const patterns = [
    /(?:^|[^a-z0-9])q(?:uestion)?[\s._-]?(\d{1,3})(?![0-9])/i,
    /(\d{1,3})\s*$/,
  ];
  for (const re of patterns) {
    const m = base.match(re);
    if (m) {
      const n = Number(m[1]);
      if (Number.isInteger(n) && n >= 1 && n <= 100) return n;
    }
  }
  return null;
};

const paperCodeFor = (syllabus: string, component: string): string | null => {
  const paper = Number(component[0]);
  const variant = Number(component[1] ?? "1") || 1;
  if (IGCSE_CODES.has(syllabus)) {
    if (paper === 1) return `CORE MCQ-V${variant}`;
    if (paper === 2) return `EXTENDED MCQ-V${variant}`;
    return null;
  }
  if (paper === 1) return `V${variant}`;
  return null;
};

/**
 * Parses `<syllabus>_<session><yy>_<component>[_q<n>]` out of a filename,
 * tolerating extra text around it.
 */
export const parseMcqImageName = (filename: string): ParsedMcqImageName | null => {
  const name = (filename.split("/").pop() ?? filename).trim();
  const base = name.replace(/\.[a-z0-9]+$/i, "");
  const m = base.match(/(\d{4})[\s._-]*([smw])(\d{2})[\s._-]*(\d{2})(?![0-9])/i);
  if (!m) return null;

  const [, syllabus_code, letter, yy, component] = m;
  const session = sessionFromLetter(letter);
  const paper_code = paperCodeFor(syllabus_code, component);
  if (!session || !paper_code) return null;

  return {
    syllabus_code,
    session,
    year: 2000 + Number(yy),
    component,
    level: IGCSE_CODES.has(syllabus_code) ? "IGCSE" : "AS LEVEL",
    paper_code,
    question: questionFromName(base.slice(m.index! + m[0].length) || base),
  };
};

export interface PaperRow {
  id: string;
  level: string | null;
  paper_code: string | null;
  session: string | null;
  year: number | null;
}

const norm = (v?: string | null) => (v ?? "").toLowerCase().replace(/\s+/g, "");

/** Finds the existing paper row a parsed filename belongs to. */
export const matchPaper = (papers: PaperRow[], parsed: ParsedMcqImageName): PaperRow | null =>
  papers.find(
    (p) =>
      norm(p.level) === norm(parsed.level) &&
      norm(p.paper_code) === norm(parsed.paper_code) &&
      norm(p.session) === norm(parsed.session) &&
      Number(p.year) === parsed.year,
  ) ?? null;

export const paperLabel = (p: PaperRow) =>
  `${p.level} · ${p.paper_code} · ${p.session} ${p.year}`;
