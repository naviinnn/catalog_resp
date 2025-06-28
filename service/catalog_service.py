from utils.db_get_connection import get_connection
from dto.catalog import Catalog
from exception.catalog_exception import DataNotFoundError

class CatalogService:
    """Service layer for Catalog operations."""

    def create_catalog(self, catalog: Catalog) -> int:
        """Adds a new catalog entry to the database."""
        conn = get_connection()
        cursor = conn.cursor()
        try:
            # SQL statement updated to match your schema (VARCHAR lengths implied by Python validation)
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
        finally:
            cursor.close()
            conn.close()

    def get_catalog_by_id(self, catalog_id: int) -> dict:
        """Retrieves a single catalog entry by its ID."""
        conn = get_connection()
        cursor = conn.cursor(dictionary=True) # Fetch results as dictionaries
        try:
            cursor.execute("SELECT * FROM catalog WHERE catalog_id = %s", (catalog_id,))
            result = cursor.fetchone()
            if not result:
                raise DataNotFoundError(f"Catalog with ID {catalog_id} not found.")
            return result
        finally:
            cursor.close()
            conn.close()

    def get_all_catalog(self, search_term: str = '') -> list:
        """Retrieves all catalog entries, with optional search filtering."""
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = "SELECT * FROM catalog"
            params = ()
            if search_term:
                # Search by name or description (case-insensitive)
                query += " WHERE catalog_name LIKE %s OR catalog_description LIKE %s"
                params = (f"%{search_term}%", f"%{search_term}%")

            cursor.execute(query, params)
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    def update_catalog_by_id(self, catalog_id: int, catalog: Catalog) -> bool:
        """Updates an existing catalog entry identified by its ID."""
        conn = get_connection()
        cursor = conn.cursor()
        try:
            # SQL statement updated to match your schema (VARCHAR lengths implied by Python validation)
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
        finally:
            cursor.close()
            conn.close()

    def delete_catalog_by_id(self, catalog_id: int) -> bool:
        """Deletes a catalog entry by its ID."""
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM catalog WHERE catalog_id = %s", (catalog_id,))
            conn.commit()
            if cursor.rowcount == 0:
                raise DataNotFoundError(f"No catalog found with ID {catalog_id} to delete.")
            return True
        finally:
            cursor.close()
            conn.close()