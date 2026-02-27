from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.audit.schemas import AuditLogListResponse, AuditLogResponse
from app.audit.service import list_audit_logs, parse_audit_details
from app.auth.models import User, UserRole
from app.dependencies import get_db, require_roles
from app.utils.responses import success_response


router = APIRouter()


@router.get("/logs")
def list_audit_logs_endpoint(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    actor_user_id: int | None = None,
    action: str | None = None,
    entity_type: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin, UserRole.hr_manager)),
):
    items, total = list_audit_logs(
        db,
        limit=limit,
        offset=offset,
        actor_user_id=actor_user_id,
        action=action,
        entity_type=entity_type,
    )

    response = AuditLogListResponse(
        items=[
            AuditLogResponse(
                id=item.id,
                actor_user_id=item.actor_user_id,
                actor_email=item.actor_email,
                action=item.action,
                entity_type=item.entity_type,
                entity_id=item.entity_id,
                details=parse_audit_details(item.details),
                created_at=item.created_at,
            )
            for item in items
        ],
        total=total,
        limit=limit,
        offset=offset,
    )
    return success_response("Audit logs fetched successfully", response.model_dump())
