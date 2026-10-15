/** Fixed display order for exam sessions: March, June, October. */
const RULES: [RegExp, number][] = [
  [/feb|march|mar\b/i, 0],
  [/may|june|jun\b/i, 1],
  [/oct|nov/i, 2],
];

export const sessionOrder = (session?: string | null): number => {
  if (!session) return 99;
  for (const [re, rank] of RULES) if (re.test(session)) return rank;
  return 98;
};

/** Comparator for session strings following the fixed March → June → October order. */
export const compareSessions = (a?: string | null, b?: string | null): number => {
  const diff = sessionOrder(a) - sessionOrder(b);
  return diff !== 0 ? diff : (a ?? "").localeCompare(b ?? "");
};
