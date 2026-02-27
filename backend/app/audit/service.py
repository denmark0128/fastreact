import json
from typing import Any

from sqlalchemy.orm import Session

from app.audit.models import AuditLog
from app.auth.models import User


def create_audit_log(
    db: Session,
    *,
    action: str,
    entity_type: str,
    entity_id: str | int | None = None,
    actor: User | None = None,
    actor_email: str | None = None,
    details: dict[str, Any] | None = None,
) -> AuditLog:
    log = AuditLog(
        actor_user_id=actor.id if actor else None,
        actor_email=actor.email if actor else actor_email,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        details=json.dumps(details) if details else None,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def list_audit_logs(
    db: Session,
    *,
    limit: int = 50,
    offset: int = 0,
    actor_user_id: int | None = None,
    action: str | None = None,
    entity_type: str | None = None,
) -> tuple[list[AuditLog], int]:
    query = db.query(AuditLog)

    if actor_user_id is not None:
        query = query.filter(AuditLog.actor_user_id == actor_user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    total = query.count()
    items = query.order_by(AuditLog.created_at.desc(), AuditLog.id.desc()).offset(offset).limit(limit).all()
    return items, total


def parse_audit_details(value: str | None) -> dict[str, Any] | None:
    if not value:
        return None
    try:
        loaded = json.loads(value)
        return loaded if isinstance(loaded, dict) else None
    except json.JSONDecodeError:
        return None
