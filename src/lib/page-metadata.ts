import pages from "@/lib/seo-routes.json";
import { legalPolicyForPath } from "@/lib/legal-policies";

export const metadataForPath = (pathname: string) => {
  const cleanPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const page = pages.find((entry) => entry.path === cleanPath);
  const policy = legalPolicyForPath(cleanPath);
  return {
    title: page?.title ?? (policy ? `${policy.title} (Draft) | PhysicsHQ` : "Physics HQ | Cambridge Physics Practice"),
    description: page?.description ?? (policy ? `Read the PhysicsHQ ${policy.title.toLowerCase()}. Draft notice awaiting confirmed contact details and legal review.` : "Cambridge IGCSE, AS and A Level Physics practice and revision tools."),
    canonical: `https://physicshq.in${page?.path ?? cleanPath}`,
    indexable: Boolean(page),
  };
};
