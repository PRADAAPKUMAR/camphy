const getSupabase = () => import("@/integrations/supabase/client").then((m) => m.supabase);

export type QuestionImageMap = Record<number, string>;

/**
 * Signed URLs for every uploaded question image of a paper, keyed by question
 * number. Papers with no uploaded images resolve to an empty map, so callers
 * can fall back to the PDF exam.
 */
export const fetchQuestionImages = async (paperId: string): Promise<QuestionImageMap> => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.functions.invoke("sign-question-images", {
    body: { paper_id: paperId },
  });
  if (error) return {};
  const map: QuestionImageMap = {};
  for (const [k, v] of Object.entries((data?.images ?? {}) as Record<string, string>)) {
    const q = Number(k);
    if (Number.isInteger(q) && typeof v === "string") map[q] = v;
  }
  return map;
};

/**
 * Pulls a question number out of an uploaded filename. Handles the common
 * Cambridge naming shapes: `9702_s23_12_q07.jpg`, `q7.jpg`, `question-07.jpg`,
 * `...-07.jpg`.
 */
export const questionNumberFromFilename = (filename: string): number | null => {
  const base = filename.replace(/\.[a-z0-9]+$/i, "");
  const patterns = [
    /(?:^|[^a-z0-9])q(?:uestion)?[\s_-]?(\d{1,3})(?![0-9])/i,
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

export const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });

export const imageDimensions = (file: File): Promise<{ width: number; height: number } | null> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
