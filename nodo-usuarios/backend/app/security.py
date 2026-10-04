import hashlib
import secrets
import time
from collections import defaultdict, deque
from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

from .config import get_settings

ALGORITHM = "HS256"
COOKIE_NAME = "nodo_session"

password_hasher = PasswordHash((Argon2Hasher(),))
# Hash de una contraseña aleatoria: se verifica cuando el email no existe para
# que el tiempo de respuesta no revele qué correos están registrados.
_DUMMY_HASH = password_hasher.hash("dummy-password-that-never-matches")


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    if password_hash is None:
        password_hasher.verify(password, _DUMMY_HASH)
        return False
    return password_hasher.verify(password, password_hash)


def create_access_token(user_id: str, session_version: int) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    expires = now + timedelta(minutes=settings.token_minutes)
    payload = {"sub": user_id, "ver": session_version, "iat": now, "exp": expires}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> tuple[str, int] | None:
    """Devuelve (id de usuario, versión de sesión) si el token es válido."""
    try:
        payload = jwt.decode(token, get_settings().secret_key, algorithms=[ALGORITHM], options={"require": ["sub", "ver", "exp"]})
    except jwt.PyJWTError:
        return None
    subject, version = payload.get("sub"), payload.get("ver")
    if not isinstance(subject, str) or not isinstance(version, int):
        return None
    return subject, version


def new_reset_token() -> tuple[str, str]:
    """Genera un token de recuperación y su hash; solo el hash se guarda."""
    token = secrets.token_urlsafe(32)
    return token, hash_reset_token(token)


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class LoginThrottle:
    """Bloqueo en memoria tras demasiados intentos fallidos por email + IP."""

    def __init__(self, max_attempts: int = 5, window_seconds: int = 15 * 60) -> None:
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._failures: dict[str, deque[float]] = defaultdict(deque)

    def _recent(self, key: str) -> deque[float]:
        failures = self._failures[key]
        limit = time.monotonic() - self.window_seconds
        while failures and failures[0] < limit:
            failures.popleft()
        return failures

    def is_blocked(self, key: str) -> bool:
        return len(self._recent(key)) >= self.max_attempts

    def record_failure(self, key: str) -> None:
        self._recent(key).append(time.monotonic())

    def reset(self, key: str) -> None:
        self._failures.pop(key, None)


login_throttle = LoginThrottle()
# Limita las solicitudes de recuperación por email para no inundar su buzón.
reset_throttle = LoginThrottle(max_attempts=3)
