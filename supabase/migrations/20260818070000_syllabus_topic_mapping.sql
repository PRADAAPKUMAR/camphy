-- =====================================================================
-- Cambridge syllabus / topic mapping layer for PhysicsHQ
-- Run this in the Supabase SQL Editor.
-- Idempotent: safe to re-run.
-- =====================================================================

-- 1. syllabus_versions ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.syllabus_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_code TEXT NOT NULL,
  syllabus_version TEXT NOT NULL,
  qualification TEXT,
  level TEXT,
  official_source_url TEXT,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT syllabus_versions_code_version_key UNIQUE (syllabus_code, syllabus_version)
);

GRANT SELECT ON public.syllabus_versions TO anon, authenticated;
GRANT ALL ON public.syllabus_versions TO service_role;
ALTER TABLE public.syllabus_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Syllabus versions are publicly readable" ON public.syllabus_versions;
CREATE POLICY "Syllabus versions are publicly readable"
  ON public.syllabus_versions FOR SELECT USING (true);

-- 2. syllabus_topics --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.syllabus_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_version_id UUID NOT NULL REFERENCES public.syllabus_versions(id) ON DELETE CASCADE,
  parent_topic_id UUID NULL REFERENCES public.syllabus_topics(id) ON DELETE CASCADE,
  topic_code TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  level TEXT,
  display_order INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT syllabus_topics_version_code_key UNIQUE (syllabus_version_id, topic_code)
);

CREATE INDEX IF NOT EXISTS syllabus_topics_version_idx ON public.syllabus_topics (syllabus_version_id);
CREATE INDEX IF NOT EXISTS syllabus_topics_parent_idx ON public.syllabus_topics (parent_topic_id);

GRANT SELECT ON public.syllabus_topics TO anon, authenticated;
GRANT ALL ON public.syllabus_topics TO service_role;
ALTER TABLE public.syllabus_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Syllabus topics are publicly readable" ON public.syllabus_topics;
CREATE POLICY "Syllabus topics are publicly readable"
  ON public.syllabus_topics FOR SELECT USING (true);

-- 3. question_topic_mapping -------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_topic_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  syllabus_topic_id UUID NOT NULL REFERENCES public.syllabus_topics(id) ON DELETE CASCADE,
  mapping_type TEXT NOT NULL DEFAULT 'primary',
  verified BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT question_topic_mapping_unique UNIQUE (paper_id, question_number, syllabus_topic_id),
  CONSTRAINT question_topic_mapping_type_check CHECK (mapping_type IN ('primary','secondary'))
);

CREATE INDEX IF NOT EXISTS question_topic_mapping_paper_q_idx ON public.question_topic_mapping (paper_id, question_number);
CREATE INDEX IF NOT EXISTS question_topic_mapping_topic_idx ON public.question_topic_mapping (syllabus_topic_id);
-- at most one primary topic per question
CREATE UNIQUE INDEX IF NOT EXISTS question_topic_mapping_one_primary_idx
  ON public.question_topic_mapping (paper_id, question_number)
  WHERE mapping_type = 'primary';

GRANT SELECT ON public.question_topic_mapping TO anon, authenticated;
GRANT ALL ON public.question_topic_mapping TO service_role;
ALTER TABLE public.question_topic_mapping ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Verified question topic mappings are publicly readable" ON public.question_topic_mapping;
CREATE POLICY "Verified question topic mappings are publicly readable"
  ON public.question_topic_mapping FOR SELECT USING (verified = true);

DROP TRIGGER IF EXISTS update_question_topic_mapping_updated_at ON public.question_topic_mapping;
CREATE TRIGGER update_question_topic_mapping_updated_at
  BEFORE UPDATE ON public.question_topic_mapping
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. topic practice -> syllabus topic bridge (no data duplication) ----
CREATE TABLE IF NOT EXISTS public.topic_practice_syllabus_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  level TEXT NOT NULL,
  syllabus_topic_id UUID NOT NULL REFERENCES public.syllabus_topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT topic_practice_syllabus_map_unique UNIQUE (topic, level)
);

CREATE INDEX IF NOT EXISTS topic_practice_syllabus_map_topic_idx ON public.topic_practice_syllabus_map (syllabus_topic_id);

GRANT SELECT ON public.topic_practice_syllabus_map TO anon, authenticated;
GRANT ALL ON public.topic_practice_syllabus_map TO service_role;
ALTER TABLE public.topic_practice_syllabus_map ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Topic practice syllabus map is publicly readable" ON public.topic_practice_syllabus_map;
CREATE POLICY "Topic practice syllabus map is publicly readable"
  ON public.topic_practice_syllabus_map FOR SELECT USING (true);

-- 5. syllabus versions data ------------------------------------------
INSERT INTO public.syllabus_versions (syllabus_code, syllabus_version, qualification, level, official_source_url, is_current)
VALUES
  ('0625','2026-2028','Cambridge IGCSE Physics','IGCSE','https://www.cambridgeinternational.org/Images/697209-2026-2028-syllabus.pdf', true),
  ('9702','2025-2027','Cambridge International AS & A Level Physics','AS & A Level','https://www.cambridgeinternational.org/Images/664565-2025-2027-syllabus.pdf', true)
ON CONFLICT (syllabus_code, syllabus_version) DO NOTHING;

