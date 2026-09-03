from typing import List, Set, Tuple
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.db.models.favorite import Favorite
from app.db.models.outfit import Outfit
from app.schemas.pagination import PaginationParams
from app.utils.time import utc_now


class FavoriteRepository:
    """Repository managing user outfit favorites."""

    def __init__(self, db: Session):
        self.db = db

    def is_favorited(self, user_id: int, outfit_id: int) -> bool:
        """Check if a specific outfit is favorited by the user."""
        stmt = (
            select(func.count())
            .select_from(Favorite)
            .where(
                Favorite.user_id == user_id,
                Favorite.outfit_id == outfit_id,
            )
        )
        return (self.db.scalar(stmt) or 0) > 0

    exists = is_favorited

    def get_favorited_outfit_ids(self, user_id: int, outfit_ids: List[int]) -> Set[int]:
        """
        Batch query to retrieve all favorited outfit IDs for a given user.
        Executes exactly 1 bounded query to completely eliminate N+1 loops.
        """
        if not outfit_ids:
            return set()

        stmt = select(Favorite.outfit_id).where(
            Favorite.user_id == user_id,
            Favorite.outfit_id.in_(outfit_ids),
        )
        return set(self.db.execute(stmt).scalars().all())

    def add(self, user_id: int, outfit_id: int) -> bool:
        """
        Idempotently add an outfit to favorites.
        Handles duplicate key constraints cleanly without leaving the session corrupted.
        """
        if self.is_favorited(user_id, outfit_id):
            return True

        fav = Favorite(
            user_id=user_id,
            outfit_id=outfit_id,
            created_at=utc_now(),
        )
        self.db.add(fav)
        try:
            self.db.flush()
            return True
        except IntegrityError:
            self.db.rollback()
            return True

    def remove(self, user_id: int, outfit_id: int) -> bool:
        """
        Idempotently remove an outfit from favorites.
        Returns True if a row was deleted, False if already absent.
        """
        fav = self.db.execute(
            select(Favorite).where(
                Favorite.user_id == user_id,
                Favorite.outfit_id == outfit_id,
            )
        ).scalar_one_or_none()

        if fav:
            self.db.delete(fav)
            self.db.flush()
            return True
        return False

    def list_by_user_id(
        self,
        user_id: int,
        pagination: PaginationParams,
    ) -> Tuple[List[Favorite], int]:
        """
        List user's favorites joining only active catalogue outfits.
        Orders newest favorite first with deterministic tie-breaker:
        created_at DESC, outfit_id DESC.
        """
        count_stmt = (
            select(func.count(Favorite.outfit_id))
            .join(Outfit, Favorite.outfit_id == Outfit.id)
            .where(
                Favorite.user_id == user_id,
                Outfit.is_active == True,
            )
        )
        total = self.db.scalar(count_stmt) or 0

        query = (
            select(Favorite)
            .join(Outfit, Favorite.outfit_id == Outfit.id)
            .options(joinedload(Favorite.outfit))
            .where(
                Favorite.user_id == user_id,
                Outfit.is_active == True,
            )
            .order_by(Favorite.created_at.desc(), Favorite.outfit_id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        items = list(self.db.execute(query).scalars().all())
        return items, total

    list_for_user = list_by_user_id
