import { useCallback, useEffect, useRef } from "react";
import { QuestionPacingClock } from "@/lib/question-pacing";

export const useQuestionPacing = (question: number | null, running: boolean) => {
  const clock = useRef(new QuestionPacingClock());
  useEffect(() => {
    const timer = clock.current;
    const update = () => timer.activate(question, running && !document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => {
      document.removeEventListener("visibilitychange", update);
      timer.pause();
    };
  }, [question, running]);

  const commit = useCallback((q: number) => clock.current.commit(q), []);
  const finish = useCallback(() => {
    clock.current.pause();
    return clock.current.snapshot();
  }, []);
  return { commit, finish };
};