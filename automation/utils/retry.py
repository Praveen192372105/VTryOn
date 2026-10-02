"""
Retry Logic Utility for Flaky / Transient Web Interactions.
"""

import time
import functools
from typing import Callable, Any
from automation.utils.logger import log

def retry(max_attempts: int = 2, delay_seconds: float = 1.0, exceptions=(Exception,)):
    """
    Decorator to retry a test step or method upon transient failure.
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    log.warning(
                        f"Attempt {attempt}/{max_attempts} failed for '{func.__name__}': {e}. "
                        f"Retrying in {delay_seconds}s..."
                    )
                    time.sleep(delay_seconds)
            log.error(f"All {max_attempts} attempts failed for '{func.__name__}'.")
            raise last_exception
        return wrapper
    return decorator
