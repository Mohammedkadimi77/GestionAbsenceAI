from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime, timezone

class Message(Document):
    senderId: PydanticObjectId
    receiverId: PydanticObjectId
    content: str
    isRead: bool = False
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "messages"
        indexes = [
            [("receiverId", 1), ("createdAt", -1)],
            [("senderId", 1), ("createdAt", -1)]
        ]
