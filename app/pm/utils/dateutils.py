from datetime import UTC, datetime

__all__ = (
    'utcnow',
    'utcfromtimestamp',
    'timestamp_from_utc',
)


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def utcfromtimestamp(timestamp: float) -> datetime:
    return datetime.fromtimestamp(timestamp, UTC).replace(tzinfo=None)


def timestamp_from_utc(dt: datetime) -> float:
    return dt.replace(tzinfo=UTC).timestamp()
