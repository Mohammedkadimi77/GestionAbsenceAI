from pydantic import BaseModel

class AlertUpdate(BaseModel):
    statut: str
