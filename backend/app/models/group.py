from beanie import Document
from pydantic import Field
from datetime import datetime, timezone
from pymongo import IndexModel

class Group(Document):
    nomGroupe: str
    niveau: str
    filiere: str
    emploiDuTemps: str | None = None  # ✅ Path vers l'image de l'emploi du temps

    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "groups"
        indexes = [
            IndexModel(
                [("nomGroupe", 1), ("niveau", 1), ("filiere", 1)],
                unique=True,
                name="uniq_group_nom_niveau_filiere"
            )
        ]
