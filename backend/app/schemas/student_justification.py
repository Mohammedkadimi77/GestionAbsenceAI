from pydantic import BaseModel

class StudentJustificationCreate(BaseModel):
    absenceId: str
    raison: str
    fichier: str  # pour l’instant: URL/nom fichier (plus tard upload réel)
