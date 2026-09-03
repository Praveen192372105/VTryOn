import re
from enum import StrEnum
from typing import Optional
import ulid


class ResourcePrefix(StrEnum):
    USER = "usr"
    UPLOAD = "upl"
    OUTFIT = "out"
    TRYON_JOB = "job"
    TRYON_RESULT = "res"
    AUTH_SESSION = "ses"


# Strict regex pattern for public IDs: <prefix>_<26-character-base32-ulid>
PUBLIC_ID_REGEX = re.compile(r"^(usr|upl|out|job|res|ses)_[0-9a-hjkmnp-tv-z]{26}$", re.IGNORECASE)


def generate_public_id(prefix: ResourcePrefix) -> str:
    """
    Generate a standard lexicographically sortable, collision-resistant public ID.
    Format: `<prefix>_<ulid_lowercase>` (e.g. `usr_01j7q9...`, `job_01j7q9...`).
    """
    unique_ulid = str(ulid.ULID()).lower()
    return f"{prefix.value}_{unique_ulid}"


def validate_public_id(id_str: str, expected_prefix: Optional[ResourcePrefix] = None) -> bool:
    """
    Validate that a given string matches the standardized public ID format,
    and optionally matches the expected resource prefix.
    """
    if not isinstance(id_str, str) or not id_str:
        return False

    if not PUBLIC_ID_REGEX.match(id_str):
        return False

    if expected_prefix is not None:
        prefix_part = id_str.split("_")[0].lower()
        if prefix_part != expected_prefix.value:
            return False

    return True


def extract_prefix(id_str: str) -> Optional[ResourcePrefix]:
    """
    Extract and return the ResourcePrefix from a valid public ID, or None.
    """
    if not validate_public_id(id_str):
        return None
    prefix_str = id_str.split("_")[0].lower()
    for prefix in ResourcePrefix:
        if prefix.value == prefix_str:
            return prefix
    return None
