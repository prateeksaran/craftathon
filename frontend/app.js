
/* ============================================
   MILITARY ASSET MANAGEMENT SYSTEM - JavaScript
   Complete functionality for login, navigation, 
   and data management
   ============================================ */

// ============================================
// CONFIGURATION & STATE MANAGEMENT
// ============================================

const AppState = {
    isAuthenticated: false,
    currentUser: {
        militaryId: null,
        accessLevel: null,
        loginTime: null
    },
    currentTab: 'inventory',
    assets: {
        inventory: [],
        deployment: [],
        maintenance: []
    }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadMockData();
    console.log('Military Asset Management System initialized');
});

function initializeEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Audit logs button
    const auditBtn = document.getElementById('auditBtn');
    if (auditBtn) {
        auditBtn.addEventListener('click', handleAuditLogs);
    }

    // Floating tabs
    const floatingTabs = document.querySelectorAll('.floating-tab');
    floatingTabs.forEach(tab => {
        tab.addEventListener('click', handleTabSwitch);
    });

    // Initialize real-time maintenance websocket
    initMaintenanceWebSocket();
}

// ============================================
// LOGIN & AUTHENTICATION
// ============================================

function handleLogin(e) {
    e.preventDefault();

    const militaryId = document.getElementById('militaryId').value.trim();
    const accessCode = document.getElementById('accessCode').value.trim();

    // Basic validation
    if (!militaryId || !accessCode) {
        showNotification('Please enter both Military ID and Access Code', 'error');
        return;
    }

    // Backend authentication call (if available)
    fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ militaryId, accessCode })
    })
    .then(async response => {
        if (!response.ok) {
            throw new Error('Invalid credentials');
        }
        return response.json();
    })
    .then(data => {
        const role = data.role || 'user';
        if (role === 'admin') {
            window.location.href = 'admin.html';
            return;
        }

        if (role === 'user') {
            AppState.isAuthenticated = true;
            AppState.currentUser = {
                militaryId: militaryId,
                accessLevel: getAccessLevel(militaryId),
                loginTime: new Date()
            };

            // Hide login overlay and show main app
            const loginOverlay = document.getElementById('loginOverlay');
            const mainApp = document.getElementById('mainApp');

            loginOverlay.classList.add('hidden');
            mainApp.classList.remove('hidden');

            // Update user display
            updateUserDisplay();

            // Load dashboard
            loadDashboard();

            showNotification(`Welcome, ${militaryId}!`, 'success');
            return;
        }

        showNotification('Unauthorized role', 'error');
    })
    .catch(err => {
        // Fallback to existing local mock behavior when backend is unavailable
        if (validateCredentials(militaryId, accessCode)) {
            AppState.isAuthenticated = true;
            AppState.currentUser = {
                militaryId: militaryId,
                accessLevel: getAccessLevel(militaryId),
                loginTime: new Date()
            };

            const loginOverlay = document.getElementById('loginOverlay');
            const mainApp = document.getElementById('mainApp');

            loginOverlay.classList.add('hidden');
            mainApp.classList.remove('hidden');

            updateUserDisplay();
            loadDashboard();
            showNotification(`Welcome, ${militaryId}!`, 'success');
        } else {
            showNotification('Invalid Military ID or Access Code', 'error');
        }
    });
}

function validateCredentials(militaryId, accessCode) {
    // Mock validation - replace with API call to FastAPI backend
    // Example: POST /api/authenticate

    const validIds = ['MIL001', 'MIL002', 'MIL003', 'ADMIN001'];
    const validCode = '2024';

    return validIds.includes(militaryId) && accessCode === validCode;
}

function getAccessLevel(militaryId) {
    // Determine access level based on military ID
    if (militaryId.startsWith('ADMIN')) {
        return 'ADMINISTRATOR';
    } else if (militaryId.startsWith('MIL')) {
        return 'OPERATOR';
    }
    return 'GUEST';
}

function handleLogout() {
    AppState.isAuthenticated = false;
    AppState.currentUser = {
        militaryId: null,
        accessLevel: null,
        loginTime: null
    };

    const loginOverlay = document.getElementById('loginOverlay');
    const mainApp = document.getElementById('mainApp');

    mainApp.classList.add('hidden');
    loginOverlay.classList.remove('hidden');

    // Clear form
    document.getElementById('loginForm').reset();

    showNotification('You have been logged out', 'info');
}

