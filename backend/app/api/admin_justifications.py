from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from app.core.deps import require_role
from beanie import PydanticObjectId
from datetime import datetime, timezone
from app.models.justification import Justification
from app.schemas.justification import JustificationDecision

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_role("admin"))])

@router.get("/justifications")
async def list_justifications(statut: Optional[str] = Query(default=None)):
    q = Justification.find_all()
    if statut:
        q = q.find(Justification.statut == statut)
    return await q.sort(-Justification.submittedAt).to_list()


@router.patch("/justifications/{justif_id}")
async def decide_justification(justif_id: str, payload: JustificationDecision, admin=Depends(require_role("admin"))):
    justif = await Justification.get(PydanticObjectId(justif_id))
    if not justif:
        raise HTTPException(status_code=404, detail="Justification not found")

    if payload.statut not in ["validee", "refusee"]:
        raise HTTPException(status_code=400, detail="Invalid statut")

    justif.statut = payload.statut
    justif.decisionAt = datetime.now(timezone.utc)

    # admin dict => sub
    admin_id = admin.get("sub") or admin.get("id")
    if admin_id:
        justif.decidedByAdminId = PydanticObjectId(admin_id)

    await justif.save()
    return {"message": "Justification updated", "statut": justif.statut}