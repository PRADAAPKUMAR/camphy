export const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "An uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "A lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "A number", test: (p: string) => /\d/.test(p) },
  { label: "A symbol (e.g. ! @ # $)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export const isStrongPassword = (p: string) => passwordRules.every((r) => r.test(p));
