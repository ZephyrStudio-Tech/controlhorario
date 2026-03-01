from datetime import datetime
import pytz

MADRID_TZ = pytz.timezone("Europe/Madrid")


def utc_to_madrid(dt: datetime) -> datetime:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)
    return dt.astimezone(MADRID_TZ)


def format_duration_hhmm(total_seconds: float) -> str:
    """Format seconds into HH:MM string."""
    total_seconds = max(0, int(total_seconds))
    hours, remainder = divmod(total_seconds, 3600)
    minutes = remainder // 60
    return f"{hours:02d}:{minutes:02d}"
