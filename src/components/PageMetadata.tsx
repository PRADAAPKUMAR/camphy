import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { metadataForPath } from "@/lib/page-metadata";

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