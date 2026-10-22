"""Read explicit marks as data; never execute uploaded SQL or explanation text."""
import re
import hashlib
from collections import defaultdict

PART = re.compile(r"\('([0-9a-f-]{36})'::uuid\s*,\s*(\d+)\s*,\s*'([^']*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*\$explanation\$", re.I)


def extract(text, filename):
    schema = re.search(r"CREATE TEMP TABLE (\w+_papers)\s*\((.*?)\) ON COMMIT DROP;", text, re.S | re.I)
    if not schema:
        raise ValueError("Missing paper catalog")
    columns = re.findall(r"(?:^|,)\s*(\w+)\s+(?:uuid|integer|text)\b", schema[2], re.I)
    values = re.search(r"INSERT INTO " + schema[1] + r"\s+VALUES(.*?);", text, re.S | re.I)
    if not values:
        raise ValueError("Missing paper identities")
    papers = {}
    batch = int(re.search(r"Batch(\d+)_", filename)[1])
    for row in re.findall(r"\(([^()]+)\)", values[1]):
        tokens = re.findall(r"'([^']*)'(?:\:\:uuid)?|(-?\d+)", row)
        fields = [a if a else int(b) for a, b in tokens]
        if len(fields) != len(columns):
            raise ValueError("Unrecognized paper identity fields")
        p = dict(zip(columns, fields))
        p.setdefault("component", "22" if batch == 2 else "42")
        p.setdefault("paper_code", "9702/" + p["component"])
        p.setdefault("level", "AS Level" if p["component"].startswith("2") else "A2 Level")
        p.setdefault("session", "May/June" if batch == 8 else "February/March")
        p.setdefault("syllabus_code", "9702")
        papers[p["theory_paper_id"]] = p
    rows = []
    keys, orders = set(), set()
    groups = defaultdict(list)
    digest = hashlib.sha256(text.encode()).hexdigest()
    for pid, q, label, order, marks in PART.findall(text):
        q, order, marks = int(q), int(order), int(marks)
        if pid not in papers or (label and not re.fullmatch(r"[a-z](?:\((?:[ivx]+|\d+)\))*", label)):
            raise ValueError("Unknown paper or part label")
        key, okey = (pid, q, label), (pid, q, order)
        if key in keys or okey in orders or min(q, order, marks) < 1:
            raise ValueError("Duplicate or invalid subdivision")
        keys.add(key); orders.add(okey)
        rows.append(dict(theory_paper_id=pid, question_number=q, part_label=label, order_index=order, marks=marks, source_file=filename, source_sha256=digest))
        groups[pid, q].append(rows[-1])
    for (pid, q), parts in groups.items():
        labels = [p["part_label"] for p in parts]
        if "" in labels and len(labels) != 1:
            raise ValueError("Whole question and subdivisions overlap")
        if any(a != b and b.startswith(a + "(") for a in labels for b in labels):
            raise ValueError("Overlapping parent and child marks")
        if sorted(p["order_index"] for p in parts) != list(range(1, len(parts) + 1)):
            raise ValueError("Incomplete part order")
    for pid, p in papers.items():
        parts = [r for r in rows if r["theory_paper_id"] == pid]
        if len(parts) != p["expected_parts"]:
            raise ValueError("Incomplete subdivision coverage")
        if {r["question_number"] for r in parts} != set(range(1, p["expected_questions"] + 1)):
            raise ValueError("Incomplete question coverage")
        if sum(r["marks"] for r in parts) != (60 if p["component"].startswith("2") else 100):
            raise ValueError("Paper marks do not reconcile")
    return papers, rows