from fastapi import APIRouter
from beanie import PydanticObjectId
import joblib
import os
import numpy as np
from sklearn.ensemble import IsolationForest

from app.models.user_student import Student
from app.ai.feature_engineering import compute_student_features

router = APIRouter(prefix="/ai", tags=["AI"])

MODEL_PATH = "app/ai/model.joblib"

@router.post("/train")
async def train_model(period: str = "30d"):
    days = int(period.replace("d", ""))

    students = await Student.find_all().to_list()
    X = []

    for s in students:
        feats = await compute_student_features(PydanticObjectId(str(s.id)), days)
        X.append([
            float(feats.get("absence_rate", 0.0)),
            float(feats.get("retard_rate", 0.0)),
            float(feats.get("max_consecutive_absences", 0)),
        ])


    if len(X) < 5:
        return {"message": "Not enough data to train", "samples": len(X)}

    X = np.array(X, dtype=float)

    model = IsolationForest(
        n_estimators=200,
        contamination=0.1,
        random_state=42
    )
    model.fit(X)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    return {"message": "Model trained", "samples": len(X), "saved_to": MODEL_PATH}
