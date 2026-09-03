from datetime import datetime
from typing import Optional
from pydantic import EmailStr, Field

from app.schemas.common import BaseSchema


class UserProfileResponse(BaseSchema):
    """
    Public safe profile representation for the authenticated user.
    Strictly excludes internal database IDs, password hashes, and tokens.
    """
    id: str = Field(..., description="Public user identifier (usr_...)")
    name: str = Field(..., description="User full name")
    email: EmailStr = Field(..., description="Normalized user email address")
    created_at: datetime
    updated_at: Optional[datetime] = None
