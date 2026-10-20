-- Explicit Data API read grants for anonymously browsable study catalog tables.
GRANT SELECT ON public.papers TO anon, authenticated;
GRANT SELECT ON public.study_materials TO anon, authenticated;
GRANT SELECT ON public.syllabus_topics TO anon, authenticated;
GRANT SELECT ON public.syllabus_versions TO anon, authenticated;
GRANT SELECT ON public.question_images TO anon, authenticated;
GRANT SELECT ON public.question_topic_mapping TO anon, authenticated;
GRANT SELECT ON public.topic_practice_syllabus_map TO anon, authenticated;
GRANT SELECT ON public.topicwise_mcq_papers TO anon, authenticated;
GRANT SELECT ON public.topicwise_theory_questions TO anon, authenticated;
GRANT SELECT ON public.theory_papers TO anon, authenticated;
GRANT SELECT ON public.theory_question_mappings TO anon, authenticated;
GRANT SELECT ON public.theory_question_topics TO anon, authenticated;