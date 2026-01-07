from pydantic import BaseModel

class JustificationDecision(BaseModel):
    statut: str  # "validee" | "refusee"
