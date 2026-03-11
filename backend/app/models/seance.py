from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime, date, timezone
from pymongo import IndexModel

class Seance(Document):
    dateSeance: date
    heureDebut: str   # ✅ "08:30" ou "08:30:00"
    heureFin: str     # ✅ "10:00" ou "10:00:00"
    typeSeance: str
    salle: str

    moduleId: PydanticObjectId
    teacherId: PydanticObjectId
    groupId: PydanticObjectId

    # QR Code fields
    qrToken: str | None = None
    qrLastToken: str | None = None  # Store previous token for overlap validation
    qrExpiresAt: datetime | None = None  # Current token expiration (not strictly needed but kept for backward compatibility/legacy)
    qrSessionExpiresAt: datetime | None = None  # Total 10-min window
    qrLastRotationAt: datetime | None = None  # When the last 30s rotation happened

    statut: str = "en_cours" # "en_cours" | "validee"

    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "seances"
        indexes = [
            IndexModel(
                [("dateSeance", 1), ("heureDebut", 1), ("moduleId", 1), ("teacherId", 1), ("groupId", 1)],
                unique=True,
                name="uniq_seance"
            )
        ]
