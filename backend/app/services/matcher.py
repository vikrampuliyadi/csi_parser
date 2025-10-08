import re
from typing import List, Tuple

from app.utils.keywords import REGEX_PATTERNS, KEYWORDS, ANCHOR_TERMS, PROXIMITY_CHAR_WINDOW


def find_matches(text: str) -> List[Tuple[str, str, List[Tuple[int, int]]]]:
    results: List[Tuple[str, str, List[Tuple[int, int]]]] = []

    lowered = text.lower()

    # Exact keyword matches (case-insensitive)
    for kw in KEYWORDS:
        start = 0
        positions = []
        kw_lower = kw.lower()
        while True:
            idx = lowered.find(kw_lower, start)
            if idx == -1:
                break
            positions.append((idx, idx + len(kw)))
            start = idx + len(kw)
        if positions:
            results.append((kw, 'exact', positions))

    # Regex patterns
    for pattern in REGEX_PATTERNS:
        compiled = re.compile(pattern, flags=re.IGNORECASE)
        positions = [(m.start(), m.end()) for m in compiled.finditer(text)]
        if positions:
            results.append((pattern, 'regex', positions))

    return results


def compute_confidence(text: str, start: int, end: int, match_type: str) -> float:
    base = 0.75 if match_type == 'exact' else 0.85
    window_start = max(0, start - PROXIMITY_CHAR_WINDOW)
    window_end = min(len(text), end + PROXIMITY_CHAR_WINDOW)
    window_text = text[window_start:window_end].lower()
    boost = 0.0
    for anchor in ANCHOR_TERMS:
        if anchor in window_text:
            boost += 0.05
            if boost >= 0.2:
                break
    # simple negation penalty
    if 'not required' in window_text or 'unless otherwise noted' in window_text:
        base -= 0.1
    score = max(0.0, min(1.0, base + boost))
    return score
