import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path


# Project root directory
BASE_DIR = Path(__file__).resolve().parents[3]

# Directory for log files
LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

LOG_FILE = LOG_DIR / "app.log"


def setup_logging():

    log_format = (
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    )

    formatter = logging.Formatter(log_format)

    # Terminal handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    # File handler with rotation
    file_handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=5 * 1024 * 1024,
        backupCount=3,
        encoding="utf-8"
    )

    file_handler.setFormatter(formatter)

    # Configure the root logger
    logging.basicConfig(
        level=logging.INFO,
        handlers=[
            console_handler,
            file_handler
        ]
    )