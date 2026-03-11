from fastapi import APIRouter, Depends, HTTPException
from beanie import PydanticObjectId
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import secrets
from pydantic import BaseModel
from app.db.mongo import get_db 

from app.core.deps import get_current_user
from app.core.deps import require_role
from app.models.seance import Seance
from app.models.user_student import Student
from app.models.absence import Absence
from app.schemas.teacher import SeanceCreate, AttendanceSubmit

router = APIRouter(prefix="/teacher", tags=["Teacher"])

# ✅ Créer une séance (liée au teacher connecté)
@router.post("/seances")
async def create_seance(payload: SeanceCreate, current=Depends(require_role("teacher"))):
    teacher = current["user"]

    seance = Seance(
        dateSeance=payload.dateSeance,
        heureDebut=payload.heureDebut,
        heureFin=payload.heureFin,
        typeSeance=payload.typeSeance,
        salle=payload.salle,
        moduleId=PydanticObjectId(payload.moduleId),
        teacherId=teacher.id,
        groupId=PydanticObjectId(payload.groupId),
        statut="en_cours"
    )
    await seance.insert()

    return {"id": str(seance.id)}

# ✅ Lister mes séances (option filtre date)
@router.get("/seances")
async def list_my_seances(date: str | None = None, current=Depends(require_role("teacher"))):
    teacher = current["user"]
    q = Seance.find(Seance.teacherId == teacher.id)

    if date:
        # date au format "YYYY-MM-DD"
        from datetime import date as dtdate
        y, m, d = map(int, date.split("-"))
        q = q.find(Seance.dateSeance == dtdate(y, m, d))

    seances = await q.sort(-Seance.dateSeance).to_list()
    return [
        {
            "id": str(s.id),
            "dateSeance": str(s.dateSeance),
            "heureDebut": str(s.heureDebut),
            "heureFin": str(s.heureFin),
            "typeSeance": s.typeSeance,
            "salle": s.salle,
            "moduleId": str(s.moduleId),
            "groupId": str(s.groupId),
            "statut": s.statut,
        }
        for s in seances
    ]

# ✅ Récupérer étudiants d’un groupe (pour afficher la liste)
@router.get("/groups/{group_id}/students")
async def get_students_by_group(group_id: str, current=Depends(require_role("teacher"))):
    students = await Student.find(Student.groupId == PydanticObjectId(group_id)).sort(Student.nom).to_list()
    return [
        {
            "id": str(st.id),
            "nom": st.nom,
            "prenom": st.prenom,
            "email": st.email,
            "CIN": st.CIN,
            "statut": st.statut,
        }
        for st in students
    ]

# ✅ Valider l’appel (bulk upsert ABSENCE)
@router.post("/seances/{seance_id}/attendance")
async def submit_attendance(seance_id: str, payload: AttendanceSubmit, current=Depends(require_role("teacher"))):
    teacher = current["user"]
    seance = await Seance.get(PydanticObjectId(seance_id))
    if not seance:
        raise HTTPException(status_code=404, detail="Seance not found")
    if seance.teacherId != teacher.id:
        raise HTTPException(status_code=403, detail="Not your seance")

    now = datetime.now(timezone.utc)
    updated = 0
    created = 0

    for item in payload.items:
        st_id = PydanticObjectId(item.studentId)
        # (Option) vérifier que l’étudiant appartient au groupe de la séance
        student = await Student.get(st_id)
        if not student or student.groupId != seance.groupId:
            continue

        existing = await Absence.find_one(Absence.studentId == st_id, Absence.seanceId == seance.id)
        if existing:
            existing.statut = item.statut
            existing.updatedAt = now
            await existing.save()
            updated += 1
        else:
            abs_doc = Absence(
                statut=item.statut,
                studentId=st_id,
                seanceId=seance.id,
                createdAt=now,
                updatedAt=now,
            )
            await abs_doc.insert()
            created += 1

    return {"created": created, "updated": updated, "total_received": len(payload.items)}

