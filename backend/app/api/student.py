from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from beanie import PydanticObjectId
from datetime import datetime, timezone
from typing import Optional
from pathlib import Path
import uuid
from pydantic import BaseModel

from app.core.deps import require_role
from app.models.justification import Justification
from app.models.absence import Absence
from app.models.seance import Seance
from app.models.module import Module
from app.models.user_student import Student
from app.models.user_teacher import Teacher
from app.models.message import Message

router = APIRouter(prefix="/student", tags=["Student"], dependencies=[Depends(require_role("student"))])

UPLOAD_DIR = Path("uploads/justifications")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/justifications")
async def submit_justification(
    absenceId: str = Form(...),
    raison: str | None = Form(None),
    file: UploadFile | None = File(None),
    student=Depends(require_role("student")),
):
    try:
        absence_obj_id = PydanticObjectId(absenceId)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid absenceId")

    absence = await Absence.get(absence_obj_id)
    if not absence:
        raise HTTPException(status_code=404, detail="Absence not found")

    student_id = student.get("sub")
    if str(absence.studentId) != str(student_id):
        raise HTTPException(status_code=403, detail="Not allowed")

    existing = await Justification.find_one(Justification.absenceId == absence.id)
    if existing:
        raise HTTPException(status_code=400, detail="Justification already submitted")

    saved_path: str | None = None
    if file:
        ext = Path(file.filename).suffix.lower() if file.filename else ""
        allowed_ext = {".pdf", ".png", ".jpg", ".jpeg"}
        if ext and ext not in allowed_ext:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        unique_name = f"{uuid.uuid4().hex}{ext}"
        dest_path = UPLOAD_DIR / unique_name
        content = await file.read()
        dest_path.write_bytes(content)
        saved_path = str(dest_path).replace("\\", "/")

    now = datetime.now(timezone.utc)
    justif = Justification(
        raison=raison,
        fichier=saved_path,
        statut="en_attente",
        submittedAt=now,
        decisionAt=None,
        absenceId=absence.id,
        decidedByAdminId=None,
    )
    await justif.insert()
    return {"message": "Justificatif soumis"}

class QRSubmit(BaseModel):
    qrToken: str

@router.post("/scan")
async def scan_qr_code(payload: QRSubmit, current=Depends(require_role("student"))):
    student = current["user"]
    token = payload.qrToken
    now = datetime.now(timezone.utc)
    # Rechercher la séance par token (uniquement le code actuel)
    seance = await Seance.find_one(Seance.qrToken == token)
    
    if not seance:
        raise HTTPException(status_code=404, detail="Code QR invalide")
    
    expires_at = seance.qrSessionExpiresAt
    if not expires_at:
        raise HTTPException(status_code=400, detail="Code QR non actif")

    # Ensure timezone aware
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        raise HTTPException(status_code=400, detail="Ce code QR a expiré (session terminée)")

    if student.groupId != seance.groupId:
        raise HTTPException(status_code=403, detail="Vous n'appartenez pas à ce groupe")

    try:
        existing = await Absence.find_one(Absence.studentId == student.id, Absence.seanceId == seance.id)
        if existing:
            if existing.statut == "present":
                return {"message": "Présence déjà enregistrée", "seance": seance.typeSeance}
            previous_statut = existing.statut
            existing.statut = "present"
            existing.updatedAt = now
            await existing.save()
            return {"message": "Présence mise à jour (était " + previous_statut + ")", "seance": seance.typeSeance}
        else:
            abs_doc = Absence(
                statut="present",
                studentId=student.id,
                seanceId=seance.id,
                createdAt=now,
                updatedAt=now
            )
            await abs_doc.insert()
            return {"message": "Présence validée avec succès", "seance": seance.typeSeance}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.get("/absences")
async def my_absences(current=Depends(require_role("student"))):
    # Fixed the typo in the name from previous version if it existed
    student_id = current["user"].id
    absences = await Absence.find(Absence.studentId == student_id).to_list()
    
    results = []
    for a in absences:
        seance = await Seance.get(a.seanceId)
        module_data = None
        if seance:
            module_obj = await Module.get(seance.moduleId)
            if module_obj:
                module_data = {
                    "id": str(module_obj.id),
                    "codeModule": module_obj.codeModule,
                    "titre": module_obj.titre
                }
        
        justif = await Justification.find_one(Justification.absenceId == a.id)
        
        results.append({
            "id": str(a.id),
            "statut": a.statut,
            "seanceId": str(a.seanceId),
            "dateSeance": str(seance.dateSeance) if seance else None,
            "heureDebut": seance.heureDebut if seance else None,
            "heureFin": seance.heureFin if seance else None,
            "moduleTitre": module_data["titre"] if module_data else None,
            "moduleCode": module_data["codeModule"] if module_data else None,
            "justification": {
                "statut": justif.statut,
                "raison": justif.raison,
                "fichier": justif.fichier,
                "fileUrl": f"http://localhost:8000/{justif.fichier}" if justif.fichier else None,
            } if justif else None
        })
    return results

from app.models.group import Group
import os

@router.get("/timetable")
async def get_timetable(current=Depends(require_role("student"))):
    student = current["user"]
    group_id = student.groupId
    
    group = await Group.get(group_id)
    timetable_url = None
    if group and group.emploiDuTemps:
        fname = os.path.basename(group.emploiDuTemps)
        timetable_url = f"http://localhost:8000/uploads/timetables/{fname}"

    seances = await Seance.find(Seance.groupId == group_id).to_list()
    
    results = []
    for s in seances:
        module = await Module.get(s.moduleId)
        teacher = await Teacher.get(s.teacherId)
        
        results.append({
            "id": str(s.id),
            "dateSeance": str(s.dateSeance),
            "heureDebut": s.heureDebut,
            "heureFin": s.heureFin,
            "typeSeance": s.typeSeance,
            "salle": s.salle,
            "module": {
                "titre": module.titre if module else "Inconnu",
                "code": module.codeModule if module else "???"
            },
            "teacher": {
                "nom": teacher.nom if teacher else "Inconnu",
                "prenom": teacher.prenom if teacher else ""
            }
        })
    
    results.sort(key=lambda x: (x["dateSeance"], x["heureDebut"]))
    return {
        "groupsTimetableUrl": timetable_url,
        "sessions": results
    }

@router.get("/messages")
async def list_messages(current=Depends(require_role("student"))):
    student_id = current["user"].id
    messages = await Message.find(Message.receiverId == student_id).sort(-Message.createdAt).to_list()
    enriched = []
    for m in messages:
        item = m.dict()
        item["id"] = str(m.id)
        item["senderId"] = str(m.senderId)
        item["receiverId"] = str(m.receiverId)
        enriched.append(item)
    return enriched
