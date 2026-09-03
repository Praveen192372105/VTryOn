import pytest
from sqlalchemy.orm import Session

from app.domain.enums import OutfitCategory, TryOnJobStatus, UploadStatus
from app.models.outfit import Outfit
from app.models.tryon_job import TryOnJob
from app.models.upload import Upload
from app.models.user import User
from app.repositories.tryon_repository import TryOnRepository


def test_atomic_claim_concurrency_race(db_session: Session):
    """
    Simulate two concurrent worker processes competing to claim the same QUEUED try-on job.
    Enforces that exactly one claim succeeds (rowcount=1) and the other fails (rowcount=0).
    """
    user = User(
        public_id="usr_claim_race_01",
        email="claimrace@example.com",
        name="Claim Race User",
        hashed_password="hashed_pwd",
    )
    db_session.add(user)
    db_session.flush()

    upload = Upload(
        public_id="upl_claim_race_01",
        user_id=user.id,
        storage_key="uploads/usr_claim/person.jpg",
        original_filename="person.jpg",
        mime_type="image/jpeg",
        size_bytes=4000,
        status=UploadStatus.ACTIVE.value,
    )
    db_session.add(upload)

    outfit = Outfit(
        public_id="out_claim_race_01",
        name="Race Outfit",
        slug="race-outfit",
        category=OutfitCategory.UPPER_BODY.value,
        storage_key="outfits/race.jpg",
        is_active=True,
    )
    db_session.add(outfit)
    db_session.flush()

    job_public_id = "job_claim_race_test_01"
    job = TryOnJob(
        public_id=job_public_id,
        user_id=user.id,
        person_upload_id=upload.id,
        outfit_id=outfit.id,
        status=TryOnJobStatus.QUEUED.value,
    )
    db_session.add(job)
    db_session.commit()

    # Competing Worker A and Worker B
    from tests.conftest import TestingSessionLocal

    with TestingSessionLocal() as session_a, TestingSessionLocal() as session_b:
        repo_a = TryOnRepository(session_a)
        repo_b = TryOnRepository(session_b)

        # Worker A attempts claim
        claimed_a = repo_a.claim_queued_job(job_public_id)

        # Worker B attempts claim on same job
        claimed_b = repo_b.claim_queued_job(job_public_id)

    # Invariant: Exactly one claim succeeds; the loser receives False without error
    assert claimed_a is True
    assert claimed_b is False

    # Check final job state in database
    with TestingSessionLocal() as verify_session:
        final_job = TryOnRepository(verify_session).get_by_public_id(job_public_id)
        assert final_job.status == TryOnJobStatus.PROCESSING.value
        assert final_job.started_at is not None
