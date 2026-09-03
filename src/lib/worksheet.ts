const getSupabase = () => import("@/integrations/supabase/client").then((m) => m.supabase);

export interface WorksheetItem {
  worksheet_number: number;
  paper_id: string;
  paper_code: string;
  year: number | null;
  session: string | null;
  level: string;
  question_number: number;
  correct_answer: string | null;
  topic_id: string | null;
  topic_name: string | null;
  image_url: string | null;
}

export interface WorksheetExclusion {
  paper_code: string;
  question_number: number;
  reason: string;
}

export interface WorksheetSelection {
  pool_size: number;
  requested?: number;
  items: WorksheetItem[];
  excluded: WorksheetExclusion[];
  error?: string;
}

export type WorksheetSource = "random" | "topic" | "paper" | "mistakes";

export interface WorksheetRequest {
  level?: string | null;
  source: WorksheetSource;
  paper_id?: string | null;
  topic_ids?: string[];
  refs?: { paper_id: string; question_number: number }[];
  count: number;
  shuffle: boolean;
}

/** Server-side selection: images + answer keys never leave the edge function unfiltered. */
export const fetchWorksheetSelection = async (req: WorksheetRequest): Promise<WorksheetSelection> => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.functions.invoke("worksheet-questions", { body: req });
  if (error) return { pool_size: 0, items: [], excluded: [], error: error.message };
  return {
    pool_size: data?.pool_size ?? 0,
    requested: data?.requested,
    items: (data?.items ?? []) as WorksheetItem[],
    excluded: (data?.excluded ?? []) as WorksheetExclusion[],
    error: data?.error,
  };
};

export interface LoadedImage {
  item: WorksheetItem;
  dataUrl: string;
  width: number;
  height: number;
}

const loadOne = (item: WorksheetItem): Promise<LoadedImage | null> =>
  new Promise((resolve) => {
    if (!item.image_url) return resolve(null);
    fetch(item.image_url)
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error("fetch failed"))))
      .then(
        (blob) =>
          new Promise<string>((ok, fail) => {
            const reader = new FileReader();
            reader.onerror = () => fail(new Error("read failed"));
            reader.onload = () => ok(String(reader.result ?? ""));
            reader.readAsDataURL(blob);
          }),
      )
      .then((dataUrl) => {
        const img = new Image();
        img.onload = () =>
          resolve({ item, dataUrl, width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve(null);
        img.src = dataUrl;
      })
      .catch(() => resolve(null));
  });

/** Loads images in small batches so a 40-question worksheet doesn't stall the tab. */
export const loadWorksheetImages = async (
  items: WorksheetItem[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ loaded: LoadedImage[]; failed: WorksheetItem[] }> => {
  const loaded: LoadedImage[] = [];
  const failed: WorksheetItem[] = [];
  const BATCH = 4;
  for (let i = 0; i < items.length; i += BATCH) {
    const chunk = items.slice(i, i + BATCH);
    const results = await Promise.all(chunk.map(loadOne));
    results.forEach((r, idx) => (r ? loaded.push(r) : failed.push(chunk[idx])));
    onProgress?.(Math.min(i + BATCH, items.length), items.length);
  }
  loaded.sort((a, b) => a.item.worksheet_number - b.item.worksheet_number);
  return { loaded, failed };
};

export interface WorksheetMeta {
  levelLabel: string;
  sourceLabel: string;
  questionCount: number;
  fileBase: string;
}

const A4 = { width: 210, height: 297 };
const MARGIN = { top: 15, right: 14, bottom: 16, left: 14 };
const CONTENT_WIDTH = A4.width - MARGIN.left - MARGIN.right;
const CONTENT_BOTTOM = A4.height - MARGIN.bottom;
const NUMBER_COL = 9; // mm reserved for the worksheet number
const GAP_AFTER_QUESTION = 6;

/** Shared brand strip used by both PDFs. */
const drawBrandHeader = (doc: any, meta: WorksheetMeta, subtitle: string) => {
  let y = MARGIN.top;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("PHYSICSHQ.IN", MARGIN.left, y);
  y += 6;
  doc.setFontSize(11);
  doc.text(subtitle, MARGIN.left, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(`Level: ${meta.levelLabel}`, MARGIN.left, y);
  y += 4.5;
  doc.text(`${meta.sourceLabel}`, MARGIN.left, y);
  y += 4.5;
  doc.text(`Questions: ${meta.questionCount}`, MARGIN.left, y);
  y += 3;
  doc.setDrawColor(150);
  doc.line(MARGIN.left, y, A4.width - MARGIN.right, y);
  return y + 6;
};

export const generateWorksheetPdf = async (loaded: LoadedImage[], meta: WorksheetMeta) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });

  let y = drawBrandHeader(doc, meta, "CAMBRIDGE PHYSICS — MCQ PRACTICE WORKSHEET");

  doc.setFontSize(10);
  doc.text("Name: ______________________________", MARGIN.left, y);
  y += 6;
  doc.text("Date: ______________________________", MARGIN.left, y);
  y += 6;
  doc.text("Time: ______________________________", MARGIN.left, y);
  y += 8;

  const imageWidth = CONTENT_WIDTH - NUMBER_COL;

  loaded.forEach((entry, index) => {
    const renderHeight = (entry.height / entry.width) * imageWidth;
    // A whole question image never spans two pages.
    if (index > 0 && y + renderHeight > CONTENT_BOTTOM) {
      doc.addPage();
      y = MARGIN.top;
    }
    // A single image taller than a full page is scaled down to one page.
    let w = imageWidth;
    let h = renderHeight;
    const maxHeight = CONTENT_BOTTOM - MARGIN.top;
    if (h > maxHeight) {
      const scale = maxHeight / h;
      h = maxHeight;
      w = w * scale;
    }
    if (y + h > CONTENT_BOTTOM) {
      doc.addPage();
      y = MARGIN.top;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(`${entry.item.worksheet_number}.`, MARGIN.left, y + 4);
    doc.addImage(entry.dataUrl, "JPEG", MARGIN.left + NUMBER_COL, y, w, h, undefined, "FAST");
    y += h + GAP_AFTER_QUESTION;
  });

  // page numbers
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Page ${p} of ${pages}`, A4.width / 2, A4.height - 8, { align: "center" });
    doc.setTextColor(0);
  }

  doc.save(`${meta.fileBase}_Worksheet.pdf`);
};

export const generateAnswerKeyPdf = async (
  loaded: LoadedImage[],
  meta: WorksheetMeta,
  includeSources = true,
) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });

  let y = drawBrandHeader(doc, meta, "MCQ WORKSHEET — ANSWER KEY");
  doc.setFontSize(10);

  const lineHeight = 6;
  loaded.forEach((entry) => {
    if (y + lineHeight > CONTENT_BOTTOM) {
      doc.addPage();
      y = MARGIN.top;
    }
    doc.setFont("helvetica", "bold");
    doc.text(
      `${entry.item.worksheet_number} — ${entry.item.correct_answer ?? "?"}`,
      MARGIN.left,
      y,
    );
    if (includeSources) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(110);
      const src = [
        `${entry.item.paper_code} ${entry.item.session ?? ""} ${entry.item.year ?? ""}`.trim(),
        `Q${entry.item.question_number}`,
        entry.item.topic_name ?? "",
      ]
        .filter(Boolean)
        .join(" · ");
      doc.text(src, MARGIN.left + 30, y);
      doc.setTextColor(0);
    }
    y += lineHeight;
  });

  doc.save(`${meta.fileBase}_Answer_Key.pdf`);
};

export const sanitizeFilePart = (value: string) =>
  value
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "Mixed";
