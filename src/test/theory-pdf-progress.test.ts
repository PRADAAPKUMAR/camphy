import { afterEach, describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createTheoryTopicalPdf, type TheoryTopicalQuestion } from "@/lib/theory-topical-pdf";

const question: TheoryTopicalQuestion = {
  mapping_id: "q1", paper_id: "paper", question_number: 1, start_page: 1, end_page: 1,
  shared_page_warning: false, paper_code: "9702_m25_42", session: "m", year: 2025,
  question_url: "/source.pdf", topics: [],
};

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("theory PDF work milestones", () => {
  it("fetches each source once and reports completion only after a valid PDF exists", async () => {
    const source = await PDFDocument.create();
    source.addPage().drawText("Question 1");
    const bytes = await source.save();
    const fetchSource = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => bytes.buffer });
    vi.stubGlobal("fetch", fetchSource);
    let generated: Blob | undefined;
    vi.stubGlobal("URL", { createObjectURL: vi.fn((blob: Blob) => { generated = blob; return "blob:theory"; }), revokeObjectURL: vi.fn() });
    vi.spyOn(window, "open").mockReturnValue({} as Window);
    const milestones: number[] = [];
    await createTheoryTopicalPdf([question, { ...question, mapping_id: "q2", question_number: 2 }], async ({ percent }) => {
      milestones.push(percent);
      expect(window.open).not.toHaveBeenCalled();
      if (percent === 100) expect(generated?.size).toBeGreaterThan(100);
    });
    expect(milestones).toEqual([15, 60, 85, 100]);
    expect(fetchSource).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledTimes(1);
  });

  it("does not report readiness or open a tab when a source fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    vi.spyOn(window, "open").mockReturnValue(null);
    const report = vi.fn();
    await expect(createTheoryTopicalPdf([question], report)).rejects.toThrow("Could not load 9702_m25_42");
    expect(report.mock.calls.map(([update]) => update.percent)).toEqual([15]);
    expect(window.open).not.toHaveBeenCalled();
  });
});