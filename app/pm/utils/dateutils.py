from datetime import UTC, datetime
from typing import NamedTuple, Self

__all__ = (
    'DurationSegmentsT',
    'timestamp_from_utc',
    'utcfromtimestamp',
    'utcnow',
)


class DurationSegmentsT(NamedTuple):
    weeks: int
    days: int
    hours: int
    minutes: int
    seconds: int

    def total_seconds(self) -> int:
        return (
            self.weeks * 7 * 24 * 3600
            + self.days * 24 * 3600
            + self.hours * 3600
            + self.minutes * 60
            + self.seconds
        )

    @classmethod
    def from_total_seconds(cls, total_seconds: int) -> Self:
        minutes, seconds = divmod(total_seconds, 60)
        hours, minutes = divmod(minutes, 60)
        days, hours = divmod(hours, 24)
        weeks, days = divmod(days, 7)
        return DurationSegmentsT(weeks, days, hours, minutes, seconds)


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def utcfromtimestamp(timestamp: float) -> datetime:
    return datetime.fromtimestamp(timestamp, UTC).replace(tzinfo=None)


def timestamp_from_utc(dt: datetime) -> float:
    return dt.replace(tzinfo=UTC).timestamp()
