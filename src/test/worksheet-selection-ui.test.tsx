import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import WorksheetGeneratorPage from "@/pages/WorksheetGeneratorPage";
import { fetchWorksheetSelection, generateWorksheetPdf, generateAnswerKeyPdf, type WorksheetItem } from "@/lib/worksheet";

vi.mock("@/lib/worksheet", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/worksheet")>();
  return { ...actual, fetchWorksheetSelection: vi.fn(), fetchWorksheetTopics: vi.fn(async () => []),
    loadWorksheetImages: vi.fn(async (items: WorksheetItem[]) => ({ loaded: items.map((item) => ({ item, dataUrl: `data:image/png;base64,${item.question_number}`, width: 100, height: 200 })).sort((a, b) => a.item.worksheet_number - b.item.worksheet_number), failed: [] })),
    generateWorksheetPdf: vi.fn(async () => ({ unavailableQuestions: [] })), generateAnswerKeyPdf: vi.fn(async () => undefined),
  };
});
const item = (number: number): WorksheetItem => ({ worksheet_number: number, paper_id: "paper", paper_code: "0625/22", year: 2025, session: "May/June", level: "IGCSE", question_number: number, correct_answer: "A", topic_id: null, topic_name: null, image_url: `https://example.invalid/${number}` });
function mount() {
  return render(<MemoryRouter initialEntries={["/worksheet-generator/igcse"]}><QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><Routes><Route path="/worksheet-generator/:grade" element={<WorksheetGeneratorPage />} /></Routes></QueryClientProvider></MemoryRouter>);
}
async function generate() {
  fireEvent.click(screen.getByRole("button", {name: "Generate worksheet"}));
  await screen.findByRole("img", {name: /Worksheet question 2/});
}
beforeEach(() => { cleanup(); vi.clearAllMocks(); localStorage.clear(); vi.mocked(fetchWorksheetSelection).mockResolvedValue({ pool_size: 3, items: [item(1), item(2)], excluded: [] }); });

describe("visual worksheet editing", () => {
  it("removes and replaces preview questions and exports matching questions and answer keys", async () => {
    mount(); await generate();
    fireEvent.click(screen.getByRole("button", {name: "Remove question 1"}));
    expect(screen.getAllByRole("img")).toHaveLength(1);
    vi.mocked(fetchWorksheetSelection).mockResolvedValueOnce({ pool_size: 1, items: [item(3)], excluded: [] });
    fireEvent.click(screen.getByRole("button", {name: "Replace question 1"}));
    await screen.findByRole("img", {name: /original question 3/});
    expect(fetchWorksheetSelection).toHaveBeenLastCalledWith(expect.objectContaining({count: 1, exclude_refs: [{paper_id:"paper",question_number:2}]}));
    fireEvent.click(screen.getByRole("button", {name: "Open worksheet PDF"}));
    await waitFor(() => expect(generateWorksheetPdf).toHaveBeenCalled());
    const exported = vi.mocked(generateWorksheetPdf).mock.calls[0][0];
    expect(exported.map(({item}) => [item.worksheet_number,item.question_number])).toEqual([[1,3]]);
    await waitFor(() => expect(screen.getByRole("button", {name:"Open answer key PDF"})).not.toBeDisabled());
    fireEvent.click(screen.getByRole("button", {name: "Open answer key PDF"}));
    await waitFor(() => expect(generateAnswerKeyPdf).toHaveBeenCalledWith(exported, expect.objectContaining({questionCount:1}), true));
  });
  it("saves stable references and restores their edited order after remount", async () => {
    const view = mount(); await generate();
    vi.mocked(fetchWorksheetSelection).mockResolvedValueOnce({pool_size:1,items:[item(3)],excluded:[]});
    fireEvent.click(screen.getByRole("button", {name:"Replace question 1"}));
    await screen.findByRole("img", {name:/original question 3/});
    fireEvent.click(screen.getByRole("button", {name:"Save selection"}));
    const persisted = localStorage.getItem("physicshq:worksheet-selections:v1")!;
    expect(persisted).not.toContain("image_url"); expect(persisted).not.toContain("correct_answer"); expect(persisted).not.toContain("data:image");
    view.unmount(); mount();
    vi.mocked(fetchWorksheetSelection).mockResolvedValueOnce({pool_size:2, items:[{...item(2),worksheet_number:1},{...item(3),worksheet_number:2}], excluded:[]});
    fireEvent.click(screen.getByText(/Saved selections \(1\)/));
    fireEvent.click(screen.getByRole("button", {name:/^Load /}));
    await screen.findByRole("img", {name:/Worksheet question 1,.*original question 3/});
    expect(screen.getByRole("img", {name:/Worksheet question 2,.*original question 2/})).toBeInTheDocument();
    expect(fetchWorksheetSelection).toHaveBeenLastCalledWith(expect.objectContaining({source:"mistakes",refs:[{paper_id:"paper",question_number:3},{paper_id:"paper",question_number:2}]}));
  });
  it("keeps the current question when no unique replacement exists", async () => {
    mount(); await generate();
    vi.mocked(fetchWorksheetSelection).mockResolvedValueOnce({pool_size:0,items:[],excluded:[]});
    fireEvent.click(screen.getByRole("button", {name:"Replace question 1"}));
    await waitFor(() => expect(screen.getByRole("button", {name:"Replace question 1"})).not.toBeDisabled());
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getByRole("img",{name:/original question 1/})).toBeInTheDocument();
  });
});
