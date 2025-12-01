# app/routers/parse.py
import json
import time
from typing import List

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import User, ParseResult
from app.models.schemas import ParseResponse, ParseResultItem, DocumentMeta, Position
from app.services.pdf_parser import PDFParser
from app.services.matcher import find_matches, compute_confidence
from app.utils.spec_section import SectionResolver
from app.utils.text import normalize_text_with_mapping, window
from app.utils.keywords import SNIPPET_WINDOW, PROXIMITY_CHAR_WINDOW
from app.utils.auth import get_current_user

router = APIRouter()

@router.post("/parse", response_model=ParseResponse)
async def parse(
    file: UploadFile = File(...),
    save: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")

    t0 = time.time()
    parser = PDFParser(data)

    results: List[ParseResultItem] = []
    # Do this once so we don't call into PyMuPDF twice later
    num_pages = parser.num_pages()

    section_seed = None

    for page_num, page_text, section_hint in parser.iter_pages():
        ntext, index_map, canonical = normalize_text_with_mapping(page_text)
        section_resolver = SectionResolver(canonical, seed_state=section_seed)
        matches = find_matches(ntext)
        for keyword_or_pattern, match_type, positions in matches:
            for start, end in positions:
                pre, snip, post = window(ntext, start, end, before=SNIPPET_WINDOW, after=SNIPPET_WINDOW)
                context_window = f"{pre}{snip}{post}"
                confidence = compute_confidence(ntext, start, end, match_type)
                source_index = index_map[start] if 0 <= start < len(index_map) else None
                spec_section = (
                    section_resolver.resolve(source_index) if source_index is not None else None
                )
                results.append(
                    ParseResultItem(
                        keyword=keyword_or_pattern,
                        page=page_num,
                        section_hint=section_hint or None,
                        spec_section=spec_section,
                        snippet=snip,
                        context_before=pre,
                        context_after=post,
                        context_window=context_window,
                        confidence=confidence,
                        match_type=match_type,  # type: ignore
                        positions=[Position(start=start, end=end)],
                        proximity_window=PROXIMITY_CHAR_WINDOW,
                    )
                )
        section_seed = section_resolver.tail_state()

    elapsed_ms = int((time.time() - t0) * 1000)
    
    matched_pages = len({r.page for r in results})
    total_matches = len(results)
    filename = file.filename or "document.pdf"

    response = ParseResponse(
        document=DocumentMeta(
            filename=filename,
            num_pages=num_pages,
            parse_time_ms=elapsed_ms,
        ),
        results=results,
        meta={
            "matched_pages": matched_pages,
            "total_matches": total_matches,
            "keywords_used": None,
        },
        result_id=None,
    )

    # Save to database if requested
    if save:
        results_json = json.dumps([r.model_dump() for r in results])
        db_result = ParseResult(
            user_id=current_user.id,
            filename=filename,
            num_pages=num_pages,
            parse_time_ms=elapsed_ms,
            total_matches=total_matches,
            matched_pages=matched_pages,
            results_json=results_json,
        )
        db.add(db_result)
        db.commit()
        db.refresh(db_result)
        response.result_id = db_result.id

    return response
