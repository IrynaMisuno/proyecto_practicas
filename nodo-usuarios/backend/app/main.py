from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .database import SessionLocal, engine, run_migrations
from .routers import auth, roles, users
from .seed import seed_database

FIELD_MESSAGES = {
    "missing": "Este campo es obligatorio.",
    "extra_forbidden": "Este campo no está permitido.",
    "string_too_short": "Este campo es obligatorio.",
    "string_too_long": "El texto es demasiado largo.",
    "literal_error": "Valor no válido.",
    "string_type": "Debe ser un texto.",
    "list_type": "Debe ser una lista.",
}


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    run_migrations(engine)
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(title="Nodo API", lifespan=lifespan)


def field_message(error: dict) -> str:
    if error["type"] == "value_error":
        message = str(error["msg"]).removeprefix("Value error, ")
        # email-validator devuelve mensajes en inglés.
        return "Introduce un email válido." if "email" in message else message
    return FIELD_MESSAGES.get(error["type"], "Valor no válido.")


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    fields: dict[str, str] = {}
    for error in exc.errors():
        location = [str(part) for part in error["loc"] if part != "body"]
        fields.setdefault(".".join(location) or "body", field_message(error))
    return JSONResponse(status_code=422, content={"error": next(iter(fields.values()), "Datos no válidos."), "fields": fields})


@app.exception_handler(StarletteHTTPException)
async def http_error_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail}, headers=exc.headers)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "same-origin")
    if request.url.path.startswith("/api/"):
        response.headers.setdefault("Cache-Control", "no-store")
    return response


for router in (auth.router, users.router, roles.router):
    app.include_router(router, prefix="/api")
