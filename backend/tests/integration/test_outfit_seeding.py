from pathlib import Path
import pytest
from sqlalchemy.orm import Session

from app.db.models.outfit import Outfit
from scripts.seed_outfits import MANIFEST_PATH, load_and_validate_manifest, seed_catalogue


def test_seed_manifest_validation():
    """Verify that the real seed manifest validates without error."""
    items = load_and_validate_manifest(MANIFEST_PATH)
    assert len(items) >= 4
    for item in items:
        assert item.public_id.startswith("out_")
        assert len(item.name) > 0
        assert item.image_storage_key.startswith("outfits/")


def test_seed_catalogue_idempotency(db_session: Session):
    """Verify that running seeding twice against a database creates records then leaves them unchanged."""
    # First run: inserts records
    exit_code_1 = seed_catalogue(dry_run=False, db=db_session)
    assert exit_code_1 == 0

    first_count = db_session.query(Outfit).count()
    assert first_count >= 4

    # Second run: 0 new records, 0 duplicates
    exit_code_2 = seed_catalogue(dry_run=False, db=db_session)
    assert exit_code_2 == 0

    second_count = db_session.query(Outfit).count()
    assert second_count == first_count
