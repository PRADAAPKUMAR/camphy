/**
 * Cambridge MCQ question-image filename parsing.
 *
 * Recognised shape (separators can be `_`, `-`, space or `.`):
 *   9702_m20_12_q01.jpg  -> AS LEVEL, Feb/March 2020, component 12, V2, Q1
 *   9702_s23_12_q07.jpg  -> AS LEVEL, May/June 2023, component 12, V2, Q7
 *   0625_w22_22_q07.png  -> IGCSE, Oct/Nov 2022, component 22, EXTENDED MCQ-V2, Q7
 *
 * Matching against the existing `papers` rows is done on canonical values
 * (canonical level + canonical session + year + paper_code), never on exact
 * human-readable strings, because the table mixes labels such as
 * "May / June" (AS) and "June" (IGCSE).
 */

export interface ParsedMcqImageName {
  syllabus_code: string;
  /** Canonical session code: "s" | "m" | "w" */
  session_code: string;
  /** Human-readable session label for display. */
  session: string;
  year: number;
  component: string;
  /** Canonical level: "igcse" | "aslevel" */
  level_code: string;
  level: string;
  paper_code: string;
  question: number | null;
}

const IGCSE_CODES = new Set(["0625", "0972", "0654", "0653"]);

const SESSION_LABELS: Record<string, string> = {
  s: "May / June",
  m: "Feb/March",
  w: "October / November",
};

const squash = (v?: string | null) =>
  (v ?? "").toLowerCase().replace(/[\s._\-/]+/g, "");

/** Canonical level code for any spelling of the level. */
export const canonicalLevel = (value?: string | null): string | null => {
  const v = squash(value);
  if (!v) return null;
  if (v.startsWith("igcse") || v.startsWith("0625") || v.startsWith("0972")) return "igcse";
  if (v.startsWith("as") || v.startsWith("alevel") || v.startsWith("a2") || v.startsWith("9702"))
    return "aslevel";
  return v;
};

/** Canonical Cambridge session code ("s", "m", "w") for any spelling. */
export const canonicalSession = (value?: string | null): string | null => {
  const v = squash(value);
  if (!v) return null;
  if (v === "s" || v === "m" || v === "w") return v;
  if (v.startsWith("mayjune") || v.startsWith("june") || v.startsWith("may") || v === "summer")
    return "s";
  if (
    v.startsWith("febmarch") ||
    v.startsWith("februarymarch") ||
    v.startsWith("feb") ||
    v.startsWith("march")
  )
    return "m";
  if (
    v.startsWith("octnov") ||
    v.startsWith("octobernovember") ||
    v.startsWith("oct") ||
    v.startsWith("nov") ||
    v === "winter"
  )
    return "w";
  return null;
};

export const sessionFromLetter = (letter: string) =>
  SESSION_LABELS[letter.toLowerCase()] ?? null;

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
  const session_code = canonicalSession(letter);
  const session = sessionFromLetter(letter);
  const paper_code = paperCodeFor(syllabus_code, component);
  if (!session_code || !session || !paper_code) return null;

  const isIgcse = IGCSE_CODES.has(syllabus_code);

  return {
    syllabus_code,
    session_code,
    session,
    year: 2000 + Number(yy),
    component,
    level_code: isIgcse ? "igcse" : "aslevel",
    level: isIgcse ? "IGCSE" : "AS LEVEL",
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

/** Finds the existing paper row a parsed filename belongs to. */
export const matchPaper = (papers: PaperRow[], parsed: ParsedMcqImageName): PaperRow | null =>
  papers.find(
    (p) =>
      canonicalLevel(p.level) === parsed.level_code &&
      squash(p.paper_code) === squash(parsed.paper_code) &&
      canonicalSession(p.session) === parsed.session_code &&
      Number(p.year) === parsed.year,
  ) ?? null;

export const paperLabel = (p: PaperRow) =>
  `${p.level} · ${p.paper_code} · ${p.session} ${p.year}`;
