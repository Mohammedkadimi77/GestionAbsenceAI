# from beanie import Document, PydanticObjectId
# from pydantic import Field
# from datetime import datetime, timezone

# class Alert(Document):
#     typeAlerte: str
#     scoreAnomalie: float

#     dateStart: datetime
#     periodEnd: datetime

#     statut: str = "nouvelle"  # nouvelle | en_cours | traitee

#     studentId: PydanticObjectId
#     adminId: PydanticObjectId | None = None
#     moduleId: PydanticObjectId | None = None

#     createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
#     updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

#     class Settings:
#         name = "alerts"
#         indexes = [
#             [("studentId", 1), ("createdAt", -1)]
#         ]
# app/models/alert.py
from datetime import datetime
from beanie import Document, PydanticObjectId
from pydantic import Field

class Alert(Document):
    typeAlerte: str = "Absence suspecte"
    scoreAnomalie: float
    reasons: list[str] = []
    studentId: PydanticObjectId
    groupId: PydanticObjectId | None = None
    periodDays: int = 30
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    status: str = "nouvelle"  # nouvelle | vue | traite

    class Settings:
        name = "alerts"