-- 6. 0625 topics + official subtopics ---------------------------------
WITH v AS (SELECT id FROM public.syllabus_versions WHERE syllabus_code='0625' AND syllabus_version='2026-2028')
INSERT INTO public.syllabus_topics (syllabus_version_id, topic_code, topic_name, level, display_order)
SELECT v.id, t.code, t.name, 'IGCSE', t.ord FROM v, (VALUES
  ('1','Motion, forces and energy',1),
  ('2','Thermal physics',2),
  ('3','Waves',3),
  ('4','Electricity and magnetism',4),
  ('5','Nuclear physics',5),
  ('6','Space physics',6)
) AS t(code,name,ord)
ON CONFLICT (syllabus_version_id, topic_code) DO NOTHING;

WITH v AS (SELECT id FROM public.syllabus_versions WHERE syllabus_code='0625' AND syllabus_version='2026-2028')
INSERT INTO public.syllabus_topics (syllabus_version_id, parent_topic_id, topic_code, topic_name, level, display_order)
SELECT v.id, p.id, s.code, s.name, 'IGCSE', s.ord
FROM v
JOIN (VALUES
  ('1','1.1','Physical quantities and measurement techniques',1),
  ('1','1.2','Motion',2),
  ('1','1.3','Mass and weight',3),
  ('1','1.4','Density',4),
  ('1','1.5','Forces',5),
  ('1','1.6','Momentum',6),
  ('1','1.7','Energy, work and power',7),
  ('1','1.8','Pressure',8),
  ('2','2.1','Kinetic particle model of matter',1),
  ('2','2.2','Thermal properties and temperature',2),
  ('2','2.3','Transfer of thermal energy',3),
  ('3','3.1','General properties of waves',1),
  ('3','3.2','Light',2),
  ('3','3.3','Electromagnetic spectrum',3),
  ('3','3.4','Sound',4),
  ('4','4.1','Simple phenomena of magnetism',1),
  ('4','4.2','Electrical quantities',2),
  ('4','4.3','Electric circuits',3),
  ('4','4.4','Electrical safety',4),
  ('4','4.5','Electromagnetic effects',5),
  ('5','5.1','The nuclear model of the atom',1),
  ('5','5.2','Radioactivity',2),
  ('6','6.1','Earth and the Solar System',1),
  ('6','6.2','Stars and the Universe',2)
) AS s(parent_code,code,name,ord) ON true
JOIN public.syllabus_topics p
  ON p.syllabus_version_id = v.id AND p.topic_code = s.parent_code
ON CONFLICT (syllabus_version_id, topic_code) DO NOTHING;

-- 7. 9702 topics 1-25 -------------------------------------------------
WITH v AS (SELECT id FROM public.syllabus_versions WHERE syllabus_code='9702' AND syllabus_version='2025-2027')
INSERT INTO public.syllabus_topics (syllabus_version_id, topic_code, topic_name, level, display_order)
SELECT v.id, t.code, t.name, t.lvl, t.ord FROM v, (VALUES
  ('1','Physical quantities and units','AS Level',1),
  ('2','Kinematics','AS Level',2),
  ('3','Dynamics','AS Level',3),
  ('4','Forces, density and pressure','AS Level',4),
  ('5','Work, energy and power','AS Level',5),
  ('6','Deformation of solids','AS Level',6),
  ('7','Waves','AS Level',7),
  ('8','Superposition','AS Level',8),
  ('9','Electricity','AS Level',9),
  ('10','D.C. circuits','AS Level',10),
  ('11','Particle physics','AS Level',11),
  ('12','Motion in a circle','A Level',12),
  ('13','Gravitational fields','A Level',13),
  ('14','Temperature','A Level',14),
  ('15','Ideal gases','A Level',15),
  ('16','Thermodynamics','A Level',16),
  ('17','Oscillations','A Level',17),
  ('18','Electric fields','A Level',18),
  ('19','Capacitance','A Level',19),
  ('20','Magnetic fields','A Level',20),
  ('21','Alternating currents','A Level',21),
  ('22','Quantum physics','A Level',22),
  ('23','Nuclear physics','A Level',23),
  ('24','Medical physics','A Level',24),
  ('25','Astronomy and cosmology','A Level',25)
) AS t(code,name,lvl,ord)
ON CONFLICT (syllabus_version_id, topic_code) DO NOTHING;

-- 8. bridge existing topic-practice topics to 9702 topics by name -----
INSERT INTO public.topic_practice_syllabus_map (topic, level, syllabus_topic_id)
SELECT DISTINCT tp.topic, tp.level, st.id
FROM public.topicwise_mcq_papers tp
JOIN public.syllabus_versions sv ON sv.syllabus_code='9702' AND sv.syllabus_version='2025-2027'
JOIN public.syllabus_topics st
  ON st.syllabus_version_id = sv.id
 AND st.parent_topic_id IS NULL
 AND lower(st.topic_name) = lower(btrim(regexp_replace(tp.topic, '\s*\(part\s*\d+\)\s*$', '', 'i')))
WHERE upper(tp.level) LIKE 'AS%' OR upper(tp.level) LIKE 'A2%' OR upper(tp.level) LIKE 'A LEVEL%'
ON CONFLICT (topic, level) DO NOTHING;

INSERT INTO public.topic_practice_syllabus_map (topic, level, syllabus_topic_id)
SELECT DISTINCT tp.topic, tp.level, st.id
FROM public.topicwise_mcq_papers tp
JOIN public.syllabus_versions sv ON sv.syllabus_code='0625' AND sv.syllabus_version='2026-2028'
JOIN public.syllabus_topics st
  ON st.syllabus_version_id = sv.id
 AND lower(st.topic_name) = lower(btrim(regexp_replace(tp.topic, '\s*\(part\s*\d+\)\s*$', '', 'i')))
WHERE upper(tp.level) = 'IGCSE'
ON CONFLICT (topic, level) DO NOTHING;
