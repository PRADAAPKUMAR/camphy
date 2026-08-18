CREATE TABLE public.syllabus_versions (
  id uuid primary key default gen_random_uuid(),
  syllabus_code text not null,
  syllabus_version text not null,
  qualification text,
  level text,
  official_source_url text,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  unique (syllabus_code, syllabus_version)
);
GRANT SELECT ON public.syllabus_versions TO anon;
GRANT SELECT ON public.syllabus_versions TO authenticated;
GRANT ALL ON public.syllabus_versions TO service_role;
ALTER TABLE public.syllabus_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Syllabus versions are publicly readable" ON public.syllabus_versions FOR SELECT USING (true);

CREATE TABLE public.syllabus_topics (
  id uuid primary key default gen_random_uuid(),
  syllabus_version_id uuid not null references public.syllabus_versions(id) on delete cascade,
  parent_topic_id uuid references public.syllabus_topics(id) on delete cascade,
  topic_code text not null,
  topic_name text not null,
  level text,
  display_order integer default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (syllabus_version_id, topic_code)
);
CREATE INDEX idx_syllabus_topics_version ON public.syllabus_topics(syllabus_version_id);
CREATE INDEX idx_syllabus_topics_parent ON public.syllabus_topics(parent_topic_id);
GRANT SELECT ON public.syllabus_topics TO anon;
GRANT SELECT ON public.syllabus_topics TO authenticated;
GRANT ALL ON public.syllabus_topics TO service_role;
ALTER TABLE public.syllabus_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Syllabus topics are publicly readable" ON public.syllabus_topics FOR SELECT USING (true);

CREATE TABLE public.question_topic_mapping (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references public.papers(id) on delete cascade,
  question_number integer not null,
  syllabus_topic_id uuid not null references public.syllabus_topics(id) on delete cascade,
  mapping_type text not null default 'primary' check (mapping_type in ('primary','secondary')),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (paper_id, question_number, syllabus_topic_id)
);
CREATE INDEX idx_qtm_paper ON public.question_topic_mapping(paper_id);
GRANT SELECT ON public.question_topic_mapping TO anon;
GRANT SELECT ON public.question_topic_mapping TO authenticated;
GRANT ALL ON public.question_topic_mapping TO service_role;
ALTER TABLE public.question_topic_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Question topic mappings are publicly readable" ON public.question_topic_mapping FOR SELECT USING (true);

CREATE TABLE public.topic_practice_syllabus_map (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  level text not null,
  syllabus_topic_id uuid not null references public.syllabus_topics(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (topic, level, syllabus_topic_id)
);
GRANT SELECT ON public.topic_practice_syllabus_map TO anon;
GRANT SELECT ON public.topic_practice_syllabus_map TO authenticated;
GRANT ALL ON public.topic_practice_syllabus_map TO service_role;
ALTER TABLE public.topic_practice_syllabus_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topic practice map is publicly readable" ON public.topic_practice_syllabus_map FOR SELECT USING (true);

INSERT INTO public.syllabus_versions (syllabus_code, syllabus_version, qualification, level, is_current)
VALUES ('0625', '2026-2028', 'Cambridge IGCSE Physics', 'IGCSE', true),
       ('9702', '2025-2027', 'Cambridge International AS & A Level Physics', 'AS/A2', true);