async def _finalize_attendance(seance: Seance):
    """Marque tous les étudiants non encore pointés comme ABSENTS et valide la séance."""
    now = datetime.now(timezone.utc)
    
    # 1. Lister tous les étudiants du groupe
    students = await Student.find(Student.groupId == seance.groupId).to_list()
    
    marked_absent = 0
    for st in students:
        # 2. Vérifier s'ils ont déjà un enregistrement d'absence/présence
        existing = await Absence.find_one(Absence.studentId == st.id, Absence.seanceId == seance.id)
        if not existing:
            # 3. Créer enregistrement ABSENT
            abs_doc = Absence(
                statut="absent",
                studentId=st.id,
                seanceId=seance.id,
                createdAt=now,
                updatedAt=now,
            )
            await abs_doc.insert()
            marked_absent += 1
            
    # 4. Marquer la séance comme validée
    seance.statut = "validee"
    await seance.save()
    return marked_absent

# ✅ Valider l’appel (bulk upsert ABSENCE + Finalisation)
@router.post("/seances/{seance_id}/attendance/validate")
async def validate_attendance(seance_id: str, payload: AttendanceSubmit, current=Depends(require_role("teacher"))):
    teacher = current["user"]
    seance = await Seance.get(PydanticObjectId(seance_id))
    if not seance:
        raise HTTPException(status_code=404, detail="Seance not found")
    if seance.teacherId != teacher.id:
        raise HTTPException(status_code=403, detail="Not your seance")

    now = datetime.now(timezone.utc)

    # 1. Traiter les présences soumises (cliquées manuellement ou scan QR)
    for item in payload.items:
        st_id = PydanticObjectId(item.studentId)
        student = await Student.get(st_id)
        if not student or student.groupId != seance.groupId:
            continue

        existing = await Absence.find_one(Absence.studentId == st_id, Absence.seanceId == seance.id)
        if existing:
            existing.statut = item.statut
            existing.updatedAt = now
            await existing.save()
        else:
            abs_doc = Absence(
                statut=item.statut,
                studentId=st_id,
                seanceId=seance.id,
                createdAt=now,
                updatedAt=now,
            )
            await abs_doc.insert()

    # 2. Finaliser : marquer le reste comme absent
    marked_absent = await _finalize_attendance(seance)

    return {"status": "validee", "auto_marked_absent": marked_absent}

# ✅ Finaliser la séance (Timeout ou Manuel sans liste)
@router.post("/seances/{seance_id}/finalize")
async def finalize_seance(seance_id: str, current=Depends(require_role("teacher"))):
    teacher = current["user"]
    seance = await Seance.get(PydanticObjectId(seance_id))
    if not seance:
        raise HTTPException(status_code=404, detail="Seance not found")
    if seance.teacherId != teacher.id:
        raise HTTPException(status_code=403, detail="Not your seance")

    marked_absent = await _finalize_attendance(seance)
    return {"status": "validee", "auto_marked_absent": marked_absent}

