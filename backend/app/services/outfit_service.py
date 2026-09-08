import logging
from typing import Optional
from sqlalchemy.orm import Session

from app.core.exceptions import OutfitNotFoundError
from app.domain.enums import OutfitCategory
from app.domain.ownership import CurrentUser
from app.repositories.favorite_repository import FavoriteRepository
from app.repositories.outfit_repository import OutfitRepository
from app.schemas.outfit import OutfitListItem, OutfitQueryFilter, OutfitResponse
from app.schemas.pagination import PaginatedData, PaginationParams, calculate_pagination
from app.storage.base import MediaStorage
from app.storage.local import default_storage

logger = logging.getLogger("vtryon.services.outfits")


class OutfitService:
    """Service managing catalogue outfit queries, media URL resolution, and favorite enrichment."""

    def __init__(self, db: Session, storage: Optional[MediaStorage] = None):
        self.db = db
        self.storage = storage or default_storage
        self.outfit_repo = OutfitRepository(db)
        self.fav_repo = FavoriteRepository(db)

    def _resolve_media_urls(self, image_key: str, thumb_key: Optional[str] = None) -> tuple[str, str]:
        """
        Safely resolve storage keys to delivery URLs.
        Falls back to primary image_url if thumbnail_key is absent.
        """
        img_url = self.storage.get_url(image_key)
        thumb_url = self.storage.get_url(thumb_key) if thumb_key else img_url
        return img_url, thumb_url

    def list_active_outfits(
        self,
        filters: OutfitQueryFilter,
        pagination: PaginationParams,
        current_user: Optional[CurrentUser] = None,
    ) -> PaginatedData[OutfitListItem]:
        """
        List active catalogue outfits with optional category filter.
        Enriches favorite state for authenticated user using a single batch query (0 N+1).
        """
        outfits, total = self.outfit_repo.list_active(
            category=filters.category,
            search=filters.search,
            pagination=pagination,
        )

        # Batch query favorite state to eliminate N+1 queries
        favorited_ids = set()
        if current_user and outfits:
            outfit_ids = [o.id for o in outfits]
            favorited_ids = self.fav_repo.get_favorited_outfit_ids(current_user.id, outfit_ids)

        items = []
        for o in outfits:
            is_fav = o.id in favorited_ids
            img_url, thumb_url = self._resolve_media_urls(o.storage_key, o.thumbnail_storage_key)

            items.append(
                OutfitListItem(
                    id=o.public_id,
                    name=o.name,
                    slug=o.slug,
                    category=OutfitCategory(o.category),
                    image_url=img_url,
                    thumbnail_url=thumb_url,
                    is_favorite=is_fav,
                    is_favorited=is_fav,
                    created_at=o.created_at,
                )
            )

        meta = calculate_pagination(total=total, page=pagination.page, page_size=pagination.page_size)
        return PaginatedData(items=items, pagination=meta)

    def get_active_outfit(
        self,
        outfit_id: str,
        current_user: Optional[CurrentUser] = None,
    ) -> OutfitResponse:
        """
        Retrieve active outfit detail by public ID.
        Returns 404 for missing or inactive outfits (non-disclosure of inactive lifecycle).
        """
        outfit = self.outfit_repo.get_active_by_public_id(outfit_id)
        if not outfit:
            raise OutfitNotFoundError(f"Outfit '{outfit_id}' was not found in the catalogue.")

        is_fav = False
        if current_user:
            is_fav = self.fav_repo.is_favorited(current_user.id, outfit.id)

        img_url, thumb_url = self._resolve_media_urls(outfit.storage_key, outfit.thumbnail_storage_key)

        return OutfitResponse(
            id=outfit.public_id,
            name=outfit.name,
            slug=outfit.slug,
            category=OutfitCategory(outfit.category),
            description=outfit.description,
            image_url=img_url,
            thumbnail_url=thumb_url,
            is_active=outfit.is_active,
            is_favorite=is_fav,
            is_favorited=is_fav,
            created_at=outfit.created_at,
            updated_at=outfit.updated_at,
        )

    def create_custom_outfit(
        self,
        user: CurrentUser,
        filename: str,
        content: bytes,
        mime_type: Optional[str] = None,
        name: Optional[str] = None,
        category: str = "upper_body",
    ) -> OutfitResponse:
        """
        Upload and register a custom garment from user for virtual try-on:
        1. Validate & normalize raw image (format verification, EXIF strip, RGB conversion, pixel limits).
        2. Generate server-controlled public ID and storage keys (primary + thumbnail).
        3. Atomically persist garment image and thumbnail to media storage.
        4. Insert Outfit row into MySQL with is_active=True and sort_order=-1 (top priority).
        """
        import io
        import re
        from pathlib import Path
        from PIL import Image
        from app.core.config import settings
        from app.domain.ids import ResourcePrefix, generate_public_id
        from app.utils.files import sanitize_filename
        from app.utils.images import normalize_person_image

        logger.info(
            f"Processing custom garment upload for user '{user.public_id}'",
            extra={"event": "outfit.custom.requested", "user_public_id": user.public_id},
        )

        clean_filename = sanitize_filename(filename)
        clean_name = (name or Path(clean_filename).stem.replace("_", " ").replace("-", " ")).strip().title()
        if not clean_name:
            clean_name = "Custom Garment"

        # Validate category
        valid_cats = {c.value: c for c in OutfitCategory}
        cat_enum = valid_cats.get(category.lower(), OutfitCategory.UPPER_BODY)

        # Normalize primary image
        normalized = normalize_person_image(
            content,
            min_width=settings.MIN_IMAGE_WIDTH,
            min_height=settings.MIN_IMAGE_HEIGHT,
            max_width=settings.MAX_IMAGE_WIDTH,
            max_height=settings.MAX_IMAGE_HEIGHT,
            max_pixels=settings.MAX_IMAGE_PIXELS,
        )

        # Generate thumbnail
        with Image.open(io.BytesIO(normalized.data)) as pil_img:
            thumb = pil_img.copy()
            thumb.thumbnail((384, 512), Image.Resampling.LANCZOS)
            thumb_io = io.BytesIO()
            thumb.save(thumb_io, format="JPEG", quality=85)
            thumb_bytes = thumb_io.getvalue()

        public_id = generate_public_id(ResourcePrefix.OUTFIT)
        clean_slug_base = re.sub(r"[^a-z0-9]+", "-", clean_name.lower()).strip("-")
        suffix = public_id.split("_")[-1][:8]
        slug = f"custom-{clean_slug_base}-{suffix}"

        image_key = f"outfits/custom/{user.public_id}/{public_id}.jpg"
        thumb_key = f"outfits/custom/{user.public_id}/{public_id}_thumb.jpg"

        # Save to storage
        self.storage.save(image_key, normalized.data, content_type="image/jpeg")
        self.storage.save(thumb_key, thumb_bytes, content_type="image/jpeg")

        try:
            outfit = self.outfit_repo.create(
                public_id=public_id,
                name=clean_name,
                slug=slug,
                category=cat_enum,
                storage_key=image_key,
                thumbnail_storage_key=thumb_key,
                description=f"Custom garment uploaded by user {user.public_id}",
                is_active=True,
                sort_order=-1,
            )
            self.db.commit()
            self.db.refresh(outfit)
        except Exception as exc:
            self.db.rollback()
            try:
                self.storage.delete(image_key)
                self.storage.delete(thumb_key)
            except Exception:
                pass
            raise exc

        img_url, thumb_url = self._resolve_media_urls(outfit.storage_key, outfit.thumbnail_storage_key)
        return OutfitResponse(
            id=outfit.public_id,
            name=outfit.name,
            slug=outfit.slug,
            category=OutfitCategory(outfit.category),
            description=outfit.description,
            image_url=img_url,
            thumbnail_url=thumb_url,
            is_active=outfit.is_active,
            is_favorite=False,
            is_favorited=False,
            created_at=outfit.created_at,
            updated_at=outfit.updated_at,
        )
