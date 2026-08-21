import { useQuery } from "@tanstack/react-query";
import { fetchQuestionImages, type QuestionImageMap } from "@/lib/question-images";

/** Signed question-image URLs for a paper (empty map when none are uploaded). */
export const useQuestionImages = (paperId?: string) =>
  useQuery<QuestionImageMap>({
    queryKey: ["question-images", paperId],
    queryFn: () => fetchQuestionImages(paperId!),
    enabled: !!paperId,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  });

/** Whether a paper can be practised in Question mode. */
export const useHasQuestionImages = (paperId?: string) => {
  const { data, isLoading } = useQuestionImages(paperId);
  return { hasImages: !!data && Object.keys(data).length > 0, isLoading, images: data };
};
