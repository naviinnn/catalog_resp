class ValidationError(Exception):
    """ Custom exception raised for input validation errors. """
    pass

class DatabaseConnectionError(Exception):
    """ Custom exception raised for issues connecting to the database. """
    pass

class DataNotFoundError(Exception):
    """ Custom exception raised when a requested data entity is not found. """
    pass