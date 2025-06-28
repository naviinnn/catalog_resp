class Catalog:
    def __init__(self, name: str, description: str, start_date: str, end_date: str, status: str, catalog_id: int = None):
        self.catalog_id = catalog_id
        self.name = name
        self.description = description
        self.start_date = start_date
        self.end_date = end_date
        self.status = status

    def to_dict(self):
        """Converts the Catalog object to a dictionary, suitable for JSON serialization."""
        return {
            'catalog_id': self.catalog_id,
            'catalog_name': self.name,
            'catalog_description': self.description,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'status': self.status
        }