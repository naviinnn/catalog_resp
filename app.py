from flask import Flask, request, jsonify, render_template
import os
import sys
from datetime import date, datetime # Import datetime for type checking

# Add the project root to sys.path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)

from dto.catalog import Catalog
from service.catalog_service import CatalogService
from exception.catalog_exception import ValidationError, DataNotFoundError, DatabaseConnectionError
# Import server-side validation functions
from utils.validation import validate_alphanumeric_string, validate_date, validate_status

app = Flask(__name__)
# IMPORTANT: Use a strong, unique, and securely managed secret key for production.
# This value should ideally be loaded from an environment variable (e.g., os.environ.get('FLASK_SECRET_KEY')).
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'a_highly_secure_random_string_for_production_use_only_please_change_me')

catalog_service = CatalogService()

def api_error_response(message: str, status_code: int, details: Exception = None):
    """Returns a standardized JSON error response for API endpoints."""
    error_payload = {'error': message}
    if details:
        # Include details for debugging in development, remove or log in production
        error_payload['details'] = str(details)
    return jsonify(error_payload), status_code

def serialize_catalog_for_json(catalog_data: dict) -> dict:
    """
    Converts a database row (dictionary) containing date or datetime objects
    into a JSON-serializable dictionary by formatting them as YYYY-MM-DD strings.
    """
    if not catalog_data:
        return None
    serialized_data = catalog_data.copy()
    for key in ['start_date', 'end_date']:
        if key in serialized_data:
            if isinstance(serialized_data[key], (date, datetime)): # Handles both date and datetime objects
                serialized_data[key] = serialized_data[key].strftime('%Y-%m-%d')
    return serialized_data

@app.route('/')
def index_page():
    """Renders the main single-page application (SPA) HTML."""
    return render_template('index.html')

@app.route('/api/catalogs', methods=['GET'])
def get_all_catalogs_api():
    """Retrieves all catalogs. Supports 'search' query parameter for filtering."""
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
def get_catalog_by_id_api(catalog_id: int):
    """Retrieves a single catalog by its ID."""
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
def add_catalog_api():
    """Creates a new catalog. Expects JSON data in the request body."""
    data = request.get_json()
    if not data:
        return api_error_response("Invalid JSON data in request body.", 400)

    try:
        # Pass max_length for name (30) and description (50) as per SQL schema
        name = validate_alphanumeric_string(data.get('name'), "Name", max_length=30)
        description = validate_alphanumeric_string(data.get('description'), "Description", max_length=50)
        start_date = validate_date(data.get('start_date'))
        end_date = validate_date(data.get('end_date'))
        status = validate_status(data.get('status'))

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
def update_catalog_api(catalog_id: int):
    """Updates an existing catalog by its ID. Expects JSON data in the request body."""
    data = request.get_json()
    if not data:
        return api_error_response("Invalid JSON data in request body.", 400)

    try:
        # Pass max_length for name (30) and description (50) as per SQL schema
        name = validate_alphanumeric_string(data.get('name'), "Name", max_length=30)
        description = validate_alphanumeric_string(data.get('description'), "Description", max_length=50)
        start_date = validate_date(data.get('start_date'))
        end_date = validate_date(data.get('end_date'))
        status = validate_status(data.get('status'))

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
def delete_catalog_api(catalog_id: int):
    """Deletes a catalog by its ID."""
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
def page_not_found(e):
    """Handles 404 Not Found errors."""
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(e):
    """Handles 500 Internal Server errors."""
    return render_template('500.html'), 500

if __name__ == '__main__':
    config_path_check = os.path.join(project_root, 'config', 'config.ini')
    if not os.path.exists(config_path_check):
        print(f"FATAL ERROR: Database configuration file not found at '{config_path_check}'.")
        print("Please ensure 'config.ini' exists in the 'config' directory and is properly configured.")
        sys.exit(1)

    # In a production environment, set debug=False and use a WSGI server like Gunicorn.
    app.run(debug=True)