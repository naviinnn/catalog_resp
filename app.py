# app.py

from flask import Flask, request, jsonify, render_template
import os
import sys
from datetime import date, datetime

# Add the project root to sys.path for proper imports
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)

from dto.catalog import Catalog
from service.catalog_service import CatalogService
from exception.catalog_exception import ValidationError, DataNotFoundError, DatabaseConnectionError
from utils.validation import validate_alphanumeric_string, validate_date, validate_status, validate_int

app = Flask(__name__)
# IMPORTANT: For production, load SECRET_KEY from an environment variable (e.g., os.environ.get('FLASK_SECRET_KEY')).
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'a_highly_secure_random_string_for_production_use_only_please_change_me')

catalog_service = CatalogService()

def api_error_response(message: str, status_code: int, details: Exception = None) -> tuple[jsonify, int]:
    """
    Generates a standardized JSON error response for API endpoints.

    Args:
        message (str): A user-friendly error message.
        status_code (int): The HTTP status code for the response (e.g., 400, 404, 500).
        details (Exception, optional): The actual exception object. Its string representation
                                       is included in 'details' for development debugging. Defaults to None.

    Returns:
        tuple: A tuple containing the JSON response and the HTTP status code.
    """
    error_payload = {'error': message}
    if details:
        error_payload['details'] = str(details)
    return jsonify(error_payload), status_code

def serialize_catalog_for_json(catalog_data: dict) -> dict:
    """
    Converts a database row (dictionary) into a JSON-serializable dictionary.
    Specifically handles `date` or `datetime` objects by formatting them as
    `YYYY-MM-DD` strings, which are not directly JSON serializable.

    Args:
        catalog_data (dict): A dictionary representing a catalog item.

    Returns:
        dict: A new dictionary with date/datetime objects formatted as strings. Returns None if input is None.
    """
    if not catalog_data:
        return None
    serialized_data = catalog_data.copy()
    for key in ['start_date', 'end_date']:
        if key in serialized_data:
            if isinstance(serialized_data[key], (date, datetime)):
                serialized_data[key] = serialized_data[key].strftime('%Y-%m-%d')
    return serialized_data

@app.route('/')
def index_page() -> str:
    """
    Renders the main single-page application (SPA) HTML template.
    """
    return render_template('index.html')

@app.route('/api/catalogs', methods=['GET'])
def get_all_catalogs_api() -> tuple[jsonify, int]:
    """
    API endpoint to retrieve all catalog entries.
    Supports an optional 'search' query parameter for filtering by name or description.

    Expected Query Parameters:
        - `search` (str, optional): A keyword to filter catalogs by `catalog_name` or `catalog_description`.

    Responses:
        - 200 OK: Returns a JSON array of catalog objects.
        - 500 Internal Server Error: For database connection issues or unexpected server errors.
    """
    search_term = request.args.get('search', '').strip()
    try:
        catalogs_data = catalog_service.get_all_catalog(search_term)
        serialized_catalogs = [serialize_catalog_for_json(c) for c in catalogs_data]
        return jsonify(serialized_catalogs), 200
    except DatabaseConnectionError as e:
        return api_error_response("Failed to connect to the database. Please try again later.", 500, e)
    except Exception as e:
        return api_error_response("An unexpected error occurred while fetching catalogs.", 500, e)

@app.route('/api/catalogs/<int:catalog_id>', methods=['GET'])
def get_catalog_by_id_api(catalog_id: int) -> tuple[jsonify, int]:
    """
    API endpoint to retrieve a single catalog by its unique ID.

    Path Parameters:
        - `catalog_id` (int): The ID of the catalog to retrieve.

    Responses:
        - 200 OK: Returns a JSON object of the requested catalog.
        - 404 Not Found: If no catalog with the given ID exists.
        - 500 Internal Server Error: For database connection issues or unexpected server errors.
    """
    try:
        catalog_data = catalog_service.get_catalog_by_id(catalog_id)
        serialized_catalog = serialize_catalog_for_json(catalog_data)
        return jsonify(serialized_catalog), 200
    except DataNotFoundError as e:
        return api_error_response(f"Catalog with ID {catalog_id} not found.", 404, e)
    except DatabaseConnectionError as e:
        return api_error_response("Failed to connect to the database. Please try again later.", 500, e)
    except Exception as e:
        return api_error_response(f"An unexpected error occurred while fetching catalog ID {catalog_id}.", 500, e)

