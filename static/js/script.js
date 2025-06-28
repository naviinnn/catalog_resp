document.addEventListener('DOMContentLoaded', () => {
    const createCatalogBtn = document.getElementById('createCatalogBtn');
    const catalogModal = document.getElementById('catalogModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const catalogForm = document.getElementById('catalogForm');
    const submitCatalogBtn = document.getElementById('submitCatalogBtn');
    const catalogTableBody = document.getElementById('catalogTableBody');
    const searchInput = document.getElementById('searchInput');
    const confirmModal = document.getElementById('confirmModal');
    const closeConfirmModalBtn = document.getElementById('closeConfirmModalBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const noCatalogsMessage = document.getElementById('noCatalogsMessage');
    const messageContainer = document.getElementById('message-container');

    let currentDeleteCatalogId = null;

    // --- Modal Control Functions ---
    const showModal = (modalElement) => {
        modalElement.classList.add('show');
        modalElement.setAttribute('aria-hidden', 'false');
    };

    const hideModal = (modalElement) => {
        modalElement.classList.remove('show');
        modalElement.setAttribute('aria-hidden', 'true');
    };

    const resetForm = () => {
        catalogForm.reset();
        document.getElementById('catalogId').value = '';
        submitCatalogBtn.textContent = 'Create Catalog';
        catalogModal.querySelector('h2').textContent = 'Create New Catalog';
        clearErrorMessages();
    };

    const clearErrorMessages = () => {
        document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
    };

    // --- Message Display Function ---
    const showMessage = (message, type = 'success') => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        messageContainer.appendChild(alertDiv);

        // Automatically remove message after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    };

    // --- Fetch Operations ---
    const fetchCatalogs = async (searchTerm = '') => {
        try {
            const url = searchTerm ? `/api/catalogs?search=${encodeURIComponent(searchTerm)}` : '/api/catalogs';
            const response = await fetch(url);
            const catalogs = await response.json();

            catalogTableBody.innerHTML = ''; // Clear existing rows

            if (response.ok && catalogs.length > 0) {
                noCatalogsMessage.style.display = 'none';
                catalogs.forEach(catalog => {
                    const row = catalogTableBody.insertRow();
                    row.setAttribute('data-id', catalog.catalog_id); // Store ID on the row

                    row.innerHTML = `
                        <td data-label="ID">${catalog.catalog_id}</td>
                        <td data-label="Name">${catalog.catalog_name}</td>
                        <td data-label="Description">${catalog.catalog_description}</td>
                        <td data-label="Start Date">${catalog.start_date}</td>
                        <td data-label="End Date">${catalog.end_date}</td>
                        <td data-label="Status">${catalog.status}</td>
                        <td class="actions">
                            <button class="btn-edit" data-id="${catalog.catalog_id}">Edit</button>
                            <button class="btn-danger" data-id="${catalog.catalog_id}">Delete</button>
                        </td>
                    `;
                });
            } else if (response.ok && catalogs.length === 0) {
                noCatalogsMessage.style.display = 'block';
            } else {
                // Handle API error message
                showMessage(catalogs.error || 'Failed to fetch catalogs.', 'error');
                noCatalogsMessage.style.display = 'block'; // Show "no catalogs" if fetch fails to load
            }
        } catch (error) {
            console.error('Error fetching catalogs:', error);
            showMessage('Network error: Could not connect to the server.', 'error');
            noCatalogsMessage.style.display = 'block'; // Show "no catalogs" if network fails
        }
    };

    const saveCatalog = async (catalogData, catalogId = null) => {
        const method = catalogId ? 'PUT' : 'POST';
        const url = catalogId ? `/api/catalogs/${catalogId}` : '/api/catalogs';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(catalogData),
            });
            const result = await response.json();

            if (response.ok) {
                showMessage(result.message, 'success');
                hideModal(catalogModal);
                resetForm();
                fetchCatalogs(searchInput.value); // Refresh list with current search term
            } else {
                // Display specific validation errors or general API errors
                if (response.status === 400 && result.details) {
                    const errorDetails = result.details;
                    if (errorDetails.includes("Name")) {
                        document.getElementById('catalogNameError').textContent = errorDetails;
                    } else if (errorDetails.includes("Description")) {
                        document.getElementById('catalogDescriptionError').textContent = errorDetails;
                    } else if (errorDetails.includes("Start Date")) {
                        document.getElementById('startDateError').textContent = errorDetails;
                    } else if (errorDetails.includes("End Date")) {
                        document.getElementById('endDateError').textContent = errorDetails;
                    } else if (errorDetails.includes("Status")) {
                        document.getElementById('statusError').textContent = errorDetails;
                    } else {
                        showMessage(result.error || 'Validation failed.', 'error');
                    }
                } else {
                    showMessage(result.error || `Failed to ${catalogId ? 'update' : 'create'} catalog.`, 'error');
                }
            }
        } catch (error) {
            console.error(`Error ${catalogId ? 'updating' : 'creating'} catalog:`, error);
            showMessage('Network error: Could not connect to the server.', 'error');
        }
    };

    const deleteCatalog = async (catalogId) => {
        try {
            const response = await fetch(`/api/catalogs/${catalogId}`, {
                method: 'DELETE',
            });
            const result = await response.json();

            if (response.ok) {
                showMessage(result.message, 'success');
                fetchCatalogs(searchInput.value); // Refresh list with current search term
            } else {
                showMessage(result.error || 'Failed to delete catalog.', 'error');
            }
        } catch (error) {
            console.error('Error deleting catalog:', error);
            showMessage('Network error: Could not connect to the server.', 'error');
        }
    };

    // --- Event Listeners ---

    // Open Create Catalog Modal
    createCatalogBtn.addEventListener('click', () => {
        resetForm();
        showModal(catalogModal);
    });

    // Close Modals
    closeModalBtn.addEventListener('click', () => hideModal(catalogModal));
    closeConfirmModalBtn.addEventListener('click', () => hideModal(confirmModal));
    window.addEventListener('click', (event) => {
        if (event.target == catalogModal) {
            hideModal(catalogModal);
        }
        if (event.target == confirmModal) {
            hideModal(confirmModal);
        }
    });

    // Handle Form Submission (Create/Edit)
    catalogForm.addEventListener('submit', (event) => {
        event.preventDefault();
        clearErrorMessages(); // Clear errors on new submission attempt

        const catalogId = document.getElementById('catalogId').value;
        const catalogName = document.getElementById('catalogName').value.trim();
        const catalogDescription = document.getElementById('catalogDescription').value.trim();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const status = document.getElementById('status').value;

        // Basic client-side validation (can be expanded)
        let isValid = true;
        if (!catalogName) {
            document.getElementById('catalogNameError').textContent = 'Name is required.';
            isValid = false;
        } else if (catalogName.length > 30) {
            document.getElementById('catalogNameError').textContent = 'Name cannot exceed 30 characters.';
            isValid = false;
        }
        if (!catalogDescription) {
            document.getElementById('catalogDescriptionError').textContent = 'Description is required.';
            isValid = false;
        } else if (catalogDescription.length > 50) {
            document.getElementById('catalogDescriptionError').textContent = 'Description cannot exceed 50 characters.';
            isValid = false;
        }
        if (!startDate) {
            document.getElementById('startDateError').textContent = 'Start Date is required.';
            isValid = false;
        }
        if (!endDate) {
            document.getElementById('endDateError').textContent = 'End Date is required.';
            isValid = false;
        } else if (startDate && new Date(endDate) < new Date(startDate)) {
            document.getElementById('endDateError').textContent = 'End Date cannot be before Start Date.';
            isValid = false;
        }
        if (!status) {
            document.getElementById('statusError').textContent = 'Status is required.';
            isValid = false;
        }

        if (isValid) {
            const catalogData = {
                name: catalogName,
                description: catalogDescription,
                start_date: startDate,
                end_date: endDate,
                status: status
            };
            saveCatalog(catalogData, catalogId || null);
        }
    });

    // Handle Edit/Delete Buttons via Event Delegation on Table Body
    catalogTableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-edit')) {
            const catalogId = event.target.dataset.id;
            try {
                const response = await fetch(`/api/catalogs/${catalogId}`);
                const catalog = await response.json();

                if (response.ok) {
                    document.getElementById('catalogId').value = catalog.catalog_id;
                    document.getElementById('catalogName').value = catalog.catalog_name;
                    document.getElementById('catalogDescription').value = catalog.catalog_description;
                    document.getElementById('startDate').value = catalog.start_date;
                    document.getElementById('endDate').value = catalog.end_date;
                    document.getElementById('status').value = catalog.status;

                    catalogModal.querySelector('h2').textContent = 'Edit Catalog';
                    submitCatalogBtn.textContent = 'Update Catalog';
                    showModal(catalogModal);
                } else {
                    showMessage(catalog.error || 'Failed to load catalog for editing.', 'error');
                }
            } catch (error) {
                console.error('Error fetching catalog for edit:', error);
                showMessage('Network error: Could not load catalog details.', 'error');
            }
        } else if (event.target.classList.contains('btn-danger')) {
            currentDeleteCatalogId = event.target.dataset.id;
            showModal(confirmModal);
        }
    });

    // Confirm Delete Action
    confirmDeleteBtn.addEventListener('click', () => {
        if (currentDeleteCatalogId) {
            deleteCatalog(currentDeleteCatalogId);
            hideModal(confirmModal);
            currentDeleteCatalogId = null;
        }
    });

    // Cancel Delete Action
    cancelDeleteBtn.addEventListener('click', () => {
        hideModal(confirmModal);
        currentDeleteCatalogId = null;
    });

    // Search functionality with debounce
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            fetchCatalogs(searchInput.value.trim());
        }, 300); // 300ms debounce
    });

    // Initial fetch of catalogs when the page loads
    fetchCatalogs();
});