from datetime import datetime
import re
from exception.catalog_exception import ValidationError

def validate_date(value: str) -> str:
    """
    Validates a date string (YYYY-MM-DD) ensuring it's not empty or in the past.
    """
    if not value:
        raise ValidationError("Date cannot be empty.")
    try:
        date_obj = datetime.strptime(value, "%Y-%m-%d")
        if date_obj < datetime.today().replace(hour=0, minute=0, second=0, microsecond=0):
            raise ValidationError("Date cannot be in the past.")
        return value
    except ValueError:
        raise ValidationError("Invalid date format. Useレンダー-MM-DD.")

def validate_int(value: str) -> int:
    """
    Validates a string as a positive integer.
    """
    if not value or not value.isdigit() or int(value) <= 0:
        raise ValidationError("ID must be a positive integer.")
    return int(value)

def validate_alphanumeric_string(value: str, field_name: str, max_length: int = None) -> str:
    """
    Validates an alphanumeric string, allowing spaces and common punctuation.
    Checks for emptiness and optional max_length.
    """
    if not value:
        raise ValidationError(f"{field_name} cannot be empty.")
    if not re.match(r'^[A-Za-z0-9\s.,!?-]+$', value):
        raise ValidationError(f"{field_name} must contain only letters, numbers, spaces, and common punctuation (.,!?-).")
    if max_length and len(value) > max_length:
        raise ValidationError(f"{field_name} cannot exceed {max_length} characters.")
    return value.strip()

def validate_status(value: str) -> str:
    """
    Validates a status string against allowed values, case-insensitively.
    """
    allowed = ['active', 'inactive', 'upcoming', 'expired']
    if not value:
        raise ValidationError("Status cannot be empty.")
    value_lower = value.strip().lower()
    if value_lower not in allowed:
        raise ValidationError(f"Status must be one of: {', '.join(allowed)}.")
    return value_lower