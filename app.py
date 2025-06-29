from flask import Flask, request, jsonify, render_template
import os
import sys
from datetime import date, datetime

# Add project root to sys.path for module imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dto.catalog import Catalog
from service.catalog_service import CatalogService
from exception.catalog_exception import ValidationError, DataNotFoundError, DatabaseConnectionError
from utils.validation import validate_alphanumeric_string, validate_date, validate_status, validate_int

app = Flask(__name__)
# Use an environment variable for secret key in production, fallback for development
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'dev_secret_key_please_change')

catalog_service = CatalogService()

def api_response(data: any = None, message: str = "Success", status_code: int = 200) -> tuple[jsonify, int]:
    """Centralized function for consistent API responses."""
    return jsonify({"message": message, "data": data}), status_code

def api_error_response(message: str, status_code: int, details: Exception = None) -> tuple[jsonify, int]:
    """Centralized function for consistent API error responses."""
    error_payload = {'error': message}
    if details:
        error_payload['details'] = str(details)
    return jsonify(error_payload), status_code

def serialize_catalog_for_json(catalog_data: dict) -> dict:
    """Converts catalog database row to JSON-serializable dictionary, formatting dates."""
    if not catalog_data:
        return None
    # Create a copy to modify without affecting original DB fetched dict
    serialized_data = catalog_data.copy()
    for key in ['start_date', 'end_date']:
        if key in serialized_data and isinstance(serialized_data[key], (date, datetime)):
            serialized_data[key] = serialized_data[key].strftime('%Y-%m-%d')
    return serialized_data

@app.route('/')
def index_page() -> str:
    """Renders the main single-page application (SPA) HTML template."""
    return render_template('index.html')

@app.route('/api/catalogs', methods=['GET'])
def get_all_catalogs_api() -> tuple[jsonify, int]:
    """API endpoint to retrieve all catalog entries with optional search."""
    search_term = request.args.get('search', '').strip()
    try:
        catalogs_data = catalog_service.get_all_catalog(search_term)
        serialized_catalogs = [serialize_catalog_for_json(c) for c in catalogs_data]
        return api_response(serialized_catalogs)
    except DatabaseConnectionError as e:
        return api_error_response("Failed to connect to the database. Please try again later.", 500, e)
    except Exception as e:
        return api_error_response("An unexpected error occurred while fetching catalogs.", 500, e)

@app.route('/api/catalogs/<int:catalog_id>', methods=['GET'])
def get_catalog_by_id_api(catalog_id: int) -> tuple[jsonify, int]:
    """API endpoint to retrieve a single catalog by ID."""
    try:
        catalog_data = catalog_service.get_catalog_by_id(catalog_id)
        serialized_catalog = serialize_catalog_for_json(catalog_data)
        return api_response(serialized_catalog)
    except DataNotFoundError as e:
        return api_error_response(str(e), 404, e)
    except DatabaseConnectionError as e:
        return api_error_response("Failed to connect to the database. Please try again later.", 500, e)
    except Exception as e:
        return api_error_response(f"An unexpected error occurred while fetching catalog ID {catalog_id}.", 500, e)

@app.route('/api/catalogs', methods=['POST'])
def add_catalog_api() -> tuple[jsonify, int]:
    """API endpoint to create a new catalog entry."""
    data = request.get_json()
    if not data:
        return api_error_response("Invalid JSON data in request body.", 400)

    try:
        # Input validation using utility functions
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
        return api_response({'catalog_id': catalog_id}, 'Catalog created successfully.', 201)
    except ValidationError as e:
        return api_error_response(str(e), 400, e)
    except DatabaseConnectionError as e:
        return api_error_response("Failed to connect to the database. Please try again later.", 500, e)
    except Exception as e:
        return api_error_response("An unexpected error occurred while creating the catalog.", 500, e)

@app.route('/api/catalogs/<int:catalog_id>', methods=['PUT'])
def update_catalog_api(catalog_id: int) -> tuple[jsonify, int]:
    """API endpoint to update an existing catalog entry by its ID."""
    data = request.get_json()
    if not data:
        return api_error_response("Invalid JSON data in request body.", 400)

    try:
        # Input validation using utility functions
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
        return api_response(message=f'Catalog ID {catalog_id} updated successfully.')
    except ValidationError as e:
        return api_error_response(str(e), 400, e)
    except DataNotFoundError as e:
        return api_error_response(str(e), 404, e)
    except DatabaseConnectionError as e:
        return api_error_response("Failed to connect to the database. Please try again later.", 500, e)
    except Exception as e:
        return api_error_response(f"An unexpected error occurred while updating catalog ID {catalog_id}.", 500, e)

@app.route('/api/catalogs/<int:catalog_id>', methods=['DELETE'])
def delete_catalog_api(catalog_id: int) -> tuple[jsonify, int]:
    """API endpoint to delete a catalog entry by its ID."""
    try:
        catalog_service.delete_catalog_by_id(catalog_id)
        return api_response(message=f'Catalog ID {catalog_id} deleted successfully.')
    except DataNotFoundError as e:
        return api_error_response(str(e), 404, e)
    except DatabaseConnectionError as e:
        return api_error_response("Failed to connect to the database.", 500, e)
    except Exception as e:
        return api_error_response(f"An unexpected error occurred during catalog deletion: {e}", 500)

@app.errorhandler(404)
def page_not_found(e) -> tuple[str, int]:
    """Custom error handler for 404 Not Found errors."""
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(e) -> tuple[str, int]:
    """Custom error handler for 500 Internal Server errors."""
    return render_template('500.html'), 500

if __name__ == '__main__':
    # Initial check for config file existence
    config_path_check = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config', 'config.ini')
    if not os.path.exists(config_path_check):
        print(f"FATAL ERROR: Database configuration file not found at '{config_path_check}'.")
        print("Please ensure 'config.ini' exists in the 'config' directory and is properly configured.")
        sys.exit(1)

    app.run(debug=True)