from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB: str = "absence_db"

    JWT_SECRET: str = "CHANGE_ME_SUPER_SECRET"
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_MINUTES: int = 60
    REFRESH_TOKEN_DAYS: int = 7

    # SMTP Settings (Email)
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "kadimimohammed07@gmail.com"
    SMTP_PASSWORD: str = "r d w t t m o s z z e h j b r h"
    EMAILS_FROM_NAME: str = "Gestion Absence AI"

settings = Settings()
