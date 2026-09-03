import sys
from datetime import timedelta
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import func, select

from app.db.models.tryon import TryOnJob
from app.db.session import SessionLocal
from app.domain.enums import TryOnJobStatus
from app.utils.time import utc_now


def main():
    print("=" * 65)
    print("  Virtual Try-On Jobs & State Diagnostics (Jobs Doctor)")
    print("=" * 65)

    with SessionLocal() as db:
        now = utc_now()
        stale_threshold = now - timedelta(minutes=10)

        # 1. Total Count by Status
        status_counts = {}
        for status in TryOnJobStatus:
            count = db.scalar(
                select(func.count(TryOnJob.id)).where(TryOnJob.status == status.value)
            ) or 0
            status_counts[status.value] = count

        print(f"Total QUEUED Jobs ........: {status_counts.get(TryOnJobStatus.QUEUED.value, 0)}")
        print(f"Total PROCESSING Jobs ....: {status_counts.get(TryOnJobStatus.PROCESSING.value, 0)}")
        print(f"Total SUCCEEDED Jobs .....: {status_counts.get(TryOnJobStatus.SUCCEEDED.value, 0)}")
        print(f"Total FAILED Jobs ........: {status_counts.get(TryOnJobStatus.FAILED.value, 0)}")

        # 2. Inspect Stale Active Jobs (> 10 minutes)
        stale_queued = list(
            db.execute(
                select(TryOnJob)
                .where(
                    TryOnJob.status == TryOnJobStatus.QUEUED.value,
                    TryOnJob.queued_at < stale_threshold,
                )
            ).scalars().all()
        )

        stale_processing = list(
            db.execute(
                select(TryOnJob)
                .where(
                    TryOnJob.status == TryOnJobStatus.PROCESSING.value,
                    TryOnJob.started_at < stale_threshold,
                )
            ).scalars().all()
        )

        print("-" * 65)
        print(f"Stale QUEUED (>10m) ......: {len(stale_queued)}")
        for job in stale_queued[:5]:
            print(f"  - [QUEUED] {job.public_id} (queued_at: {job.queued_at})")

        print(f"Stale PROCESSING (>10m) ..: {len(stale_processing)}")
        for job in stale_processing[:5]:
            print(f"  - [PROCESSING] {job.public_id} (started_at: {job.started_at})")

        # 3. Recent Failures
        recent_failed = list(
            db.execute(
                select(TryOnJob)
                .where(TryOnJob.status == TryOnJobStatus.FAILED.value)
                .order_by(TryOnJob.finished_at.desc())
                .limit(5)
            ).scalars().all()
        )
        print("-" * 65)
        print(f"Recent FAILED Jobs (up to 5):")
        for job in recent_failed:
            print(f"  - {job.public_id}: code={job.error_code}, msg={job.error_message}")

    print("=" * 65)
    print(">> Inspection complete (read-only diagnostic).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
