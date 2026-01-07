# from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
# import pandas as pd

# from app.core.deps import require_role
# from app.core.security import hash_password
# from app.models.user_student import Student
# from app.models.user_teacher import Teacher
# from app.schemas.admin_import import ImportResult

# router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_role("admin"))])

# @router.post("/import", response_model=ImportResult)
# async def import_excel(file: UploadFile = File(...)):
#     if not file.filename.lower().endswith((".xlsx", ".xls")):
#         raise HTTPException(status_code=400, detail="Upload an Excel file (.xlsx/.xls)")

#     content = await file.read()

#     # ✅ Attendu: 2 feuilles "students" et "teachers"
#     try:
#         xls = pd.ExcelFile(BytesIO(content))
#         if "students" not in xls.sheet_names or "teachers" not in xls.sheet_names:
#             raise HTTPException(status_code=400, detail="Excel must contain sheets: students, teachers")

#         df_students = pd.read_excel(xls, sheet_name="students").fillna("")
#         df_teachers = pd.read_excel(xls, sheet_name="teachers").fillna("")
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=f"Invalid Excel: {e}")

#     created_students = skipped_students = 0
#     created_teachers = skipped_teachers = 0
#     errors = []

#     # ---- Students ----
#     for i, row in df_students.iterrows():
#         try:
#             email = str(row.get("email", "")).strip().lower()
#             cin = str(row.get("CIN", "")).strip()
#             nom = str(row.get("nom", "")).strip()
#             prenom = str(row.get("prenom", "")).strip()
#             statut = str(row.get("statut", "actif")).strip() or "actif"
#             group_id = str(row.get("groupId", "")).strip()

#             if not email or not cin or not group_id:
#                 errors.append(f"students row {i}: missing email/CIN/groupId")
#                 continue

#             exists = await Student.find_one(Student.email == email)
#             if exists:
#                 skipped_students += 1
#                 continue

#             raw_password = str(row.get("password", "")).strip() or cin  # default = CIN
#             student = Student(
#                 email=email,
#                 passwordHash=hash_password(raw_password),
#                 CIN=cin,
#                 nom=nom,
#                 prenom=prenom,
#                 statut=statut,
#                 groupId=group_id,  # si ton field est PydanticObjectId, convertis dans model
#             )
#             await student.insert()
#             created_students += 1
#         except Exception as e:
#             errors.append(f"students row {i}: {e}")

#     # ---- Teachers ----
#     for i, row in df_teachers.iterrows():
#         try:
#             email = str(row.get("email", "")).strip().lower()
#             nom = str(row.get("nom", "")).strip()
#             prenom = str(row.get("prenom", "")).strip()
#             departement = str(row.get("departement", "")).strip()

#             if not email:
#                 errors.append(f"teachers row {i}: missing email")
#                 continue

#             exists = await Teacher.find_one(Teacher.email == email)
#             if exists:
#                 skipped_teachers += 1
#                 continue

#             raw_password = str(row.get("password", "")).strip() or "Teacher@123"
#             teacher = Teacher(
#                 email=email,
#                 passwordHash=hash_password(raw_password),
#                 nom=nom,
#                 prenom=prenom,
#                 departement=departement,
#             )
#             await teacher.insert()
#             created_teachers += 1
#         except Exception as e:
#             errors.append(f"teachers row {i}: {e}")

#     return ImportResult(
#         created_students=created_students,
#         created_teachers=created_teachers,
#         skipped_students=skipped_students,
#         skipped_teachers=skipped_teachers,
#         errors=errors
#     )
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import pandas as pd
from io import BytesIO

from beanie import PydanticObjectId

from app.core.deps import require_role
from app.core.security import hash_password
from app.models.user_student import Student
from app.models.user_teacher import Teacher
from app.models.group import Group  # ✅ pour mapper nomGroupe -> id
from app.schemas.admin_import import ImportResult

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_role("admin"))]
)

