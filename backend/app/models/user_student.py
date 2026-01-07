from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field, EmailStr
from datetime import datetime, timezone

class Student(Document):
    email: Indexed(EmailStr, unique=True)
    passwordHash: str
    CIN: Indexed(str, unique=True)

    nom: str
    prenom: str
    statut: str

    groupId: PydanticObjectId

    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "students"
        indexes = [[("groupId", 1)]]
