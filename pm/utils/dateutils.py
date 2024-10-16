from datetime import UTC, datetime

__all__ = (
    'utcnow',
    'utcfromtimestamp',
)


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def utcfromtimestamp(timestamp: float) -> datetime:
    return datetime.fromtimestamp(timestamp, UTC).replace(tzinfo=None)
