import { createContext, useContext } from "react";
import type { GradeKey } from "@/lib/grades";

interface GradeContextValue { grade: GradeKey | null; setGrade: (grade: GradeKey) => void }
export const GradeContext = createContext<GradeContextValue | null>(null);

export const useSelectedGrade = () => {
  const value = useContext(GradeContext);
  if (!value) throw new Error("useSelectedGrade must be used inside GradeProvider");
  return value;
};
