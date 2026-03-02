import uuid
import os
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, RolEnum
from app.models.document import Document
from app.schemas.document import DocumentOut
from app.services.auth_service import get_current_user, require_admin_or_rrhh
from app.config import get_settings
from app.utils.file_utils import ensure_storage_dir, is_allowed_mime, sanitize_filename, MAX_SIZE_BYTES
from app.services.log_service import log_activity # <-- EL ESPÍA
from app.services.session_service import get_client_ip

settings = get_settings()
router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not is_allowed_mime(file.content_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": True, "code": "INVALID_FILE_TYPE", "message": "Solo se permiten ficheros PDF, JPG y JPEG"},
        )
    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": True, "code": "FILE_TOO_LARGE", "message": "El fichero supera el tamaño máximo de 30MB"},
        )

    user_dir = ensure_storage_dir(settings.storage_path, str(current_user.id))
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    safe_name = sanitize_filename(file.filename)
    filename = f"{timestamp}_{safe_name}"
    file_path = os.path.join(user_dir, filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    doc = Document(
        user_id=current_user.id,
        nombre_original=file.filename,
        ruta_fichero=file_path,
        tipo_mime=file.content_type,
        tamaño_bytes=len(contents),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # --- REGISTRO DE AUDITORÍA ---
    log_activity(
        db, 
        "DOCUMENT_UPLOAD", 
        f"Subió el archivo: {file.filename} ({file.content_type})", 
        current_user.id, 
        get_client_ip(request)
    )

    return doc


@router.get("/my", response_model=List[DocumentOut])
def get_my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Document)
        .filter(Document.user_id == current_user.id, Document.activo == True)
        .order_by(Document.subido_en.desc())
        .all()
    )


@router.get("/user/{user_id}", response_model=List[DocumentOut])
def get_user_documents(
    user_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_rrhh),
):
    # --- REGISTRO DE AUDITORÍA ---
    target_user = db.query(User).filter(User.id == user_id).first()
    t_name = f"{target_user.nombre} {target_user.apellidos}" if target_user else str(user_id)
    log_activity(db, "DOCUMENT_LIST_VIEW", f"Consultó la lista de documentos de {t_name}", current_user.id, get_client_ip(request))

    return (
        db.query(Document)
        .filter(Document.user_id == user_id, Document.activo == True)
        .order_by(Document.subido_en.desc())
        .all()
    )


@router.get("/download/{doc_id}")
def download_document(
    doc_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.activo == True).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "code": "DOCUMENT_NOT_FOUND", "message": "Documento no encontrado"},
        )
    if current_user.rol == RolEnum.worker and doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": True, "code": "FORBIDDEN", "message": "No puedes acceder a este documento"},
        )
    if not os.path.exists(doc.ruta_fichero):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "code": "FILE_NOT_FOUND", "message": "Fichero no encontrado en el servidor"},
        )

    # --- REGISTRO DE AUDITORÍA ---
    owner = db.query(User).filter(User.id == doc.user_id).first()
    owner_name = f"{owner.nombre} {owner.apellidos}" if owner else "Usuario"
    log_activity(
        db, 
        "DOCUMENT_DOWNLOAD", 
        f"Descargó '{doc.nombre_original}' (Propiedad de {owner_name})", 
        current_user.id, 
        get_client_ip(request)
    )

    return FileResponse(
        path=doc.ruta_fichero,
        filename=doc.nombre_original,
        media_type=doc.tipo_mime,
    )


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_document(
    doc_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "code": "DOCUMENT_NOT_FOUND", "message": "Documento no encontrado"},
        )
    if current_user.rol == RolEnum.worker and doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": True, "code": "FORBIDDEN", "message": "No puedes eliminar este documento"},
        )
    
    doc.activo = False
    db.commit()

    # --- REGISTRO DE AUDITORÍA ---
    log_activity(db, "DOCUMENT_DELETE", f"Desactivó el documento: {doc.nombre_original}", current_user.id, get_client_ip(request))