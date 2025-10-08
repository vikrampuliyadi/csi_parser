import re
import unicodedata


def normalize_text(s: str) -> str:
    s = unicodedata.normalize('NFKC', s)
    s = s.replace('\r', '\n')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()


def window(text: str, start: int, end: int, before: int, after: int):
    s = max(0, start - before)
    e = min(len(text), end + after)
    pre = text[s:start]
    snip = text[start:end]
    post = text[end:e]
    return pre, snip, post
