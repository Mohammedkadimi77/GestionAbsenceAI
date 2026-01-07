from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timezone
from beanie import PydanticObjectId
from typing import Optional

from app.core.deps import require_role
from app.models.alert import Alert
from app.models.justification import Justification
from app.models.user_student import Student
from app.models.user_teacher import Teacher
from app.models.absence import Absence
from app.schemas.admin import AlertUpdate

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_role("admin"))]
)

async def get_student_name(student_id):
    """Helper robuste pour récupérer le nom complet."""
    if not student_id:
        return "Inconnu"
    try:
        # Tenter lookup direct
        stu = await Student.get(student_id)
        if not stu and isinstance(student_id, str):
            # Tenter conversion si c'était une string
            stu = await Student.get(PydanticObjectId(student_id))
        
        if stu:
            return f"{stu.nom} {stu.prenom}".strip() or "Sans Nom"
    except Exception:
        pass
    return "Étudiant Inconnu"

async def enrich_justif(j: Justification):
    """Enrichit un objet Justification avec les infos étudiant et fichiers."""
    item = j.dict()
    item["id"] = str(j.id)
    
    # URL du fichier
    if j.fichier:
        # On extrait juste le nom du fichier du path complet
        fname = j.fichier.split("/")[-1].split("\\")[-1]
        item["fileUrl"] = f"http://localhost:8000/uploads/justifications/{fname}"
    else:
        item["fileUrl"] = None

    # Lookup étudiant via Absence
    try:
        abs_doc = await Absence.get(j.absenceId)
        if not abs_doc and isinstance(j.absenceId, str):
            abs_doc = await Absence.get(PydanticObjectId(j.absenceId))
        
        if abs_doc:
            item["studentName"] = await get_student_name(abs_doc.studentId)
        else:
            item["studentName"] = "Absence Orpheline"
    except Exception:
        item["studentName"] = "Erreur Lookup"
        
    return item

# ✅ 1) Lister toutes les alertes (avec enrichment)
@router.get("/alerts")
async def list_alerts(
    statut: Optional[str] = Query(default=None),
    studentId: Optional[str] = Query(default=None),
    dateFrom: Optional[str] = Query(default=None),
    dateTo: Optional[str] = Query(default=None)
):
    q = Alert.find_all()
    if statut: q = q.find(Alert.statut == statut)
    if studentId: q = q.find(Alert.studentId == PydanticObjectId(studentId))
    if dateFrom: q = q.find(Alert.createdAt >= datetime.fromisoformat(dateFrom))
    if dateTo: q = q.find(Alert.createdAt <= datetime.fromisoformat(dateTo))

    alerts = await q.sort(-Alert.createdAt).to_list()
    enriched = []
    for a in alerts:
        item = a.dict()
        item["id"] = str(a.id)
        item["studentName"] = await get_student_name(a.studentId)
        enriched.append(item)
    return enriched

# ✅ Détail d’une alerte
@router.get("/alerts/{alert_id}")
async def get_alert(alert_id: str):
    alert = await Alert.get(PydanticObjectId(alert_id))
    if not alert:
        return {"detail": "Alert not found"}
    return alert

# ✅ 2) Statistiques Globales
@router.get("/stats")
async def admin_stats():
    # Alert stats
    alert_total = await Alert.find_all().count()
    alert_nouvelle = await Alert.find(Alert.statut == "nouvelle").count()
    alert_en_cours = await Alert.find(Alert.statut == "en_cours").count()
    alert_traitee = await Alert.find(Alert.statut == "traitee").count()

    # General counts
    total_students = await Student.find_all().count()
    total_teachers = await Teacher.find_all().count()
    total_absences = await Absence.find_all().count()

    # Top 5 étudiants avec le + d'alertes
    pipeline = [
        {"$group": {"_id": "$studentId", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    cursor = Alert.get_pymongo_collection().aggregate(pipeline)
    top = await cursor.to_list(length=5)

    res_top = []
    for x in top:
        res_top.append({
            "studentId": str(x["_id"]),
            "studentName": await get_student_name(x["_id"]),
            "alerts": x["count"]
        })

    return {
        "totalStudents": total_students,
        "totalTeachers": total_teachers,
        "totalAbsences": total_absences,
        "alerts": {
            "total": alert_total,
            "nouvelle": alert_nouvelle,
            "en_cours": alert_en_cours,
            "traitee": alert_traitee
        },
        "top_students": res_top
    }

# ✅ 3) Justifications en attente (version enrichie)
@router.get("/justifications/pending")
async def pending_justifications():
    justifications = await Justification.find(Justification.statut == "en_attente").sort(-Justification.submittedAt).to_list()
    return [await enrich_justif(j) for j in justifications]

# ✅ 3.1) Historique des justificatifs (version enrichie)
@router.get("/justifications")
async def list_justifications():
    justifications = await Justification.find(Justification.statut != "en_attente").sort(-Justification.decisionAt).to_list()
    return [await enrich_justif(j) for j in justifications]

# ✅ 4) Décider d'un justificatif (Accepter/Refuser)
@router.patch("/justifications/{justif_id}")
async def decide_justification(justif_id: str, payload: dict, admin=Depends(require_role("admin"))):
    justif = await Justification.get(PydanticObjectId(justif_id))
    if not justif:
        raise HTTPException(status_code=404, detail="Justification not found")

    statut = payload.get("statut")
    if statut not in ["validee", "refusee"]:
        raise HTTPException(status_code=400, detail="Invalid statut (validee/refusee expected)")

    justif.statut = statut
    justif.decisionAt = datetime.now(timezone.utc)
    justif.decidedByAdminId = admin["user"].id

    await justif.save()
    return {"message": "Success", "id": str(justif.id), "statut": justif.statut}
