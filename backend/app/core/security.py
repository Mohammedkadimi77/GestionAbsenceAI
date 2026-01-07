from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str) -> str:
    if not isinstance(password, str):
        password = str(password)
    return pwd_context.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    if not isinstance(password, str):
        password = str(password)
    return pwd_context.verify(password, password_hash)

def create_token(subject: str, role: str, expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALG)

def create_access_token(user_id: str, role: str) -> str:
    return create_token(user_id, role, timedelta(minutes=settings.ACCESS_TOKEN_MINUTES))

def create_refresh_token(user_id: str, role: str) -> str:
    return create_token(user_id, role, timedelta(days=settings.REFRESH_TOKEN_DAYS))
