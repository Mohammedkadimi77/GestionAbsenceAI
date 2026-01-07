from datetime import datetime, timedelta, timezone
from beanie import PydanticObjectId

from app.ai.feature_engineering import compute_student_features
from app.ai.rules_engine import compute_anomaly_score
from app.models.alert import Alert

async def detect_student_anomaly(student_id: PydanticObjectId, days: int = 30):
    features = await compute_student_features(student_id, days)
    score, reasons = compute_anomaly_score(features)

    if score >= 0.7:
        alert = Alert(
            typeAlerte="Absence suspecte",
            scoreAnomalie=score,
            dateStart=datetime.now(timezone.utc) - timedelta(days=days),
            periodEnd=datetime.now(timezone.utc),
            statut="nouvelle",
            studentId=student_id,
        )
        await alert.insert()
        return {"alert": True, "score": score, "reasons": reasons}

    return {"alert": False, "score": score, "reasons": reasons}
