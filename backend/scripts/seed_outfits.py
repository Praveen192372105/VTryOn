import argparse
import io
import json
import logging
import re
import sys
from pathlib import Path
from typing import Any, Dict, List
from pydantic import BaseModel, Field, field_validator
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.core.config import settings
from app.db.session import SessionLocal
from app.domain.enums import OutfitCategory
from app.repositories.outfit_repository import OutfitRepository
from app.storage.local import default_storage

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("vtryon.scripts.seed")

MANIFEST_PATH = PROJECT_ROOT / "scripts" / "data" / "outfits.json"


class SeedOutfitManifestItem(BaseModel):
    public_id: str = Field(..., description="Stable public identifier for the outfit")
    name: str = Field(..., min_length=1, max_length=160)
    slug: str = Field(..., min_length=1, max_length=160)
    category: OutfitCategory
    image_storage_key: str = Field(..., min_length=1)
    thumbnail_storage_key: str | None = None
    description: str | None = None
    sort_order: int = Field(default=0)
    is_active: bool = Field(default=True)

    @field_validator("public_id")
    @classmethod
    def validate_public_id(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^out_[0-9a-zA-Z]+$", v):
            raise ValueError(f"Invalid public_id format '{v}'. Expected out_<alphanumeric>.")
        return v

    @field_validator("name", "slug")
    @classmethod
    def strip_and_validate(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be empty or whitespace only.")
        return v


def ensure_sample_media(storage_key: str) -> None:
    """Ensure a minimal valid JPEG exists at storage_key in local storage for development."""
    target_path = Path(default_storage.resolve_path(storage_key))
    if not target_path.exists():
        target_path.parent.mkdir(parents=True, exist_ok=True)
        # Create a simple 256x256 test image
        img = Image.new("RGB", (256, 256), color=(220, 225, 230))
        out_buf = io.BytesIO()
        img.save(out_buf, format="JPEG", quality=90)
        target_path.write_bytes(out_buf.getvalue())
        logger.info(f"Generated local sample media asset at '{storage_key}'")


def load_and_validate_manifest(manifest_path: Path) -> List[SeedOutfitManifestItem]:
    """Load and validate the catalogue seed manifest."""
    if not manifest_path.exists():
        raise FileNotFoundError(f"Manifest file not found at: {manifest_path}")

    with open(manifest_path, "r", encoding="utf-8") as f:
        raw_items: List[Dict[str, Any]] = json.load(f)

    validated_items: List[SeedOutfitManifestItem] = []
    seen_public_ids = set()
    seen_slugs = set()

    for idx, raw in enumerate(raw_items):
        try:
            item = SeedOutfitManifestItem(**raw)
        except Exception as exc:
            raise ValueError(f"Validation failed for record at index {idx}: {str(exc)}") from exc

        if item.public_id in seen_public_ids:
            raise ValueError(f"Duplicate public_id '{item.public_id}' detected in manifest.")
        if item.slug in seen_slugs:
            raise ValueError(f"Duplicate slug '{item.slug}' detected in manifest.")

        seen_public_ids.add(item.public_id)
        seen_slugs.add(item.slug)
        validated_items.append(item)

    return validated_items


def seed_catalogue(dry_run: bool = False, db: Optional[Session] = None) -> int:
    """
    Execute catalogue seeding from the controlled manifest.
    Returns 0 on success, non-zero on failure.
    """
    logger.info("=" * 60)
    logger.info(f"V Try-On -- Catalogue Seeder (Mode: {'DRY RUN' if dry_run else 'LIVE'})")
    logger.info(f"Database: {settings.DATABASE_HOST}:{settings.DATABASE_PORT}/{settings.DATABASE_NAME}")
    logger.info("=" * 60)

    try:
        items = load_and_validate_manifest(MANIFEST_PATH)
        logger.info(f"Validated {len(items)} catalogue records from manifest.")
    except Exception as exc:
        logger.error(f"Manifest validation error: {str(exc)}")
        return 1

    # Ensure media files exist
    for item in items:
        try:
            ensure_sample_media(item.image_storage_key)
            if item.thumbnail_storage_key:
                ensure_sample_media(item.thumbnail_storage_key)
        except Exception as exc:
            logger.error(f"Failed to prepare media for '{item.public_id}': {str(exc)}")
            return 1

    created_count = 0
    updated_count = 0
    unchanged_count = 0

    def _apply_seed(session: Session) -> int:
        nonlocal created_count, updated_count, unchanged_count
        repo = OutfitRepository(session)
        try:
            for item in items:
                outfit, created, updated = repo.upsert_seed_outfit(
                    public_id=item.public_id,
                    name=item.name,
                    slug=item.slug,
                    category=item.category,
                    storage_key=item.image_storage_key,
                    description=item.description,
                    thumbnail_storage_key=item.thumbnail_storage_key,
                    is_active=item.is_active,
                    sort_order=item.sort_order,
                )

                if created:
                    created_count += 1
                    logger.info(f"[+] Created outfit: '{outfit.name}' [{outfit.public_id}]")
                elif updated:
                    updated_count += 1
                    logger.info(f"[*] Updated outfit: '{outfit.name}' [{outfit.public_id}]")
                else:
                    unchanged_count += 1
                    logger.info(f"[-] Unchanged outfit: '{outfit.name}' [{outfit.public_id}]")

            if dry_run:
                session.rollback()
                logger.info("Dry-run complete. Transaction rolled back safely.")
            else:
                session.commit()
                logger.info("Transaction committed successfully.")

            print("\n" + "=" * 40)
            print("Catalogue Seeding Summary:")
            print(f"  Total records: {len(items)}")
            print(f"  Created:       {created_count}")
            print(f"  Updated:       {updated_count}")
            print(f"  Unchanged:     {unchanged_count}")
            print(f"  Failed:        0")
            print("=" * 40 + "\n")
            return 0
        except Exception as exc:
            session.rollback()
            logger.error(f"Catalogue seeding failed: {str(exc)}", exc_info=True)
            return 1

    if db is not None:
        return _apply_seed(db)

    with SessionLocal() as session:
        return _apply_seed(session)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the V Try-On catalogue outfits.")
    parser.add_argument("--dry-run", action="store_true", help="Validate and calculate planned changes without committing.")
    args = parser.parse_args()

    exit_code = seed_catalogue(dry_run=args.dry_run)
    sys.exit(exit_code)
