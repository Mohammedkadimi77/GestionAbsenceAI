from fastapi import APIRouter
from datetime import datetime, timezone
from beanie import PydanticObjectId

from app.models.group import Group
from app.models.module import Module
from app.models.user_teacher import Teacher
from app.models.user_student import Student
from app.core.security import hash_password
from app.models.user_admin import Administrator

router = APIRouter(prefix="/dev", tags=["dev"])

@router.post("/seed")
async def seed():
    now = datetime.now(timezone.utc)

    # 1) Group (unique: nomGroupe+niveau+filiere)
    group = await Group.find_one(
        Group.nomGroupe == "G1",
        Group.niveau == "2A",
        Group.filiere == "GI",
    )
    if not group:
        group = Group(
            nomGroupe="G1",
            niveau="2A",
            filiere="GI",
            createdAt=now,
            updatedAt=now,
        )
        await group.insert()

    # 2) Module (unique: codeModule)
    module = await Module.find_one(Module.codeModule == "M101")
    if not module:
        module = Module(
            codeModule="M101",
            titre="Base de Donnees",
            semestre="S1",
            createdAt=now,
            updatedAt=now,
        )
        await module.insert()

    # 3) Teacher (unique: email)
    teacher_email = "teacher1@test.com"
    teacher_pass = "123456"
    teacher = await Teacher.find_one(Teacher.email == teacher_email)
    if not teacher:
        teacher = Teacher(
            email=teacher_email,
            passwordHash=hash_password(teacher_pass),
            nom="Ali",
            prenom="Prof",
            departement="Informatique",
            createdAt=now,
            updatedAt=now,
        )
        await teacher.insert()

    # 4) Students (unique: email + CIN)
    students_data = [
        ("stud1@test.com", "111111", "AA111", "Sara", "A", "actif"),
        ("stud2@test.com", "111111", "BB222", "Omar", "B", "actif"),
        ("stud3@test.com", "111111", "CC333", "Nora", "C", "actif"),
    ]

    student_ids = []
    for email, pwd, cin, nom, prenom, statut in students_data:
        st = await Student.find_one(Student.email == email)
        if not st:
            st = Student(
                email=email,
                passwordHash=hash_password(pwd),
                CIN=cin,
                nom=nom,
                prenom=prenom,
                statut=statut,
                groupId=PydanticObjectId(str(group.id)),
                createdAt=now,
                updatedAt=now,
            )
            await st.insert()
        student_ids.append(str(st.id))
    admin_email = "admin@test.com"
    admin_pass = "123456"    
    admin = await Administrator.find_one(Administrator.email == admin_email)
    if not admin:
        admin = Administrator(
            CIN="ADMIN001",
            email=admin_email,
            passwordHash=hash_password(admin_pass),
            nom="Admin",
            prenom="Root",
            role="admin",
            createdAt=now,
            updatedAt=now,
        )
        await admin.insert()
    return {
        "groupId": str(group.id),
        "moduleId": str(module.id),
        "teacher": {"email": teacher_email, "password": teacher_pass, "teacherId": str(teacher.id)},
        "students": student_ids,
        "admin": {
            "email": admin_email,
            "password": admin_pass,
            "adminId": str(admin.id),
        },
    }





