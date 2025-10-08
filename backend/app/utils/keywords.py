KEYWORDS = [
    "Professional Engineer",
    "Registered Engineer",
    "Civil Engineer",
    "Structural Engineer",
    "Civil or Structural Engineer",
    "Stamped by",
    "Sealed by",
    "Licensed Engineer",
    "Engineer of Record",
    "PE seal",
]

REGEX_PATTERNS = [
    r"\bprofessional\s+engineer(s)?\b",
    r"\bregistered\s+engineer(s)?\b",
    r"\b(structural|civil)\s+engineer(s)?\b",
    r"\b(seal(ed)?|stamp(ed)?)\s+by\b",
    r"\bengineer\s+of\s+record\b",
    r"\blicensed\s+engineer(s)?\b",
    r"\bpe\s+(seal|stamp|registration)\b",
]

ANCHOR_TERMS = [
    "seal", "sealed", "stamp", "stamped", "calculations", "shop drawings", "licensed", "state",
]

PROXIMITY_CHAR_WINDOW = 300
SNIPPET_WINDOW = 400
