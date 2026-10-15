import type { SyllabusTopic } from "@/lib/syllabus";

export interface TheoryTopicOption {
  id: string;
  topic_code: string;
  topic_name: string;
}

export interface TheoryTopicGroup {
  topic: TheoryTopicOption;
  mappedIds: string[];
  subtopics: TheoryTopicOption[];
}

/** Use the mapped topics' own syllabus ancestors, including older versions. */
export const groupTheoryTopics = (
  available: TheoryTopicOption[],
  hierarchy: Record<string, SyllabusTopic>,
): TheoryTopicGroup[] => {
  const groups = new Map<string, TheoryTopicGroup>();
  for (const mapped of available) {
    let root: TheoryTopicOption = hierarchy[mapped.id] ?? mapped;
    const visited = new Set<string>([root.id]);
    while (true) {
      const parentId = hierarchy[root.id]?.parent_topic_id;
      const parent = parentId ? hierarchy[parentId] : undefined;
      if (!parent || visited.has(parent.id)) break;
      visited.add(parent.id);
      root = parent;
    }
    const group = groups.get(root.id) ?? { topic: root, mappedIds: [], subtopics: [] };
    group.mappedIds.push(mapped.id);
    if (mapped.id !== root.id) group.subtopics.push(mapped);
    groups.set(root.id, group);
  }
  const sort = (a: TheoryTopicOption, b: TheoryTopicOption) =>
    a.topic_code.localeCompare(b.topic_code, undefined, { numeric: true });
  return [...groups.values()].sort((a, b) => sort(a.topic, b.topic)).map((group) => ({
    ...group,
    subtopics: group.subtopics.sort(sort),
  }));
};

/** Browsing filters never replace the question basket. */
export const addTheoryQuestionIds = (current: string[], incoming: string[]) =>
  [...new Set([...current, ...incoming])];