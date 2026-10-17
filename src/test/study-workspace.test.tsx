import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import GradeDashboardPage from "@/pages/GradeDashboardPage";
import SiteNav from "@/components/SiteNav";
import StudyToolsPage from "@/pages/StudyToolsPage";
import { PERFORMANCE_KEY, type PerformanceRecord } from "@/lib/performance-history";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: null, profile: null, role: "user", signOut: vi.fn() }) }));
vi.mock("@/contexts/GradeContext", () => ({ useSelectedGrade: () => ({ grade: "igcse", setGrade: vi.fn() }) }));
vi.mock("@/components/study/MultiTimers", () => ({default: () => <p>Exam timers panel</p>}));
vi.mock("@/components/study/FocusMode", () => ({default: () => <p>Focus panel</p>}));
vi.mock("@/components/study/TimetableScheduler", () => ({default: () => <p>Timetable panel</p>}));

function dashboard(grade: string) {
  render(<MemoryRouter initialEntries={[`/grade/${grade}`]}><Routes><Route path="/grade/:grade" element={<GradeDashboardPage />} /><Route path="/" element={<h1>All grades</h1>} /></Routes></MemoryRouter>);
}
const record = (level: string, paperId: string, overrides: Partial<PerformanceRecord> = {}): PerformanceRecord => ({level,paperId,paperCode:paperId,year:2025,session:"May/June",score:30,totalQuestions:40,percentage:75,completedAt:"2026-10-15T10:00:00Z",questionResults:{1:false,2:true},...overrides});
beforeEach(() => { cleanup(); localStorage.clear(); });

describe("grade study workspace", () => {
  it("shows an honest first-use state and links to existing tools", () => {
    dashboard("igcse");
    expect(screen.getByText("Your progress starts here.")).toBeInTheDocument();
    expect(screen.getByRole("link", {name:/Choose a topic/})).toHaveAttribute("href","/topic-practice/IGCSE");
    expect(screen.getByRole("link", {name:/Focus mode/})).toHaveAttribute("href","/study-tools?tab=focus");
    expect(screen.getByRole("link", {name:/Worksheet generator/})).toHaveAttribute("href","/worksheet-generator/igcse");
    expect(screen.queryByRole("link", {name:/Resume|Continue/})).not.toBeInTheDocument();
  });
  it("uses only the selected grade's actual history and retry questions", () => {
    localStorage.setItem(PERFORMANCE_KEY,JSON.stringify([record("IGCSE","igcse-paper"),record("AS LEVEL","as-paper",{score:40,percentage:100})]));
    dashboard("igcse");
    expect(screen.getByRole("link",{name:/Retry mistakes/})).toHaveAttribute("href","/question-mode/igcse-paper?qs=1");
    const progress=screen.getByRole("region",{name:"Recent performance"});
    expect(within(progress).getByText("75%")).toBeInTheDocument();
    expect(within(progress).queryByText(/as-paper/)).not.toBeInTheDocument();
  });
  it("respects A Level's available content without MCQs or teacher-only MCQ tools", () => {
    dashboard("a2");
    expect(screen.getByRole("link",{name:/Theory past papers/})).toHaveAttribute("href","/theory-papers/A2%20Level");
    expect(screen.queryByRole("link",{name:/MCQ past papers|Classroom quiz|Worksheet generator/})).not.toBeInTheDocument();
  });
  it("keeps Progress visible and the secondary menu keyboard accessible", () => {
    render(<MemoryRouter initialEntries={["/grade/igcse"]}><SiteNav /></MemoryRouter>);
    expect(screen.getByRole("link",{name:"Progress"})).toHaveAttribute("href","/performance/igcse");
    expect(screen.getByRole("link",{name:"Overview"})).toHaveAttribute("aria-current","page");
    fireEvent.click(screen.getByRole("button",{name:"Open menu"}));
    expect(screen.getByRole("button",{name:"Close menu"})).toHaveAttribute("aria-expanded","true");
    expect(screen.getByRole("link",{name:"Classroom quiz"})).toHaveAttribute("href","/classroom-quiz/igcse");
    fireEvent.keyDown(document, {key:"Escape"});
    expect(screen.queryByRole("link",{name:"Classroom quiz"})).not.toBeInTheDocument();
    expect(screen.getByRole("button",{name:"Open menu"})).toHaveFocus();
  });
  it("opens the requested study tool directly and switches panels", () => {
    render(<MemoryRouter initialEntries={["/study-tools?tab=focus"]}><StudyToolsPage /></MemoryRouter>);
    expect(screen.getByText("Focus panel")).toBeInTheDocument();
    expect(screen.queryByText("Exam timers panel")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button",{name:"Timetable"}));
    expect(screen.getByText("Timetable panel")).toBeInTheDocument();
  });
});