function handleAuditLogs() {
    // Placeholder for audit logs functionality
    showNotification('Audit Logs feature coming soon', 'info');
    console.log('Audit Logs button clicked - implement audit logs modal/panel here');
}

function updateUserDisplay() {
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay && AppState.currentUser.militaryId) {
        userDisplay.textContent = `ID: ${AppState.currentUser.militaryId} | ${AppState.currentUser.accessLevel}`;
    }
}

// ============================================
// TAB NAVIGATION
// ============================================

function handleTabSwitch(e) {
    const tabElement = e.currentTarget;
    const tabName = tabElement.getAttribute('data-tab');

    if (!tabName) return;

    // Update active tab in navigation
    const floatingTabs = document.querySelectorAll('.floating-tab');
    floatingTabs.forEach(tab => tab.classList.remove('active'));
    tabElement.classList.add('active');

    // Hide all sections and show selected one
    const contentSections = document.querySelectorAll('.content-section');
    contentSections.forEach(section => section.classList.remove('active'));
    contentSections.forEach(section => {
        section.classList.remove('active');
        section.classList.add('hidden');
    });

    const selectedSection = document.getElementById(tabName);
    if (selectedSection) {
        selectedSection.classList.remove('hidden');
        selectedSection.classList.add('active');
        AppState.currentTab = tabName;
        

        // Load tab-specific data
        loadTabData(tabName);
    }
}

function initMaintenanceWebSocket() {
    const ws = new WebSocket('ws://localhost:8000/ws/maintenance');

    ws.addEventListener('open', () => {
        console.log('Connected to maintenance websocket');
    });

    ws.addEventListener('message', (event) => {
        try {
            const payload = JSON.parse(event.data);
            const { id, name, status } = payload;
            const tableBody = document.getElementById('maintenanceTableBody');
            if (!tableBody) return;

            if (tableBody.children.length === 1 && tableBody.children[0].textContent.includes('Waiting for live maintenance updates')) {
                tableBody.innerHTML = '';
            }

            const row = document.createElement('tr');
            row.innerHTML = `<td>${id}</td><td>${name}</td><td>${status}</td>`;
            row.classList.add('realtime-highlight');

            tableBody.appendChild(row);

            setTimeout(() => row.classList.remove('realtime-highlight'), 1200);
        } catch (err) {
            console.error('Invalid maintenance websocket message', err);
        }
    });

    ws.addEventListener('close', () => {
        console.log('Maintenance websocket closed');
    });

    ws.addEventListener('error', (err) => {
        console.error('Maintenance websocket error', err);
    });
}


// ============================================
// DATA LOADING & MANAGEMENT
// ============================================

