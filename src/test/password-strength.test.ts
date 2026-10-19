import { describe, expect, it } from "vitest";
import { isStrongPassword } from "@/lib/password-strength";

describe("password strength", () => {
  it("rejects passwords shorter than 8 characters", () => expect(isStrongPassword("Ab1!xyz")).toBe(false));
  it("rejects passwords without a symbol", () => expect(isStrongPassword("Abcdefg1")).toBe(false));
  it("rejects passwords without an uppercase letter", () => expect(isStrongPassword("abcdef1!")).toBe(false));
  it("rejects passwords without a number", () => expect(isStrongPassword("Abcdefg!")).toBe(false));
  it("accepts an 8-character strong password", () => expect(isStrongPassword("Abcdef1!")).toBe(true));
});
