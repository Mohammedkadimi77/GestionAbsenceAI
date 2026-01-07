from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from beanie import PydanticObjectId

from app.core.config import settings
from app.models.user_admin import Administrator
from app.models.user_teacher import Teacher
from app.models.user_student import Student

bearer_scheme = HTTPBearer(auto_error=False)

async def get_current_user( 
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    if not creds:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    token = creds.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if not user_id or not role:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    pid = PydanticObjectId(user_id)

    if role == "admin":
        user = await Administrator.get(pid)
    elif role == "teacher":
        user = await Teacher.get(pid)
    elif role == "student":
        user = await Student.get(pid)
    else:
        raise HTTPException(status_code=401, detail="Invalid role")

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return {"role": role, "user": user, "sub": user_id}

def require_role(*allowed_roles: str):
    async def _guard(current=Depends(get_current_user)):
        if current["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return current
    return _guard


