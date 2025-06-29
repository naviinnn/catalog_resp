document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References & Utility ---
    // Centralized function to get elements by ID for conciseness
    const getById = (id) => document.getElementById(id);

    // Main UI elements
    const ui = {
        createCatalogBtn: getById('createCatalogBtn'),
        viewAllCatalogsBtn: getById('viewAllCatalogsBtn'),
        updateByIdBtn: getById('updateByIdBtn'),
        deleteByIdBtn: getById('deleteByIdBtn'),
        viewByIdBtn: getById('viewByIdBtn'),
        catalogModal: getById('catalogModal'),
        closeModalBtn: getById('closeModalBtn'),
        catalogForm: getById('catalogForm'),
        submitCatalogBtn: getById('submitCatalogBtn'),
        catalogTableBody: getById('catalogTableBody'),
        confirmModal: getById('confirmModal'),
        closeConfirmModalBtn: getById('closeConfirmModalBtn'),
        confirmDeleteBtn: getById('confirmDeleteBtn'),
        cancelDeleteBtn: getById('cancelDeleteBtn'),
        confirmMessage: getById('confirmMessage'),
        inputByIdModal: getById('inputByIdModal'),
        closeInputByIdModalBtn: getById('closeInputByIdModalBtn'),
        inputByIdForm: getById('inputByIdForm'),
        actionByIdTitle: getById('actionByIdTitle'),
        inputCatalogId: getById('inputCatalogId'),
        inputByIdError: getById('inputByIdError'),
        actionByIdSubmitBtn: getById('actionByIdSubmitBtn'),
        noCatalogsMessage: getById('noCatalogsMessage'),
        messageContainer: getById('message-container'),
        loadingSpinner: getById('loadingSpinner'),
        // Form specific error spans
        catalogNameError: getById('catalogNameError'),
        catalogDescriptionError: getById('catalogDescriptionError'),
        startDateError: getById('startDateError'),
        endDateError: getById('endDateError'),
        statusError: getById('statusError')
    };

    // --- State Variables ---
    let currentDeleteCatalogId = null;
    let currentActionType = null; // 'update', 'delete', 'view'

    // --- UI Feedback & Modal Management ---

    /** Shows a modal by adding the 'show' class. */
    const showModal = (modalElement) => {
        modalElement.classList.add('show');
        modalElement.setAttribute('aria-hidden', 'false');
    };

    /** Hides a modal by removing the 'show' class. */
    const hideModal = (modalElement) => {
        modalElement.classList.remove('show');
        modalElement.setAttribute('aria-hidden', 'true');
    };

    /** Resets the main catalog form to its initial state. */
    const resetCatalogForm = () => {
        ui.catalogForm.reset();
        ui.catalogId.value = '';
        ui.submitCatalogBtn.textContent = 'Create Catalog';
        ui.catalogModal.querySelector('h2').textContent = 'Create New Catalog';
        clearFormErrorMessages();
    };

    /** Clears all validation error messages within the forms. */
    const clearFormErrorMessages = () => {
        document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
        ui.inputByIdError.textContent = '';
    };

    /** Displays a temporary success or error message to the user. */
    const showMessage = (message, type = 'success') => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        ui.messageContainer.innerHTML = ''; // Clear previous messages
        ui.messageContainer.appendChild(alertDiv);
        // Optional: Auto-hide message after a few seconds
        setTimeout(() => alertDiv.remove(), 5000);
    };

    /** Shows the loading spinner. */
    const showSpinner = () => ui.loadingSpinner.classList.add('show');

    /** Hides the loading spinner. */
    const hideSpinner = () => ui.loadingSpinner.classList.remove('show');

    // --- API Interaction Layer ---

    /** Handles API requests with integrated loading and error feedback. */
    const apiRequest = async (url, options = {}) => {
        showSpinner();
        try {
            const response = await fetch(url, options);
            const data = await response.json();
            if (!response.ok) {
                const errorMessage = data.error || 'An unknown error occurred.';
                throw new Error(data.details || errorMessage); // Use details if available
            }
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            // Show user-friendly network error or specific API error
            showMessage(error.message || 'Network error: Could not connect to the server.', 'error');
            throw error; // Re-throw to allow specific error handling at call site
        } finally {
            hideSpinner();
        }
    };

    /** Fetches and displays all catalogs, with optional search. */
    const fetchAndDisplayAllCatalogs = async (searchTerm = '') => {
        try {
            const url = searchTerm ? `/api/catalogs?search=${encodeURIComponent(searchTerm)}` : '/api/catalogs';
            const result = await apiRequest(url);
            const catalogs = result.data || []; // Access 'data' field

            ui.catalogTableBody.innerHTML = ''; // Clear table

            if (catalogs.length > 0) {
                ui.noCatalogsMessage.style.display = 'none';
                catalogs.forEach(catalog => {
                    const row = ui.catalogTableBody.insertRow();
                    row.setAttribute('data-id', catalog.catalog_id);
                    row.innerHTML = `
                        <td data-label="ID">${catalog.catalog_id}</td>
                        <td data-label="Name">${catalog.catalog_name}</td>
                        <td data-label="Description">${catalog.catalog_description}</td>
                        <td data-label="Start Date">${catalog.start_date}</td>
                        <td data-label="End Date">${catalog.end_date}</td>
                        <td data-label="Status">${catalog.status}</td>
                        <td class="actions">
                            <button class="btn-small btn-edit-color" data-id="${catalog.catalog_id}">Edit</button>
                            <button class="btn-small btn-danger-color" data-id="${catalog.catalog_id}">Delete</button>
                        </td>
                    `;
                });
            } else {
                ui.noCatalogsMessage.style.display = 'block';
            }
        } catch (error) {
            // Error already shown by apiRequest, just update UI state if needed
            ui.noCatalogsMessage.style.display = 'block';
        }
    };

    /** Fetches a single catalog by ID and populates the form for editing. */
    const fetchCatalogForEdit = async (catalogId) => {
        try {
            const result = await apiRequest(`/api/catalogs/${catalogId}`);
            const catalog = result.data; // Access 'data' field
            if (catalog) {
                ui.catalogId.value = catalog.catalog_id;
                ui.catalogName.value = catalog.catalog_name;
                ui.catalogDescription.value = catalog.catalog_description;
                ui.startDate.value = catalog.start_date;
                ui.endDate.value = catalog.end_date;
                ui.status.value = catalog.status;

                ui.catalogModal.querySelector('h2').textContent = 'Edit Catalog';
                ui.submitCatalogBtn.textContent = 'Update Catalog';
                
                hideModal(ui.inputByIdModal);
                showModal(ui.catalogModal);
            } else {
                showMessage(`Catalog ID ${catalogId} not found.`, 'error');
                hideModal(ui.inputByIdModal);
            }
        } catch (error) {
            // Error already shown by apiRequest
            hideModal(ui.inputByIdModal);
        }
    };

    /** Fetches a single catalog by ID and displays it in the table (clearing others). */
    const fetchCatalogAndDisplayOne = async (catalogId) => {
        try {
            const result = await apiRequest(`/api/catalogs/${catalogId}`);
            const catalog = result.data; // Access 'data' field
            
            ui.catalogTableBody.innerHTML = ''; // Clear table

            if (catalog) {
                ui.noCatalogsMessage.style.display = 'none';
                const row = ui.catalogTableBody.insertRow();
                row.setAttribute('data-id', catalog.catalog_id);
                row.innerHTML = `
                    <td data-label="ID">${catalog.catalog_id}</td>
                    <td data-label="Name">${catalog.catalog_name}</td>
                    <td data-label="Description">${catalog.catalog_description}</td>
                    <td data-label="Start Date">${catalog.start_date}</td>
                    <td data-label="End Date">${catalog.end_date}</td>
                    <td data-label="Status">${catalog.status}</td>
                    <td class="actions">
                        <button class="btn-small btn-edit-color" data-id="${catalog.catalog_id}">Edit</button>
                        <button class="btn-small btn-danger-color" data-id="${catalog.catalog_id}">Delete</button>
                    </td>
                `;
                showMessage(`Catalog ID ${catalogId} found and displayed.`, 'success');
            } else {
                ui.noCatalogsMessage.style.display = 'block';
                showMessage(`Catalog with ID ${catalogId} not found.`, 'error');
            }
            hideModal(ui.inputByIdModal);
        } catch (error) {
            // Error already shown by apiRequest
            ui.noCatalogsMessage.style.display = 'block';
            hideModal(ui.inputByIdModal);
        }
    };

    /** Saves (creates or updates) a catalog via API. */
    const saveCatalog = async (catalogData, catalogId = null) => {
        const method = catalogId ? 'PUT' : 'POST';
        const url = catalogId ? `/api/catalogs/${catalogId}` : '/api/catalogs';

        try {
            const result = await apiRequest(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(catalogData),
            });
            showMessage(result.message, 'success');
            hideModal(ui.catalogModal);
            resetCatalogForm();
            fetchAndDisplayAllCatalogs(); // Refresh table
        } catch (error) {
            // Specific validation errors already handled by Flask & apiRequest, just update form errors
            if (error.message) {
                // This assumes `error.message` will contain the detailed validation string from Flask
                // We'll parse it to assign to correct fields
                const errorMessage = error.message;
                if (errorMessage.includes("Name")) ui.catalogNameError.textContent = errorMessage;
                else if (errorMessage.includes("Description")) ui.catalogDescriptionError.textContent = errorMessage;
                else if (errorMessage.includes("Start Date") || (errorMessage.includes("Date") && !errorMessage.includes("End Date"))) ui.startDateError.textContent = errorMessage;
                else if (errorMessage.includes("End Date")) ui.endDateError.textContent = errorMessage;
                else if (errorMessage.includes("Status")) ui.statusError.textContent = errorMessage;
                else showMessage(errorMessage, 'error'); // Fallback for unhandled validation messages
            }
        }
    };

    /** Prompts for deletion and sets up the confirmation modal. */
    const promptForDelete = (catalogId) => {
        currentDeleteCatalogId = catalogId;
        ui.confirmMessage.textContent = `Are you sure you want to delete catalog ID ${currentDeleteCatalogId}? This action cannot be undone.`;
        hideModal(ui.inputByIdModal); // Hide input modal if open
        showModal(ui.confirmModal);
    };

    /** Deletes a catalog via API. */
    const deleteCatalog = async (catalogId) => {
        try {
            const result = await apiRequest(`/api/catalogs/${catalogId}`, { method: 'DELETE' });
            showMessage(result.message, 'success');
            fetchAndDisplayAllCatalogs(); // Refresh table
        } catch (error) {
            // Error already shown by apiRequest
        } finally {
            hideModal(ui.confirmModal); // Always hide confirm modal after attempt
            currentDeleteCatalogId = null;
            ui.confirmMessage.textContent = "";
        }
    };

    // --- Client-side Form Validation ---

    /** Validates catalog form inputs. */
    const validateCatalogForm = () => {
        clearFormErrorMessages();
        let isValid = true;

        const name = ui.catalogName.value.trim();
        const description = ui.catalogDescription.value.trim();
        const startDate = ui.startDate.value;
        const endDate = ui.endDate.value;
        const status = ui.status.value;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!name) { ui.catalogNameError.textContent = 'Name is required.'; isValid = false; }
        else if (name.length > 30) { ui.catalogNameError.textContent = 'Name cannot exceed 30 characters.'; isValid = false; }
        
        if (!description) { ui.catalogDescriptionError.textContent = 'Description is required.'; isValid = false; }
        else if (description.length > 50) { ui.catalogDescriptionError.textContent = 'Description cannot exceed 50 characters.'; isValid = false; }
        
        if (!startDate) { ui.startDateError.textContent = 'Start Date is required.'; isValid = false; }
        else if (new Date(startDate) < today) { ui.startDateError.textContent = 'Start Date cannot be in the past.'; isValid = false; }

        if (!endDate) { ui.endDateError.textContent = 'End Date is required.'; isValid = false; }
        else if (new Date(endDate) < today) { ui.endDateError.textContent = 'End Date cannot be in the past.'; isValid = false; }

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            ui.endDateError.textContent = 'End Date cannot be before Start Date.'; isValid = false;
        }

        const allowedStatuses = ['active', 'inactive', 'upcoming', 'expired'];
        const statusLower = status.toLowerCase();
        if (!status) { ui.statusError.textContent = 'Status is required.'; isValid = false; }
        else if (!allowedStatuses.includes(statusLower)) {
            ui.statusError.textContent = `Invalid status. Allowed: ${allowedStatuses.join(', ')}.`; isValid = false;
        }

        return isValid;
    };

    // --- Event Listeners Initialization ---

    ui.createCatalogBtn.addEventListener('click', () => {
        resetCatalogForm();
        showModal(ui.catalogModal);
    });

    ui.viewAllCatalogsBtn.addEventListener('click', () => fetchAndDisplayAllCatalogs());

    ui.updateByIdBtn.addEventListener('click', () => {
        currentActionType = 'update';
        ui.actionByIdTitle.textContent = 'Enter Catalog ID to Update';
        ui.actionByIdSubmitBtn.textContent = 'Proceed to Update';
        ui.inputCatalogId.value = '';
        clearFormErrorMessages();
        showModal(ui.inputByIdModal);
    });

    ui.deleteByIdBtn.addEventListener('click', () => {
        currentActionType = 'delete';
        ui.actionByIdTitle.textContent = 'Enter Catalog ID to Delete';
        ui.actionByIdSubmitBtn.textContent = 'Proceed to Delete';
        ui.inputCatalogId.value = '';
        clearFormErrorMessages();
        showModal(ui.inputByIdModal);
    });

    ui.viewByIdBtn.addEventListener('click', () => {
        currentActionType = 'view';
        ui.actionByIdTitle.textContent = 'Enter Catalog ID to View';
        ui.actionByIdSubmitBtn.textContent = 'View Catalog';
        ui.inputCatalogId.value = '';
        clearFormErrorMessages();
        showModal(ui.inputByIdModal);
    });

    // Close buttons for modals
    ui.closeModalBtn.addEventListener('click', () => hideModal(ui.catalogModal));
    ui.closeConfirmModalBtn.addEventListener('click', () => hideModal(ui.confirmModal));
    ui.closeInputByIdModalBtn.addEventListener('click', () => hideModal(ui.inputByIdModal));

    // Close modals on outside click
    window.addEventListener('click', (event) => {
        if (event.target === ui.catalogModal) hideModal(ui.catalogModal);
        if (event.target === ui.confirmModal) hideModal(ui.confirmModal);
        if (event.target === ui.inputByIdModal) hideModal(ui.inputByIdModal);
    });

    ui.catalogForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (validateCatalogForm()) {
            const catalogId = ui.catalogId.value || null; // Will be empty string if new
            const catalogData = {
                name: ui.catalogName.value.trim(),
                description: ui.catalogDescription.value.trim(),
                start_date: ui.startDate.value,
                end_date: ui.endDate.value,
                status: ui.status.value.toLowerCase()
            };
            saveCatalog(catalogData, catalogId);
        }
    });

    ui.inputByIdForm.addEventListener('submit', (event) => {
        event.preventDefault();
        clearFormErrorMessages();
        const id = parseInt(ui.inputCatalogId.value, 10);

        if (isNaN(id) || id <= 0) {
            ui.inputByIdError.textContent = 'Please enter a valid positive Catalog ID.';
            return;
        }

        if (currentActionType === 'update') {
            fetchCatalogForEdit(id);
        } else if (currentActionType === 'delete') {
            promptForDelete(id);
        } else if (currentActionType === 'view') {
            fetchCatalogAndDisplayOne(id);
        }
    });

    // Event delegation for Edit/Delete buttons in the table
    ui.catalogTableBody.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('btn-small')) {
            const catalogId = target.dataset.id;
            if (target.textContent === 'Edit') {
                fetchCatalogForEdit(catalogId);
            } else if (target.textContent === 'Delete') {
                promptForDelete(catalogId);
            }
        }
    });

    ui.confirmDeleteBtn.addEventListener('click', () => {
        if (currentDeleteCatalogId) {
            deleteCatalog(currentDeleteCatalogId);
        }
    });

    ui.cancelDeleteBtn.addEventListener('click', () => {
        hideModal(ui.confirmModal);
        currentDeleteCatalogId = null;
        ui.confirmMessage.textContent = "";
    });

    // --- Initial Application Load ---
    fetchAndDisplayAllCatalogs();
});