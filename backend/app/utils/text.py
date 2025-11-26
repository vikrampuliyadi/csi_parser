import re
import unicodedata
from typing import List, Tuple

def normalize_text(s: str) -> str:
    s = unicodedata.normalize('NFKC', s)
    s = s.replace('\r', '\n')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def normalize_text_with_mapping(s: str) -> Tuple[str, List[int], str]:
    """Return a whitespace-collapsed string and a map back to the source text.

    ``normalize_text`` has historically returned a version of ``s`` that is
    safe for keyword matching (Windows newlines collapsed, runs of whitespace
    reduced to single spaces, leading/trailing spaces trimmed).  For CSI section
    resolution we also need to know *where* in the original page each character
    of the normalized string originated.  This helper performs the same
    canonicalisation work but additionally yields ``index_map`` and
    ``canonical_source``:

    ``index_map``
        A list where ``index_map[i]`` is the index in ``canonical_source`` that
        produced ``normalized_text[i]``.

    ``canonical_source``
        The intermediate form of ``s`` after unicode normalization and newline
        canonicalisation but before whitespace collapsing.  This lets the caller
        correlate resolved indices with the exact page text if needed.
    """

    canonical = unicodedata.normalize('NFKC', s).replace('\r', '\n')
    result_chars: List[str] = []
    index_map: List[int] = []
    last_was_space = False

    for idx, ch in enumerate(canonical):
        if ch.isspace():
            if not result_chars:
                continue
            if last_was_space:
                continue
            result_chars.append(' ')
            index_map.append(idx)
            last_was_space = True
        else:
            result_chars.append(ch)
            index_map.append(idx)
            last_was_space = False

    # Strip trailing space to mirror ``normalize_text`` behaviour.
    if result_chars and result_chars[-1] == ' ':
        result_chars.pop()
        index_map.pop()

    normalized = ''.join(result_chars)
    return normalized, index_map, canonical

def window(text: str, start: int, end: int, before: int, after: int):
    s = max(0, start - before)
    e = min(len(text), end + after)
    pre = text[s:start]
    snip = text[start:end]
    post = text[end:e]
    return pre, snip, post
