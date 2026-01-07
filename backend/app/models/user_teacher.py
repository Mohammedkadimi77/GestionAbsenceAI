from beanie import Document, Indexed
from pydantic import Field, EmailStr
from datetime import datetime, timezone

class Teacher(Document):
    email: Indexed(EmailStr, unique=True)
    passwordHash: str
    nom: str
    prenom: str
    departement: str

    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "teachers"
