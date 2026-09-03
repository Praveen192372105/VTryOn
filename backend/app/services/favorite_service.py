import logging
from typing import Optional
from sqlalchemy.orm import Session

from app.core.exceptions import OutfitNotFoundError
from app.domain.enums import OutfitCategory
from app.domain.ownership import CurrentUser
from app.repositories.favorite_repository import FavoriteRepository
from app.repositories.outfit_repository import OutfitRepository
from app.schemas.favorite import FavoriteItemResponse, FavoriteToggleResponse
from app.schemas.outfit import OutfitListItem
from app.schemas.pagination import PaginatedData, PaginationParams, calculate_pagination
from app.storage.base import MediaStorage
from app.storage.local import default_storage

logger = logging.getLogger("vtryon.services.favorites")


class FavoriteService:
    """Service managing user outfit favorites, idempotency, and listing."""

    def __init__(self, db: Session, storage: Optional[MediaStorage] = None):
        self.db = db
        self.storage = storage or default_storage
        self.fav_repo = FavoriteRepository(db)
        self.outfit_repo = OutfitRepository(db)

    def _resolve_media_urls(self, image_key: str, thumb_key: Optional[str] = None) -> tuple[str, str]:
        img_url = self.storage.get_url(image_key)
        thumb_url = self.storage.get_url(thumb_key) if thumb_key else img_url
        return img_url, thumb_url

    def favorite_outfit(self, user: CurrentUser, outfit_id: str) -> FavoriteToggleResponse:
        """
        Idempotently add an outfit to user favorites.
        Requires outfit to exist and be active in the catalogue (404 if absent or inactive).
        """
        outfit = self.outfit_repo.get_active_by_public_id(outfit_id)
        if not outfit:
            raise OutfitNotFoundError(f"Outfit '{outfit_id}' was not found in the catalogue.")

        self.fav_repo.add(user_id=user.id, outfit_id=outfit.id)
        self.db.commit()

        logger.info(
            f"Outfit '{outfit_id}' favorited by user '{user.public_id}'",
            extra={"event": "favorite.add.completed", "outfit_id": outfit_id, "user_id": user.public_id},
        )

        return FavoriteToggleResponse(
            outfit_id=outfit.public_id,
            is_favorite=True,
            is_favorited=True,
            message="Outfit added to favorites.",
        )

    def unfavorite_outfit(self, user: CurrentUser, outfit_id: str) -> FavoriteToggleResponse:
        """
        Idempotently remove an outfit from user favorites.
        Allows removal even if outfit was deactivated, but requires outfit to exist.
        """
        outfit = self.outfit_repo.get_by_public_id(outfit_id)
        if not outfit:
            raise OutfitNotFoundError(f"Outfit '{outfit_id}' was not found.")

        self.fav_repo.remove(user_id=user.id, outfit_id=outfit.id)
        self.db.commit()

        logger.info(
            f"Outfit '{outfit_id}' unfavorited by user '{user.public_id}'",
            extra={"event": "favorite.remove.completed", "outfit_id": outfit_id, "user_id": user.public_id},
        )

        return FavoriteToggleResponse(
            outfit_id=outfit.public_id,
            is_favorite=False,
            is_favorited=False,
            message="Outfit removed from favorites.",
        )

    def list_favorites(
        self,
        user: CurrentUser,
        pagination: PaginationParams,
    ) -> PaginatedData[FavoriteItemResponse]:
        """
        List favorited outfits for authenticated user in newest-first order.
        Only returns active outfits.
        """
        favs, total = self.fav_repo.list_by_user_id(
            user_id=user.id,
            pagination=pagination,
        )

        items = []
        for f in favs:
            if f.outfit:
                img_url, thumb_url = self._resolve_media_urls(f.outfit.storage_key, f.outfit.thumbnail_storage_key)
                items.append(
                    FavoriteItemResponse(
                        outfit=OutfitListItem(
                            id=f.outfit.public_id,
                            name=f.outfit.name,
                            slug=f.outfit.slug,
                            category=OutfitCategory(f.outfit.category),
                            image_url=img_url,
                            thumbnail_url=thumb_url,
                            is_favorite=True,
                            is_favorited=True,
                            created_at=f.outfit.created_at,
                        ),
                        favorited_at=f.created_at,
                    )
                )

        meta = calculate_pagination(total=total, page=pagination.page, page_size=pagination.page_size)
        return PaginatedData(items=items, pagination=meta)
