"""End-to-end verification script for custom user garment upload and CatVTON readiness."""

import os
import sys
from pathlib import Path
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal
from app.models.user import User
from app.services.outfit_service import OutfitService


def run_test():
    print("=" * 60)
    print("TESTING CUSTOM USER GARMENT UPLOAD & CATVTON PIPELINE COMPATIBILITY")
    print("=" * 60)

    sample_garment_path = Path("scripts/data/samples/garment_crimson_cashmere_sweater.jpg")
    if not sample_garment_path.exists():
        print(f"Error: Sample garment not found at {sample_garment_path}")
        return False

    garment_bytes = sample_garment_path.read_bytes()
    print(f"Loaded source test garment: {len(garment_bytes)} bytes")

    session = SessionLocal()
    try:
        user = session.query(User).order_by(User.id.asc()).first()
        if not user:
            print("No existing user found. Creating a test user...")
            from app.core.security import get_password_hash
            from app.core.ulid import generate_ulid

            user = User(
                public_id=f"usr_{generate_ulid()}",
                email="custom_tester@example.com",
                password_hash=get_password_hash("Secret123!"),
                full_name="Custom Garment Tester",
                is_active=True,
                is_verified=True,
            )
            session.add(user)
            session.commit()
            session.refresh(user)

        print(f"Testing with user: {user.public_id} ({user.email})")

        # 1. Create custom outfit via OutfitService
        service = OutfitService(session)
        custom_outfit = service.create_custom_outfit(
            user=user,
            filename="my_vintage_shirt.jpg",
            content=garment_bytes,
            mime_type="image/jpeg",
            name="My Vintage Custom Shirt",
            category="upper_body",
        )

        print(f"\n[PASS] Custom outfit created successfully!")
        print(f"  ID: {custom_outfit.id}")
        print(f"  Name: {custom_outfit.name}")
        print(f"  Category: {custom_outfit.category}")
        print(f"  Image URL: {custom_outfit.image_url}")
        print(f"  Thumbnail URL: {custom_outfit.thumbnail_url}")

        # 2. Verify files exist on disk via DB record
        from app.repositories.outfit_repository import OutfitRepository
        from app.storage import get_media_storage

        outfit_repo = OutfitRepository(session)
        db_outfit = outfit_repo.get_by_public_id(custom_outfit.id)
        assert db_outfit is not None, "Outfit must exist in database"
        print(f"  DB sort_order: {db_outfit.sort_order}")
        assert db_outfit.sort_order == -1, "Custom outfit should have sort_order=-1"

        storage = get_media_storage()
        garment_file = storage._get_safe_path(db_outfit.storage_key)
        thumb_file = storage._get_safe_path(db_outfit.thumbnail_storage_key)

        print(f"\nVerifying storage files:")
        print(f"  Garment path: {garment_file} -> Exists: {garment_file.exists()}")
        print(f"  Thumb path: {thumb_file} -> Exists: {thumb_file.exists()}")

        if not garment_file.exists() or not thumb_file.exists():
            print("[FAIL] Storage files missing!")
            return False

        # 3. Verify image can be opened and meets CatVTON input specifications
        with Image.open(garment_file) as img:
            print(f"\nGarment properties:")
            print(f"  Format: {img.format}")
            print(f"  Mode: {img.mode}")
            print(f"  Size: {img.size}")
            assert img.mode == "RGB", "Image must be normalized to RGB"

            # Check CatVTON resize compatibility (768x1024)
            catvton_garment = img.resize((768, 1024), Image.Resampling.BICUBIC)
            print(f"  CatVTON resize check: {catvton_garment.size} -> OK!")

        # 4. Verify catalog listing returns custom outfit at top
        from app.schemas.outfit import OutfitQueryFilter
        from app.schemas.pagination import PaginationParams

        paginated = service.list_active_outfits(
            filters=OutfitQueryFilter(),
            pagination=PaginationParams(page=1, page_size=10),
            current_user=user,
        )
        print(f"\nCatalog listing check: total={paginated.pagination.total} items")
        first_item = paginated.items[0]
        print(f"  Top outfit in catalog: {first_item.name} ({first_item.id})")
        assert first_item.id == custom_outfit.id, "Custom outfit should appear first due to sort_order=-1"
        print("  [PASS] Custom garment appears at top of catalog listing!")

        print("\n" + "=" * 60)
        print("ALL CUSTOM USER GARMENT CHECKS PASSED SUCCESSFULLY!")
        print("=" * 60)
        return True
    finally:
        session.close()


if __name__ == "__main__":
    success = run_test()
    sys.exit(0 if success else 1)
