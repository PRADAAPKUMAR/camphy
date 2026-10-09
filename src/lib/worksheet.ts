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

export type WorksheetSource = "random" | "topic" | "mistakes";

export const getDefaultWorksheetName = (
  level: string,
  source: WorksheetSource,
  topicNames: string[],
) => {
  const levelName = level === "IGCSE" ? "IGCSE" : "AS";
  if (source === "topic") {
    if (topicNames.length === 1) return `${levelName} Physics — ${topicNames[0]} MCQ Worksheet`;
    if (topicNames.length > 1) return `${levelName} Physics — Mixed Topics MCQ Worksheet`;
  }
  if (source === "mistakes") return `${levelName} Physics — Mistake Revision Worksheet`;
  return "Physics MCQ Practice Worksheet";
};

export interface WorksheetRequest {
  level?: string | null;
  source: WorksheetSource;
  /** Topic + subtopic ids across every selected topic (multi-select). */
  topic_ids?: string[];
  refs?: { paper_id: string; question_number: number }[];
  count: number;
  shuffle: boolean;
}


export interface WorksheetTopicOption {
  key: string;
  name: string;
  code: string;
  ids: string[];
  count: number;
}

export interface WorksheetTopicGroup extends WorksheetTopicOption {
  subtopics: WorksheetTopicOption[];
}

/** Only topics that have worksheet-ready (image + answer key) mapped questions. */
export const fetchWorksheetTopics = async (level: string): Promise<WorksheetTopicGroup[]> => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.functions.invoke("worksheet-questions", {
    body: { mode: "topics", level },
  });
  if (error) return [];
  return (data?.topics ?? []) as WorksheetTopicGroup[];
};

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
        img.onload = () => {
          // Re-encode as JPEG so the PDF engine always receives a format it accepts
          // (source files may be PNG/WebP despite .jpg names).
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("no canvas");
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            resolve({ item, dataUrl: canvas.toDataURL("image/jpeg", 0.92), width: img.naturalWidth, height: img.naturalHeight });
          } catch {
            resolve(null);
          }
        };
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
  worksheetName: string;
  showTotalMarks: boolean;
}

const A4 = { width: 210, height: 297 };
const MARGIN = { top: 15, right: 14, bottom: 16, left: 14 };
const CONTENT_WIDTH = A4.width - MARGIN.left - MARGIN.right;
const CONTENT_BOTTOM = A4.height - MARGIN.bottom;
const NUMBER_COL = 9; // mm reserved for the worksheet number
const GAP_AFTER_QUESTION = 6;
const CONTINUATION_HEADER_HEIGHT = 10;

let logoDataUrlPromise: Promise<string | null> | null = null;

