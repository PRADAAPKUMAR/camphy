CREATE TYPE public.app_role AS ENUM ('user', 'admin');
CREATE TYPE public.account_type AS ENUM ('student', 'teacher');
CREATE TYPE public.profile_grade AS ENUM ('igcse', 'as', 'a2');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '' CHECK (char_length(full_name) <= 120),
  display_name text NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 60),
  avatar_url text CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 1000),
  account_type public.account_type NOT NULL DEFAULT 'student',
  grade public.profile_grade,
  school text CHECK (school IS NULL OR char_length(school) <= 160),
  country text CHECK (country IS NULL OR char_length(country) <= 80),
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(preferences) = 'object'),
  usage_summary jsonb NOT NULL DEFAULT '{"total_questions_attempted":0,"correct_total":0,"incorrect_total":0,"current_streak":0,"longest_streak":0,"mcq_total":0,"theory_total":0,"worksheet_total":0,"topical_pdf_total":0,"recent_topics":[],"performance":{}}'::jsonb CHECK (jsonb_typeof(usage_summary) = 'object'),
  setup_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  user_id uuid PRIMARY KEY,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_key text NOT NULL CHECK (char_length(event_key) BETWEEN 8 AND 180),
  activity_type text NOT NULL CHECK (activity_type IN ('paper','topic','question','worksheet','theory_pdf','favourite')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_key)
);
GRANT SELECT, INSERT, DELETE ON public.user_activity TO authenticated;
GRANT ALL ON public.user_activity TO service_role;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own activity" ON public.user_activity FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own activity" ON public.user_activity FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own activity" ON public.user_activity FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
