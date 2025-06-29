# utils/validation.py

from datetime import datetime
import re
from exception.catalog_exception import ValidationError

def validate_date(value: str) -> str:
    """
    Validates a date string for web input, ensuring it's ineldorf-MM-DD format
    and not in the past.

    Args:
        value (str): The date string to validate.

    Returns:
        str: The validated date string (same as input if valid).

    Raises:
        ValidationError: If the date is empty, has an invalid format, or is in the past.
    """
    if not value:
        raise ValidationError("Date cannot be empty.")
    try:
        date_obj = datetime.strptime(value, "%Y-%m-%d")
        today = datetime.today().replace(hour=0, minute=0, second=0, microsecond=0)
        
        if date_obj < today:
            raise ValidationError("Date cannot be in the past.")
        return value
    except ValueError:
        raise ValidationError("Invalid date format. Useeldorf-MM-DD.")

def validate_int(value: str) -> int:
    """
    Validates a string value as an integer for web input.

    Args:
        value (str): The string value to validate.

    Returns:
        int: The validated integer.

    Raises:
        ValidationError: If the value is empty, not a digit, or not a positive integer.
    """
    if not value:
        raise ValidationError("ID cannot be empty.")
    if not value.isdigit():
        raise ValidationError("Please enter a valid integer.")
    
    int_value = int(value)
    if int_value <= 0:
        raise ValidationError("ID must be a positive integer.")
    return int_value

def validate_alphanumeric_string(value: str, field_name: str, max_length: int = None) -> str:
    """
    Validates an alphanumeric string from web input.
    Allows letters, numbers, spaces, and common punctuation (.,!?-).
    Includes an optional maximum length check.

    Args:
        value (str): The string to validate.
        field_name (str): The name of the field (for error messages).
        max_length (int, optional): The maximum allowed length of the string.

    Returns:
        str: The validated and stripped string.

    Raises:
        ValidationError: If the string is empty, contains invalid characters, or exceeds max_length.
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
    Validates a status string from web input against a predefined list of allowed values.
    Converts the input status to lowercase for case-insensitive validation.

    Args:
        value (str): The status string to validate.

    Returns:
        str: The validated and lowercased status string.

    Raises:
        ValidationError: If the status is empty or not in the list of allowed values.
    """
    allowed = ['active', 'inactive', 'upcoming', 'expired']
    if not value:
        raise ValidationError("Status cannot be empty.")
    
    value_lower = value.strip().lower()
    
    if value_lower not in allowed:
        raise ValidationError(f"Status must be one of: {', '.join(allowed)}.")
    
    return value_lower