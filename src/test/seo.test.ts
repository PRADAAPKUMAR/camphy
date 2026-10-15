import { describe, expect, it } from "vitest";
import { metadataForPath } from "@/components/PageMetadata";
import pages from "@/lib/seo-routes.json";
describe("search metadata", () => {
  it("uses the main domain and distinct titles for every public page", () => {
    expect(new Set(pages.map((page) => page.path)).size).toBe(pages.length);
    for (const page of pages) {
      const metadata = metadataForPath(page.path);
      expect(metadata.indexable).toBe(true);
      expect(metadata.canonical).toBe(`https://physicshq.in${page.path}`);
      expect(metadata.description.length).toBeGreaterThan(40);
    }
  });
  it.each(["/admin/upload", "/auth", "/profile", "/performance/igcse", "/exam/private-paper", "/reset-password", "/not-found"])("excludes %s from indexing", (path) => {
    expect(metadataForPath(path).indexable).toBe(false);
  });
});