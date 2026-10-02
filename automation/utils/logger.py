"""
Centralized Logging Utility for Selenium Automation Framework.
Provides formatted timestamps, console output, and dual file persistence.
"""

import logging
import sys
from pathlib import Path
from automation.config.env_config import LOGS_DIR, LOCAL_LOGS_DIR

LOGGER_NAME = "VTryOn_Automation"

def get_logger(name: str = LOGGER_NAME) -> logging.Logger:
    """Return a configured logger with console and file handlers."""
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)-8s] [%(filename)s:%(lineno)d] - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # Master Execution Log File
    execution_log_path = LOGS_DIR / "execution.log"
    file_handler = logging.FileHandler(str(execution_log_path), encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    # Local Automation Log File
    local_log_path = LOCAL_LOGS_DIR / "automation.log"
    local_handler = logging.FileHandler(str(local_log_path), encoding="utf-8")
    local_handler.setLevel(logging.DEBUG)
    local_handler.setFormatter(formatter)
    logger.addHandler(local_handler)

    return logger

# Module-level instance
log = get_logger()
