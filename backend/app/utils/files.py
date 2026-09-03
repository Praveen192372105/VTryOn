import hashlib
import re
from pathlib import Path
from typing import Optional
from fastapi import UploadFile

from app.core.exceptions import EmptyUploadError, ImageTooLargeError


def compute_sha256(data: bytes) -> str:
    """Compute the SHA-256 hexadecimal hash of bytes."""
    return hashlib.sha256(data).hexdigest()


def get_file_extension(filename: str) -> str:
    """Extract lowercase file extension from filename."""
    if not filename or "." not in filename:
        return ""
    return filename.rsplit(".", 1)[-1].lower().strip()


def sanitize_filename(filename: Optional[str], max_length: int = 255) -> str:
    """
    Sanitize an untrusted user-supplied filename.
    1. Strips directory traversal fragments (e.g. ../../secret.jpg -> secret.jpg).
    2. Strips control characters, NUL bytes, and newline injection characters.
    3. Normalizes whitespace and bounds length while preserving extension.
    4. Falls back to a safe default if the result is empty.
    """
    if not filename:
        return "upload.jpg"

    # Extract base filename to eliminate directory traversal
    base_name = Path(filename).name

    # Remove dangerous characters: NUL, CR, LF, path separators, quotes
    clean_name = re.sub(r'[\x00-\x1f\x7f\\/:"*?<>|]+', "", base_name)
    clean_name = clean_name.strip(" .")

    if not clean_name:
        return "upload.jpg"

    if len(clean_name) > max_length:
        if "." in clean_name:
            stem, ext = clean_name.rsplit(".", 1)
            ext_part = f".{ext}"
            allowed_stem_len = max(1, max_length - len(ext_part))
            clean_name = f"{stem[:allowed_stem_len]}{ext_part}"
        else:
            clean_name = clean_name[:max_length]

    return clean_name or "upload.jpg"


async def read_upload_limited(
    upload: UploadFile,
    *,
    max_bytes: int,
    chunk_size: int = 64 * 1024,
) -> bytes:
    """
    Read UploadFile in bounded chunks to protect against memory exhaustion.
    Rejects uploads exceeding max_bytes with ImageTooLargeError (413).
    Rejects 0-byte uploads with EmptyUploadError (422).
    """
    # Early content-length check if provided by client headers
    if upload.size is not None and upload.size > max_bytes:
        raise ImageTooLargeError(
            f"Uploaded file size ({upload.size} bytes) exceeds maximum limit of {max_bytes} bytes."
        )

    buffer = bytearray()
    total_bytes = 0

    while True:
        chunk = await upload.read(chunk_size)
        if not chunk:
            break

        total_bytes += len(chunk)
        if total_bytes > max_bytes:
            raise ImageTooLargeError(
                f"Uploaded file exceeds maximum limit of {max_bytes} bytes."
            )
        buffer.extend(chunk)

    if total_bytes == 0:
        raise EmptyUploadError("Uploaded image file is empty (0 bytes).")

    return bytes(buffer)
