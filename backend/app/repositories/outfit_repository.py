from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.domain.enums import OutfitCategory
from app.domain.ids import ResourcePrefix, generate_public_id
from app.db.models.outfit import Outfit
from app.schemas.pagination import PaginationParams
from app.utils.time import utc_now


class OutfitRepository:
    """Repository managing catalogue Outfit persistence and queries."""

    def __init__(self, db: Session):
        self.db = db

    def count(self) -> int:
        """Count total outfits in catalogue."""
        return self.db.scalar(select(func.count(Outfit.id))) or 0

    def get_by_id(self, outfit_id: int) -> Optional[Outfit]:
        """Lookup outfit by internal primary key."""
        return self.db.execute(
            select(Outfit).where(Outfit.id == outfit_id)
        ).scalar_one_or_none()

    def get_by_public_id(self, public_id: str) -> Optional[Outfit]:
        """Lookup outfit by public ID regardless of active status (for worker/historical jobs)."""
        return self.db.execute(
            select(Outfit).where(Outfit.public_id == public_id)
        ).scalar_one_or_none()

    def get_active_by_public_id(self, public_id: str) -> Optional[Outfit]:
        """Lookup active outfit by public ID for public user-facing interactions."""
        return self.db.execute(
            select(Outfit).where(
                Outfit.public_id == public_id,
                Outfit.is_active == True,
            )
        ).scalar_one_or_none()

    def get_by_slug(self, slug: str) -> Optional[Outfit]:
        """Lookup outfit by unique slug."""
        return self.db.execute(
            select(Outfit).where(Outfit.slug == slug)
        ).scalar_one_or_none()

    def list_active(
        self,
        category: Optional[OutfitCategory] = None,
        search: Optional[str] = None,
        pagination: Optional[PaginationParams] = None,
    ) -> Tuple[List[Outfit], int]:
        """
        List active catalogue outfits with optional category and search filters.
        Enforces stable deterministic ordering: sort_order ASC, created_at DESC, id ASC.
        """
        count_stmt = select(func.count(Outfit.id)).where(Outfit.is_active == True)
        if category:
            cat_val = category.value if hasattr(category, "value") else str(category)
            count_stmt = count_stmt.where(Outfit.category == cat_val)
        if search:
            search_pattern = f"%{search.strip()}%"
            count_stmt = count_stmt.where(Outfit.name.ilike(search_pattern))

        total = self.db.scalar(count_stmt) or 0

        query = select(Outfit).where(Outfit.is_active == True)
        if category:
            cat_val = category.value if hasattr(category, "value") else str(category)
            query = query.where(Outfit.category == cat_val)
        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.where(Outfit.name.ilike(search_pattern))

        query = query.order_by(
            Outfit.sort_order.asc(),
            Outfit.created_at.desc(),
            Outfit.id.asc(),
        )

        if pagination:
            query = query.offset(pagination.offset).limit(pagination.limit)

        items = list(self.db.execute(query).scalars().all())
        return items, total

    def create(
        self,
        name: str,
        slug: str,
        category: OutfitCategory,
        storage_key: str,
        description: Optional[str] = None,
        thumbnail_storage_key: Optional[str] = None,
        is_active: bool = True,
        sort_order: int = 0,
        public_id: Optional[str] = None,
    ) -> Outfit:
        """Create and flush a new catalogue Outfit record."""
        cat_val = category.value if hasattr(category, "value") else str(category)
        outfit = Outfit(
            public_id=public_id or generate_public_id(ResourcePrefix.OUTFIT),
            name=name.strip(),
            slug=slug.strip(),
            category=cat_val,
            image_storage_key=storage_key,
            thumbnail_storage_key=thumbnail_storage_key,
            description=description.strip() if description else None,
            is_active=is_active,
            sort_order=sort_order,
            created_at=utc_now(),
        )
        self.db.add(outfit)
        self.db.flush()
        return outfit

    def upsert_seed_outfit(
        self,
        public_id: str,
        name: str,
        slug: str,
        category: OutfitCategory,
        storage_key: str,
        description: Optional[str] = None,
        thumbnail_storage_key: Optional[str] = None,
        is_active: bool = True,
        sort_order: int = 0,
    ) -> Tuple[Outfit, bool, bool]:
        """
        Idempotently upsert a catalogue outfit from seed manifest.
        Returns (outfit, was_created, was_updated).
        """
        existing = self.get_by_public_id(public_id) or self.get_by_slug(slug)
        cat_val = category.value if hasattr(category, "value") else str(category)

        if existing:
            # Check for mutations
            mutated = False
            if existing.name != name.strip():
                existing.name = name.strip()
                mutated = True
            if existing.category != cat_val:
                existing.category = cat_val
                mutated = True
            if existing.image_storage_key != storage_key:
                existing.image_storage_key = storage_key
                mutated = True
            if existing.thumbnail_storage_key != thumbnail_storage_key:
                existing.thumbnail_storage_key = thumbnail_storage_key
                mutated = True
            if existing.description != (description.strip() if description else None):
                existing.description = description.strip() if description else None
                mutated = True
            if existing.is_active != is_active:
                existing.is_active = is_active
                mutated = True
            if existing.sort_order != sort_order:
                existing.sort_order = sort_order
                mutated = True

            if mutated:
                existing.updated_at = utc_now()
                self.db.flush()
            return existing, False, mutated

        new_outfit = self.create(
            name=name,
            slug=slug,
            category=category,
            storage_key=storage_key,
            description=description,
            thumbnail_storage_key=thumbnail_storage_key,
            is_active=is_active,
            sort_order=sort_order,
            public_id=public_id,
        )
        return new_outfit, True, False
