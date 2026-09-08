import argparse
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.core.redis import check_redis_connectivity
from app.workers.worker_heartbeat import get_active_workers


def check_python() -> tuple[bool, str]:
    ver = sys.version.split()[0]
    return True, f"Python {ver}"


def check_mysql() -> tuple[bool, str]:
    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            # Check Alembic revision
            try:
                res = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
                migration_info = f"Alembic: {res}" if res else "Alembic: uninitialized"
            except Exception:
                migration_info = "Alembic: no table"
        return True, f"Connected [Pool: size={settings.DB_POOL_SIZE}, max_overflow={settings.DB_MAX_OVERFLOW}] | {migration_info}"
    except Exception as exc:
        return False, f"Connection failed: {str(exc).splitlines()[0]}"


def check_redis() -> tuple[bool, str]:
    if check_redis_connectivity():
        active = get_active_workers()
        workers_info = f"Active Workers: {len(active)}" if active else "No active workers"
        return True, f"Connected to {settings.REDIS_URL} | {workers_info}"
    return False, f"Could not connect to {settings.REDIS_URL}"


def check_storage() -> tuple[bool, str]:
    try:
        if settings.STORAGE_BACKEND == "s3":
            return True, f"S3 backend: bucket='{settings.S3_BUCKET_NAME}' region='{settings.S3_REGION}'"
        else:
            storage_root = settings.resolved_storage_root
            storage_root.mkdir(parents=True, exist_ok=True)
            test_file = storage_root / ".doctor_test"
            test_file.write_text("ok")
            test_file.unlink()
            return True, f"Local disk writable at {storage_root}"
    except Exception as exc:
        return False, f"Storage error: {str(exc)}"


def check_catvton() -> tuple[bool, str]:
    catvton_root = settings.resolved_catvton_root
    if not catvton_root.exists():
        return False, f"CatVTON directory missing at {catvton_root}"
    try:
        import torch
        if not torch.cuda.is_available():
            return False, "CUDA GPU is NOT available for CatVTON inference"
        gpu_name = torch.cuda.get_device_name(0)
        vram = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
        return True, f"CatVTON engine verified on {gpu_name} ({vram:.1f} GB VRAM, {settings.CATVTON_DTYPE})"
    except Exception as exc:
        return False, f"CatVTON diagnostic error: {exc}"


def run_doctor():
    print("=" * 70)
    print("  V Try-On Backend Doctor -- Operational Diagnostics")
    print("=" * 70)

    checks = [
        ("Python Environment", check_python),
        ("MySQL Database", check_mysql),
        ("Redis & Workers", check_redis),
        ("Media Storage", check_storage),
        ("CatVTON AI Engine", check_catvton),
    ]

    all_passed = True
    for name, check_fn in checks:
        ok, msg = check_fn()
        plain_status = "[ OK ]" if ok else "[WARN]" if "Redis" in name or "MySQL" in name else "[FAIL]"
        dots = "." * (25 - len(name))
        print(f"{name} {dots} {plain_status}  {msg}")
        if not ok and name not in ("Redis & Workers", "MySQL Database"):
            all_passed = False

    print("=" * 70)
    if all_passed:
        print("System is operational and ready for workloads.")
    else:
        print("Some critical configurations require attention before running production traffic.")
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="V Try-On System Health Doctor")
    args = parser.parse_args()
    run_doctor()
