-- Public study pages work without sign-in; keep personal records and answer keys protected.
DROP POLICY IF EXISTS "Papers are readable by signed-in users" ON public.papers;
DROP POLICY IF EXISTS "Papers are publicly readable" ON public.papers;
CREATE POLICY "Papers are publicly readable" ON public.papers FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Study materials are readable by signed-in users" ON public.study_materials;
DROP POLICY IF EXISTS "Study materials are publicly readable" ON public.study_materials;
CREATE POLICY "Study materials are publicly readable" ON public.study_materials FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Syllabus topics are readable by signed-in users" ON public.syllabus_topics;
DROP POLICY IF EXISTS "Syllabus topics are publicly readable" ON public.syllabus_topics;
CREATE POLICY "Syllabus topics are publicly readable" ON public.syllabus_topics FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Syllabus versions are readable by signed-in users" ON public.syllabus_versions;
DROP POLICY IF EXISTS "Syllabus versions are publicly readable" ON public.syllabus_versions;
CREATE POLICY "Syllabus versions are publicly readable" ON public.syllabus_versions FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Question images are readable by signed-in users" ON public.question_images;
DROP POLICY IF EXISTS "Question images are publicly readable" ON public.question_images;
CREATE POLICY "Question images are publicly readable" ON public.question_images FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Question topic mappings are readable by signed-in users" ON public.question_topic_mapping;
DROP POLICY IF EXISTS "Question topic mappings are publicly readable" ON public.question_topic_mapping;
DROP POLICY IF EXISTS "Verified question topic mappings are publicly readable" ON public.question_topic_mapping;
CREATE POLICY "Verified question topic mappings are publicly readable" ON public.question_topic_mapping FOR SELECT TO public USING (verified = true);

DROP POLICY IF EXISTS "Topic practice map is readable by signed-in users" ON public.topic_practice_syllabus_map;
DROP POLICY IF EXISTS "Topic practice map is publicly readable" ON public.topic_practice_syllabus_map;
CREATE POLICY "Topic practice map is publicly readable" ON public.topic_practice_syllabus_map FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Topicwise MCQ papers are readable by signed-in users" ON public.topicwise_mcq_papers;
DROP POLICY IF EXISTS "Topicwise MCQ papers are publicly readable" ON public.topicwise_mcq_papers;
CREATE POLICY "Topicwise MCQ papers are publicly readable" ON public.topicwise_mcq_papers FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Topicwise theory questions are readable by signed-in users" ON public.topicwise_theory_questions;
DROP POLICY IF EXISTS "Topicwise theory questions are publicly readable" ON public.topicwise_theory_questions;
CREATE POLICY "Topicwise theory questions are publicly readable" ON public.topicwise_theory_questions FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Theory papers are readable by signed-in users" ON public.theory_papers;
DROP POLICY IF EXISTS "Theory papers are publicly readable" ON public.theory_papers;
CREATE POLICY "Theory papers are publicly readable" ON public.theory_papers FOR SELECT TO public USING (true);