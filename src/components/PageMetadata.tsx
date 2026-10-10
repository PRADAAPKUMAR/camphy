import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
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

export default function PageMetadata() {
  const { pathname } = useLocation();
  const page = metadataForPath(pathname);
  return <Helmet>
    <title>{page.title}</title>
    <meta name="description" content={page.description} />
    <link rel="canonical" href={page.canonical} />
    <meta name="robots" content={page.indexable ? "index,follow" : "noindex,follow"} />
    <meta property="og:title" content={page.title} />
    <meta property="og:description" content={page.description} />
    <meta property="og:url" content={page.canonical} />
    <meta name="twitter:title" content={page.title} />
    <meta name="twitter:description" content={page.description} />
  </Helmet>;
}