import { defineMcp } from "@lovable.dev/mcp-js";
import listLevels from "./tools/list-levels";
import listPapers from "./tools/list-papers";
import listTopicMcq from "./tools/list-topic-mcq";
import listTopicTheory from "./tools/list-topic-theory";
import listStudyMaterials from "./tools/list-study-materials";

export default defineMcp({
  name: "physics-hq-mcp",
  title: "Physics HQ",
  version: "0.1.0",
  instructions:
    "Read-only tools for Physics HQ, a Cambridge physics practice site by PRADAAP KUMAR. Use `list_levels` to see which levels (IGCSE, AS LEVEL, A2 LEVEL) are available and how much content each has. Use `list_papers` for full past-paper MCQs, `list_topic_mcq_practice` for topic-focused MCQ sets, `list_topic_theory_questions` for topic-focused structured questions (with answer keys), and `list_study_materials` for notes and revision resources. All tools return public content only.",
  tools: [listLevels, listPapers, listTopicMcq, listTopicTheory, listStudyMaterials],
});