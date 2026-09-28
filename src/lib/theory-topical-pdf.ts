import type { PDFDocument as PDFDocumentType } from "pdf-lib";

export interface TheoryTopicalQuestion {
  mapping_id: string;
  paper_id: string;
  question_number: number;
  start_page: number;
  end_page: number;
  shared_page_warning: boolean;
  paper_code: string;
  session: string;
  year: number;
  question_url: string;
  topics: { id: string; topic_code: string; topic_name: string }[];
}

const safeFilePart = (value: string) => value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");

export const createTheoryTopicalPdf = async (questions: TheoryTopicalQuestion[]) => {
  if (!questions.length) throw new Error("Select at least one question");
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const output = await PDFDocument.create();
  const regular = await output.embedFont(StandardFonts.Helvetica);
  const bold = await output.embedFont(StandardFonts.HelveticaBold);
  const sources = new Map<string, PDFDocumentType>();

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    let source = sources.get(question.paper_id);
    if (!source) {
      const response = await fetch(question.question_url);
      if (!response.ok) throw new Error(`Could not load ${question.paper_code}`);
      source = await PDFDocument.load(await response.arrayBuffer());
      sources.set(question.paper_id, source);
    }

    if (question.start_page < 1 || question.end_page < question.start_page || question.end_page > source.getPageCount()) {
      throw new Error(`Invalid page range for ${question.paper_code} Q${question.question_number}`);
    }

    for (let pageNumber = question.start_page; pageNumber <= question.end_page; pageNumber += 1) {
      const [embedded] = await output.embedPdf(source, [pageNumber - 1]);
      const top = pageNumber === question.start_page ? 34 : 18;
      const bottom = 22;
      const page = output.addPage([embedded.width, embedded.height + top + bottom]);
      page.drawRectangle({ x: 0, y: embedded.height + bottom, width: embedded.width, height: top, color: rgb(0.96, 0.97, 0.99) });
      if (pageNumber === question.start_page) {
        page.drawText(`Question ${index + 1}`, { x: 20, y: embedded.height + bottom + 12, size: 13, font: bold, color: rgb(0.04, 0.16, 0.3) });
        page.drawText(`${question.paper_code} · ${question.session} ${question.year} · Original Q${question.question_number}`, {
          x: 112,
          y: embedded.height + bottom + 13,
          size: 8,
          font: regular,
          color: rgb(0.3, 0.36, 0.44),
        });
      }
      page.drawPage(embedded, { x: 0, y: bottom, width: embedded.width, height: embedded.height });
      page.drawText(`PHYSICSHQ.IN · Page ${output.getPageCount()}`, { x: 20, y: 8, size: 7, font: regular, color: rgb(0.38, 0.43, 0.5) });
    }
  }

  const bytes = await output.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const popup = window.open(url, "_blank", "noopener,noreferrer");
  if (!popup) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `PhysicsHQ-Theory-${safeFilePart(questions[0].topics[0]?.topic_name ?? "Topical")}.pdf`;
    anchor.click();
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};