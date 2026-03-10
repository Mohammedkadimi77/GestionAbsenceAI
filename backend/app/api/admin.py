from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timezone, timedelta
from beanie import PydanticObjectId
from typing import Optional

from app.core.deps import require_role
from app.models.alert import Alert
from app.models.justification import Justification
from app.models.user_student import Student
from app.models.user_teacher import Teacher
from app.models.absence import Absence
from app.models.message import Message
from app.schemas.admin import AlertUpdate
from app.ai.feature_engineering import compute_student_features

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
        item["studentId"] = str(a.studentId)
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
    
# ✅ SUPPRIMER une alerte
@router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    alert = await Alert.get(PydanticObjectId(alert_id))
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    await alert.delete()
    return {"message": "Alert deleted"}

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

# ✅ MESSAGERIE: Envoyer un message à un étudiant
@router.post("/messages")
async def send_message_to_student(payload: dict, admin=Depends(require_role("admin"))):
    student_id = payload.get("studentId")
    content = payload.get("content")
    
    if not student_id or not content:
        raise HTTPException(status_code=400, detail="studentId and content are required")
        
    msg = Message(
        senderId=admin["user"].id,
        receiverId=PydanticObjectId(student_id),
        content=content
    )
    await msg.insert()
    return {"message": "Message sent", "id": str(msg.id)}

# ✅ 5) Détection d'anomalies par IA (Batch)
@router.post("/ai/detect")
async def detect_anomalies(period: str = "30d"):
    """Scanne tous les étudiants et crée des alertes pour les comportements suspects."""
    print("DEBUG AI: Detection started")
    days = 30
    if period.endswith("d") and period[:-1].isdigit():
        days = int(period[:-1])

    students = await Student.find_all().to_list()
    print(f"DEBUG AI: Found {len(students)} students")
    new_alerts_count = 0
    
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)

    for s in students:
        feats = await compute_student_features(s.id, days)
        
        late_rate = float(feats.get("retard_rate", 0.0))
        absent_rate = float(feats.get("absence_rate", 0.0))
        streak = float(feats.get("max_consecutive_absences", 0))

        # Formule: 50% absences, 30% retards, 20% streak
        score = (0.5 * absent_rate + 0.3 * late_rate + 0.2 * min(streak / 5.0, 1.0))
        
        print(f"DEBUG AI: Student {s.nom} {s.prenom} -> Absent: {absent_rate:.2f}, Late: {late_rate:.2f}, Streak: {streak}, Score: {score:.4f}")

        # Seuil d'alerte
        if score >= 0.1:
            # Calculer le niveau de risque
            risk = "low"
            if score >= 0.6: risk = "high"
            elif score >= 0.3: risk = "medium"

            # Générer les raisons
            reasons = []
            if absent_rate > 0.2: reasons.append(f"Taux d'absence élevé ({absent_rate*100:.0f}%)")
            if late_rate > 0.15: reasons.append(f"Retards répétés ({late_rate*100:.0f}%)")
            if streak >= 3: reasons.append(f"Série de {int(streak)} absences consécutives")
            if score >= 0.7: reasons.append("Score d'anomalie critique (risque de décrochage)")
            
            if not reasons: reasons = ["Comportement d'assiduité atypique détecté"]

            # Éviter les doublons (une alerte par jour max)
            today_start = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
            exists = await Alert.find_one(
                Alert.studentId == s.id,
                Alert.createdAt >= today_start,
                Alert.typeAlerte == "Anomalie d'assiduité"
            )
            
            if not exists:
                alert = Alert(
                    typeAlerte="Anomalie d'assiduité",
                    scoreAnomalie=round(score, 4),
                    riskLevel=risk,
                    reasons=reasons,
                    metrics={
                        "absent_rate": round(absent_rate, 2),
                        "late_rate": round(late_rate, 2),
                        "max_streak": int(streak)
                    },
                    dateStart=start_date,
                    periodEnd=end_date,
                    studentId=s.id,
                    statut="nouvelle"
                )
                await alert.insert()
                new_alerts_count += 1
                
    return {
        "message": f"Analyse terminée. {new_alerts_count} nouvelles alertes générées.",
        "count": new_alerts_count
    }


# ✅ 6) Gestion des Groupes (Emploi du temps)
from app.models.group import Group
import os
import shutil
from fastapi import UploadFile, File

@router.get("/groups")
async def list_groups():
    groups = await Group.find_all().to_list()
    enriched = []
    for g in groups:
        item = g.dict()
        item["id"] = str(g.id)
        if g.emploiDuTemps:
            fname = os.path.basename(g.emploiDuTemps)
            item["timetableUrl"] = f"http://localhost:8000/uploads/timetables/{fname}"
        else:
            item["timetableUrl"] = None
        enriched.append(item)
    return enriched

@router.post("/groups/{group_id}/timetable")
async def upload_group_timetable(group_id: str, file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Veuillez uploader une image (PNG/JPG).")
    
    group = await Group.get(PydanticObjectId(group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Groupe introuvable.")

    # Création dossier si besoin
    upload_dir = "uploads/timetables"
    os.makedirs(upload_dir, exist_ok=True)

    # Nom unique pour éviter cache browser ou collision
    ext = os.path.splitext(file.filename)[1]
    filename = f"timetable_{group_id}{ext}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    group.emploiDuTemps = file_path
    group.updatedAt = datetime.now(timezone.utc)
    await group.save()

    return {
        "message": "Emploi du temps mis à jour.",
        "url": f"http://localhost:8000/uploads/timetables/{filename}"
    }
