import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { ExplanationData } from "@/components/ExplanationDialog";

const getSupabase = () => import("@/integrations/supabase/client").then((m) => m.supabase);

type Source = { paper_id: string } | { topic_paper_id: string };

export const useExplanation = (source: Source | null) => {
  const [question, setQuestion] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ExplanationData | null>(null);
  const [cache, setCache] = useState<Record<number, ExplanationData>>({});

  const openExplanation = useCallback(
    async (q: number) => {
      if (!source) return;
      setQuestion(q);
      setOpen(true);

      const cached = cache[q];
      if (cached) {
        setData(cached);
        setIsLoading(false);
        return;
      }

      setData(null);
      setIsLoading(true);
      try {
        const supabase = await getSupabase();
        const { data: res, error } = await supabase.functions.invoke("get-explanation", {
          body: { ...source, question: q },
        });
        if (error) throw error;
        const payload = res as ExplanationData;
        setCache((prev) => ({ ...prev, [q]: payload }));
        setData(payload);
      } catch {
        toast.error("Could not load the explanation");
        setData({ found: false });
      } finally {
        setIsLoading(false);
      }
    },
    [source, cache]
  );

  return { question, open, setOpen, isLoading, data, openExplanation };
};
