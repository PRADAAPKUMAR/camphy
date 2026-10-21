import content from "@/lib/legal-policy-content.json";

// A fixed update date records this revision; it must not change on every visit.
export const POLICY_UPDATED_AT = "2026-10-21";
export const POLICY_UPDATED_LABEL = "21 October 2026";
export const POLICY_CONTACT = {
  creator: "S. Pradaap Kumar",
  email: "prathap.cambridge@gmail.com",
};

const contactHtml = `<a href="mailto:${POLICY_CONTACT.email}">${POLICY_CONTACT.email}</a>`;

// These locally authored notices remain review copies and outside the search catalog.
export const LEGAL_POLICIES = content.map((policy) => {
  const html = policy.html.split("{{contactEmail}}").join(contactHtml);
  const headings = Array.from(html.matchAll(/<h2>(.*?)<\/h2>/g));
  const sections = headings.map((match, index) => ({
    id: `policy-section-${index}`,
    title: match[1].replace(/^\d+\.\s*/, ""),
    html: html.slice(match.index! + match[0].length, headings[index + 1]?.index ?? html.length),
  }));
  return {
    ...policy,
    html,
    introduction: html.slice(0, headings[0]?.index ?? html.length),
    sections,
    readingMinutes: Math.max(1, Math.ceil(html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length / 200)),
  };
});
export const legalPolicyForPath = (path: string) => LEGAL_POLICIES.find((policy) => `/${policy.slug}` === path.replace(/\/+$/, ""));
