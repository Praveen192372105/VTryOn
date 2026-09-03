import os
import uuid


def generate_person_upload_key(user_id: str, extension: str = "jpg") -> str:
    """e.g. users/usr_01j.../uploads/up_abc123.jpg"""
    file_id = uuid.uuid4().hex[:16]
    return f"users/{user_id}/uploads/{file_id}.{extension.lstrip('.')}"


def generate_person_thumbnail_key(user_id: str, extension: str = "jpg") -> str:
    """e.g. users/usr_01j.../thumbnails/thumb_abc123.jpg"""
    file_id = uuid.uuid4().hex[:16]
    return f"users/{user_id}/thumbnails/thumb_{file_id}.{extension.lstrip('.')}"


def generate_outfit_image_key(category: str, slug: str, extension: str = "jpg") -> str:
    """e.g. outfits/upper_body/blue-denim-jacket.jpg"""
    return f"outfits/{category}/{slug}.{extension.lstrip('.')}"


def generate_outfit_thumbnail_key(category: str, slug: str, extension: str = "jpg") -> str:
    """e.g. outfits/{category}/thumbnails/{slug}_thumb.jpg"""
    return f"outfits/{category}/thumbnails/{slug}_thumb.{extension.lstrip('.')}"


def generate_tryon_result_key(job_id: str, extension: str = "png") -> str:
    """e.g. tryons/job_01j.../result.png"""
    return f"tryons/{job_id}/result.{extension.lstrip('.')}"


def generate_tryon_temp_dir(job_id: str) -> str:
    """Temporary working directory for CatVTON masks and intermediate files."""
    return f"tmp/tryons/{job_id}"
