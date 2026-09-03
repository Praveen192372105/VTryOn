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
