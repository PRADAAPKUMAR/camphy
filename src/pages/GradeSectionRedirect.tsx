import { Navigate } from "react-router-dom";
import { useSelectedGrade } from "@/contexts/GradeContext";
import { gradeSectionPath } from "@/lib/grades";

type Section = "mcq" | "theory" | "practice" | "materials" | "worksheet" | "performance";
const GradeSectionRedirect = ({ section }: { section: Section }) => {
  const { grade } = useSelectedGrade();
  if (!grade) return <Navigate to="/" replace />;
  return <Navigate to={gradeSectionPath(grade, section)} replace />;
};
export default GradeSectionRedirect;
