import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import redis
from sqlalchemy import text
from app.core.config import settings
from app.db.session import engine
from app.storage.local import default_storage


def run_healthcheck() -> int:
    print("=" * 60)
    print("V Try-On — Infrastructure Health Check")
    print("=" * 60)

    overall_ok = True

    # 1. Config Check
    print(f"[*] App Environment: {settings.APP_ENV.value}")
    print(f"[*] API Base URL:    {settings.API_V1_PREFIX}")

    # 2. Database Check
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("[+] MySQL Database:  HEALTHY (Connection verified)")
    except Exception as exc:
        print(f"[-] MySQL Database:  FAILED ({str(exc)})")
        overall_ok = False

    # 3. Redis Check
    try:
        r = redis.Redis.from_url(settings.REDIS_URL, socket_timeout=2.0)
        r.ping()
        print("[+] Redis Broker:    HEALTHY (PING OK)")
    except Exception as exc:
        print(f"[-] Redis Broker:    FAILED ({str(exc)})")
        overall_ok = False

    # 4. Storage Check
    try:
        root_dir = default_storage.root_dir
        if Path(root_dir).exists():
            print(f"[+] Storage Root:    HEALTHY ({root_dir})")
        else:
            print(f"[-] Storage Root:    FAILED (Directory {root_dir} missing)")
            overall_ok = False
    except Exception as exc:
        print(f"[-] Storage Root:    FAILED ({str(exc)})")
        overall_ok = False

    print("=" * 60)
    if overall_ok:
        print(">> ALL CORE INFRASTRUCTURE CHECKS PASSED")
        return 0
    else:
        print(">> SOME CHECKS FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(run_healthcheck())
