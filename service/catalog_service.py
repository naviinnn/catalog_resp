# service/catalog_service.py

import mysql.connector
from utils.db_get_connection import get_connection
from dto.catalog import Catalog
from exception.catalog_exception import DataNotFoundError, DatabaseConnectionError

class CatalogService:
    """
    Service layer for Catalog operations.

    This class encapsulates the business logic related to catalogs,
    interacting with the database and handling specific data operations.
    It abstracts direct database access from the API layer.
    """

    def create_catalog(self, catalog: Catalog) -> int:
        """
        Adds a new catalog entry to the database.

        Args:
            catalog (Catalog): The Catalog DTO object containing data for the new catalog.

        Returns:
            int: The ID of the newly created catalog.

        Raises:
            DatabaseConnectionError: If there's an issue with the database connection or query execution.
            Exception: For other unexpected errors during the operation.
        """
        conn = None
        cursor = None
        try:
            conn = get_connection()
            cursor = conn.cursor()
            query = """
                INSERT INTO catalog (catalog_name, catalog_description, start_date, end_date, status)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(query, (
                catalog.name, catalog.description,
                catalog.start_date, catalog.end_date,
                catalog.status
            ))
            conn.commit()
            catalog_id = cursor.lastrowid
            return catalog_id
        except mysql.connector.Error as e:
            if conn:
                conn.rollback()
            raise DatabaseConnectionError(f"Database error during catalog creation: {e}")
        except Exception as e:
            raise Exception(f"An unexpected error occurred during catalog creation: {e}")
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def get_catalog_by_id(self, catalog_id: int) -> dict:
        """
        Retrieves a single catalog entry by its ID.

        Args:
            catalog_id (int): The unique ID of the catalog to retrieve.

        Returns:
            dict: A dictionary representing the catalog entry if found.

        Raises:
            DataNotFoundError: If no catalog with the given ID is found in the database.
            DatabaseConnectionError: If there's an issue with the database connection or query execution.
            Exception: For other unexpected errors.
        """
        conn = None
        cursor = None
        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM catalog WHERE catalog_id = %s", (catalog_id,))
            result = cursor.fetchone()
            if not result:
                raise DataNotFoundError(f"Catalog with ID {catalog_id} not found.")
            return result
        except mysql.connector.Error as e:
            raise DatabaseConnectionError(f"Database error during catalog retrieval by ID: {e}")
        except Exception as e:
            raise Exception(f"An unexpected error occurred during catalog retrieval by ID: {e}")
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def get_all_catalog(self, search_term: str = '') -> list:
        """
        Retrieves all catalog entries, with optional filtering by a search term.
        The search applies to catalog name or description.

        Args:
            search_term (str, optional): A string to filter catalogs by name or description.
                                         Defaults to '' (no filter, retrieves all).

        Returns:
            list: A list of dictionaries, each representing a catalog entry.

        Raises:
            DatabaseConnectionError: If there's an issue with the database connection or query execution.
            Exception: For other unexpected errors.
        """
        conn = None
        cursor = None
        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)
            query = "SELECT * FROM catalog"
            params = ()
            if search_term:
                query += " WHERE catalog_name LIKE %s OR catalog_description LIKE %s"
                params = (f"%{search_term}%", f"%{search_term}%")

            cursor.execute(query, params)
            return cursor.fetchall()
        except mysql.connector.Error as e:
            raise DatabaseConnectionError(f"Database error during all catalog retrieval: {e}")
        except Exception as e:
            raise Exception(f"An unexpected error occurred during all catalog retrieval: {e}")
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def update_catalog_by_id(self, catalog_id: int, catalog: Catalog) -> bool:
        """
        Updates an existing catalog entry identified by its ID.

        Args:
            catalog_id (int): The unique ID of the catalog to update.
            catalog (Catalog): The Catalog DTO object containing the updated information.

        Returns:
            bool: True if the update was successful.

        Raises:
            DataNotFoundError: If no catalog with the given ID is found to update.
            DatabaseConnectionError: If there's an issue with the database connection or query execution.
            Exception: For other unexpected errors.
        """
        conn = None
        cursor = None
        try:
            conn = get_connection()
            cursor = conn.cursor()
            query = """
                UPDATE catalog
                SET catalog_name = %s, catalog_description = %s,
                    start_date = %s, end_date = %s, status = %s
                WHERE catalog_id = %s
            """
            cursor.execute(query, (
                catalog.name, catalog.description,
                catalog.start_date, catalog.end_date,
                catalog.status, catalog_id
            ))
            conn.commit()
            if cursor.rowcount == 0:
                raise DataNotFoundError(f"No catalog found with ID {catalog_id} to update.")
            return True
        except mysql.connector.Error as e:
            if conn:
                conn.rollback()
            raise DatabaseConnectionError(f"Database error during catalog update: {e}")
        except Exception as e:
            raise Exception(f"An unexpected error occurred during catalog update: {e}")
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def delete_catalog_by_id(self, catalog_id: int) -> bool:
        """
        Deletes a catalog entry by its ID.

        Args:
            catalog_id (int): The unique ID of the catalog to delete.

        Returns:
            bool: True if the deletion was successful.

        Raises:
            DataNotFoundError: If no catalog with the given ID is found to delete.
            DatabaseConnectionError: If there's an issue with the database connection or query execution.
            Exception: For other unexpected errors.
        """
        conn = None
        cursor = None
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("DELETE FROM catalog WHERE catalog_id = %s", (catalog_id,))
            conn.commit()
            if cursor.rowcount == 0:
                raise DataNotFoundError(f"Catalog with ID {catalog_id} not found for deletion.")
            return True
        except mysql.connector.Error as e:
            if conn:
                conn.rollback()
            raise DatabaseConnectionError(f"Database error during catalog deletion: {e}")
        except Exception as e:
            raise Exception(f"An unexpected error occurred during catalog deletion: {e}")
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()