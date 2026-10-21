import content from "@/lib/legal-policy-content.json";

// Unapproved policy drafts must not enter the public search catalog.
export const LEGAL_POLICIES = content;
export const legalPolicyForPath = (path: string) => LEGAL_POLICIES.find((policy) => `/${policy.slug}` === path);