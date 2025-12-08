"""Results routes for retrieving and managing saved parse results."""

import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import ParseResult, User
from app.models.schemas import ParseResultSummary, ParseResultDetail, ParseResultItem
from app.utils.auth import get_current_user

router = APIRouter(prefix="/results", tags=["results"])


@router.get("", response_model=List[ParseResultSummary])
async def list_results(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all saved parse results for the current user."""
    results = (
        db.query(ParseResult)
        .filter(ParseResult.user_id == current_user.id)
        .order_by(ParseResult.created_at.desc())
        .all()
    )
    return results


@router.get("/{result_id}", response_model=ParseResultDetail)
async def get_result(
    result_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get detailed information about a specific parse result."""
    result = (
        db.query(ParseResult)
        .filter(ParseResult.id == result_id, ParseResult.user_id == current_user.id)
        .first()
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parse result not found",
        )
    
    # Parse the JSON results string back into ParseResultItem objects
    try:
        results_data = json.loads(result.results_json)
        results = [ParseResultItem(**item) for item in results_data]
    except (json.JSONDecodeError, ValueError, TypeError) as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse results JSON: {str(e)}",
        )
    
    # Build the meta dictionary
    meta = {
        "matched_pages": result.matched_pages,
        "total_matches": result.total_matches,
        "keywords_used": None,
    }
    
    return ParseResultDetail(
        id=result.id,
        filename=result.filename,
        num_pages=result.num_pages,
        total_matches=result.total_matches,
        matched_pages=result.matched_pages,
        parse_time_ms=result.parse_time_ms,
        results=results,
        meta=meta,
        created_at=result.created_at,
    )


@router.delete("/{result_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_result(
    result_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a saved parse result."""
    result = (
        db.query(ParseResult)
        .filter(ParseResult.id == result_id, ParseResult.user_id == current_user.id)
        .first()
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parse result not found",
        )
    
    db.delete(result)
    db.commit()
    return None

