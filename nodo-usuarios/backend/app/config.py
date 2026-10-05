from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    secret_key: str = Field(min_length=32)
    database_url: str = "sqlite:///./nodo.db"
    token_minutes: int = 60
    cookie_secure: bool = False
    admin_email: str | None = None
    admin_password: str | None = None
    admin_name: str = "Administrador"

    # Recuperación de contraseña
    frontend_url: str = "http://localhost:5173"
    reset_token_minutes: int = 30
    invite_token_hours: int = 24
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str = "Nodo <no-reply@example.com>"
    smtp_starttls: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
