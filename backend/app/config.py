from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    storage_path: str = "/storage/documents"
    admin_email: str = "admin@empresa.com"
    admin_password: str = "Admin1234!"
    admin_dni: str = "00000000A"
    admin_nombre: str = "Administrador"
    admin_apellidos: str = "Sistema"
    environment: str = "production"
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:80", "http://localhost"]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()