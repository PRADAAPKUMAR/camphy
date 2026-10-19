import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pdf = vi.hoisted(() => ({
  addImage: vi.fn(), setFont: vi.fn(), setFontSize: vi.fn(), setTextColor: vi.fn(),
  setDrawColor: vi.fn(), text: vi.fn(), line: vi.fn(), roundedRect: vi.fn(), rect: vi.fn(),
  addPage: vi.fn(), setPage: vi.fn(), getNumberOfPages: vi.fn(() => 1),
  splitTextToSize: vi.fn((text: string) => [text]),
  output: vi.fn(() => new Blob(["%PDF-test"], { type: "application/pdf" })),
  save: vi.fn(),
}));

vi.mock("jspdf", () => ({ jsPDF: class { constructor() { return pdf; } } }));

import { generateAnswerKeyPdf, generateWorksheetPdf, type LoadedImage, type WorksheetMeta } from "@/lib/worksheet";

const meta: WorksheetMeta = {
  levelLabel: "IGCSE", sourceLabel: "Electric current", questionCount: 2,
  fileBase: "Test", worksheetName: "Electric current", showTotalMarks: true,
};
const questions: LoadedImage[] = [1, 2].map((number) => ({
  item: {
    worksheet_number: number, paper_id: "paper", paper_code: "0625_w22_22",
    year: 2022, session: "w", level: "IGCSE", question_number: number,
    correct_answer: "A", topic_id: "topic", topic_name: "Electric current", image_url: null,
  },
  dataUrl: "data:image/jpeg;base64,test", width: 600, height: 150,
}));

describe("worksheet PDF safeguards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, headers: new Headers({ "content-type": "text/html" }),
      blob: vi.fn(() => { throw new Error("HTML must not be read as an image"); }),
    }));
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL: vi.fn() });
    vi.spyOn(window, "open").mockReturnValue({} as Window);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("uses the PhysicsHQ fallback if browser branding is unavailable and opens the worksheet", async () => {
    expect(await generateWorksheetPdf(questions, meta)).toEqual({ unavailableQuestions: [] });
    expect(fetch).not.toHaveBeenCalled();
    expect(pdf.text).toHaveBeenCalledWith("PhysicsHQ", expect.any(Number), expect.any(Number));
    expect(pdf.setFontSize).toHaveBeenCalledWith(10.5);
    expect(pdf.setFontSize).not.toHaveBeenCalledWith(14.5);
    expect(pdf.text.mock.calls.some(([text]) => String(text).includes("PHYSICSHQ.IN"))).toBe(false);
    expect(pdf.addImage).toHaveBeenCalledTimes(2);
    expect(window.open).toHaveBeenCalledWith("blob:test", "_blank");
  });

  it("opens the answer key independently of question image rendering", async () => {
    await generateAnswerKeyPdf(questions, meta);
    expect(pdf.addImage).not.toHaveBeenCalled();
    expect(pdf.text).toHaveBeenCalledWith("PhysicsHQ", expect.any(Number), expect.any(Number));
    expect(pdf.text).toHaveBeenCalledWith("1 — A", expect.any(Number), expect.any(Number));
    expect(window.open).toHaveBeenCalled();
  });

  it("keeps later questions and reports a failed image visibly", async () => {
    pdf.addImage.mockImplementationOnce(() => { throw new Error("Invalid JPEG"); });
    const result = await generateWorksheetPdf(questions, meta);
    expect(result.unavailableQuestions).toEqual([1]);
    expect(pdf.addImage).toHaveBeenCalledTimes(2);
    expect(pdf.text).toHaveBeenCalledWith(
      [expect.stringContaining("Question image unavailable")], expect.any(Number), expect.any(Number),
    );
    expect(window.open).toHaveBeenCalled();
  });

  it("handles invalid dimensions without stopping generation", async () => {
    const result = await generateWorksheetPdf([{ ...questions[0], width: 0 }], meta);
    expect(result.unavailableQuestions).toEqual([1]);
    expect(pdf.addImage).not.toHaveBeenCalled();
  });

  it.each(["blocked", "throws"])("uses a download link when the popup %s", async (mode) => {
    vi.mocked(window.open).mockImplementation(() => {
      if (mode === "throws") throw new Error("Sandbox restriction");
      return null;
    });
    await generateAnswerKeyPdf(questions, meta);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    expect(document.querySelector("a[download]")).toBeNull();
    expect(pdf.save).not.toHaveBeenCalled();
  });

  it("uses PDF save if blob URLs are unavailable", async () => {
    vi.mocked(URL.createObjectURL).mockImplementationOnce(() => { throw new Error("Blocked"); });
    await generateAnswerKeyPdf(questions, meta);
    expect(pdf.save).toHaveBeenCalledWith("Test_Answer_Key.pdf");
  });

  it("uses PDF save if a fallback link throws", async () => {
    vi.mocked(window.open).mockReturnValue(null);
    vi.mocked(HTMLAnchorElement.prototype.click).mockImplementationOnce(() => { throw new Error("Blocked"); });
    await generateWorksheetPdf(questions, meta);
    expect(pdf.save).toHaveBeenCalledWith("Test_Worksheet.pdf");
    expect(document.querySelector("a[download]")).toBeNull();
  });
});