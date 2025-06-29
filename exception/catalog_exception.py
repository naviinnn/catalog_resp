# exception/catalog_exception.py

class ValidationError(Exception):
    """
    Custom exception raised for input validation errors.
    Used when user input does not meet predefined criteria.
    """
    pass

class DatabaseConnectionError(Exception):
    """
    Custom exception raised for issues connecting to or interacting with the database.
    Abstracts underlying database driver errors for a cleaner service layer.
    """
    pass

class DataNotFoundError(Exception):
    """
    Custom exception raised when a requested data entity (e.g., a catalog by ID) is not found.
    """
    pass