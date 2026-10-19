-- Historical compatibility marker. The preceding 20260818070000 migration is
-- the canonical definition of these four syllabus tables and their seed data.
-- Recreating them here broke clean database replay. Keep this version so existing
-- installations retain their migration history; 20261019000000 reconciles both
-- previously deployed schema variants without dropping tables or mappings.
SELECT 1;
