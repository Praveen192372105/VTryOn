import logging
from typing import Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import (
    UploadInUseError,
    UploadNotFoundError,
    UploadPersistenceFailedError,
)
from app.domain.enums import UploadStatus
from app.domain.ids import ResourcePrefix, generate_public_id
from app.domain.ownership import CurrentUser, ensure_upload_not_in_use
from app.repositories.upload_repository import UploadRepository
from app.schemas.pagination import PaginatedData, PaginationParams, calculate_pagination
from app.schemas.upload import PersonUploadListItem, PersonUploadResponse
from app.storage.base import MediaStorage
from app.storage.local import default_storage
from app.utils.files import sanitize_filename
from app.utils.images import build_person_storage_key, normalize_person_image

logger = logging.getLogger("vtryon.services.uploads")


class UploadService:
    """
    Application service managing person image uploads, normalization,
    atomic storage persistence, database compensation, and owned resource queries.
    """

    def __init__(self, db: Session, storage: Optional[MediaStorage] = None):
        self.db = db
        self.storage = storage or default_storage
        self.upload_repo = UploadRepository(db)

    def create_person_upload(
        self,
        user: CurrentUser,
        filename: str,
        content: bytes,
        mime_type: Optional[str] = None,
    ) -> PersonUploadResponse:
        """
        Execute the canonical person image upload pipeline:
        1. Validate & normalize raw image (format verification, EXIF strip, RGB conversion, pixel limits).
        2. Generate server-controlled public ID and storage key.
        3. Atomically persist file to media storage.
        4. Insert metadata row into MySQL.
        5. Compensate and remove storage file if database transaction fails.
        """
        logger.info(
            f"Processing person upload request for user '{user.public_id}'",
            extra={"event": "upload.requested", "user_public_id": user.public_id},
        )

        clean_filename = sanitize_filename(filename)

        # Step 1: Decode, verify, transpose, and normalize image to RGB JPEG without metadata
        normalized = normalize_person_image(
            content,
            min_width=settings.MIN_IMAGE_WIDTH,
            min_height=settings.MIN_IMAGE_HEIGHT,
            max_width=settings.MAX_IMAGE_WIDTH,
            max_height=settings.MAX_IMAGE_HEIGHT,
            max_pixels=settings.MAX_IMAGE_PIXELS,
        )

        logger.info(
            f"Image normalized successfully ({normalized.width}x{normalized.height}, {normalized.size_bytes} bytes)",
            extra={
                "event": "upload.normalized",
                "width": normalized.width,
                "height": normalized.height,
                "size_bytes": normalized.size_bytes,
            },
        )

        # Step 2: Generate identifiers
        public_id = generate_public_id(ResourcePrefix.UPLOAD)
        storage_key = build_person_storage_key(
            user_public_id=user.public_id,
            upload_public_id=public_id,
            extension=normalized.extension,
        )

        # Step 3: Atomic storage write
        stored = self.storage.save(storage_key, normalized.data, content_type=normalized.mime_type)

        # Step 4: Database metadata persistence with compensation
        try:
            upload = self.upload_repo.create(
                public_id=public_id,
                user_id=user.id,
                storage_key=stored.storage_key,
                original_filename=clean_filename,
                mime_type=normalized.mime_type,
                size_bytes=normalized.size_bytes,
                width=normalized.width,
                height=normalized.height,
                sha256=normalized.sha256,
                kind="person",
            )
            self.db.commit()
        except Exception as exc:
            self.db.rollback()
            logger.error(
                f"Database insertion failed for upload '{public_id}'. Triggering storage cleanup. Error: {str(exc)}",
                extra={"event": "upload.persistence.failed", "upload_id": public_id},
            )
            try:
                self.storage.delete(stored.storage_key)
                logger.info(
                    f"Storage compensation cleaned up orphan key '{stored.storage_key}'",
                    extra={"event": "upload.cleanup.succeeded", "storage_key": stored.storage_key},
                )
            except Exception as cleanup_exc:
                logger.error(
                    f"Failed to clean up storage key '{stored.storage_key}' after DB failure: {str(cleanup_exc)}",
                    extra={"event": "upload.cleanup.failed", "storage_key": stored.storage_key},
                )
            raise UploadPersistenceFailedError("Failed to persist upload metadata record.")

        logger.info(
            f"Person upload '{public_id}' created and committed for user '{user.public_id}'",
            extra={"event": "upload.created", "upload_id": public_id, "user_id": user.public_id},
        )

        return PersonUploadResponse(
            id=upload.public_id,
            original_filename=upload.original_filename,
            mime_type=upload.mime_type,
            width=upload.width,
            height=upload.height,
            size_bytes=upload.size_bytes,
            status=UploadStatus(upload.status),
            image_url=self.storage.get_url(upload.storage_key),
            created_at=upload.created_at,
            updated_at=getattr(upload, "updated_at", None),
        )

    def list_person_uploads(
        self,
        user: CurrentUser,
        pagination: PaginationParams,
    ) -> PaginatedData[PersonUploadListItem]:
        """List active person uploads for authenticated user in newest-first order."""
        uploads, total = self.upload_repo.list_by_user_id(
            user_id=user.id,
            pagination=pagination,
            status=UploadStatus.ACTIVE,
        )

        items = [
            PersonUploadListItem(
                id=u.public_id,
                mime_type=u.mime_type,
                width=u.width,
                height=u.height,
                size_bytes=u.size_bytes,
                status=UploadStatus(u.status),
                image_url=self.storage.get_url(u.storage_key),
                created_at=u.created_at,
            )
            for u in uploads
        ]

        meta = calculate_pagination(total=total, page=pagination.page, page_size=pagination.page_size)
        return PaginatedData(items=items, pagination=meta)

    def get_owned_upload(self, user: CurrentUser, upload_id: str) -> PersonUploadResponse:
        """Retrieve owned active upload detail. Returns 404 if missing or foreign."""
        upload = self.upload_repo.get_by_public_id_and_user_id(
            public_id=upload_id,
            user_id=user.id,
        )
        if not upload:
            raise UploadNotFoundError(f"Upload '{upload_id}' was not found.")

        return PersonUploadResponse(
            id=upload.public_id,
            original_filename=upload.original_filename,
            mime_type=upload.mime_type,
            width=upload.width,
            height=upload.height,
            size_bytes=upload.size_bytes,
            status=UploadStatus(upload.status),
            image_url=self.storage.get_url(upload.storage_key),
            created_at=upload.created_at,
            updated_at=getattr(upload, "updated_at", None),
        )

    def delete_owned_upload(self, user: CurrentUser, upload_id: str) -> bool:
        """
        Soft-delete an owned person upload.
        Rejects deletion with 409 UPLOAD_IN_USE if referenced by active try-on jobs.
        Performs best-effort physical storage deletion afterwards.
        """
        upload = self.upload_repo.get_by_public_id_and_user_id(
            public_id=upload_id,
            user_id=user.id,
        )
        if not upload:
            raise UploadNotFoundError(f"Upload '{upload_id}' was not found.")

        # Guard: active jobs in queued/processing status block deletion
        active_jobs_count = self.upload_repo.count_active_jobs_for_upload(upload.id)
        ensure_upload_not_in_use(active_jobs_count, upload_id)

        # 1. Soft-delete database metadata record
        deleted = self.upload_repo.mark_deleted(upload_id, user.id)
        self.db.commit()

        logger.info(
            f"Person upload '{upload_id}' marked as deleted by user '{user.public_id}'",
            extra={"event": "upload.deleted", "upload_id": upload_id, "user_id": user.public_id},
        )

        # 2. Attempt best-effort physical file deletion
        try:
            self.storage.delete(upload.storage_key)
        except Exception as exc:
            logger.warning(
                f"Physical file deletion failed for key '{upload.storage_key}': {str(exc)}",
                extra={"event": "upload.storage_cleanup.failed", "storage_key": upload.storage_key},
            )

        return deleted
