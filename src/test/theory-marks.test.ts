import { describe, expect, it } from "vitest";
import { theoryMarksSummary } from "@/lib/theory-topic-selection";

describe("live theory selection marks", () => {
  it("adds selected question marks immediately", () => {
    expect(theoryMarksSummary([{ mapping_id: "q1", marks: 9 }, { mapping_id: "q2", marks: 4 }])).toEqual({ total: 13, pending: 0 });
  });
  it("removes marks with removed questions", () => {
    expect(theoryMarksSummary([{ mapping_id: "q2", marks: 4 }])).toEqual({ total: 4, pending: 0 });
  });
  it("counts a question matching multiple topics only once", () => {
    expect(theoryMarksSummary([{ mapping_id: "q1", marks: 9 }, { mapping_id: "q1", marks: 9 }])).toEqual({ total: 9, pending: 0 });
  });
  it("discloses unknown marks rather than declaring a complete total", () => {
    expect(theoryMarksSummary([{ mapping_id: "q1", marks: 9 }, { mapping_id: "q2", marks: null }])).toEqual({ total: 9, pending: 1 });
  });
});