from beanie import Document, Indexed
from pydantic import Field
from datetime import datetime, timezone

class Module(Document):
    codeModule: Indexed(str, unique=True)
    titre: str
    semestre: str

    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "modules"
