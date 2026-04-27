import logging
from contextvars import ContextVar


request_id_context: ContextVar[str | None] = ContextVar("request_id", default=None)


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_context.get() or "-"
        return True


def configure_logging() -> None:
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    for handler in root_logger.handlers:
        handler.addFilter(RequestIdFilter())
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s %(levelname)s [request_id=%(request_id)s] %(name)s: %(message)s"
            )
        )


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)

    for handler in logger.handlers:
        handler.addFilter(RequestIdFilter())

    return logger
