from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime, timezone

class Justification(Document):
    raison: str
    fichier: str
    statut: str = "en_attente"  # en_attente | validee | refusee

    submittedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    decisionAt: datetime | None = None

    absenceId: PydanticObjectId
    decidedByAdminId: PydanticObjectId | None = None

    class Settings:
        name = "justifications"
        indexes = [
            [("absenceId", 1)]
        ]
