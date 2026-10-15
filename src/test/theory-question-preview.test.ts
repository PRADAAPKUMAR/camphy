// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createTheoryQuestionPreview, type TheoryTopicalQuestion } from "@/lib/theory-topical-pdf";
const question: TheoryTopicalQuestion = {mapping_id:"mapping",paper_id:"paper",question_number:2,start_page:2,end_page:3,shared_page_warning:true,paper_code:"9702/22",session:"May/June",year:2025,question_url:"https://example.invalid/paper.pdf",topics:[]};
afterEach(() => vi.unstubAllGlobals());
describe("theory question page preview", () => {
  it("copies only the reviewed page range and preserves page dimensions", async () => {
    const source = await PDFDocument.create();
    source.addPage([200,300]); source.addPage([400,500]); source.addPage([600,700]); source.addPage([800,900]);
    const bytes = await source.save();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(Uint8Array.from(bytes).buffer)));
    const blob = await createTheoryQuestionPreview(question);
    const preview = await PDFDocument.load(await blob.arrayBuffer());
    expect(preview.getPages().map((page) => page.getSize())).toEqual([{width:400,height:500},{width:600,height:700}]);
    expect(blob.type).toBe("application/pdf");
  });
  it("rejects missing PDFs and out-of-range mappings instead of showing other pages", async () => {
    vi.stubGlobal("fetch",vi.fn(async () => new Response(null,{status:404})));
    await expect(createTheoryQuestionPreview(question)).rejects.toThrow("Could not load");
    const source=await PDFDocument.create(); source.addPage();
    vi.stubGlobal("fetch",vi.fn(async () => new Response(Uint8Array.from(await source.save()).buffer)));
    await expect(createTheoryQuestionPreview(question)).rejects.toThrow("Invalid question page range");
  });
});
