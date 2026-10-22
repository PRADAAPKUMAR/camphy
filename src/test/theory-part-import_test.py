import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("part_import", Path(__file__).parents[2] / "scripts/extract-theory-part-marks.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

PID = "f45138d8-bcb7-48c9-912a-88b0d521ffc5"
HEADER = "CREATE TEMP TABLE test_papers (theory_paper_id uuid,year integer,expected_questions integer,expected_parts integer) ON COMMIT DROP; INSERT INTO test_papers VALUES ('" + PID + "'::uuid,2022,1,2);"


def row(label, order, marks):
    return f"('{PID}'::uuid,1,'{label}',{order},{marks},$explanation$ignore text numbers 999$explanation$)"


class ImportTests(unittest.TestCase):
    def test_explicit_nested_marks_only(self):
        _, rows = module.extract(HEADER + row("b(i)(1)", 1, 20) + row("b(i)(2)", 2, 40), "PhysicsHQ_Batch02_test.sql")
        self.assertEqual([r['marks'] for r in rows], [20, 40])

    def test_duplicate_parts_rejected(self):
        with self.assertRaises(ValueError):
            module.extract(HEADER + row("a", 1, 30) * 2, "PhysicsHQ_Batch02_test.sql")

    def test_unsubdivided_question_marks(self):
        header = HEADER.replace("2022,1,2", "2022,1,1")
        _, rows = module.extract(header + row("", 1, 60), "PhysicsHQ_Batch02_test.sql")
        self.assertEqual((rows[0]['part_label'], rows[0]['marks']), ("", 60))

    def test_parent_child_double_count_rejected(self):
        with self.assertRaises(ValueError):
            module.extract(HEADER + row("a", 1, 30) + row("a(i)", 2, 30), "PhysicsHQ_Batch02_test.sql")

    def test_incomplete_paper_total_rejected(self):
        with self.assertRaises(ValueError):
            module.extract(HEADER + row("a", 1, 2) + row("b", 2, 3), "PhysicsHQ_Batch02_test.sql")


if __name__ == "__main__":
    unittest.main()