function loadMockData() {
    // Generate mock inventory data
    AppState.assets.inventory = [
        { id: 'AST001', name: 'M1 Abrams Tank', type: 'Vehicle', status: 'Operational', location: 'Depot A' },
        { id: 'AST002', name: 'UH-60 Blackhawk', type: 'Aircraft', status: 'Operational', location: 'Airfield B' },
        { id: 'AST003', name: 'Bradley IFV', type: 'Vehicle', status: 'Maintenance', location: 'Depot C' },
        { id: 'AST004', name: 'MLRS', type: 'Equipment', status: 'Operational', location: 'Arsenal D' },
        { id: 'AST005', name: 'C-130 Hercules', type: 'Aircraft', status: 'Operational', location: 'Airfield B' }
    ];

    // Generate mock deployment data
    AppState.assets.deployment = [
        { id: 'DEP001', assetId: 'AST001', destination: 'Operation Eagle', status: 'Active', startDate: '2024-01-15', expectedEnd: '2024-06-30' },
        { id: 'DEP002', assetId: 'AST002', destination: 'Operation Falcon', status: 'Standby', startDate: '2024-02-01', expectedEnd: '2024-08-15' },
        { id: 'DEP003', assetId: 'AST005', destination: 'Operation Phoenix', status: 'Active', startDate: '2024-01-20', expectedEnd: '2024-07-20' },
        { id: 'DEP004', assetId: 'AST004', destination: 'Operation Hammer', status: 'Planning', startDate: '2024-04-01', expectedEnd: '2024-09-30' }
    ];

    // Generate mock maintenance data
    AppState.assets.maintenance = [
        { id: 'MNT001', assetId: 'AST003', type: 'Scheduled Service', priority: 'High', startDate: '2024-03-01', status: 'In Progress' },
        { id: 'MNT002', assetId: 'AST001', type: 'Engine Overhaul', priority: 'Medium', startDate: '2024-04-01', status: 'Scheduled' },
        { id: 'MNT003', assetId: 'AST002', type: 'Avionics Update', priority: 'High', startDate: '2024-03-15', status: 'In Progress' },
        { id: 'MNT004', assetId: 'AST004', type: 'Inspection', priority: 'Low', startDate: '2024-05-01', status: 'Scheduled' }
    ];

    // Generate mock disabled units data
    AppState.assets.disabledUnits = [
        { id: 'DIS001', assetId: 'AST003', reason: 'Severe Hull Damage', status: 'Awaiting Repair', location: 'Depot C' },
        { id: 'DIS002', assetId: 'AST004', reason: 'Obsolete Weapon System', status: 'Awaiting Retirement', location: 'Depot D' },
        { id: 'DIS003', assetId: 'AST002', reason: 'Engine Failure', status: 'Under Inspection', location: 'Airfield B' }
    ];
}

function loadDashboard() {
    // Initialize dashboard with first tab
    const firstTab = document.querySelector('.floating-tab');
    if (firstTab) {
        firstTab.click();
    }
}

function loadTabData(tabName) {
    switch(tabName) {
        case 'inventory':
            renderInventoryData();
            break;
        case 'deployment':
            renderDeploymentData();
            break;
        case 'maintenance':
            renderMaintenanceData();
            break;
        case 'disabled-units':
            renderDisabledUnitsData();
            break;
    }
}

// ============================================
// INVENTORY TAB RENDERING
// ============================================

function renderInventoryData() {
    const section = document.getElementById('inventory');
    if (!section) return;

    const placeholderContent = section.querySelector('.placeholder-content');
    if (placeholderContent) {
        placeholderContent.innerHTML = '<p>Inventory table has been removed.</p>';
    }
}

// ============================================
// DEPLOYMENT TAB RENDERING
// MAINTENANCE TAB RENDERING
// ============================================

function renderInventoryData() {
    const section = document.getElementById('inventory');
    if (!section) return;

    const placeholderContent = section.querySelector('.placeholder-content');
    if (!placeholderContent) return;

    if (AppState.assets.inventory.length === 0) {
        placeholderContent.innerHTML = '<p>No inventory records available.</p>';
        return;
    }

    const tableHtml = `
        <div class="data-table">
            <table>
                <thead>
                    <tr>
                        <th>Asset ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Location</th>
                    </tr>
                </thead>
                <tbody>
                    ${AppState.assets.inventory.map(asset => `
                        <tr>
                            <td><code>${asset.id}</code></td>
                            <td>${asset.name}</td>
                            <td>${asset.type}</td>
                            <td><span class="status-badge status-${asset.status.toLowerCase()}">${asset.status}</span></td>
                            <td>${asset.location}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    placeholderContent.innerHTML = tableHtml;
}

function renderDeploymentData() {
    const section = document.getElementById('deployment');
    if (!section) return;

    const placeholderContent = section.querySelector('.placeholder-content');
    if (!placeholderContent) return;

    if (AppState.assets.deployment.length === 0) {
        placeholderContent.innerHTML = '<p>No deployment records available.</p>';
        return;
    }

    const tableHtml = `
        <div class="data-table">
            <table>
                <thead>
                    <tr>
                        <th>Deployment ID</th>
                        <th>Asset</th>
                        <th>Destination</th>
                        <th>Status</th>
                        <th>Start Date</th>
                        <th>Expected End</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${AppState.assets.deployment.map(dep => {
                        const asset = AppState.assets.inventory.find(a => a.id === dep.assetId);
                        return `
                            <tr>
                                <td><code>${dep.id}</code></td>
                                <td>${asset ? asset.name : 'Unknown'}</td>
                                <td>${dep.destination}</td>
                                <td><span class="status-badge status-${dep.status.toLowerCase()}">${dep.status}</span></td>
                                <td>${formatDate(dep.startDate)}</td>
                                <td>${formatDate(dep.expectedEnd)}</td>
                                <td><button class="action-btn" onclick="viewDeploymentDetails('${dep.id}')">Details</button></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    placeholderContent.innerHTML = tableHtml;
}

