document.addEventListener('DOMContentLoaded', () => {
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
    const loadingSpinner = document.getElementById('loadingSpinner');

    let currentDeleteCatalogId = null;
    let currentActionType = null;

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
        inputByIdError.textContent = '';
    };

    const showMessage = (message, type = 'success') => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        messageContainer.innerHTML = '';
        messageContainer.appendChild(alertDiv);
    };

    const showSpinner = () => loadingSpinner.classList.add('show');
    const hideSpinner = () => loadingSpinner.classList.remove('show');

    const fetchCatalogs = async () => {
        showSpinner();
        try {
            const response = await fetch('/api/catalogs');
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
                            <button class="btn-small btn-edit-color" data-id="${catalog.catalog_id}">Edit</button>
                            <button class="btn-small btn-danger-color" data-id="${catalog.catalog_id}">Delete</button>
                        </td>
                    `;
                });
            } else {
                noCatalogsMessage.style.display = 'block';
            }
        } catch (error) {
            showMessage('Network error: Could not fetch catalogs.', 'error');
            noCatalogsMessage.style.display = 'block';
        } finally {
            hideSpinner();
        }
    };

    const fetchCatalogAndDisplay = async (catalogId) => {
        showSpinner();
        try {
            const response = await fetch(`/api/catalogs/${catalogId}`);
            const catalog = await response.json();
            catalogTableBody.innerHTML = '';

            if (response.ok) {
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
                        <button class="btn-small btn-edit-color" data-id="${catalog.catalog_id}">Edit</button>
                        <button class="btn-small btn-danger-color" data-id="${catalog.catalog_id}">Delete</button>
                    </td>
                `;
                showMessage(`Catalog ID ${catalogId} displayed.`, 'success');
            } else {
                noCatalogsMessage.style.display = 'block';
                showMessage(`Catalog ID ${catalogId} not found.`, 'error');
            }
        } catch (error) {
            showMessage('Network error: Could not fetch catalog.', 'error');
            noCatalogsMessage.style.display = 'block';
        } finally {
            hideModal(inputByIdModal);
            hideSpinner();
        }
    };

    const promptForDelete = (catalogId) => {
        currentDeleteCatalogId = catalogId;
        confirmMessage.textContent = `Are you sure you want to delete catalog ID ${catalogId}?`;
        hideModal(inputByIdModal);
        showModal(confirmModal);
    };

    const deleteCatalog = async (catalogId) => {
        showSpinner();
        try {
            const response = await fetch(`/api/catalogs/${catalogId}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (response.ok) {
                showMessage(result.message, 'success');
                fetchCatalogs();
            } else {
                showMessage(result.error || 'Failed to delete catalog.', 'error');
            }
        } catch (error) {
            showMessage('Network error: Could not delete catalog.', 'error');
        } finally {
            hideSpinner();
        }
    };

    const fetchCatalogAndPopulateForm = async (catalogId) => {
        showSpinner();
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
                showMessage('Failed to load catalog.', 'error');
            }
        } catch (error) {
            showMessage('Network error: Could not load catalog.', 'error');
        } finally {
            hideSpinner();
        }
    };

    const saveCatalog = async (catalogData, catalogId = null) => {
        showSpinner();
        const method = catalogId ? 'PUT' : 'POST';
        const url = catalogId ? `/api/catalogs/${catalogId}` : '/api/catalogs';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(catalogData),
            });
            const result = await response.json();

            if (response.ok) {
                showMessage(result.message, 'success');
                hideModal(catalogModal);
                resetForm();
                fetchCatalogs();
            } else {
                showMessage(result.error || 'Operation failed.', 'error');
            }
        } catch (error) {
            showMessage('Network error: Could not save catalog.', 'error');
        } finally {
            hideSpinner();
        }
    };

    createCatalogBtn.addEventListener('click', () => {
        resetForm();
        showModal(catalogModal);
    });

    viewAllCatalogsBtn.addEventListener('click', () => fetchCatalogs());

    updateByIdBtn.addEventListener('click', () => {
        currentActionType = 'update';
        actionByIdTitle.textContent = 'Enter Catalog ID to Update';
        actionByIdSubmitBtn.textContent = 'Update';
        inputCatalogId.value = '';
        showModal(inputByIdModal);
    });

    deleteByIdBtn.addEventListener('click', () => {
        currentActionType = 'delete';
        actionByIdTitle.textContent = 'Enter Catalog ID to Delete';
        actionByIdSubmitBtn.textContent = 'Delete';
        inputCatalogId.value = '';
        showModal(inputByIdModal);
    });

    viewByIdBtn.addEventListener('click', () => {
        currentActionType = 'view';
        actionByIdTitle.textContent = 'Enter Catalog ID to View';
        actionByIdSubmitBtn.textContent = 'View';
        inputCatalogId.value = '';
        showModal(inputByIdModal);
    });

    inputByIdForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const id = parseInt(inputCatalogId.value, 10);
        if (isNaN(id) || id <= 0) {
            inputByIdError.textContent = 'Enter a valid ID.';
            return;
        }

        if (currentActionType === 'view') fetchCatalogAndDisplay(id);
        else if (currentActionType === 'delete') promptForDelete(id);
        else if (currentActionType === 'update') fetchCatalogAndPopulateForm(id);
    });

    catalogForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const catalogId = document.getElementById('catalogId').value;
        const catalogData = {
            name: document.getElementById('catalogName').value,
            description: document.getElementById('catalogDescription').value,
            start_date: document.getElementById('startDate').value,
            end_date: document.getElementById('endDate').value,
            status: document.getElementById('status').value
        };
        saveCatalog(catalogData, catalogId || null);
    });

    catalogTableBody.addEventListener('click', (event) => {
        const id = event.target.dataset.id;
        if (event.target.classList.contains('btn-edit-color')) fetchCatalogAndPopulateForm(id);
        if (event.target.classList.contains('btn-danger-color')) promptForDelete(id);
    });

    closeModalBtn.addEventListener('click', () => hideModal(catalogModal));
    closeConfirmModalBtn.addEventListener('click', () => hideModal(confirmModal));
    closeInputByIdModalBtn.addEventListener('click', () => hideModal(inputByIdModal));

    cancelDeleteBtn.addEventListener('click', () => {
        hideModal(confirmModal);
        currentDeleteCatalogId = null;
    });

    confirmDeleteBtn.addEventListener('click', () => {
        if (currentDeleteCatalogId) deleteCatalog(currentDeleteCatalogId);
        hideModal(confirmModal);
        currentDeleteCatalogId = null;
    });

    fetchCatalogs();
});
