import io
import sys
from pathlib import Path
from PIL import Image, ImageDraw

from app.core.config import settings
from app.core.constants import GarmentCategory
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.outfit import Outfit
from app.models.user import User
from app.repositories.outfit_repository import OutfitRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.storage.local import default_storage
from app.storage.paths import generate_outfit_image_key, generate_outfit_thumbnail_key
from app.utils.images import create_thumbnail


def create_demo_garment_image(text: str, color: tuple, size: tuple = (768, 1024)) -> bytes:
    """Generate a clean mock garment image for testing/development."""
    img = Image.new("RGB", size, color)
    draw = ImageDraw.Draw(img)
    # Simple aesthetic pattern
    draw.rectangle([60, 60, size[0] - 60, size[1] - 60], outline=(255, 255, 255), width=8)
    draw.text((size[0] // 4, size[1] // 2), text, fill=(255, 255, 255))

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def seed_database():
    """Create tables if not exist and seed initial demo outfits."""
    print("Ensuring database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        outfit_repo = OutfitRepository(db)
        if outfit_repo.count() > 0:
            print(f"Database already contains {outfit_repo.count()} outfits. Skipping seed.")
            return

        print("Seeding demo outfits catalogue...")
        demo_items = [
            {
                "name": "Classic Denim Jacket",
                "slug": "classic-denim-jacket",
                "category": GarmentCategory.UPPER_BODY.value,
                "description": "Timeless relaxed-fit blue denim jacket with contrast stitching.",
                "color": (50, 90, 150),
            },
            {
                "name": "Minimalist Linen Shirt",
                "slug": "minimalist-linen-shirt",
                "category": GarmentCategory.UPPER_BODY.value,
                "description": "Breathable off-white linen button-down shirt.",
                "color": (220, 215, 200),
            },
            {
                "name": "Urban Slim-Fit Chinos",
                "slug": "urban-slim-fit-chinos",
                "category": GarmentCategory.LOWER_BODY.value,
                "description": "Tailored khaki chinos in stretch cotton twill.",
                "color": (160, 130, 95),
            },
            {
                "name": "Wide-Leg Cargo Trousers",
                "slug": "wide-leg-cargo-trousers",
                "category": GarmentCategory.LOWER_BODY.value,
                "description": "Relaxed olive-green cargo pants with utility pockets.",
                "color": (75, 90, 65),
            },
            {
                "name": "Floral Summer Midi Dress",
                "slug": "floral-summer-midi-dress",
                "category": GarmentCategory.DRESSES.value,
                "description": "Lightweight floral print midi dress with a flowy A-line silhouette.",
                "color": (200, 100, 120),
            },
            {
                "name": "Silk Evening Slip Dress",
                "slug": "silk-evening-slip-dress",
                "category": GarmentCategory.DRESSES.value,
                "description": "Elegant emerald green slip dress crafted from lustrous silk satin.",
                "color": (25, 80, 60),
            },
        ]

        for item in demo_items:
            img_bytes = create_demo_garment_image(item["name"], item["color"])
            thumb_bytes = create_thumbnail(img_bytes)

            img_key = generate_outfit_image_key(item["category"], item["slug"], "jpg")
            thumb_key = generate_outfit_thumbnail_key(item["category"], item["slug"], "jpg")

            saved_img_key = default_storage.save(img_key, img_bytes, content_type="image/jpeg")
            saved_thumb_key = default_storage.save(thumb_key, thumb_bytes, content_type="image/jpeg")

            outfit = Outfit(
                name=item["name"],
                slug=item["slug"],
                category=item["category"],
                storage_key=saved_img_key,
                thumbnail_key=saved_thumb_key,
                description=item["description"],
                is_active=True,
            )
            outfit_repo.create(outfit)
            print(f"  + Seeded outfit: {item['name']} ({item['category']})")

        print("Seeding completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