@app.route('/api/catalogs', methods=['POST'])
def add_catalog_api() -> tuple[jsonify, int]:
    """
    API endpoint to create a new catalog entry.
    Expects catalog data as a JSON object in the request body.

    Request Body:
        - JSON object with keys: `name`, `description`, `start_date`, `end_date`, `status`.

    Responses:
        - 201 Created: Returns a success message and the ID of the newly created catalog.
        - 400 Bad Request: If request body is not valid JSON, or if validation of input data fails.
        - 500 Internal Server Error: For database issues or unexpected server errors.
    """
    data = request.get_json()
    if not data:
        return api_error_response("Invalid JSON data in request body.", 400)

    try:
        name = validate_alphanumeric_string(data.get('name'), "Name", max_length=30)
        description = validate_alphanumeric_string(data.get('description'), "Description", max_length=50)
        start_date = validate_date(data.get('start_date'))
        end_date = validate_date(data.get('end_date'))
        status = validate_status(data.get('status'))

        if datetime.strptime(start_date, '%Y-%m-%d') > datetime.strptime(end_date, '%Y-%m-%d'):
            raise ValidationError("End Date cannot be before Start Date.")

        new_catalog = Catalog(name=name, description=description,
                              start_date=start_date, end_date=end_date, status=status)
        
        catalog_id = catalog_service.create_catalog(new_catalog)
        return jsonify({'message': 'Catalog created successfully.', 'catalog_id': catalog_id}), 201
    except ValidationError as e:
        return api_error_response("Validation failed for catalog data.", 400, e)
    except DatabaseConnectionError as e:
        return api_error_response("Failed to connect to the database. Please try again later.", 500, e)
    except Exception as e:
        return api_error_response("An unexpected error occurred while creating the catalog.", 500, e)

@app.route('/api/catalogs/<int:catalog_id>', methods=['PUT'])
def update_catalog_api(catalog_id: int) -> tuple[jsonify, int]:
    """
    API endpoint to update an existing catalog entry by its ID.
    Expects updated catalog data as a JSON object in the request body.

    Path Parameters:
        - `catalog_id` (int): The ID of the catalog to update.

    Request Body:
        - JSON object with keys: `name`, `description`, `start_date`, `end_date`, `status`.

    Responses:
        - 200 OK: Returns a success message.
        - 400 Bad Request: If request body is invalid JSON, or if validation of input data fails.
        - 404 Not Found: If no catalog with the given ID exists for update.
        - 500 Internal Server Error: For database issues or unexpected server errors.
    """
    data = request.get_json()
    if not data:
        return api_error_response("Invalid JSON data in request body.", 400)

    try:
        name = validate_alphanumeric_string(data.get('name'), "Name", max_length=30)
        description = validate_alphanumeric_string(data.get('description'), "Description", max_length=50)
        start_date = validate_date(data.get('start_date'))
        end_date = validate_date(data.get('end_date'))
        status = validate_status(data.get('status'))

        if datetime.strptime(start_date, '%Y-%m-%d') > datetime.strptime(end_date, '%Y-%m-%d'):
            raise ValidationError("End Date cannot be before Start Date.")

        updated_catalog = Catalog(name=name, description=description,
                                  start_date=start_date, end_date=end_date, status=status)

        catalog_service.update_catalog_by_id(catalog_id, updated_catalog)
        return jsonify({'message': f'Catalog ID {catalog_id} updated successfully.'}), 200
    except ValidationError as e:
        return api_error_response("Validation failed for catalog data.", 400, e)
    except DataNotFoundError as e:
        return api_error_response(f"Catalog with ID {catalog_id} not found for update.", 404, e)
    except DatabaseConnectionError as e:
        return api_error_response("Failed to connect to the database. Please try again later.", 500, e)
    except Exception as e:
        return api_error_response(f"An unexpected error occurred while updating catalog ID {catalog_id}.", 500, e)

@app.route('/api/catalogs/<int:catalog_id>', methods=['DELETE'])
def delete_catalog_api(catalog_id: int) -> tuple[jsonify, int]:
    """
    API endpoint to delete a catalog entry by its ID.

    Path Parameters:
        - `catalog_id` (int): The ID of the catalog to delete.

    Responses:
        - 200 OK: Returns a success message.
        - 404 Not Found: If no catalog with the given ID exists for deletion.
        - 500 Internal Server Error: For database issues or unexpected server errors.
    """
    try:
        catalog_service.delete_catalog_by_id(catalog_id)
        return jsonify({'message': f'Catalog ID {catalog_id} deleted successfully.'}), 200
    except DataNotFoundError as e:
        return api_error_response(f"Catalog with ID {catalog_id} not found for deletion.", 404, e)
    except DatabaseConnectionError as e:
        return api_error_response("Failed to connect to the database. Please try again later.", 500, e)
    except Exception as e:
        return api_error_response(f"An unexpected error occurred while deleting catalog ID {catalog_id}.", 500, e)

@app.errorhandler(404)
def page_not_found(e) -> tuple[str, int]:
    """
    Custom error handler for 404 Not Found errors.
    Renders a dedicated 404.html template.
    """
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(e) -> tuple[str, int]:
    """
    Custom error handler for 500 Internal Server errors.
    Renders a dedicated 500.html template.
    """
    return render_template('500.html'), 500

if __name__ == '__main__':
    # Critical check: Ensure config.ini exists before running the Flask app.
    config_path_check = os.path.join(project_root, 'config', 'config.ini')
    if not os.path.exists(config_path_check):
        print(f"FATAL ERROR: Database configuration file not found at '{config_path_check}'.")
        print("Please ensure 'config.ini' exists in the 'config' directory and is properly configured.")
        sys.exit(1)

    app.run(debug=True)