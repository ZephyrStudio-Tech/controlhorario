import uuid
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from app.database import engine
from app.models import user, work_session, session_pause, absence, document  # noqa: F401
from app.routers import auth, users, sessions, absences, documents
from app.services.report_service import router as reports_router
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("uvicorn.error")


def create_initial_admin():
    """Create the initial admin user if no users exist."""
    from sqlalchemy.orm import Session
    from app.models.user import User, RolEnum
    from app.services.auth_service import hash_password

    with Session(engine) as db:
        if db.query(User).count() == 0:
            admin = User(
                nombre=settings.admin_nombre,
                apellidos=settings.admin_apellidos,
                email=settings.admin_email,
                dni=settings.admin_dni.upper(),
                password_hash=hash_password(settings.admin_password),
                pin_hash=hash_password(settings.admin_dni.upper()),
                rol=RolEnum.admin,
                jornada_horas_diarias=8.0,
            )
            db.add(admin)
            db.commit()
            logger.info(f"Admin user created: {settings.admin_email}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # La migración ahora se hace en el entrypoint.sh
    create_initial_admin()
    yield


app = FastAPI(
    title="Control Horario API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": True, "code": "DATABASE_ERROR", "message": "Error interno de base de datos"},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": True, "code": "INTERNAL_ERROR", "message": "Error interno del servidor"},
    )


# Include all routers under /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(absences.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(reports_router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
