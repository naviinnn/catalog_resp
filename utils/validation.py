from datetime import datetime
import re
from exception.catalog_exception import ValidationError

def validate_date(value: str) -> str:
    """Validates a date string from web input (YYYY-MM-DD format)."""
    if not value:
        raise ValidationError("Date cannot be empty.")
    try:
        # This will create a datetime object with time set to 00:00:00, suitable for DATETIME in MySQL
        date_obj = datetime.strptime(value, "%Y-%m-%d")
        today = datetime.today()
        # Ensure date is not in the past
        if date_obj.date() < today.date():
            raise ValidationError("Date cannot be in the past.")
        return value
    except ValueError:
        raise ValidationError("Invalid date format. Use YYYY-MM-DD.")

def validate_int(value: str) -> int:
    """Validates a string value as an integer for web input."""
    if not value:
        raise ValidationError("ID cannot be empty.")
    if not value.isdigit():
        raise ValidationError("Please enter a valid integer.")
    return int(value)

def validate_alphanumeric_string(value: str, field_name: str, max_length: int = None) -> str:
    """
    Validates an alphanumeric string from web input, allowing spaces and common punctuation.
    Includes an optional max_length check.
    """
    if not value:
        raise ValidationError(f"{field_name} cannot be empty.")
    # Regex allows letters, numbers, spaces, and common punctuation (.,!?-).
    if not re.match(r'^[A-Za-z0-9\s.,!?-]+$', value):
        raise ValidationError(f"{field_name} must contain only letters, numbers, spaces, and common punctuation.")
    if max_length and len(value) > max_length:
        raise ValidationError(f"{field_name} cannot exceed {max_length} characters.")
    return value.strip()

def validate_status(value: str) -> str:
    """Validates a status string from web input against a predefined list of allowed values."""
    allowed = ['active', 'inactive', 'upcoming', 'expired']
    if not value:
        raise ValidationError("Status cannot be empty.")
    value_lower = value.strip().lower()
    if value_lower not in allowed:
        raise ValidationError(f"Status must be one of: {', '.join(allowed)}.")
    return value_lower