/** Render browser typography to an image, never hand web fonts to the PDF engine. */
const renderWordmark = async (): Promise<string | null> => {
  try {
    if (document.fonts) {
      await Promise.race([
        document.fonts.load('800 160px Inter'),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    }
    const styles = getComputedStyle(document.documentElement);
    const colour = (token: string) => `hsl(${styles.getPropertyValue(token).trim()})`;
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Leave the canvas clear so the PDF's white page remains visible.
    const bolt = await new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image();
      const timer = setTimeout(() => resolve(null), 2000);
      image.onload = () => { clearTimeout(timer); resolve(image); };
      image.onerror = () => { clearTimeout(timer); resolve(null); };
      image.src = `${import.meta.env.BASE_URL}favicon.png`;
    });
    if (bolt) ctx.drawImage(bolt, 0, 20, 160, 160);
    ctx.font = '800 140px Inter, sans-serif';
    ctx.textBaseline = "middle";
    const physicsWidth = ctx.measureText("Physics").width;
    const hqWidth = ctx.measureText("HQ").width;
    const x = 184;
    // Homepage light lettering disappears on transparent white paper.
    ctx.fillStyle = colour("--primary-foreground");
    ctx.fillText("Physics", x, 106);
    const gradient = ctx.createLinearGradient(x + physicsWidth, 0, x + physicsWidth + hqWidth, 0);
    gradient.addColorStop(0, colour("--primary"));
    gradient.addColorStop(1, colour("--accent"));
    ctx.fillStyle = gradient;
    ctx.fillText("HQ", x + physicsWidth, 106);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
};

const loadLogoDataUrl = () => {
  logoDataUrlPromise ??= renderWordmark();
  return logoDataUrlPromise;
};

const drawBrand = (
  doc: any,
  logoDataUrl: string | null,
  y: number,
  compact = false,
) => {
  const fontSize = compact ? 8.5 : 10.5;
  const width = (1000 / 140) * fontSize * (25.4 / 72);
  if (logoDataUrl?.startsWith("data:image/")) {
    try {
      doc.addImage(logoDataUrl, "PNG", MARGIN.left, y + (compact ? 0 : 3), width, width * 0.2, undefined, "FAST");
      doc.setTextColor(0);
      return;
    } catch {
      // Branding must never prevent the worksheet from opening.
    }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize);
  doc.setTextColor(15, 39, 78);
  doc.text("PhysicsHQ", MARGIN.left, y + (compact ? 3.8 : 7.5));
  doc.setTextColor(0);
};

/** Full school-style header used only on the first page of the student worksheet. */
const drawWorksheetHeader = (
  doc: any,
  meta: WorksheetMeta,
  logoDataUrl: string | null,
) => {
  let y = MARGIN.top;
  drawBrand(doc, logoDataUrl, y);
  if (meta.showTotalMarks) {
    doc.setDrawColor(90);
    doc.roundedRect(A4.width - MARGIN.right - 48, y, 48, 12, 2, 2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(`Marks: ______ / ${meta.questionCount}`, A4.width - MARGIN.right - 24, y + 7.5, {
      align: "center",
    });
  }
  y += 17;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(meta.worksheetName, CONTENT_WIDTH - 12).slice(0, 2);
  doc.text(titleLines, A4.width / 2, y, { align: "center" });
  y += titleLines.length * 6 + 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Level: ${meta.levelLabel}`, MARGIN.left, y);
  const sourceText = doc.splitTextToSize(meta.sourceLabel, 88)[0] ?? meta.sourceLabel;
  doc.text(sourceText, A4.width - MARGIN.right, y, { align: "right" });
  y += 5;
  doc.setDrawColor(175);
  doc.line(MARGIN.left, y, A4.width - MARGIN.right, y);
  y += 6;
  doc.setFontSize(9.5);
  doc.text("Name: ______________________________", MARGIN.left, y);
  doc.text("Class: __________________________", 112, y);
  y += 6;
  doc.text("Date: ______________________________", MARGIN.left, y);
  doc.text("Time: ___________________________", 112, y);
  y += 5;
  doc.line(MARGIN.left, y, A4.width - MARGIN.right, y);
  return y + 6;
};

const drawContinuationHeader = (
  doc: any,
  meta: WorksheetMeta,
  logoDataUrl: string | null,
) => {
  const y = MARGIN.top;
  drawBrand(doc, logoDataUrl, y, true);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(90);
  const title = doc.splitTextToSize(meta.worksheetName, 110)[0] ?? meta.worksheetName;
  doc.text(`·  ${title}`, MARGIN.left + 44, y + 3.8);
  doc.setDrawColor(190);
  doc.line(MARGIN.left, y + 7, A4.width - MARGIN.right, y + 7);
  doc.setTextColor(0);
  return y + CONTINUATION_HEADER_HEIGHT;
};

const drawAnswerKeyHeader = (
  doc: any,
  meta: WorksheetMeta,
  logoDataUrl: string | null,
) => {
  let y = MARGIN.top;
  drawBrand(doc, logoDataUrl, y);
  y += 17;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  const titleLines = doc.splitTextToSize(meta.worksheetName, CONTENT_WIDTH).slice(0, 2);
  doc.text(titleLines, MARGIN.left, y);
  y += titleLines.length * 5.5 + 1;
  doc.setFontSize(10.5);
  doc.text("MCQ WORKSHEET — ANSWER KEY", MARGIN.left, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Level: ${meta.levelLabel}`, MARGIN.left, y);
  doc.text(`Questions: ${meta.questionCount}`, A4.width - MARGIN.right, y, { align: "right" });
  y += 4;
  doc.setDrawColor(175);
  doc.line(MARGIN.left, y, A4.width - MARGIN.right, y);
  return y + 6;
};

/** Opens the finished PDF in a new browser tab instead of downloading it. */
const openPdfInNewTab = (doc: any, fileName: string) => {
  let url: string | undefined;
  try {
    const blob: Blob | null = doc.output("blob");
    if (!blob || !blob.size) throw new Error("The PDF document is empty");
    url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    try {
      if (window.open(url, "_blank")) return;
    } catch {
      // Some embedded browsers throw rather than return null for blocked popups.
    }
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    try {
      anchor.click();
    } finally {
      anchor.remove();
    }
  } catch {
    // Last resort when blob URLs or link activation are unavailable.
    doc.save(fileName);
  } finally {
    const objectUrl = url;
    if (objectUrl) {
      setTimeout(() => {
        try { URL.revokeObjectURL(objectUrl); } catch { /* Browser cleanup only. */ }
      }, 60_000);
    }
  }
};

export const generateWorksheetPdf = async (loaded: LoadedImage[], meta: WorksheetMeta) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const logoDataUrl = await loadLogoDataUrl();

  let y = drawWorksheetHeader(doc, meta, logoDataUrl);

  const imageWidth = CONTENT_WIDTH - NUMBER_COL;
  const unavailableQuestions: number[] = [];

  const addContinuationPage = () => {
    doc.addPage();
    return drawContinuationHeader(doc, meta, logoDataUrl);
  };

  loaded.forEach((entry, index) => {
    const validDimensions = Number.isFinite(entry.width) && entry.width > 0 &&
      Number.isFinite(entry.height) && entry.height > 0;
    const renderHeight = validDimensions ? (entry.height / entry.width) * imageWidth : 18;
    // A whole question image never spans two pages.
    if (index > 0 && y + renderHeight > CONTENT_BOTTOM) {
      y = addContinuationPage();
    }
    // A single image taller than a full page is scaled down to one page.
    let w = imageWidth;
    let h = renderHeight;
    const maxHeight = CONTENT_BOTTOM - (MARGIN.top + CONTINUATION_HEADER_HEIGHT);
    if (h > maxHeight) {
      const scale = maxHeight / h;
      h = maxHeight;
      w = w * scale;
    }
    if (y + h > CONTENT_BOTTOM) {
      y = addContinuationPage();
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(`${entry.item.worksheet_number}.`, MARGIN.left, y + 4);
    try {
      if (!validDimensions) throw new Error("Invalid question image dimensions");
      doc.addImage(entry.dataUrl, "JPEG", MARGIN.left + NUMBER_COL, y, w, h, undefined, "FAST");
    } catch {
      unavailableQuestions.push(entry.item.worksheet_number);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setDrawColor(175);
      doc.rect(MARGIN.left + NUMBER_COL, y, w, h);
      const message = doc.splitTextToSize(
        `Question image unavailable. Rebuild before using this worksheet. Source: ${entry.item.paper_code}, Q${entry.item.question_number}.`,
        Math.max(w - 6, 15),
      );
      doc.text(message, MARGIN.left + NUMBER_COL + 3, y + 5);
    }
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

  openPdfInNewTab(doc, `${meta.fileBase}_Worksheet.pdf`);
  return { unavailableQuestions };
};

export const generateAnswerKeyPdf = async (
  loaded: LoadedImage[],
  meta: WorksheetMeta,
  includeSources = true,
) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const logoDataUrl = await loadLogoDataUrl();

  let y = drawAnswerKeyHeader(doc, meta, logoDataUrl);
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

  openPdfInNewTab(doc, `${meta.fileBase}_Answer_Key.pdf`);
};

export const sanitizeFilePart = (value: string) =>
  value
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "Mixed";
