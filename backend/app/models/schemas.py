from typing import List, Optional, Literal
from pydantic import BaseModel, EmailStr
from datetime import datetime


class Position(BaseModel):
    start: int
    end: int


class ParseResultItem(BaseModel):
    keyword: str
    page: int
    section_hint: Optional[str] = None
    spec_section: Optional[str] = None
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
    result_id: Optional[int] = None  # ID of saved result, if saved


# Authentication schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


# Results schemas
class ParseResultSummary(BaseModel):
    id: int
    filename: str
    num_pages: int
    total_matches: int
    matched_pages: int
    parse_time_ms: int
    created_at: datetime

    class Config:
        from_attributes = True


class ParseResultDetail(BaseModel):
    id: int
    filename: str
    num_pages: int
    total_matches: int
    matched_pages: int
    parse_time_ms: int
    results: List[ParseResultItem]
    meta: dict
    created_at: datetime

    class Config:
        from_attributes = True