// ============================================
// MAINTENANCE TAB RENDERING
// ============================================

function renderMaintenanceData() {
    const section = document.getElementById('maintenance');
    if (!section) return;

    const placeholderContent = section.querySelector('.placeholder-content');
    if (placeholderContent) {
        placeholderContent.innerHTML = '<p>Maintenance table has been removed.</p>';
    if (!placeholderContent) return;

    if (AppState.assets.maintenance.length === 0) {
        placeholderContent.innerHTML = '<p>No maintenance records available.</p>';
        return;
    }

    const tableHtml = `
        <div class="data-table">
            <table>
                <thead>
                    <tr>
                        <th>Maintenance ID</th>
                        <th>Asset</th>
                        <th>Type</th>
                        <th>Priority</th>
                        <th>Start Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${AppState.assets.maintenance.map(mnt => {
                        const asset = AppState.assets.inventory.find(a => a.id === mnt.assetId);
                        return `
                            <tr>
                                <td><code>${mnt.id}</code></td>
                                <td>${asset ? asset.name : 'Unknown'}</td>
                                <td>${mnt.type}</td>
                                <td><span class="priority-badge priority-${mnt.priority.toLowerCase()}">${mnt.priority}</span></td>
                                <td>${formatDate(mnt.startDate)}</td>
                                <td><span class="status-badge status-${mnt.status.toLowerCase().replace(' ', '-')}">${mnt.status}</span></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    placeholderContent.innerHTML = tableHtml;
}

function renderDisabledUnitsData() {
    const section = document.getElementById('disabled-units');
    if (!section) return;

    const placeholderContent = section.querySelector('.placeholder-content');
    if (!placeholderContent) return;

    const data = AppState.assets.disabledUnits || [];
    if (data.length === 0) {
        placeholderContent.innerHTML = '<p>No disabled units records available.</p>';
        return;
    }

    const tableHtml = `
        <div class="data-table">
            <table>
                <thead>
                    <tr>
                        <th>Disabled ID</th>
                        <th>Asset</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Location</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(dis => {
                        const asset = AppState.assets.inventory.find(a => a.id === dis.assetId);
                        return `
                            <tr>
                                <td><code>${dis.id}</code></td>
                                <td>${asset ? asset.name : 'Unknown'}</td>
                                <td>${dis.reason}</td>
                                <td><span class="status-badge status-${dis.status.toLowerCase().replace(' ', '-')}">${dis.status}</span></td>
                                <td>${dis.location}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    placeholderContent.innerHTML = tableHtml;
}

// ============================================
// DETAIL VIEW FUNCTIONS (for expansion)
// ============================================

function viewAssetDetails(assetId) {
    const asset = AppState.assets.inventory.find(a => a.id === assetId);
    if (asset) {
        showNotification(`Viewing details for ${asset.name} (${assetId})`, 'info');
        console.log('Asset Details:', asset);
        // Integrate with modal/detail panel here
    }
}

function viewDeploymentDetails(deploymentId) {
    const deployment = AppState.assets.deployment.find(d => d.id === deploymentId);
    if (deployment) {
        showNotification(`Viewing deployment ${deploymentId}`, 'info');
        console.log('Deployment Details:', deployment);
    }
}

function viewMaintenanceDetails(maintenanceId) {
    const maintenance = AppState.assets.maintenance.find(m => m.id === maintenanceId);
    if (maintenance) {
        showNotification(`Viewing maintenance record ${maintenanceId}`, 'info');
        console.log('Maintenance Details:', maintenance);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        font-size: 0.9rem;
        font-weight: 600;
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
    `;

    // Set colors based on type
    const colors = {
        'success': { bg: '#27ae60', text: 'white' },
        'error': { bg: '#e74c3c', text: 'white' },
        'info': { bg: '#3498db', text: 'white' },
        'warning': { bg: '#f39c12', text: 'white' }
    };

    const color = colors[type] || colors.info;
    notification.style.backgroundColor = color.bg;
    notification.style.color = color.text;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation keyframes to document
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }

    /* Data table styles */
    .data-table {
        overflow-x: auto;
        margin-top: 1rem;
    }

    .data-table table {
        width: 100%;
        border-collapse: collapse;
        background: var(--secondary-dark);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        overflow: hidden;
    }

    .data-table thead {
        background: var(--primary-dark);
        border-bottom: 2px solid var(--accent-olive);
        border-bottom: 2px solid var(--border-color);
    }

    .data-table th,
    .data-table td {
        padding: 1rem;
        text-align: left;
        font-size: 0.9rem;
        color: var(--light-text);
        border-bottom: 1px solid var(--border-color);
    }

    .data-table th {
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .data-table tbody tr:hover {
        background-color: rgba(85, 107, 47, 0.1);
        background-color: rgba(26, 26, 26, 0.1);
    }

    .data-table code {
        background-color: var(--primary-dark);
        padding: 0.2rem 0.4rem;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        color: #27ae60;
        font-size: 0.8rem;
    }

    /* Status badges */
    .status-badge {
        display: inline-block;
        padding: 0.4rem 0.8rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }

    .status-operational {
        background-color: rgba(39, 174, 96, 0.2);
        color: #27ae60;
    }

    .status-maintenance {
        background-color: rgba(241, 196, 15, 0.2);
        color: #f39c12;
    }

    .status-active {
        background-color: rgba(39, 174, 96, 0.2);
        color: #27ae60;
    }

    .status-standby {
        background-color: rgba(52, 152, 219, 0.2);
        color: #3498db;
    }

    .status-planning {
        background-color: rgba(155, 89, 182, 0.2);
        color: #9b59b6;
    }

    .status-in-progress {
        background-color: rgba(241, 196, 15, 0.2);
        color: #f39c12;
    }

    .status-scheduled {
        background-color: rgba(52, 152, 219, 0.2);
        color: #3498db;
    }

    /* Priority badges */
    .priority-badge {
        display: inline-block;
        padding: 0.4rem 0.8rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }

    .priority-high {
        background-color: rgba(231, 76, 60, 0.2);
        color: #e74c3c;
    }

    .priority-medium {
        background-color: rgba(241, 196, 15, 0.2);
        color: #f39c12;
    }

    .priority-low {
        background-color: rgba(52, 152, 219, 0.2);
        color: #3498db;
    }

    /* Action buttons */
    .action-btn {
        padding: 0.4rem 0.8rem;
        background-color: var(--accent-olive);
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        letter-spacing: 0.5px;
    }

    .action-btn:hover {
        background-color: var(--accent-muted);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(85, 107, 47, 0.3);
    }

    .action-btn:active {
        transform: translateY(0);
    }

    /* Notification styles */
    .notification {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
`;
document.head.appendChild(style);

// ============================================
// API INTEGRATION HELPERS (for FastAPI)
// ============================================

const APIClient = {
    baseURL: 'http://localhost:8000/api',

    async authenticate(militaryId, accessCode) {
        try {
            const response = await fetch(`${this.baseURL}/authenticate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    military_id: militaryId,
                    access_code: accessCode
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Authentication error:', error);
            return null;
        }
    },

    async getInventory() {
        try {
            const response = await fetch(`${this.baseURL}/inventory`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching inventory:', error);
            return [];
        }
    },

    async getDeployments() {
        try {
            const response = await fetch(`${this.baseURL}/deployments`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching deployments:', error);
            return [];
        }
    },

    async getMaintenance() {
        try {
            const response = await fetch(`${this.baseURL}/maintenance`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching maintenance records:', error);
            return [];
        }
    },

    async updateAsset(assetId, data) {
        try {
            const response = await fetch(`${this.baseURL}/inventory/${assetId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating asset:', error);
            return null;
        }
    }
};

// ============================================
// EXPORT FOR USE IN FASTAPI
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppState, APIClient };
}
}
