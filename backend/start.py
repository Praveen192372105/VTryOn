#!/usr/bin/env python3
"""
V Try-On Backend Runtime Orchestrator
=====================================
Single-command launcher and supervisor for FastAPI and Celery GPU worker processes.
Provides automatic LAN IPv4 detection, connectivity endpoints for web, Android Emulator,
and physical devices, dependency preflight validation, and graceful shutdown handling.
"""

import argparse
import os
import signal
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple

# Ensure backend root is in sys.path
BACKEND_ROOT = Path(__file__).resolve().parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import get_settings  # noqa: E402
from app.utils.network import (  # noqa: E402
    ConnectivityInfo,
    get_connectivity_info,
    is_port_in_use,
)


@dataclass(frozen=True)
class LauncherConfig:
    host: str
    port: int
    reload: bool
    start_api: bool
    start_worker: bool
    info_only: bool


def parse_arguments(argv: Optional[List[str]] = None) -> LauncherConfig:
    """Parses command-line arguments for the backend runtime launcher."""
    settings = get_settings()

    parser = argparse.ArgumentParser(
        prog="python start.py",
        description="V Try-On Backend Runtime — Supervised FastAPI and Celery GPU Worker launcher.",
    )

    parser.add_argument(
        "--host",
        type=str,
        default=None,
        help=f"Bind host for FastAPI (default from config/env: {settings.API_HOST})",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=None,
        help=f"Bind port for FastAPI (default from config/env: {settings.API_PORT})",
    )

    reload_group = parser.add_mutually_exclusive_group()
    reload_group.add_argument(
        "--reload",
        dest="reload",
        action="store_true",
        default=None,
        help="Enable auto-reload on FastAPI code changes.",
    )
    reload_group.add_argument(
        "--no-reload",
        dest="reload",
        action="store_false",
        help="Disable auto-reload on FastAPI code changes (default).",
    )

    service_group = parser.add_mutually_exclusive_group()
    service_group.add_argument(
        "--api-only",
        action="store_true",
        help="Run only the FastAPI API server (disables Celery worker).",
    )
    service_group.add_argument(
        "--no-worker",
        action="store_true",
        help="Alias for --api-only.",
    )
    service_group.add_argument(
        "--worker-only",
        action="store_true",
        help="Run only the Celery Try-On worker (disables FastAPI server).",
    )

    parser.add_argument(
        "--info",
        action="store_true",
        help="Display configuration and detected network endpoints without starting services.",
    )

    args = parser.parse_args(argv)

    # Resolve host and port overrides
    host = args.host if args.host is not None else settings.API_HOST
    port = args.port if args.port is not None else settings.API_PORT

    # Resolve reload: CLI override > settings > False
    if args.reload is not None:
        reload_val = args.reload
    else:
        reload_val = bool(settings.API_RELOAD)

    api_only = args.api_only or args.no_worker
    worker_only = args.worker_only

    start_api = not worker_only
    start_worker = not api_only

    return LauncherConfig(
        host=host,
        port=port,
        reload=reload_val,
        start_api=start_api,
        start_worker=start_worker,
        info_only=args.info,
    )


def build_fastapi_cmd(host: str, port: int, reload: bool) -> List[str]:
    """Constructs the subprocess argument list for Uvicorn FastAPI."""
    cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        host,
        "--port",
        str(port),
    ]
    if reload:
        cmd.append("--reload")
    return cmd


def build_celery_cmd(
    queue: str = "gpu",
    concurrency: int = 1,
    log_level: str = "INFO",
) -> List[str]:
    """Constructs the subprocess argument list for Celery worker."""
    cmd = [
        sys.executable,
        "-m",
        "celery",
        "-A",
        "app.workers.celery_app.celery_app",
        "worker",
        "-Q",
        queue,
        "-c",
        str(concurrency),
        "--loglevel",
        log_level,
        "-n",
        "vtryon-gpu@%h",
    ]
    # On Windows, Celery requires solo execution pool to prevent POSIX fork errors
    if sys.platform == "win32":
        cmd.extend(["-P", "solo"])
    return cmd


