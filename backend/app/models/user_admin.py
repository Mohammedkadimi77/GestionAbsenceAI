from beanie import Document, Indexed
from pydantic import Field, EmailStr
from datetime import datetime, timezone

class Administrator(Document):
    CIN: Indexed(str, unique=True)
    email: Indexed(EmailStr, unique=True)
    passwordHash: str
    nom: str
    prenom: str
    role: str = "admin"

    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "administrators"