def safe_password(raw: str) -> str:
    """
    bcrypt coupe à 72 bytes => on limite ici pour éviter ValueError.
    """
    raw = raw.strip()
    if not raw:
        return "Temp@123456"
    # limiter à 72 bytes (utf-8)
    b = raw.encode("utf-8")
    if len(b) <= 72:
        return raw
    return b[:72].decode("utf-8", errors="ignore")

@router.post("/import", response_model=ImportResult)
async def import_excel(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Upload an Excel file (.xlsx/.xls)")

    content = await file.read()

    # ✅ ouvrir excel depuis BytesIO
    try:
        xls = pd.ExcelFile(BytesIO(content))
        if "students" not in xls.sheet_names or "teachers" not in xls.sheet_names:
            raise HTTPException(status_code=400, detail="Excel must contain sheets: students, teachers")

        df_students = pd.read_excel(xls, sheet_name="students").fillna("")
        df_teachers = pd.read_excel(xls, sheet_name="teachers").fillna("")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Excel: {e}")

    # ✅ mapping nomGroupe -> id (parce que dans Excel tu as le nom)
    # Exemple: colonne Excel = "nomGroupe"
    groups = await Group.find_all().to_list()
    group_by_name = {g.nomGroupe.strip().lower(): str(g.id) for g in groups}

    created_students = skipped_students = 0
    created_teachers = skipped_teachers = 0
    errors: list[str] = []

    # ---------- Students ----------
    for i, row in df_students.iterrows():
        try:
            email = str(row.get("email", "")).strip().lower()
            cin = str(row.get("CIN", "")).strip()
            nom = str(row.get("nom", "")).strip()
            prenom = str(row.get("prenom", "")).strip()
            statut = str(row.get("statut", "actif")).strip() or "actif"

            # ✅ dans ton Excel tu as "nomGroupe" (pas groupId)
            nom_groupe = str(row.get("nomGroupe", "")).strip().lower()

            if not email or not cin or not nom_groupe:
                errors.append(f"students row {i+2}: missing email/CIN/nomGroupe")
                continue

            group_id_str = group_by_name.get(nom_groupe)
            if not group_id_str:
                errors.append(f"students row {i+2}: group '{nom_groupe}' not found in DB")
                continue

            exists = await Student.find_one(Student.email == email)
            if exists:
                skipped_students += 1
                continue

            raw_password = str(row.get("password", "")).strip() or cin
            raw_password = safe_password(raw_password)

            student = Student(
                email=email,
                passwordHash=hash_password(raw_password),
                CIN=cin,
                nom=nom,
                prenom=prenom,
                statut=statut,
                groupId=PydanticObjectId(group_id_str),  # ✅ convert
            )
            await student.insert()
            created_students += 1

        except Exception as e:
            errors.append(f"students row {i+2}: {e}")

    # ---------- Teachers ----------
    for i, row in df_teachers.iterrows():
        try:
            email = str(row.get("email", "")).strip().lower()
            nom = str(row.get("nom", "")).strip()
            prenom = str(row.get("prenom", "")).strip()
            departement = str(row.get("departement", "")).strip()

            if not email:
                errors.append(f"teachers row {i+2}: missing email")
                continue

            exists = await Teacher.find_one(Teacher.email == email)
            if exists:
                skipped_teachers += 1
                continue

            raw_password = str(row.get("password", "")).strip() or "Teacher@123"
            raw_password = safe_password(raw_password)

            teacher = Teacher(
                email=email,
                passwordHash=hash_password(raw_password),
                nom=nom,
                prenom=prenom,
                departement=departement,
            )
            await teacher.insert()
            created_teachers += 1

        except Exception as e:
            errors.append(f"teachers row {i+2}: {e}")

    return ImportResult(
        created_students=created_students,
        created_teachers=created_teachers,
        skipped_students=skipped_students,
        skipped_teachers=skipped_teachers,
        errors=errors,
    )
