import pages from "@/lib/seo-routes.json";

export const metadataForPath = (pathname: string) => {
  const cleanPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const page = pages.find((entry) => entry.path === cleanPath);
  return {
    title: page?.title ?? "Physics HQ | Cambridge Physics Practice",
    description: page?.description ?? "Cambridge IGCSE, AS and A Level Physics practice and revision tools.",
    canonical: `https://physicshq.in${page?.path ?? cleanPath}`,
    indexable: Boolean(page),
  };
};
