from datetime import datetime, timedelta
from beanie import PydanticObjectId
from beanie.operators import In

from app.models.absence import Absence
from app.models.seance import Seance

async def compute_student_features(student_id: PydanticObjectId, days: int = 30):
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # récupérer les séances dans la période
    seances = await Seance.find(Seance.dateSeance >= start_date.date()).to_list()
    seance_ids = [s.id for s in seances]

    if not seance_ids:
        return {
            "total": 0,
            "absent": 0,
            "retard": 0,
            "absence_rate": 0,
            "retard_rate": 0,
            "max_consecutive_absences": 0,
        }

    # ✅ Beanie: In(field, list)
    absences = await Absence.find(
        Absence.studentId == student_id,
        In(Absence.seanceId, seance_ids)
    ).to_list()

    total = len(absences)
    absent = sum(1 for a in absences if a.statut == "absent")
    retard = sum(1 for a in absences if a.statut == "retard")

    absence_rate = absent / total if total else 0
    retard_rate = retard / total if total else 0

    # absences consécutives (basé sur createdAt)
    abs_sorted = sorted(absences, key=lambda a: a.createdAt)
    max_cons = cons = 0
    for a in abs_sorted:
        if a.statut == "absent":
            cons += 1
            max_cons = max(max_cons, cons)
        else:
            cons = 0

    return {
        "total": total,
        "absent": absent,
        "retard": retard,
        "absence_rate": absence_rate,
        "retard_rate": retard_rate,
        "max_consecutive_absences": max_cons,
    }