# ✅ Générer un QR Code (Token) tournant chaque 30s pendant 10 minutes
@router.post("/seances/{seance_id}/qr")
async def generate_qr_code(seance_id: str, current=Depends(require_role("teacher"))):
    teacher = current["user"]
    try:
        s_oid = PydanticObjectId(seance_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Seance ID")

    seance = await Seance.get(s_oid)
    if not seance:
        raise HTTPException(status_code=404, detail="Seance not found")
    if seance.teacherId != teacher.id:
        raise HTTPException(status_code=403, detail="Not your seance")

    now = datetime.now(timezone.utc)
    
    # helper for timezone aware comparison
    def make_aware(dt):
        if dt and dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt

    qr_session_exp = make_aware(seance.qrSessionExpiresAt)
    qr_last_rot = make_aware(seance.qrLastRotationAt)

    # 1. Gérer la session globale de 10 minutes
    if not qr_session_exp or qr_session_exp < now:
        seance.qrSessionExpiresAt = now + timedelta(minutes=10)
        seance.qrToken = secrets.token_urlsafe(16)
        seance.qrLastToken = None
        seance.qrLastRotationAt = now
        seance.qrExpiresAt = seance.qrSessionExpiresAt # Keep for old logic compatibility
        await seance.save()
        return {"qrToken": seance.qrToken, "expiresAt": seance.qrSessionExpiresAt}

    # 2. Gérer la rotation de 30 secondes
    rotation_delta = timedelta(seconds=30)
    if not qr_last_rot or (now - qr_last_rot) > rotation_delta:
        seance.qrToken = secrets.token_urlsafe(16)
        seance.qrLastRotationAt = now
        await seance.save()
        qr_last_rot = now # Update local for calc
        print(f"[DEBUG GEN QR] Rotation - New Token: {seance.qrToken}")

    # Calculer combien de temps reste-t-il exactement avant le prochain changement (max 30s)
    elapsed = (now - qr_last_rot).total_seconds()
    next_rotation_in = max(0, 30.5 - elapsed) # 30.5 to add a tiny buffer for network

    return {
        "qrToken": seance.qrToken, 
        "expiresAt": seance.qrSessionExpiresAt,
        "nextRotationIn": int(next_rotation_in)
    }
# =========================
# Schemas (Response models)
# =========================
class GroupOut(BaseModel):
    id: str
    nomGroupe: str
    niveau: Optional[str] = None
    filiere: Optional[str] = None


class ModuleOut(BaseModel):
    id: str
    codeModule: str
    titre: str
    semestre: Optional[str] = None


# =========================
# Helpers
# =========================
def oid_to_str(doc: dict) -> dict:
    """Convertit _id ObjectId en string id."""
    if not doc:
        return doc
    if "_id" in doc:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
    return doc


# ✅ Récupérer la liste des présences pour une séance
@router.get("/seances/{seance_id}/attendance")
async def get_seance_attendance(seance_id: str, current=Depends(require_role("teacher"))):
    teacher = current["user"]
    seance = await Seance.get(PydanticObjectId(seance_id))
    if not seance:
        raise HTTPException(status_code=404, detail="Seance not found")
    if seance.teacherId != teacher.id:
        raise HTTPException(status_code=403, detail="Not your seance")

    absences = await Absence.find(Absence.seanceId == seance.id).to_list()
    
    # On peut aussi enrichir avec les infos de l'étudiant
    results = []
    for abb in absences:
        st = await Student.get(abb.studentId)
        results.append({
            "studentId": str(abb.studentId),
            "nom": st.nom if st else "Inconnu",
            "prenom": st.prenom if st else "",
            "statut": abb.statut,
            "updatedAt": abb.updatedAt
        })
        
    return results


# =========================
# NEW: GET /teacher/groups
# =========================
@router.get("/groups", response_model=List[GroupOut])
async def list_teacher_groups(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Retourne les groupes accessibles par le teacher.
    Version simple: retourne tous les groupes.
    Version avancée: retourne seulement les groupes du teacher.
    """

    # ✅ OPTION SIMPLE (recommandée au début) : tous les groupes
    cursor = db["groups"].find({}, {"nomGroupe": 1, "niveau": 1, "filiere": 1})
    docs = await cursor.to_list(length=500)
    return [oid_to_str(d) for d in docs]

    # ✅ OPTION AVANCÉE (si tu as teacherId sur group ou mapping teacher->group)
    # teacher_id = str(current_user["id"])  # adapte
    # cursor = db["groups"].find({"teacherId": teacher_id}, {"nomGroupe":1,"niveau":1,"filiere":1})
    # docs = await cursor.to_list(length=500)
    # return [oid_to_str(d) for d in docs]


# ==========================
# NEW: GET /teacher/modules
# ==========================
@router.get("/modules", response_model=List[ModuleOut])
async def list_teacher_modules(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Retourne les modules accessibles par le teacher.
    Version simple: retourne tous les modules.
    """

    cursor = db["modules"].find({}, {"codeModule": 1, "titre": 1, "semestre": 1})
    docs = await cursor.to_list(length=500)
    return [oid_to_str(d) for d in docs]