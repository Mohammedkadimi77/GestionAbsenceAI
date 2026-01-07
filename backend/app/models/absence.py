from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime, timezone
from pymongo import IndexModel

class Absence(Document):
    statut: str  # present | absent | retard
    studentId: PydanticObjectId
    seanceId: PydanticObjectId

    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "absences"
        indexes = [
            IndexModel([("studentId", 1), ("seanceId", 1)], unique=True, name="uniq_student_seance")
        ]
