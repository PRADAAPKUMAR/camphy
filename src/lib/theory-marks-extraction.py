"""Conservative offline extraction; never infer marks from individual part scores."""
import re


def extract_question_marks(text, question_number, shared_page=False):
    if shared_page:
        return None
    totals = re.findall(r"\[\s*Total\s*:\s*(\d+)\s*\]", text, re.IGNORECASE)
    # Multiple printed totals indicate overlapping or suspect question ranges.
    if len(totals) != 1:
        return None
    starts = re.findall(r"^\s*(\d{1,2})\s+(?:\([a-z]\)|[A-Z][a-z])", text, re.MULTILINE)
    if not starts or set(map(int, starts)) != {question_number}:
        return None
    marks = int(totals[0])
    return marks if marks > 0 else None