/**
 * Route-level module prefetching.
 * Maps a URL path to the lazy chunk that renders it, so hovering a tile can
 * warm the chunk before the click. Each chunk is imported at most once.
 */

type Loader = () => Promise<unknown>;

const loaders: Array<[RegExp, Loader]> = [
  [/^\/$/, () => import("@/pages/HomePage")],
  [/^\/papers$/, () => import("@/pages/Index")],
  [/^\/papers\/[^/]+$/, () => import("@/pages/SubjectPage")],
  [/^\/exam\//, () => import("@/pages/ExamPage")],
  [/^\/question-mode\//, () => import("@/pages/QuestionModePage")],
  [/^\/materials$/, () => import("@/pages/MaterialsPage")],
  [/^\/materials\/[^/]+$/, () => import("@/pages/MaterialsLevelPage")],
  [/^\/view-drive/, () => import("@/pages/DriveViewerPage")],
  [/^\/topic-practice$/, () => import("@/pages/TopicPracticePage")],
  [/^\/topic-practice\/[^/]+$/, () => import("@/pages/TopicLevelPage")],
  [/^\/topic-exam\//, () => import("@/pages/TopicExamPage")],
  [/^\/topical-mcq$/, () => import("@/pages/TopicalMcqPage")],
  [/^\/topical-mcq\/[^/]+$/, () => import("@/pages/TopicalMcqLevelPage")],
  [/^\/topical-mcq\/[^/]+\/[^/]+$/, () => import("@/pages/TopicalMcqSessionPage")],
  [/^\/topic-theory\//, () => import("@/pages/TopicTheoryPage")],
  [/^\/theory-papers$/, () => import("@/pages/TheoryPapersPage")],
  [/^\/theory-papers\/[^/]+$/, () => import("@/pages/TheoryLevelPage")],
  [/^\/theory-paper\//, () => import("@/pages/TheoryPaperPage")],
  [/^\/about$/, () => import("@/pages/AboutPage")],
  [/^\/study-tools$/, () => import("@/pages/StudyToolsPage")],
  [/^\/worksheet-generator$/, () => import("@/pages/WorksheetGeneratorPage")],
  [/^\/performance$/, () => import("@/pages/PerformancePage")],
];

const warmed = new Set<string>();

/** Preload the JS chunk for a route path. Safe to call repeatedly. */
export const prefetchRoute = (to: string) => {
  const path = to.split(/[?#]/)[0];
  const match = loaders.find(([re]) => re.test(path));
  if (!match) return;
  const key = match[0].source;
  if (warmed.has(key)) return;
  warmed.add(key);
  // Fire and forget — a failed prefetch must never surface to the user.
  match[1]().catch(() => warmed.delete(key));
};
