class ValidationError(Exception):
    """Custom exception for input validation errors."""
    pass

class DatabaseConnectionError(Exception):
    """Custom exception for database connection or interaction issues."""
    pass

class DataNotFoundError(Exception):
    """Custom exception when a requested data entity is not found."""
    pass