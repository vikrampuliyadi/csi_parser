"""Utilities for inferring CSI MasterFormat hierarchy codes.

The specification PDFs that we parse usually encode the CSI MasterFormat
hierarchy using visual indentation and short prefixes.  For example::

    1.05    SUBMITTALS
        A.  Action Submittals
            1.  Product Data
                a.  Manufacturer datasheets

``SectionResolver`` treats the text of a single page as a stream and keeps
track of the most recent *article* (``1.05``), *paragraph* (``A``),
*subparagraph* (``1``), and *item* (``a``) encountered while iterating.  When
the parser discovers a keyword match elsewhere on the page we ask the resolver
to map the match's ``source_index`` back to the latest seen identifiers.  This
lets the API return rich CSI codes like ``1.05-A-1-a`` alongside each match.
"""

import bisect
import dataclasses
import re
from typing import List, Optional, Tuple


@dataclasses.dataclass
class SectionEntry:
    """Snapshot of the CSI hierarchy state at a particular character index."""

    index: int
    article: Optional[str]
    paragraph: Optional[str]
    subparagraph: Optional[str]
    item: Optional[str]
    opened_depth: int


class SectionResolver:
    """Heuristically track CSI MasterFormat section hierarchies within a page."""

    ARTICLE_RE = re.compile(r"^(?P<article>\d{1,2}\.\d{2,}(?:\.\d{2,})?)")
    PARAGRAPH_RE = re.compile(r"^(?P<paragraph>[A-Z])(?:[\.\)\-])(?:\s|$)")
    SUBPARAGRAPH_RE = re.compile(r"^(?P<subparagraph>\d+)(?:[\.\)\-])(?:\s|$)")
    ITEM_RE = re.compile(r"^(?P<item>[a-z])(?:[\.\)\-])(?:\s|$)")

    def __init__(self, text: str, seed_state: Optional[SectionEntry] = None):
        self._entries, self._tail_state = self._build_entries(text, seed_state)
        self._indices = [entry.index for entry in self._entries]

    def resolve(self, source_index: int) -> Optional[str]:
        """Return the most recent CSI hierarchy identifier for ``source_index``.

        The ``source_index`` we receive corresponds to the canonical text
        produced by :func:`backend.app.utils.text.normalize_text_with_mapping`.
        We therefore bisect within ``self._indices`` to find the most recent
        hierarchy snapshot that begins at or before that character and build a
        compound identifier from the stored article / paragraph / etc. parts.
        """

        if not self._entries:
            return None
        pos = bisect.bisect_right(self._indices, source_index) - 1
        if pos < 0:
            return None
        entry = self._entries[pos]
        depth = entry.opened_depth
        parts = [entry.article, entry.paragraph, entry.subparagraph, entry.item]
        if depth:
            parts = parts[:depth]
        joined = [p for p in parts if p]
        return "-".join(joined) if joined else None

    def tail_state(self) -> Optional[SectionEntry]:
        """Return the CSI hierarchy state observed at the end of the page."""

        return self._tail_state

    def _build_entries(
        self, text: str, seed_state: Optional[SectionEntry]
    ) -> Tuple[List[SectionEntry], Optional[SectionEntry]]:
        entries: List[SectionEntry] = []
        state = {
            "article": None,
            "paragraph": None,
            "subparagraph": None,
            "item": None,
        }

        opened_depth = 0

        if seed_state:
            state["article"] = seed_state.article
            state["paragraph"] = seed_state.paragraph
            state["subparagraph"] = seed_state.subparagraph
            state["item"] = seed_state.item
            if any(state.values()):
                opened_depth = min(self._state_depth(state), 2)
                entries.append(
                    SectionEntry(
                        index=0,
                        article=state["article"],
                        paragraph=state["paragraph"],
                        subparagraph=state["subparagraph"],
                        item=state["item"],
                        opened_depth=opened_depth,
                    )
                )

        cursor = 0
        lines = text.split("\n")
        for line in lines:
            line_start = cursor
            cursor += len(line) + 1  # account for the newline we split on

            stripped = line.lstrip()
            if not stripped:
                continue

            leading_ws = len(line) - len(stripped)
            position = line_start + leading_ws
            updated_depth: Optional[int] = None

            article_match = self.ARTICLE_RE.match(stripped)
            if article_match:
                state["article"] = article_match.group("article")
                state["paragraph"] = None
                state["subparagraph"] = None
                state["item"] = None
                updated_depth = 1

            paragraph_match = self.PARAGRAPH_RE.match(stripped)
            if paragraph_match and state["article"]:
                state["paragraph"] = paragraph_match.group("paragraph")
                state["subparagraph"] = None
                state["item"] = None
                updated_depth = max(updated_depth or 0, 2)

            sub_match = self.SUBPARAGRAPH_RE.match(stripped)
            if sub_match and state["article"]:
                state["subparagraph"] = sub_match.group("subparagraph")
                state["item"] = None
                updated_depth = max(updated_depth or 0, 3)

            item_match = self.ITEM_RE.match(stripped)
            if item_match and state["article"]:
                state["item"] = item_match.group("item")
                updated_depth = max(updated_depth or 0, 4)

            if updated_depth and state["article"]:
                opened_depth = max(opened_depth, updated_depth)
                entries.append(
                    SectionEntry(
                        index=position,
                        article=state["article"],
                        paragraph=state["paragraph"],
                        subparagraph=state["subparagraph"],
                        item=state["item"],
                        opened_depth=opened_depth,
                    )
                )

        if any(state.values()):
            tail_depth = max(opened_depth, self._state_depth(state))
            tail = SectionEntry(
                index=len(text),
                article=state["article"],
                paragraph=state["paragraph"],
                subparagraph=state["subparagraph"],
                item=state["item"],
                opened_depth=tail_depth,
            )
        else:
            tail = None

        return entries, tail

    @staticmethod
    def _state_depth(state: dict) -> int:
        if state.get("item"):
            return 4
        if state.get("subparagraph"):
            return 3
        if state.get("paragraph"):
            return 2
        if state.get("article"):
            return 1
        return 0
