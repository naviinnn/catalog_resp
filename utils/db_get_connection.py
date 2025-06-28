import mysql.connector
from configparser import ConfigParser
from exception.catalog_exception import DatabaseConnectionError
import os

def get_connection():
    """Establishes and returns a connection to the MySQL database."""
    config = ConfigParser()
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    config_path = os.path.join(project_root, 'config', 'config.ini')

    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Configuration file not found at: {config_path}.")

    config.read(config_path)

    try:
        return mysql.connector.connect(
            host=config.get('mysql', 'host'),
            user=config.get('mysql', 'user'),
            password=config.get('mysql', 'password'),
            database=config.get('mysql', 'database')
        )
    except mysql.connector.Error as e:
        raise DatabaseConnectionError(f"Failed to connect to the database: {e}.")