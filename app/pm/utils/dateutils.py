from datetime import UTC, datetime

__all__ = (
    'timestamp_from_utc',
    'utcfromtimestamp',
    'utcnow',
)


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def utcfromtimestamp(timestamp: float) -> datetime:
    return datetime.fromtimestamp(timestamp, UTC).replace(tzinfo=None)


def timestamp_from_utc(dt: datetime) -> float:
    return dt.replace(tzinfo=UTC).timestamp()
