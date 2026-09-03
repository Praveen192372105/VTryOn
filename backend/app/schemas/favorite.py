from datetime import datetime
from typing import Optional
from pydantic import Field

from app.schemas.common import BaseSchema
from app.schemas.outfit import OutfitListItem


class FavoriteItemResponse(BaseSchema):
    """
    Representation of an outfit saved in user favorites.
    """
    outfit: OutfitListItem = Field(..., description="Favorited outfit catalogue item")
    favorited_at: datetime = Field(..., description="Timestamp when the item was favorited")


class FavoriteToggleResponse(BaseSchema):
    """
    Idempotent favorite action response.
    """
    outfit_id: str = Field(..., description="Outfit public ID")
    is_favorite: bool = Field(default=True, description="Current favorite state after operation")
    is_favorited: bool = Field(default=True, description="Backward compatibility alias for is_favorite")
    message: Optional[str] = Field(default=None, description="Human-readable result status")
