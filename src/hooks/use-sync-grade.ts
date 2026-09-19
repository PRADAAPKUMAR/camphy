import { useEffect } from "react";
import { useSelectedGrade } from "@/contexts/GradeContext";
import { gradeFromLevel } from "@/lib/grades";

export const useSyncGrade = (level?: string | null) => {
  const { setGrade } = useSelectedGrade();
  useEffect(() => {
    const grade = gradeFromLevel(level);
    if (grade) setGrade(grade);
  }, [level, setGrade]);
};
