import argparse
import os
import sys
from pathlib import Path
from sqlalchemy import select

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.db.models.outfit import Outfit
from app.db.models.tryon import TryOnResult
from app.db.models.upload import Upload
from app.db.session import SessionLocal


def audit_storage():
    print("=" * 70)
    print("  V Try-On Storage Auditor -- Consistency & Orphan Detection")
    print("=" * 70)

    storage_root = settings.resolved_storage_root
    print(f"Auditing storage root: {storage_root}\n")

    with SessionLocal() as db:
        # Collect all active storage keys from DB
        upload_keys = set(db.scalars(select(Upload.storage_key).where(Upload.status == "active")).all())
        outfit_keys = set(db.scalars(select(Outfit.image_storage_key).where(Outfit.is_active == True)).all())
        result_keys = set(db.scalars(select(TryOnResult.storage_key)).all())

    all_db_keys = upload_keys | outfit_keys | result_keys
    print(f"Database References:")
    print(f"  - Active Uploads:   {len(upload_keys)}")
    print(f"  - Active Outfits:   {len(outfit_keys)}")
    print(f"  - Try-On Results:   {len(result_keys)}")
    print(f"  - Total DB Keys:    {len(all_db_keys)}")

    # Check for missing files (DB references that don't exist on disk)
    missing_keys = []
    for key in all_db_keys:
        clean_key = key.lstrip("/\\")
        file_path = storage_root / clean_key
        if not file_path.exists():
            missing_keys.append(key)

    # Scan filesystem for orphaned files
    disk_files = []
    if storage_root.exists():
        for path in storage_root.rglob("*"):
            if path.is_file() and not path.name.startswith("."):
                rel_path = path.relative_to(storage_root).as_posix()
                disk_files.append(rel_path)

    orphaned_files = []
    for f in disk_files:
        if f not in all_db_keys and not f.startswith("tmp/"):
            orphaned_files.append(f)

    print(f"\nFilesystem Scan:")
    print(f"  - Total Disk Files: {len(disk_files)}")
    print(f"  - Missing Files:    {len(missing_keys)}")
    print(f"  - Orphaned Files:   {len(orphaned_files)}")

    if missing_keys:
        print("\nMissing Files (Referenced in DB, missing on disk):")
        for k in missing_keys[:10]:
            print(f"  - [MISSING] {k}")
        if len(missing_keys) > 10:
            print(f"  ... and {len(missing_keys) - 10} more")

    if orphaned_files:
        print("\nOrphaned Files (Present on disk, no DB reference):")
        for o in orphaned_files[:10]:
            print(f"  - [ORPHAN] {o}")
        if len(orphaned_files) > 10:
            print(f"  ... and {len(orphaned_files) - 10} more")

    print("\n" + "=" * 70)
    if not missing_keys and not orphaned_files:
        print("Storage is perfectly consistent with the database!")
    else:
        print("Audit identified inconsistencies (see above).")
    print("=" * 70)


if __name__ == "__main__":
    audit_storage()
