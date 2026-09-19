import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { gradeFromLevel, isGradeKey, type GradeKey } from "@/lib/grades";

const STORAGE_KEY = "physicshq:selected-grade";
interface GradeContextValue { grade: GradeKey | null; setGrade: (grade: GradeKey) => void }
const GradeContext = createContext<GradeContextValue | null>(null);

const gradeFromPath = (pathname: string): GradeKey | null => {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "grade" && isGradeKey(parts[1])) return parts[1].toLowerCase() as GradeKey;
  if (["papers", "theory-papers", "topic-practice", "materials", "topical-mcq"].includes(parts[0] ?? "") && parts[1]) return gradeFromLevel(parts[1]);
  if (["worksheet-generator", "performance"].includes(parts[0] ?? "") && isGradeKey(parts[1])) return parts[1].toLowerCase() as GradeKey;
  return null;
};

const remembered = (): GradeKey | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY) ?? "";
    return isGradeKey(value) ? value.toLowerCase() as GradeKey : null;
  } catch { return null; }
};

export const GradeProvider = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const [grade, setGradeState] = useState<GradeKey | null>(() => gradeFromPath(pathname) ?? remembered());
  const setGrade = useCallback((next: GradeKey) => {
    setGradeState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* privacy mode */ }
  }, []);
  useEffect(() => {
    const next = gradeFromPath(pathname);
    if (next && next !== grade) setGrade(next);
  }, [pathname, grade, setGrade]);
  const value = useMemo(() => ({ grade, setGrade }), [grade, setGrade]);
  return <GradeContext.Provider value={value}>{children}</GradeContext.Provider>;
};

export const useSelectedGrade = () => {
  const value = useContext(GradeContext);
  if (!value) throw new Error("useSelectedGrade must be used inside GradeProvider");
  return value;
};
