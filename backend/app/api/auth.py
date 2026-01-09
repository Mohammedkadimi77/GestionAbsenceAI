from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app.models.user_admin import Administrator
from app.models.user_teacher import Teacher
from app.models.user_student import Student
from app.core.security import verify_password, create_access_token, create_refresh_token

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    role: str
    user_id: str

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    # Cherche dans admin → teacher → student
    user = await Administrator.find_one(Administrator.email == payload.email)
    role = "admin"

    if not user:
        user = await Teacher.find_one(Teacher.email == payload.email)
        role = "teacher"

    if not user:
        user = await Student.find_one(Student.email == payload.email)
        role = "student"

    if not user:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    if not verify_password(payload.password, user.passwordHash):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    user_id = str(user.id)
    return TokenResponse(
        access_token=create_access_token(user_id, role),
        refresh_token=create_refresh_token(user_id, role),
        role=role,
        user_id=user_id
    )

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    # Cherche dans admin → teacher → student
    user = await Administrator.find_one(Administrator.email == payload.email)
    role = "admin"
    if not user:
        user = await Teacher.find_one(Teacher.email == payload.email)
        role = "teacher"
    if not user:
        user = await Student.find_one(Student.email == payload.email)
        role = "student"

    if not user:
        # Sécurité: ne pas révéler si l'email existe
        return {"message": "Si l'email existe, un lien a été envoyé."}

    # Générer token court terme (15 min)
    # On réutilise create_token de security, mais avec 15 min
    from app.core.security import create_token
    from datetime import timedelta
    token = create_token(str(user.id), role, timedelta(minutes=15))

    # Envoyer Email
    from app.services.email import send_reset_password_email
    await send_reset_password_email(payload.email, token)

    return {"message": "Si l'email existe, un lien a été envoyé."}

@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    from jose import jwt, JWTError
    from app.core.config import settings
    from beanie import PydanticObjectId
    from app.core.security import hash_password

    try:
        data = jwt.decode(payload.token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
        user_id = data.get("sub")
        role = data.get("role")
    except JWTError:
        raise HTTPException(status_code=400, detail="Lien invalide ou expiré")

    if not user_id or not role:
        raise HTTPException(status_code=400, detail="Token invalide")

    pid = PydanticObjectId(user_id)
    user = None
    if role == "admin":
        user = await Administrator.get(pid)
    elif role == "teacher":
        user = await Teacher.get(pid)
    elif role == "student":
        user = await Student.get(pid)
    
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    # Mise à jour
    user.passwordHash = hash_password(payload.new_password)
    await user.save()

    return {"message": "Mot de passe réinitialisé avec succès."}
