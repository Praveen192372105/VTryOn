from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from PIL import Image

from app.core.exceptions import QueueSubmissionError
from app.core.security import create_access_token, get_password_hash
from app.db.models.outfit import Outfit
from app.db.models.tryon import TryOnJob, TryOnResult
from app.db.models.upload import Upload
from app.db.models.user import User
from app.domain.enums import OutfitCategory, TryOnJobStatus, UploadStatus
from app.domain.ids import ResourcePrefix, generate_public_id
from app.storage.local import default_storage
from app.utils.time import utc_now


def create_test_user(db_session: Session, idx: int) -> tuple[User, str, dict]:
    user = User(
        public_id=generate_public_id(ResourcePrefix.USER),
        email=f"tryon_user_{idx}_{generate_public_id(ResourcePrefix.USER)[:8]}@example.com",
        name=f"TryOn User {idx}",
        hashed_password=get_password_hash("Password123!"),
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    token, _ = create_access_token(user_public_id=user.public_id)
    headers = {"Authorization": f"Bearer {token}"}
    return user, token, headers


def create_test_upload_and_outfit(db_session: Session, user: User) -> tuple[Upload, Outfit]:
    # Seed upload
    person_key = f"uploads/{user.public_id}/person.jpg"
    img = Image.new("RGB", (768, 1024), color=(200, 200, 200))
    raw_bytes = img.tobytes()
    default_storage.save(person_key, raw_bytes, content_type="image/jpeg")

    upload = Upload(
        public_id=generate_public_id(ResourcePrefix.UPLOAD),
        user_id=user.id,
        storage_key=person_key,
        original_filename="person.jpg",
        mime_type="image/jpeg",
        size_bytes=len(raw_bytes),
        status=UploadStatus.ACTIVE.value,
    )
    db_session.add(upload)

    # Seed outfit
    outfit_key = f"outfits/shirt_{user.id}.jpg"
    default_storage.save(outfit_key, raw_bytes, content_type="image/jpeg")

    outfit = Outfit(
        public_id=generate_public_id(ResourcePrefix.OUTFIT),
        name=f"Cotton Shirt {user.id}",
        slug=f"cotton-shirt-{user.id}-{generate_public_id(ResourcePrefix.OUTFIT)[-6:]}",
        category=OutfitCategory.UPPER_BODY.value,
        storage_key=outfit_key,
        is_active=True,
    )
    db_session.add(outfit)
    db_session.commit()
    return upload, outfit


def test_tryon_create_returns_202_and_location_header(client: TestClient, db_session: Session):
    user, _, headers = create_test_user(db_session, 1)
    upload, outfit = create_test_upload_and_outfit(db_session, user)

    with patch("app.workers.dispatchers.CeleryTryOnJobDispatcher.dispatch", return_value="task_fake123"):
        res = client.post(
            "/api/v1/try-ons",
            headers=headers,
            json={"person_upload_id": upload.public_id, "outfit_id": outfit.public_id},
        )

    assert res.status_code == 202
    assert "Location" in res.headers
    data = res.json()["data"]

    assert data["status"] == "queued"
    assert data["person_upload_id"] == upload.public_id
    assert data["outfit_id"] == outfit.public_id
    assert data["result"] is None
    assert data["error"] is None
    assert res.headers["Location"] == f"/api/v1/try-ons/{data['id']}"

    # Critical requirement: NO progress field
    assert "progress" not in data


def test_tryon_create_foreign_upload_returns_404(client: TestClient, db_session: Session):
    user_a, _, headers_a = create_test_user(db_session, 2)
    user_b, _, _ = create_test_user(db_session, 3)
    upload_b, outfit = create_test_upload_and_outfit(db_session, user_b)

    res = client.post(
        "/api/v1/try-ons",
        headers=headers_a,
        json={"person_upload_id": upload_b.public_id, "outfit_id": outfit.public_id},
    )
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "UPLOAD_NOT_FOUND"


def test_tryon_create_inactive_outfit_returns_404(client: TestClient, db_session: Session):
    user, _, headers = create_test_user(db_session, 4)
    upload, outfit = create_test_upload_and_outfit(db_session, user)
    outfit.is_active = False
    db_session.commit()

    res = client.post(
        "/api/v1/try-ons",
        headers=headers,
        json={"person_upload_id": upload.public_id, "outfit_id": outfit.public_id},
    )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "OUTFIT_INACTIVE"


def test_tryon_create_queue_failure_compensates_to_failed(client: TestClient, db_session: Session):
    user, _, headers = create_test_user(db_session, 5)
    upload, outfit = create_test_upload_and_outfit(db_session, user)

    with patch(
        "app.workers.dispatchers.CeleryTryOnJobDispatcher.dispatch",
        side_effect=QueueSubmissionError("Broker down"),
    ):
        res = client.post(
            "/api/v1/try-ons",
            headers=headers,
            json={"person_upload_id": upload.public_id, "outfit_id": outfit.public_id},
        )

    assert res.status_code == 503
    assert res.json()["error"]["code"] == "TRYON_QUEUE_UNAVAILABLE"

    # Verify compensated job is marked FAILED in DB
    compensated = db_session.query(TryOnJob).filter_by(user_id=user.id).first()
    assert compensated is not None
    assert compensated.status == TryOnJobStatus.FAILED.value
    assert compensated.error_code == "QUEUE_SUBMISSION_FAILED"


def test_tryon_polling_states_and_no_progress(client: TestClient, db_session: Session):
    user, _, headers = create_test_user(db_session, 6)
    upload, outfit = create_test_upload_and_outfit(db_session, user)

    # 1. QUEUED State
    job = TryOnJob(
        public_id=generate_public_id(ResourcePrefix.TRYON_JOB),
        user_id=user.id,
        person_upload_id=upload.id,
        outfit_id=outfit.id,
        status=TryOnJobStatus.QUEUED.value,
    )
    db_session.add(job)
    db_session.commit()

    res_q = client.get(f"/api/v1/try-ons/{job.public_id}", headers=headers)
    assert res_q.status_code == 200
    assert res_q.json()["data"]["status"] == "queued"
    assert "progress" not in res_q.json()["data"]

    # 2. PROCESSING State
    job.status = TryOnJobStatus.PROCESSING.value
    job.started_at = utc_now()
    db_session.commit()

    res_p = client.get(f"/api/v1/try-ons/{job.public_id}", headers=headers)
    assert res_p.status_code == 200
    assert res_p.json()["data"]["status"] == "processing"
    assert res_p.json()["data"]["started_at"] is not None
    assert "progress" not in res_p.json()["data"]

    # 3. SUCCEEDED State with Result
    result_key = f"results/{user.public_id}/{job.public_id}/res.jpg"
    default_storage.save(result_key, b"fake_jpeg_image_data", content_type="image/jpeg")

    result = TryOnResult(
        public_id=generate_public_id(ResourcePrefix.TRYON_RESULT),
        job_id=job.id,
        storage_key=result_key,
        mime_type="image/jpeg",
        width=768,
        height=1024,
    )
    db_session.add(result)
    job.status = TryOnJobStatus.SUCCEEDED.value
    job.finished_at = utc_now()
    db_session.commit()

    res_s = client.get(f"/api/v1/try-ons/{job.public_id}", headers=headers)
    assert res_s.status_code == 200
    data_s = res_s.json()["data"]
    assert data_s["status"] == "succeeded"
    assert data_s["result"] is not None
    assert data_s["result"]["id"] == result.public_id
    assert data_s["result"]["image_url"] == f"/api/v1/try-ons/{job.public_id}/content"
    assert data_s["error"] is None
    assert "progress" not in data_s

    # 4. FAILED State
    job.status = TryOnJobStatus.FAILED.value
    job.error_code = "INVALID_PERSON_IMAGE"
    job.error_message = "The face in the person image could not be detected."
    db_session.delete(result)
    db_session.commit()

    res_f = client.get(f"/api/v1/try-ons/{job.public_id}", headers=headers)
    assert res_f.status_code == 200
    data_f = res_f.json()["data"]
    assert data_f["status"] == "failed"
    assert data_f["result"] is None
    assert data_f["error"]["code"] == "INVALID_PERSON_IMAGE"
    assert "progress" not in data_f


def test_tryon_detail_and_content_idor_protection(client: TestClient, db_session: Session):
    user_a, _, headers_a = create_test_user(db_session, 7)
    user_b, _, headers_b = create_test_user(db_session, 8)
    upload_a, outfit_a = create_test_upload_and_outfit(db_session, user_a)

    result_key = f"results/{user_a.public_id}/job_idor/res.jpg"
    default_storage.save(result_key, b"binary_image_secret", content_type="image/jpeg")

    job_a = TryOnJob(
        public_id=generate_public_id(ResourcePrefix.TRYON_JOB),
        user_id=user_a.id,
        person_upload_id=upload_a.id,
        outfit_id=outfit_a.id,
        status=TryOnJobStatus.SUCCEEDED.value,
        finished_at=utc_now(),
    )
    db_session.add(job_a)
    db_session.flush()

    res_obj = TryOnResult(
        public_id=generate_public_id(ResourcePrefix.TRYON_RESULT),
        job_id=job_a.id,
        storage_key=result_key,
        mime_type="image/jpeg",
        width=768,
        height=1024,
    )
    db_session.add(res_obj)
    db_session.commit()

    # User B cannot GET User A's job -> 404
    assert client.get(f"/api/v1/try-ons/{job_a.public_id}", headers=headers_b).status_code == 404

    # User B cannot GET User A's result content -> 404
    assert client.get(f"/api/v1/try-ons/{job_a.public_id}/content", headers=headers_b).status_code == 404

    # User A CAN download binary content -> 200
    res_content = client.get(f"/api/v1/try-ons/{job_a.public_id}/content", headers=headers_a)
    assert res_content.status_code == 200
    assert res_content.content == b"binary_image_secret"
    assert res_content.headers["Content-Type"] == "image/jpeg"
    assert "private" in res_content.headers.get("Cache-Control", "")


def test_tryon_deletion_rules(client: TestClient, db_session: Session):
    user, _, headers = create_test_user(db_session, 9)
    upload, outfit = create_test_upload_and_outfit(db_session, user)

    # 1. QUEUED job deletion rejected with 409
    job_q = TryOnJob(
        public_id=generate_public_id(ResourcePrefix.TRYON_JOB),
        user_id=user.id,
        person_upload_id=upload.id,
        outfit_id=outfit.id,
        status=TryOnJobStatus.QUEUED.value,
    )
    db_session.add(job_q)
    db_session.commit()

    del_q = client.delete(f"/api/v1/try-ons/{job_q.public_id}", headers=headers)
    assert del_q.status_code == 409
    assert del_q.json()["error"]["code"] == "TRYON_JOB_IN_PROGRESS"

    # 2. PROCESSING job deletion rejected with 409
    job_q.status = TryOnJobStatus.PROCESSING.value
    db_session.commit()

    del_p = client.delete(f"/api/v1/try-ons/{job_q.public_id}", headers=headers)
    assert del_p.status_code == 409
    assert del_p.json()["error"]["code"] == "TRYON_JOB_IN_PROGRESS"

    # 3. SUCCEEDED job deletion allowed with 204 No Content
    result_key = f"results/{user.public_id}/del_test/res.jpg"
    default_storage.save(result_key, b"to_be_deleted", content_type="image/jpeg")
    res_obj = TryOnResult(
        public_id=generate_public_id(ResourcePrefix.TRYON_RESULT),
        job_id=job_q.id,
        storage_key=result_key,
        width=768,
        height=1024,
    )
    db_session.add(res_obj)
    job_q.status = TryOnJobStatus.SUCCEEDED.value
    db_session.commit()

    del_s = client.delete(f"/api/v1/try-ons/{job_q.public_id}", headers=headers)
    assert del_s.status_code == 204
    assert not del_s.content

    # GET after delete returns 404
    assert client.get(f"/api/v1/try-ons/{job_q.public_id}", headers=headers).status_code == 404


def test_tryon_history_pagination_and_isolation(client: TestClient, db_session: Session):
    user_a, _, headers_a = create_test_user(db_session, 10)
    user_b, _, headers_b = create_test_user(db_session, 11)
    upload_a, outfit_a = create_test_upload_and_outfit(db_session, user_a)

    for i in range(3):
        job = TryOnJob(
            public_id=generate_public_id(ResourcePrefix.TRYON_JOB),
            user_id=user_a.id,
            person_upload_id=upload_a.id,
            outfit_id=outfit_a.id,
            status=TryOnJobStatus.SUCCEEDED.value,
        )
        db_session.add(job)
    db_session.commit()

    # User A lists 3 jobs
    res_a = client.get("/api/v1/try-ons?page=1&page_size=2", headers=headers_a)
    assert res_a.status_code == 200
    data_a = res_a.json()["data"]
    assert len(data_a["items"]) == 2
    assert data_a["pagination"]["total"] == 3
    assert data_a["pagination"]["total_pages"] == 2
    assert "progress" not in data_a["items"][0]

    # User B lists 0 jobs (isolation)
    res_b = client.get("/api/v1/try-ons", headers=headers_b)
    assert res_b.status_code == 200
    assert len(res_b.json()["data"]["items"]) == 0
    assert res_b.json()["data"]["pagination"]["total"] == 0
