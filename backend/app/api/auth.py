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
