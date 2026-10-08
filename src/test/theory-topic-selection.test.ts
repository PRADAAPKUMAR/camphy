import { describe, expect, it } from "vitest";
import { addTheoryQuestionIds, groupTheoryTopics } from "@/lib/theory-topic-selection";
import type { SyllabusTopic } from "@/lib/syllabus";

const topic = (id: string, parent: string | null, code: string): SyllabusTopic => ({
  id, parent_topic_id: parent, topic_code: code, topic_name: id,
  syllabus_version_id: "version", level: "AS LEVEL", display_order: 1, is_active: true,
});

describe("theory topic browsing and question basket", () => {
  it("groups only mapped subtopics beneath their syllabus parent", () => {
    const root = topic("Electricity", null, "10");
    const child = topic("Current", root.id, "10.1");
    const absent = topic("Resistance", root.id, "10.2");
    const groups = groupTheoryTopics([child], { [root.id]: root, [child.id]: child, [absent.id]: absent });
    expect(groups).toEqual([{ topic: root, mappedIds: [child.id], subtopics: [child] }]);
  });

  it("supports directly mapped main topics and unresolved hierarchy", () => {
    const root = topic("Fields", null, "13");
    expect(groupTheoryTopics([root], {})[0]).toEqual({ topic: root, mappedIds: [root.id], subtopics: [] });
  });

  it("adds questions from another topic without clearing or duplicating earlier choices", () => {
    const firstTopic = addTheoryQuestionIds([], ["q1", "shared"]);
    const secondTopic = addTheoryQuestionIds(firstTopic, ["shared", "q2"]);
    expect(secondTopic).toEqual(["q1", "shared", "q2"]);
    expect(addTheoryQuestionIds(secondTopic, [])).toEqual(secondTopic);
  });
});