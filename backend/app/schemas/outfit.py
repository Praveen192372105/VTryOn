from datetime import datetime
from typing import Optional
from pydantic import Field

from app.domain.enums import OutfitCategory
from app.schemas.common import BaseSchema


class OutfitResponse(BaseSchema):
    """
    Representation of an outfit catalogue product item.
    """
    id: str = Field(..., description="Public identifier of outfit (out_...)")
    name: str = Field(..., description="Name of the outfit garment")
    slug: str = Field(..., description="URL-safe unique slug identifier")
    category: OutfitCategory = Field(..., description="Garment category supported by CatVTON")
    description: Optional[str] = Field(default=None, description="Garment details and styling notes")
    image_url: str = Field(..., description="High-resolution garment image URL")
    thumbnail_url: Optional[str] = Field(default=None, description="Garment thumbnail URL")
    is_active: bool = Field(default=True, description="Whether the item is active in the catalogue")
    is_favorite: bool = Field(default=False, description="Whether the current user has favorited this item")
    is_favorited: bool = Field(default=False, description="Backward compatibility alias for is_favorite")
    created_at: datetime
    updated_at: Optional[datetime] = None


class OutfitListItem(BaseSchema):
    """
    Catalogue listing item for browsable collections.
    """
    id: str = Field(..., description="Public identifier of outfit (out_...)")
    name: str
    slug: str
    category: OutfitCategory
    image_url: str
    thumbnail_url: Optional[str] = None
    is_favorite: bool = False
    is_favorited: bool = False
    created_at: datetime


class OutfitQueryFilter(BaseSchema):
    """
    Query parameters for filtering catalogue outfits.
    """
    category: Optional[OutfitCategory] = Field(default=None, description="Filter by garment category")
    search: Optional[str] = Field(default=None, description="Search term across name and description")
    is_active: bool = Field(default=True, description="Only show active outfits")