def run_preflight_checks(config: LauncherConfig) -> Tuple[bool, List[str]]:
    """
    Validates infrastructure prerequisites (Redis, MySQL, Port availability)
    before launching child processes.
    """
    settings = get_settings()
    errors: List[str] = []

    # 1. Check Port Availability if FastAPI is requested
    if config.start_api:
        if is_port_in_use(config.host, config.port):
            errors.append(
                f"Port {config.port} is already in use on {config.host}. "
                f"Stop the existing process or use `python start.py --port <other-port>`."
            )

    # 2. Check Redis if Celery worker is requested
    if config.start_worker:
        try:
            import redis

            r = redis.Redis.from_url(settings.REDIS_URL, socket_timeout=2.0)
            r.ping()
        except Exception as exc:
            errors.append(
                f"Redis broker is unreachable at {settings.safe_redis_url} ({str(exc)}). "
                f"Start Redis and run `python start.py` again, or run `python start.py --api-only`."
            )

    # 3. Check MySQL Database
    try:
        from sqlalchemy import create_engine, text

        engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        msg = f"MySQL Database check failed at {settings.safe_database_url} ({str(exc)})."
        if config.start_api:
            errors.append(f"{msg} If using XAMPP/local MySQL, ensure the MySQL service is started.")

    # 4. Ensure Storage Directories Exist
    try:
        storage_path = settings.resolved_storage_root
        storage_path.mkdir(parents=True, exist_ok=True)
        (storage_path / "people").mkdir(parents=True, exist_ok=True)
        (storage_path / "outfits").mkdir(parents=True, exist_ok=True)
        (storage_path / "results").mkdir(parents=True, exist_ok=True)
        (storage_path / "tmp").mkdir(parents=True, exist_ok=True)
    except Exception as exc:
        errors.append(f"Storage root directory initialization failed: {str(exc)}")

    return len(errors) == 0, errors


def poll_fastapi_live(port: int, timeout_seconds: float = 30.0) -> bool:
    """Polls the local /api/v1/health/live endpoint until healthy or timeout."""
    import urllib.request

    url = f"http://127.0.0.1:{port}/api/v1/health/live"
    start_time = time.time()

    while time.time() - start_time < timeout_seconds:
        try:
            with urllib.request.urlopen(url, timeout=1.0) as response:
                if response.status == 200:
                    return True
        except Exception:
            pass
        time.sleep(0.5)

    return False


def terminate_process_tree(proc: subprocess.Popen, service_name: str, timeout: float = 5.0) -> None:
    """Terminates a child process and all its subprocesses cleanly."""
    if proc.poll() is not None:
        return

    print(f"Stopping {service_name} (PID {proc.pid})...")

    # Attempt psutil process tree termination if available
    try:
        import psutil

        parent = psutil.Process(proc.pid)
        children = parent.children(recursive=True)
        for child in children:
            child.terminate()
        parent.terminate()

        gone, alive = psutil.wait_procs(children + [parent], timeout=timeout)
        for p in alive:
            p.kill()
        return
    except Exception:
        pass

    # Standard library fallback
    try:
        proc.terminate()
        proc.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait()
    except Exception:
        pass


def print_banner(
    config: LauncherConfig,
    conn_info: ConnectivityInfo,
    api_status: str = "PENDING",
    worker_status: str = "PENDING",
) -> None:
    """Prints a clear, professional runtime summary banner to the terminal."""
    settings = get_settings()

    print("\n" + "=" * 70)
    print(" V Try-On Backend Development Runtime")
    print("=" * 70)

    print("\nEnvironment")
    print(f"  Mode                {settings.APP_ENV.value}")
    print(f"  Python              {sys.version.split()[0]} ({Path(sys.executable).name})")
    print(f"  API Bind            {config.host}:{config.port}")
    print(f"  Database            {settings.safe_database_url}")
    print(f"  Redis               {settings.safe_redis_url}")
    print(f"  GPU Queue           {settings.CELERY_GPU_QUEUE}")
    pool_name = "solo (Windows)" if sys.platform == "win32" else "prefork"
    print(f"  Worker Pool         {pool_name}")
    print(f"  Worker Concurrency  1")

    print("\nConnectivity")
    print(f"  Local API           {conn_info.local_url}")
    print(f"  Local Swagger       {conn_info.local_swagger_url}")
    print(f"  Android Emulator    {conn_info.emulator_url}")
    if conn_info.lan_urls:
        for lan_url in conn_info.lan_urls:
            print(f"  LAN API             {lan_url}")
        for lan_swagger in conn_info.lan_swagger_urls:
            print(f"  LAN Swagger         {lan_swagger}")
    else:
        print("  LAN API             (No secondary LAN IPv4 detected)")

    print("\nServices")
    if config.start_api:
        print(f"  FastAPI             {api_status}")
    else:
        print("  FastAPI             DISABLED (--worker-only)")

    if config.start_worker:
        print(f"  Celery Worker       {worker_status}")
    else:
        print("  Celery Worker       DISABLED (--api-only)")

    print("\nPress Ctrl+C to stop all services.")
    print("-" * 70 + "\n")


