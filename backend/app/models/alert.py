from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime, timezone

class Alert(Document):
    typeAlerte: str
    scoreAnomalie: float

    dateStart: datetime
    periodEnd: datetime

    statut: str = "nouvelle"  # nouvelle | en_cours | traitee

    studentId: PydanticObjectId
    adminId: PydanticObjectId | None = None
    moduleId: PydanticObjectId | None = None

    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "alerts"
        indexes = [
            [("studentId", 1), ("createdAt", -1)]
        ]

