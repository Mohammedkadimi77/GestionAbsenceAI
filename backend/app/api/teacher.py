from fastapi import APIRouter, Depends, HTTPException
from beanie import PydanticObjectId
from datetime import datetime, timezone
from typing import List, Optional
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