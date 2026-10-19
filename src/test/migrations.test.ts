// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const reconciliation = () => readFile("supabase/migrations/20261019000000_reconcile_syllabus_mapping.sql", "utf8");
const progressRepair = () => readFile("drizzle/migrations/0002_canonical_progress_keys.sql", "utf8");
describe("isolated PostgreSQL migration replay", () => {
  it("replays both migration systems, enforces reviewed mappings, and repairs duplicated attempts", async () => {
    const db = new PGlite();
    try {
      // Only Supabase-managed platform objects are stubbed; application SQL runs unchanged.
      await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
        CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
        CREATE SCHEMA storage; CREATE TABLE storage.objects (id uuid DEFAULT gen_random_uuid(), bucket_id text);
        CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean);`);
      for (const file of (await readdir("supabase/migrations")).filter((file) => file.endsWith(".sql")).sort()) {
        try { await db.exec(await readFile(`supabase/migrations/${file}`, "utf8")); }
        catch (error) { throw new Error(`Supabase migration ${file} failed: ${String(error)}`); }
      }
      for (const file of (await readdir("drizzle/migrations")).filter((file) => file.endsWith(".sql")).sort()) {
        try { await db.exec(await readFile(`drizzle/migrations/${file}`, "utf8")); }
        catch (error) { throw new Error(`Drizzle migration ${file} failed: ${String(error)}`); }
      }
      await db.exec(await reconciliation());
      const policies = await db.query<{ policyname: string; qual: string }>("SELECT policyname, qual FROM pg_policies WHERE tablename = 'question_topic_mapping'");
      expect(policies.rows).toEqual([{ policyname: "Verified question topic mappings are publicly readable", qual: "(verified = true)" }]);
      const defaults = await db.query<{ column_default: string }>("SELECT column_default FROM information_schema.columns WHERE table_name='question_topic_mapping' AND column_name='verified'");
      expect(defaults.rows[0].column_default).toBe("false");
      await db.exec(`INSERT INTO public.papers (id, level, subject, year, session, paper_code, pdf_url)
        VALUES ('33333333-3333-4333-8333-333333333333','IGCSE','Physics',2026,'June','0625/12','https://example.test/paper.pdf');
        INSERT INTO public.answer_keys (id, paper_id, q1)
        VALUES ('44444444-4444-4444-8444-444444444444','33333333-3333-4333-8333-333333333333','A');
        INSERT INTO public.attempts (id, paper_id, score, total_questions, answers)
        VALUES ('55555555-5555-4555-8555-555555555555','33333333-3333-4333-8333-333333333333',1,1,'{"1":"A"}');
        INSERT INTO public.profiles (id) VALUES ('66666666-6666-4666-8666-666666666666');
        SET ROLE anon;`);
      const publicPaperCount = await db.query<{ count: string }>("SELECT count(*)::text AS count FROM public.papers WHERE id='33333333-3333-4333-8333-333333333333'");
      expect(publicPaperCount.rows[0].count).toBe("1");
      await expect(db.query("SELECT * FROM public.answer_keys")).rejects.toThrow();
      await expect(db.query("SELECT * FROM public.attempts")).rejects.toThrow();
      await expect(db.query("SELECT * FROM public.profiles")).rejects.toThrow();
      await db.exec("RESET ROLE");
      await db.exec(`INSERT INTO public.profiles (id) VALUES ('11111111-1111-4111-8111-111111111111');
        INSERT INTO public.user_activity (user_id, event_key, activity_type, payload) VALUES
        ('11111111-1111-4111-8111-111111111111','activity-same','question','{"score":1,"totalQuestions":2}'),
        ('11111111-1111-4111-8111-111111111111','local-same','question','{"score":1,"totalQuestions":2}'),
        ('11111111-1111-4111-8111-111111111111','local-other','question','{"score":2,"totalQuestions":3}');`);
      await db.exec(await progressRepair()); await db.exec(await progressRepair());
      const activities = await db.query<{ event_key: string }>("SELECT event_key FROM public.user_activity ORDER BY event_key");
      expect(activities.rows.map((row) => row.event_key)).toEqual(["activity-other", "activity-same"]);
      const totals = await db.query<{ usage_summary: { total_questions_attempted: number; correct_total: number; mcq_total: number } }>("SELECT usage_summary FROM public.profiles WHERE id='11111111-1111-4111-8111-111111111111'");
      expect(totals.rows[0].usage_summary).toMatchObject({ total_questions_attempted: 5, correct_total: 3, mcq_total: 2 });
      await db.exec(`GRANT USAGE ON SCHEMA auth TO authenticated;
        INSERT INTO public.user_activity (user_id, event_key, activity_type, payload)
        VALUES ('22222222-2222-4222-8222-222222222222','activity-private','question','{}');
        SET ROLE authenticated;
        SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);`);
      const own = await db.query<{ event_key: string }>("SELECT event_key FROM public.user_activity ORDER BY event_key");
      expect(own.rows.map((row) => row.event_key)).toEqual(["activity-other", "activity-same"]);
      await expect(db.exec(`INSERT INTO public.user_activity (user_id,event_key,activity_type,payload)
        VALUES ('22222222-2222-4222-8222-222222222222','activity-forged','question','{}')`)).rejects.toThrow();
      await db.exec("RESET ROLE");
    } finally { await db.close(); }
  }, 60000);
});
