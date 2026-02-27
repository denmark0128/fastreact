from fastapi import APIRouter

from app.utils.responses import success_response

router = APIRouter()


@router.get("/health")
def performance_health():
    return success_response("Performance module scaffold ready")
