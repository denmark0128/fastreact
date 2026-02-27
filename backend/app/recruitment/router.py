from fastapi import APIRouter

from app.utils.responses import success_response

router = APIRouter()


@router.get("/health")
def recruitment_health():
    return success_response("Recruitment module scaffold ready")
