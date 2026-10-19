-- Remove only byte-for-byte equivalent attempts duplicated by the old import
-- prefix. Different payloads are retained even if their short legacy hashes match.
DELETE FROM public.user_activity imported
USING public.user_activity synced
WHERE imported.user_id = synced.user_id
  AND imported.event_key LIKE 'local-%'
  AND synced.event_key = 'activity-' || substring(imported.event_key FROM 7)
  AND imported.payload = synced.payload;

UPDATE public.user_activity imported
SET event_key = 'activity-' || substring(imported.event_key FROM 7)
WHERE imported.event_key LIKE 'local-%'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_activity synced
    WHERE synced.user_id = imported.user_id
      AND synced.event_key = 'activity-' || substring(imported.event_key FROM 7)
  );

-- Repair aggregates after consolidating duplicated attempts. Preserve unrelated
-- profile preferences/summary fields and don't modify the original attempt data.
WITH totals AS (
  SELECT user_id,
    sum(CASE WHEN payload->>'totalQuestions' ~ '^[0-9]+$' THEN (payload->>'totalQuestions')::bigint ELSE 0 END) AS attempted,
    sum(CASE WHEN payload->>'score' ~ '^[0-9]+$' THEN (payload->>'score')::bigint ELSE 0 END) AS correct,
    count(*) AS attempts
  FROM public.user_activity
  WHERE activity_type IN ('paper', 'topic', 'question')
  GROUP BY user_id
)
UPDATE public.profiles p
SET usage_summary = p.usage_summary || jsonb_build_object(
  'total_questions_attempted', totals.attempted,
  'correct_total', totals.correct,
  'incorrect_total', greatest(0, totals.attempted - totals.correct),
  'mcq_total', totals.attempts
)
FROM totals WHERE p.id = totals.user_id;
