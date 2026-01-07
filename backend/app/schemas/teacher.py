from pydantic import BaseModel
from datetime import date, time
from typing import Literal

AttendanceStatus = Literal["present", "absent", "retard"]

class SeanceCreate(BaseModel):
    dateSeance: date
    heureDebut: str  # "08:30" ou "08:30:00"
    heureFin: str
    typeSeance: str
    salle: str
    moduleId: str
    groupId: str

class AttendanceItem(BaseModel):
    studentId: str
    statut: AttendanceStatus

class AttendanceSubmit(BaseModel):
    items: list[AttendanceItem]
