from fastapi import APIRouter, Query, HTTPException
from beanie import PydanticObjectId
from app.ai.feature_engineering import compute_student_features

router = APIRouter(prefix="/ai", tags=["AI"])

def parse_period(period: str) -> int:
    # "30d" -> 30
    period = period.strip().lower()
    if period.endswith("d") and period[:-1].isdigit():
        return int(period[:-1])
    raise HTTPException(status_code=400, detail="period must be like 7d, 30d")

@router.get("/student/{studentId}/score")
async def student_score(studentId: str, period: str = Query(default="30d")):
    days = parse_period(period)
    feats = await compute_student_features(PydanticObjectId(studentId), days)

    # ✅ noms corrects
    late_rate = float(feats.get("retard_rate", 0.0))
    absent_rate = float(feats.get("absence_rate", 0.0))
    streak = float(feats.get("max_consecutive_absences", 0))

    score = (
        0.5 * absent_rate +
        0.3 * late_rate +
        0.2 * min(streak / 5.0, 1.0)  # option: cap à 1
    )

    return {
        "studentId": studentId,
        "period": period,
        "score": round(float(score), 4),
        "factors": feats,
        "explain": {
            "absent_rate_weight": 0.5,
            "late_rate_weight": 0.3,
            "streak_weight": 0.2,
        }
    }

