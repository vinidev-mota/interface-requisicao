// API Base URL (same host)
const API_BASE = 'http://localhost:3000/api';

// State
let clientsData = [];
let selectedClients = new Set();

// DOM Elements
const pendingClientsList = document.getElementById('pendingClientsList');
const completeClientsList = document.getElementById('completeClientsList');
const selectAllCheckbox = document.getElementById('selectAll');
const btnSubmit = document.getElementById('btnSubmit');
const loader = document.getElementById('loader');
const loaderMessage = document.getElementById('loaderMessage');
const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toastIcon');
const toastMessage = document.getElementById('toastMessage');

// Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Upload Form Elements
const remetenteInput = document.getElementById('remetenteInput');
const novosDocumentosList = document.getElementById('novosDocumentosList');
const uploadForm = document.getElementById('uploadForm');
const fileDropArea = document.getElementById('fileDropArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const removeFileBtn = document.getElementById('removeFileBtn');

// Initialize
async function init() {
    setupEventListeners();
    await fetchClients();
    await fetchNovosDocumentos();
}

// Fetch Clients from Backend
async function fetchClients() {
    try {
        const response = await fetch(`${API_BASE}/clientes`);
        if (!response.ok) throw new Error('Falha ao carregar clientes.');
        clientsData = await response.json();
        
        renderClients();
    } catch (error) {
        console.error(error);
        showToast('Erro ao carregar dados dos clientes', 'error');
    }
}

// Render Clients List
function renderClients() {
    pendingClientsList.innerHTML = '';
    completeClientsList.innerHTML = '';

    const pendingClients = clientsData.filter(c => c.status === 'pendente');
    const completeClients = clientsData.filter(c => c.status === 'completo');

    // Render Pending
    if (pendingClients.length === 0) {
        pendingClientsList.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 1rem;">Nenhum cliente com documentação pendente.</p>';
    } else {
        pendingClients.forEach(client => {
            pendingClientsList.appendChild(createClientCard(client));
        });
    }

    // Render Complete
    if (completeClients.length === 0) {
        completeClientsList.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 1rem;">Nenhum cliente com documentação completa.</p>';
    } else {
        completeClients.forEach(client => {
            completeClientsList.appendChild(createClientCard(client));
        });
    }
    
    // Ensure select all state is accurate after re-render
    updateSelectAllState();
    updateSubmitButton();
}

// Fetch Novos Documentos from Backend
async function fetchNovosDocumentos() {
    try {
        const response = await fetch(`${API_BASE}/documentos-novos`);
        if (!response.ok) throw new Error('Falha ao carregar novos documentos.');
        const docs = await response.json();
        renderNovosDocumentos(docs);
    } catch (error) {
        console.error(error);
    }
}

function renderNovosDocumentos(docs) {
    novosDocumentosList.innerHTML = '';
    if (docs.length === 0) {
        novosDocumentosList.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 1rem;">Nenhum documento avulso recebido.</p>';
        return;
    }

    docs.forEach(doc => {
        const data = new Date(doc.dataRecebimento).toLocaleString('pt-BR');
        const card = document.createElement('div');
        card.className = 'client-card';
        card.style.borderLeftColor = 'var(--secondary)';
        
        card.innerHTML = `
            <div class="client-info">
                <div class="client-header">
                    <div>
                        <h3 class="client-name">${doc.fileName}</h3>
                        <div class="client-details">
                            <span><i class="fa-regular fa-envelope"></i> ${doc.remetente}</span>
                            <span><i class="fa-regular fa-calendar"></i> ${data}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        novosDocumentosList.appendChild(card);
    });
}

// Create Client Card DOM Element
function createClientCard(client) {
    const isPending = client.status === 'pendente';
    const card = document.createElement('div');
    card.className = `client-card ${isPending ? 'pending' : 'complete'}`;
    
    // Checkbox for pending clients
    let checkboxHTML = '';
    if (isPending) {
        const isChecked = selectedClients.has(client.id) ? 'checked' : '';
        checkboxHTML = `
            <div class="client-checkbox">
                <input type="checkbox" class="client-select-cb" data-id="${client.id}" ${isChecked}>
            </div>
        `;
    }

    // Documents list
    const docsHTML = client.documentos.map(doc => {
        const iconClass = doc.tem ? 'fa-check text-success' : 'fa-xmark text-error';
        const docClass = doc.tem ? 'has' : 'missing';
        return `
            <div class="doc-item ${docClass}">
                <i class="fa-solid ${iconClass}"></i>
                <span>${doc.nome}</span>
            </div>
        `;
    }).join('');

    card.innerHTML = `
        ${checkboxHTML}
        <div class="client-info">
            <div class="client-header">
                <div>
                    <h3 class="client-name">${client.nome}</h3>
                    <div class="client-details">
                        <span><i class="fa-regular fa-id-card"></i> ${client.cpf}</span>
                        <span><i class="fa-regular fa-envelope"></i> ${client.email}</span>
                        <span><i class="fa-solid fa-scale-balanced"></i> ${client.numero_processo}</span>
                    </div>
                </div>
                <div class="status-badge ${isPending ? 'pending' : 'complete'}">
                    ${isPending ? 'Pendente' : 'Completo'}
                </div>
            </div>
            <div class="documents-list">
                ${docsHTML}
            </div>
        </div>
    `;

    // Click on card to toggle checkbox (for pending)
    if (isPending) {
        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                const cb = card.querySelector('.client-select-cb');
                cb.checked = !cb.checked;
                handleClientSelection(client.id, cb.checked);
            }
        });
    }

    return card;
}

// Event Listeners
function setupEventListeners() {
    // Select All
    selectAllCheckbox.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        const clientCheckboxes = document.querySelectorAll('.client-select-cb');
        
        clientCheckboxes.forEach(cb => {
            cb.checked = isChecked;
            handleClientSelection(parseInt(cb.dataset.id), isChecked);
        });
    });

    // Individual Checkboxes (delegation on pending list)
    pendingClientsList.addEventListener('change', (e) => {
        if (e.target.classList.contains('client-select-cb')) {
            handleClientSelection(parseInt(e.target.dataset.id), e.target.checked);
            updateSelectAllState();
        }
    });

    // Submit Request (N8N)
    btnSubmit.addEventListener('click', submitRequest);

    // Tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active to clicked
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // File Drag and Drop
    fileInput.addEventListener('change', handleFileSelect);
    removeFileBtn.addEventListener('click', clearFile);
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileDropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        fileDropArea.addEventListener(eventName, () => {
            fileDropArea.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        fileDropArea.addEventListener(eventName, () => {
            fileDropArea.classList.remove('dragover');
        }, false);
    });

    fileDropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            fileInput.files = files; // Assign files to input
            handleFileSelect();
        }
    }, false);

    // Upload Form Submit
    uploadForm.addEventListener('submit', handleUploadSubmit);
}

// Handle individual selection
function handleClientSelection(id, isSelected) {
    if (isSelected) {
        selectedClients.add(id);
    } else {
        selectedClients.delete(id);
    }
    updateSubmitButton();
}

// Update Select All Checkbox State
function updateSelectAllState() {
    const totalPending = clientsData.filter(c => c.status === 'pendente').length;
    selectAllCheckbox.checked = totalPending > 0 && selectedClients.size === totalPending;
}

// Update Submit Button State
function updateSubmitButton() {
    btnSubmit.disabled = selectedClients.size === 0;
    
    // Update button text to show count
    const span = btnSubmit.querySelector('span');
    if (selectedClients.size > 0) {
        span.textContent = `Solicitar Documentos (${selectedClients.size})`;
    } else {
        span.textContent = 'Solicitar Documentos Faltantes';
    }
}

// File Selection Logic
function handleFileSelect() {
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        
        // Check size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            showToast('Arquivo muito grande. Limite é 10MB.', 'error');
            clearFile();
            return;
        }

        fileNameDisplay.textContent = file.name;
        fileDropArea.style.display = 'none';
        fileInfo.classList.remove('hidden');
    }
}

function clearFile() {
    fileInput.value = '';
    fileNameDisplay.textContent = '';
    fileInfo.classList.add('hidden');
    fileDropArea.style.display = 'flex';
}

// Handle Manual Upload Submit (to our backend)
async function handleUploadSubmit(e) {
    e.preventDefault();

    const remetente = document.getElementById('remetenteInput').value;
    const file = fileInput.files[0];

    if (!file) {
        showToast('Selecione um arquivo.', 'error');
        return;
    }

    const formData = new FormData();
    if (remetente) formData.append('remetente', remetente);
    formData.append('documento', file);

    showLoader('Enviando documento...');

    try {
        const response = await fetch(`${API_BASE}/upload-documento`, {
            method: 'POST',
            headers: {
                // Nossa API-KEY mockada para teste
                'x-api-key': 'mota-api-key-123'
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Documento enviado com sucesso!', 'success');
            
            // Reset form
            uploadForm.reset();
            clearFile();
            
            // Refresh unassigned docs list from server
            await fetchNovosDocumentos();
            
        } else {
            throw new Error(data.error || 'Erro desconhecido');
        }
    } catch (error) {
        console.error(error);
        showToast(`Erro: ${error.message}`, 'error');
    } finally {
        hideLoader();
    }
}


// Submit Request to n8n Webhook
async function submitRequest() {
    if (selectedClients.size === 0) return;

    // Prepare payload
    const payload = {
        clientes: Array.from(selectedClients).map(id => {
            const client = clientsData.find(c => c.id === id);
            // Get only missing documents
            const missingDocs = client.documentos
                .filter(doc => !doc.tem)
                .map(doc => doc.nome);
                
            return {
                nome_completo: client.nome,
                cpf: client.cpf,
                email: client.email,
                numero_processo: client.numero_processo,
                documentos_faltantes: missingDocs
            };
        })
    };

    showLoader('Enviando requisição...');

    try {
        const response = await fetch('https://n8n.motaadv.net/webhook/solicitar-documentos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showToast('Requisição enviada com sucesso ao N8N!', 'success');
            selectedClients.clear();
            document.querySelectorAll('.client-select-cb').forEach(cb => cb.checked = false);
            selectAllCheckbox.checked = false;
            updateSubmitButton();
        } else {
            throw new Error(`Erro na requisição: ${response.status}`);
        }
    } catch (error) {
        console.error('Webhook error:', error);
        showToast('Erro ao enviar requisição para o webhook.', 'error');
    } finally {
        hideLoader();
    }
}

// UI Helpers
function showLoader(message = 'Processando...') {
    loaderMessage.textContent = message;
    loader.classList.remove('hidden');
}

function hideLoader() {
    loader.classList.add('hidden');
}

function showToast(message, type) {
    toastMessage.textContent = message;
    
    if (type === 'success') {
        toastIcon.className = 'fa-solid fa-check-circle success';
    } else {
        toastIcon.className = 'fa-solid fa-circle-exclamation error';
    }

    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 4000);
}

// Run init
init();
