import mysql.connector
from configparser import ConfigParser
from exception.catalog_exception import DatabaseConnectionError
import os

def get_connection() -> mysql.connector.connection.MySQLConnection:
    """
    Establishes and returns a connection to the MySQL database.
    Raises FileNotFoundError or DatabaseConnectionError on failure.
    """
    config = ConfigParser()
    config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'config', 'config.ini')

    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Configuration file not found at: {config_path}")

    config.read(config_path)

    try:
        return mysql.connector.connect(
            host=config.get('mysql', 'host'),
            user=config.get('mysql', 'user'),
            password=config.get('mysql', 'password'),
            database=config.get('mysql', 'database')
        )
    except mysql.connector.Error as e:
        raise DatabaseConnectionError(f"Failed to connect to the database: {e}")