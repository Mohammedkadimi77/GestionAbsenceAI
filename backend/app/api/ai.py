from fastapi import APIRouter
from beanie import PydanticObjectId

from app.ai.anomaly_service import detect_student_anomaly

router = APIRouter(prefix="/ai", tags=["AI"])

@router.post("/detect/{student_id}")
async def detect(student_id: str):
    return await detect_student_anomaly(PydanticObjectId(student_id))
