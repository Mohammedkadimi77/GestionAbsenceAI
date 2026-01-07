from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB: str = "absence_db"

    JWT_SECRET: str = "CHANGE_ME_SUPER_SECRET"
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_MINUTES: int = 60
    REFRESH_TOKEN_DAYS: int = 7

settings = Settings()
