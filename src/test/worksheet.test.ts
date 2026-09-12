import { describe, expect, it } from "vitest";
import { getDefaultWorksheetName } from "@/lib/worksheet";

describe("worksheet title defaults", () => {
  it("uses the general practice title for random questions", () => {
    expect(getDefaultWorksheetName("IGCSE", "random", [])).toBe("Physics MCQ Practice Worksheet");
  });

  it("uses the selected topic for a single-topic worksheet", () => {
    expect(getDefaultWorksheetName("IGCSE", "topic", ["Electricity"])).toBe(
      "IGCSE Physics — Electricity MCQ Worksheet",
    );
  });

  it("uses a mixed title for multiple topics", () => {
    expect(getDefaultWorksheetName("AS LEVEL", "topic", ["Waves", "Electricity", "Mechanics"])).toBe(
      "AS Physics — Mixed Topics MCQ Worksheet",
    );
  });

  it("uses the level-specific mistake revision title", () => {
    expect(getDefaultWorksheetName("AS LEVEL", "mistakes", [])).toBe(
      "AS Physics — Mistake Revision Worksheet",
    );
  });
});