// static/js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const createCatalogBtn = document.getElementById('createCatalogBtn');
    const viewAllCatalogsBtn = document.getElementById('viewAllCatalogsBtn');
    const updateByIdBtn = document.getElementById('updateByIdBtn');
    const deleteByIdBtn = document.getElementById('deleteByIdBtn');
    const viewByIdBtn = document.getElementById('viewByIdBtn');

    const catalogModal = document.getElementById('catalogModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const catalogForm = document.getElementById('catalogForm');
    const submitCatalogBtn = document.getElementById('submitCatalogBtn');
    const catalogTableBody = document.getElementById('catalogTableBody');

    const confirmModal = document.getElementById('confirmModal');
    const closeConfirmModalBtn = document.getElementById('closeConfirmModalBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmMessage = document.getElementById('confirmMessage');

    const inputByIdModal = document.getElementById('inputByIdModal');
    const closeInputByIdModalBtn = document.getElementById('closeInputByIdModalBtn');
    const inputByIdForm = document.getElementById('inputByIdForm');
    const actionByIdTitle = document.getElementById('actionByIdTitle');
    const inputCatalogId = document.getElementById('inputCatalogId');
    const inputByIdError = document.getElementById('inputByIdError');
    const actionByIdSubmitBtn = document.getElementById('actionByIdSubmitBtn');

    const noCatalogsMessage = document.getElementById('noCatalogsMessage');
    const messageContainer = document.getElementById('message-container');

    // --- State Variables ---
    let currentDeleteCatalogId = null;
    let currentActionType = null;

    // --- Utility Functions for Modals ---

    /**
     * Displays a given modal element.
     * @param {HTMLElement} modalElement - The DOM element representing the modal to show.
     */
    const showModal = (modalElement) => {
        modalElement.classList.add('show');
        modalElement.setAttribute('aria-hidden', 'false');
    };

    /**
     * Hides a given modal element.
     * @param {HTMLElement} modalElement - The DOM element representing the modal to hide.
     */
    const hideModal = (modalElement) => {
        modalElement.classList.remove('show');
        modalElement.setAttribute('aria-hidden', 'true');
    };

    /**
     * Resets the main catalog form to its initial state.
     */
    const resetForm = () => {
        catalogForm.reset();
        document.getElementById('catalogId').value = '';
        submitCatalogBtn.textContent = 'Create Catalog';
        catalogModal.querySelector('h2').textContent = 'Create New Catalog';
        clearErrorMessages();
    };

    /**
     * Clears all validation error messages displayed in the forms.
     */
    const clearErrorMessages = () => {
        document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
        inputByIdError.textContent = '';
    };

    /**
     * Displays a temporary success or error message to the user.
     * @param {string} message - The text content of the message to display.
     * @param {string} type - The type of message ('success' or 'error').
     */
    const showMessage = (message, type = 'success') => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        messageContainer.innerHTML = '';
        messageContainer.appendChild(alertDiv);
    };

    // --- API Interaction Functions (using Fetch API) ---

    /**
     * Fetches a list of catalogs from the backend API.
     * @param {string} searchTerm - The search keyword to filter catalogs.
     */
    const fetchCatalogs = async (searchTerm = '') => {
        try {
            const url = searchTerm ? `/api/catalogs?search=${encodeURIComponent(searchTerm)}` : '/api/catalogs';
            const response = await fetch(url);
            const catalogs = await response.json();

            catalogTableBody.innerHTML = '';

            if (response.ok && Array.isArray(catalogs) && catalogs.length > 0) {
                noCatalogsMessage.style.display = 'none';
                catalogs.forEach(catalog => {
                    const row = catalogTableBody.insertRow();
                    row.setAttribute('data-id', catalog.catalog_id);

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
            } else if (response.ok && Array.isArray(catalogs) && catalogs.length === 0) {
                noCatalogsMessage.style.display = 'block';
            } else {
                showMessage(catalogs.error || 'Failed to fetch catalogs. Please try again.', 'error');
                noCatalogsMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error fetching catalogs:', error);
            showMessage('Network error: Could not connect to the server. Please check your connection.', 'error');
            noCatalogsMessage.style.display = 'block';
        }
    };

    /**
     * Fetches a single catalog by its ID and populates the main catalog form for editing.
     * @param {number} catalogId - The ID of the catalog to fetch for editing.
     */
    const fetchCatalogAndPopulateForm = async (catalogId) => {
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
                
                hideModal(inputByIdModal);
                showModal(catalogModal);
            } else {
                showMessage(catalog.error || 'Failed to load catalog for editing.', 'error');
                hideModal(inputByIdModal);
            }
        } catch (error) {
            console.error('Error fetching catalog for edit:', error);
            showMessage('Network error: Could not load catalog details. Please try again.', 'error');
            hideModal(inputByIdModal);
        }
    };

    /**
     * Fetches a single catalog by its ID and displays only that catalog in the table.
     * @param {number} catalogId - The ID of the catalog to fetch and display.
     */
    const fetchCatalogAndDisplay = async (catalogId) => {
        try {
            const response = await fetch(`/api/catalogs/${catalogId}`);
            const catalog = await response.json();

            catalogTableBody.innerHTML = '';

            if (response.ok && catalog) {
                noCatalogsMessage.style.display = 'none';
                const row = catalogTableBody.insertRow();
                row.setAttribute('data-id', catalog.catalog_id);
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
                showMessage(`Catalog ID ${catalogId} found and displayed.`, 'success');
            } else if (!response.ok && response.status === 404) {
                noCatalogsMessage.style.display = 'block';
                showMessage(`Catalog with ID ${catalogId} not found.`, 'error');
            } else {
                noCatalogsMessage.style.display = 'block';
                showMessage(catalog.error || `Failed to fetch catalog with ID ${catalogId}.`, 'error');
            }
            hideModal(inputByIdModal);
        } catch (error) {
            console.error(`Error fetching catalog ID ${catalogId}:`, error);
            showMessage('Network error: Could not connect to the server. Please try again.', 'error');
            noCatalogsMessage.style.display = 'block';
            hideModal(inputByIdModal);
        }
    };

    /**
     * Sends a request to the backend API to create a new catalog or update an existing one.
     * @param {object} catalogData - The data of the catalog to save.
     * @param {number|null} catalogId - The ID of the catalog if updating, or null if creating.
     */
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
                fetchCatalogs('');
            } else {
                if (response.status === 400 && result.details) {
                    const errorDetails = result.details;
                    if (errorDetails.includes("Name")) {
                        document.getElementById('catalogNameError').textContent = errorDetails;
                    } else if (errorDetails.includes("Description")) {
                        document.getElementById('catalogDescriptionError').textContent = errorDetails;
                    } else if (errorDetails.includes("Date cannot be empty") || errorDetails.includes("Invalid date format") || errorDetails.includes("Date cannot be in the past") || errorDetails.includes("End Date cannot be before Start Date")) {
                        if (errorDetails.includes("Start Date")) {
                            document.getElementById('startDateError').textContent = errorDetails;
                        } else if (errorDetails.includes("End Date")) {
                             document.getElementById('endDateError').textContent = errorDetails;
                        } else {
                            document.getElementById('startDateError').textContent = errorDetails;
                            document.getElementById('endDateError').textContent = errorDetails;
                        }
                    } else if (errorDetails.includes("Status")) {
                        document.getElementById('statusError').textContent = errorDetails;
                    } else {
                        showMessage(result.error || 'Validation failed. Please check your input.', 'error');
                    }
                } else {
                    showMessage(result.error || `Failed to ${catalogId ? 'update' : 'create'} catalog.`, 'error');
                }
            }
        } catch (error) {
            console.error(`Error ${catalogId ? 'updating' : 'creating'} catalog:`, error);
            showMessage('Network error: Could not connect to the server. Please try again.', 'error');
        }
    };

    /**
     * Displays the confirmation modal for deletion.
     * @param {number} catalogId - The ID of the catalog to be deleted.
     */
    const promptForDelete = (catalogId) => {
        currentDeleteCatalogId = catalogId;
        confirmMessage.textContent = `Are you sure you want to delete catalog ID ${currentDeleteCatalogId}? This action cannot be undone.`;
        hideModal(inputByIdModal);
        showModal(confirmModal);
    };

    /**
     * Sends a request to the backend API to delete a catalog by its ID.
     * @param {number} catalogId - The ID of the catalog to delete.
     */
    const deleteCatalog = async (catalogId) => {
        try {
            const response = await fetch(`/api/catalogs/${catalogId}`, {
                method: 'DELETE',
            });
            const result = await response.json();

            if (response.ok) {
                showMessage(result.message, 'success');
                fetchCatalogs('');
            } else {
                showMessage(result.error || 'Failed to delete catalog.', 'error');
            }
        } catch (error) {
            console.error('Error deleting catalog:', error);
            showMessage('Network error: Could not connect to the server. Please try again.', 'error');
        }
    };

    // --- Event Listeners for UI Interactions ---

    createCatalogBtn.addEventListener('click', () => {
        resetForm();
        showModal(catalogModal);
    });

    viewAllCatalogsBtn.addEventListener('click', () => {
        fetchCatalogs('');
    });

    updateByIdBtn.addEventListener('click', () => {
        currentActionType = 'update';
        actionByIdTitle.textContent = 'Enter Catalog ID to Update';
        actionByIdSubmitBtn.textContent = 'Proceed to Update';
        inputCatalogId.value = '';
        clearErrorMessages();
        showModal(inputByIdModal);
    });

    deleteByIdBtn.addEventListener('click', () => {
        currentActionType = 'delete';
        actionByIdTitle.textContent = 'Enter Catalog ID to Delete';
        actionByIdSubmitBtn.textContent = 'Proceed to Delete';
        inputCatalogId.value = '';
        clearErrorMessages();
        showModal(inputByIdModal);
    });

    viewByIdBtn.addEventListener('click', () => {
        currentActionType = 'view';
        actionByIdTitle.textContent = 'Enter Catalog ID to View';
        actionByIdSubmitBtn.textContent = 'View Catalog';
        inputCatalogId.value = '';
        clearErrorMessages();
        showModal(inputByIdModal);
    });

    closeModalBtn.addEventListener('click', () => hideModal(catalogModal));
    closeConfirmModalBtn.addEventListener('click', () => hideModal(confirmModal));
    closeInputByIdModalBtn.addEventListener('click', () => hideModal(inputByIdModal));

    window.addEventListener('click', (event) => {
        if (event.target === catalogModal) {
            hideModal(catalogModal);
        }
        if (event.target === confirmModal) {
            hideModal(confirmModal);
        }
        if (event.target === inputByIdModal) {
            hideModal(inputByIdModal);
        }
    });

    catalogForm.addEventListener('submit', (event) => {
        event.preventDefault();
        clearErrorMessages();

        const catalogId = document.getElementById('catalogId').value;
        const catalogName = document.getElementById('catalogName').value.trim();
        const catalogDescription = document.getElementById('catalogDescription').value.trim();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const status = document.getElementById('status').value;

        let isValid = true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!catalogName) { document.getElementById('catalogNameError').textContent = 'Name is required.'; isValid = false; }
        else if (catalogName.length > 30) { document.getElementById('catalogNameError').textContent = 'Name cannot exceed 30 characters.'; isValid = false; }
        
        if (!catalogDescription) { document.getElementById('catalogDescriptionError').textContent = 'Description is required.'; isValid = false; }
        else if (catalogDescription.length > 50) { document.getElementById('catalogDescriptionError').textContent = 'Description cannot exceed 50 characters.'; isValid = false; }
        
        if (!startDate) { document.getElementById('startDateError').textContent = 'Start Date is required.'; isValid = false; }
        else if (new Date(startDate) < today) { document.getElementById('startDateError').textContent = 'Start Date cannot be in the past.'; isValid = false; }

        if (!endDate) { document.getElementById('endDateError').textContent = 'End Date is required.'; isValid = false; }
        else if (new Date(endDate) < today) { document.getElementById('endDateError').textContent = 'End Date cannot be in the past.'; isValid = false; }

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            document.getElementById('endDateError').textContent = 'End Date cannot be before Start Date.'; isValid = false;
        }

        const allowedStatuses = ['active', 'inactive', 'upcoming', 'expired'];
        const statusLower = status.toLowerCase();
        if (!status) { document.getElementById('statusError').textContent = 'Status is required.'; isValid = false; }
        else if (!allowedStatuses.includes(statusLower)) {
            document.getElementById('statusError').textContent = `Invalid status. Allowed: ${allowedStatuses.join(', ')}.`; isValid = false;
        }

        if (isValid) {
            const catalogData = { name: catalogName, description: catalogDescription, start_date: startDate, end_date: endDate, status: statusLower };
            saveCatalog(catalogData, catalogId || null);
        }
    });

    inputByIdForm.addEventListener('submit', (event) => {
        event.preventDefault();
        clearErrorMessages();
        const id = parseInt(inputCatalogId.value, 10);

        if (isNaN(id) || id <= 0) {
            inputByIdError.textContent = 'Please enter a valid positive Catalog ID.';
            return;
        }

        if (currentActionType === 'update') {
            fetchCatalogAndPopulateForm(id);
        } else if (currentActionType === 'delete') {
            promptForDelete(id);
        } else if (currentActionType === 'view') {
            fetchCatalogAndDisplay(id);
        }
    });

    catalogTableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-edit')) {
            const catalogId = event.target.dataset.id;
            fetchCatalogAndPopulateForm(catalogId);
        } else if (event.target.classList.contains('btn-danger')) {
            const catalogId = event.target.dataset.id;
            promptForDelete(catalogId);
        }
    });

    confirmDeleteBtn.addEventListener('click', () => {
        if (currentDeleteCatalogId) {
            deleteCatalog(currentDeleteCatalogId);
        }
        hideModal(confirmModal);
        currentDeleteCatalogId = null;
        confirmMessage.textContent = "";
    });

    cancelDeleteBtn.addEventListener('click', () => {
        hideModal(confirmModal);
        currentDeleteCatalogId = null;
        confirmMessage.textContent = "";
    });

    // --- Initial Application Setup ---
    fetchCatalogs();
});