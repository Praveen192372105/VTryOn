from typing import List, Optional, Tuple
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.domain.enums import TryOnJobStatus, UploadStatus
from app.domain.ids import ResourcePrefix, generate_public_id
from app.db.models.tryon import TryOnJob
from app.db.models.upload import Upload
from app.schemas.pagination import PaginationParams
from app.utils.time import utc_now


class UploadRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, upload_id: int) -> Optional[Upload]:
        return self.db.execute(
            select(Upload).where(Upload.id == upload_id)
        ).scalar_one_or_none()

    def get_by_public_id(self, public_id: str) -> Optional[Upload]:
        return self.db.execute(
            select(Upload).where(Upload.public_id == public_id)
        ).scalar_one_or_none()

    def get_by_public_id_and_user_id(self, public_id: str, user_id: int) -> Optional[Upload]:
        return self.db.execute(
            select(Upload).where(
                Upload.public_id == public_id,
                Upload.user_id == user_id,
                Upload.status == UploadStatus.ACTIVE.value,
            )
        ).scalar_one_or_none()

    get_for_user = get_by_public_id_and_user_id

    def find_active_by_hash(self, user_id: int, sha256_hash: str) -> Optional[Upload]:
        """Find an existing active upload with matching SHA-256 for the user."""
        return self.db.execute(
            select(Upload).where(
                Upload.user_id == user_id,
                Upload.sha256 == sha256_hash,
                Upload.status == UploadStatus.ACTIVE.value,
            )
        ).scalar_one_or_none()

    def list_by_user_id(
        self,
        user_id: int,
        pagination: PaginationParams,
        status: UploadStatus = UploadStatus.ACTIVE,
    ) -> Tuple[List[Upload], int]:
        count_stmt = select(func.count(Upload.id)).where(
            Upload.user_id == user_id,
            Upload.status == status.value,
        )
        total = self.db.scalar(count_stmt) or 0

        query = (
            select(Upload)
            .where(
                Upload.user_id == user_id,
                Upload.status == status.value,
            )
            .order_by(Upload.created_at.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        items = list(self.db.execute(query).scalars().all())
        return items, total

    def create(
        self,
        user_id: int,
        storage_key: str,
        original_filename: str,
        mime_type: str,
        size_bytes: int,
        width: Optional[int] = None,
        height: Optional[int] = None,
        sha256: Optional[str] = None,
        kind: str = "person",
        public_id: Optional[str] = None,
    ) -> Upload:
        upload = Upload(
            public_id=public_id or generate_public_id(ResourcePrefix.UPLOAD),
            user_id=user_id,
            kind=kind,
            storage_key=storage_key,
            original_name=original_filename,
            mime_type=mime_type,
            size_bytes=size_bytes,
            width=width,
            height=height,
            sha256=sha256,
            status=UploadStatus.ACTIVE.value,
            created_at=utc_now(),
        )
        self.db.add(upload)
        self.db.flush()
        return upload

    def mark_deleted(self, public_id: str, user_id: int) -> bool:
        stmt = (
            update(Upload)
            .where(
                Upload.public_id == public_id,
                Upload.user_id == user_id,
                Upload.status == UploadStatus.ACTIVE.value,
            )
            .values(
                status=UploadStatus.DELETED.value,
                deleted_at=utc_now(),
            )
        )
        result = self.db.execute(stmt)
        return result.rowcount > 0

    def count_active_jobs_for_upload(self, upload_id: int) -> int:
        """Count currently queued or running try-on jobs referencing this upload."""
        active_statuses = [TryOnJobStatus.QUEUED.value, TryOnJobStatus.PROCESSING.value]
        stmt = select(func.count(TryOnJob.id)).where(
            TryOnJob.person_upload_id == upload_id,
            TryOnJob.status.in_(active_statuses),
        )
        return self.db.scalar(stmt) or 0
