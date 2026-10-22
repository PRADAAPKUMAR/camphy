import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("marks", Path(__file__).parents[1] / "lib/theory-marks-extraction.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ExtractionTests(unittest.TestCase):
    def test_terminal_total(self):
        self.assertEqual(module.extract_question_marks("1 (a) Define velocity. [2]\n[Total: 9]", 1), 9)

    def test_split_total(self):
        self.assertEqual(module.extract_question_marks("12 (a) Define decay.\n[Total:\t7]", 12), 7)

    def test_ambiguous_ranges(self):
        self.assertIsNone(module.extract_question_marks("1 (a) Define. [Total: 9]\n2 (a) State. [Total: 4]", 1))

    def test_wrong_question(self):
        self.assertIsNone(module.extract_question_marks("2 (a) Define. [Total: 4]", 1))

    def test_missing_total(self):
        self.assertIsNone(module.extract_question_marks("1 (a) Define. [2]", 1))

    def test_shared_page(self):
        self.assertIsNone(module.extract_question_marks("1 (a) Define. [Total: 9]", 1, True))


if __name__ == "__main__":
    unittest.main()