def main(argv: Optional[List[str]] = None) -> int:
    config = parse_arguments(argv)
    settings = get_settings()

    # Defensive GPU normalization for Windows environments
    cuda_visible = os.environ.get("CUDA_VISIBLE_DEVICES")
    if cuda_visible == "1" or not cuda_visible:
        os.environ["CUDA_VISIBLE_DEVICES"] = "0"

    conn_info = get_connectivity_info(
        bind_host=config.host,
        port=config.port,
        dev_lan_override=settings.DEV_LAN_HOST,
    )

    # Info mode: print connectivity details and exit
    if config.info_only:
        print_banner(config, conn_info, api_status="NOT STARTED", worker_status="NOT STARTED")
        return 0

    # 1. Preflight validation
    print("Running backend preflight checks...")
    ok, errors = run_preflight_checks(config)
    if not ok:
        print("\nPreflight check failed:")
        for err in errors:
            print(f"  [-] {err}")
        return 1

    print("Preflight checks passed.")

    # 2. Prepare child process handles
    api_proc: Optional[subprocess.Popen] = None
    worker_proc: Optional[subprocess.Popen] = None
    is_shutting_down = False

    def handle_shutdown(signum=None, frame=None):
        nonlocal is_shutting_down
        if is_shutting_down:
            return
        is_shutting_down = True
        print("\nStopping V Try-On backend...")
        if api_proc:
            terminate_process_tree(api_proc, "FastAPI")
        if worker_proc:
            terminate_process_tree(worker_proc, "Celery GPU Worker")
        print("Waiting for child processes to exit...")
        print("Backend stopped.")

    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)

    try:
        # 3. Start FastAPI
        if config.start_api:
            api_cmd = build_fastapi_cmd(config.host, config.port, config.reload)
            api_proc = subprocess.Popen(api_cmd, cwd=str(BACKEND_ROOT))

            # Poll for FastAPI liveness before proceeding
            live = poll_fastapi_live(config.port, timeout_seconds=30.0)
            if not live:
                print(f"[-] FastAPI failed to respond on port {config.port} within timeout.")
                handle_shutdown()
                return 1

        # 4. Start Celery GPU Worker
        if config.start_worker:
            worker_cmd = build_celery_cmd(
                queue=settings.CELERY_GPU_QUEUE,
                concurrency=1,
                log_level=settings.LOG_LEVEL,
            )
            worker_proc = subprocess.Popen(worker_cmd, cwd=str(BACKEND_ROOT))

            # Verify worker survives initial startup
            time.sleep(2.0)
            if worker_proc.poll() is not None:
                print(f"[-] Celery GPU worker exited unexpectedly with code {worker_proc.poll()}.")
                handle_shutdown()
                return 1

        # 5. Display banner with live status
        api_status = "READY (http://127.0.0.1:" + str(config.port) + ")" if config.start_api else "DISABLED"
        worker_status = f"RUNNING (queue: {settings.CELERY_GPU_QUEUE})" if config.start_worker else "DISABLED"
        print_banner(config, conn_info, api_status=api_status, worker_status=worker_status)

        # 6. Supervision loop
        while not is_shutting_down:
            time.sleep(0.5)

            if api_proc is not None:
                exit_code = api_proc.poll()
                if exit_code is not None:
                    print(f"\n[-] FastAPI process exited with code {exit_code}.")
                    handle_shutdown()
                    return exit_code if exit_code != 0 else 1

            if worker_proc is not None:
                exit_code = worker_proc.poll()
                if exit_code is not None:
                    print(f"\n[-] Celery GPU worker process exited with code {exit_code}.")
                    handle_shutdown()
                    return exit_code if exit_code != 0 else 1

    except KeyboardInterrupt:
        handle_shutdown()
        return 0
    except Exception as exc:
        print(f"\n[-] Launcher encountered unexpected error: {str(exc)}")
        handle_shutdown()
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
