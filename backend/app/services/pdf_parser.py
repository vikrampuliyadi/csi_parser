# app/services/pdf_parser.py
import time
import re
from typing import Dict, Generator, Tuple, Iterable
import fitz  # PyMuPDF

SECTION_LINE_PATTERN = re.compile(r"\b\d{2}\s\d{2}\s\d{2}\b")

class PDFParser:
    def __init__(self, pdf_bytes: bytes):
        self._pdf_bytes = pdf_bytes

    def _open(self):
        # Avoids temp-file lifetime issues entirely
        return fitz.open(stream=self._pdf_bytes, filetype="pdf")

    def iter_pages(self) -> Generator[Tuple[int, str, str], None, None]:
        last_section = ""
        with self._open() as doc:
            for i, page in enumerate(doc):
                text = page.get_text("text")
                # naive section header heuristic
                lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
                for ln in lines[:8]:
                    if len(ln) >= 120:
                        continue
                    if SECTION_LINE_PATTERN.search(ln):
                        last_section = ln
                        break
                yield (i + 1, text, last_section)

    def num_pages(self) -> int:
        with self._open() as doc:
            return doc.page_count

    def parse_timing(self) -> int:
        return int(time.time() * 1000)
