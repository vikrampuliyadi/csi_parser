from typing import List, Optional, Literal
from pydantic import BaseModel


class Position(BaseModel):
    start: int
    end: int


class ParseResultItem(BaseModel):
    keyword: str
    page: int
    section_hint: Optional[str] = None
    snippet: str
    context_before: str
    context_after: str
    context_window: str
    confidence: float
    match_type: Literal['exact', 'regex', 'fuzzy']
    positions: List[Position]
    proximity_window: Optional[int] = None


class DocumentMeta(BaseModel):
    filename: str
    num_pages: int
    parse_time_ms: int


class ParseResponse(BaseModel):
    document: DocumentMeta
    results: List[ParseResultItem]
    meta: dict
