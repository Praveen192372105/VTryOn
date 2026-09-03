import argparse
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from sqlalchemy import select, update

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.models.tryon import TryOnJob
from app.db.session import SessionLocal
from app.domain.enums import FailureCode, TryOnJobStatus
from app.utils.time import utc_now


def reconcile_jobs(
    processing_threshold_minutes: int = 10,
    queued_threshold_minutes: int = 30,
    mark_failed: bool = False,
):
    print("=" * 70)
    print("  V Try-On Job Reconciler -- Stale Job Diagnostic & Recovery Tool")
    print("=" * 70)

    now = utc_now()
    processing_cutoff = now - timedelta(minutes=processing_threshold_minutes)
    queued_cutoff = now - timedelta(minutes=queued_threshold_minutes)

    with SessionLocal() as db:
        # 1. Find stale PROCESSING jobs
        stale_processing_stmt = (
            select(TryOnJob)
            .where(
                TryOnJob.status == TryOnJobStatus.PROCESSING.value,
                TryOnJob.started_at < processing_cutoff,
            )
            .order_by(TryOnJob.started_at.asc())
        )
        stale_processing = db.scalars(stale_processing_stmt).all()

        # 2. Find stale QUEUED jobs
        stale_queued_stmt = (
            select(TryOnJob)
            .where(
                TryOnJob.status == TryOnJobStatus.QUEUED.value,
                TryOnJob.queued_at < queued_cutoff,
            )
            .order_by(TryOnJob.queued_at.asc())
        )
        stale_queued = db.scalars(stale_queued_stmt).all()

        print(f"Stale PROCESSING jobs (> {processing_threshold_minutes}m): {len(stale_processing)}")
        for job in stale_processing:
            duration_m = round((now - (job.started_at or now)).total_seconds() / 60, 1)
            print(f"  - [{job.public_id}] started {duration_m}m ago (task_id: {job.celery_task_id})")

        print(f"\nStale QUEUED jobs (> {queued_threshold_minutes}m): {len(stale_queued)}")
        for job in stale_queued:
            duration_m = round((now - (job.queued_at or now)).total_seconds() / 60, 1)
            print(f"  - [{job.public_id}] queued {duration_m}m ago")

        if not mark_failed:
            print("\n[Dry Run Mode] No changes made to database. Use --mark-failed to reconcile.")
            print("=" * 70)
            return

        print("\nReconciling stale jobs...")
        updated_count = 0

        # Mark stale processing jobs as failed
        for job in stale_processing:
            job.status = TryOnJobStatus.FAILED.value
            job.error_code = "WORKER_LOST"
            job.error_message = (
                f"Worker lost: processing exceeded threshold of {processing_threshold_minutes} minutes."
            )
            job.finished_at = now
            job.updated_at = now
            updated_count += 1

        # Mark stale queued jobs as failed
        for job in stale_queued:
            job.status = TryOnJobStatus.FAILED.value
            job.error_code = "QUEUE_TIMEOUT"
            job.error_message = (
                f"Queue timeout: job queued longer than {queued_threshold_minutes} minutes."
            )
            job.finished_at = now
            job.updated_at = now
            updated_count += 1

        db.commit()
        print(f"Successfully marked {updated_count} stale jobs as FAILED in MySQL.")
        print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reconcile stale virtual try-on jobs")
    parser.add_argument(
        "--processing-threshold-minutes",
        type=int,
        default=10,
        help="Minutes after which a PROCESSING job is considered stale (default: 10)",
    )
    parser.add_argument(
        "--queued-threshold-minutes",
        type=int,
        default=30,
        help="Minutes after which a QUEUED job is considered stale (default: 30)",
    )
    parser.add_argument(
        "--mark-failed",
        action="store_true",
        help="Apply updates to database marking stale jobs FAILED",
    )
    args = parser.parse_args()
    reconcile_jobs(
        processing_threshold_minutes=args.processing_threshold_minutes,
        queued_threshold_minutes=args.queued_threshold_minutes,
        mark_failed=args.mark_failed,
    )
