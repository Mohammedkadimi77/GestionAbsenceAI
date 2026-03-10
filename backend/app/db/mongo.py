from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.core.config import settings

# Import des documents (Beanie)
from app.models.group import Group
from app.models.user_admin import Administrator
from app.models.user_teacher import Teacher
from app.models.user_student import Student
from app.models.module import Module
from app.models.seance import Seance
from app.models.absence import Absence
from app.models.justification import Justification
from app.models.alert import Alert
from app.models.message import Message

async def init_mongo():
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB]

    await init_beanie(
        database=db,
        document_models=[
            Group, Administrator, Teacher, Student,
            Module, Seance, Absence, Justification, Alert, Message
        ],
    )
def get_db():
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB]
    return db