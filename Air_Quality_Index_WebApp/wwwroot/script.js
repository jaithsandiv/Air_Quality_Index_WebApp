// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration ---
    const API_ENDPOINT = '/api/sensors'; // Example: Replace with your actual API or set to null for simulation
    const SIMULATION_INTERVAL_MS = 30000; // Default simulation interval
    const ADMIN_USERNAME = 'admin'; // Added admin username constant
    const ADMIN_PASSWORD = 'password'; // !! IMPORTANT: NEVER hardcode passwords in production client-side code !! This is just for demonstration. Use a backend for real auth.

    // --- State Variables ---
    let map = null;
    let historicalChart = null;
    let sensors = []; // Holds sensor data { id, name, lat, lng, aqi, status, marker }
    let selectedSensor = null;
    let simulationIntervalId = null;
    let simulationActive = true; // Initial state from HTML checkbox
    let isAdminLoggedIn = false;

    // --- DOM Element References ---
    const mapContainer = document.getElementById('map');
    const sensorDetailsSection = document.getElementById('sensor-details');
    const noSensorSelectedSection = document.getElementById('no-sensor-selected');
    const sensorDescription = document.getElementById('sensor-description');
    const aqiIndicator = document.getElementById('aqi-indicator');
    const aqiValue = document.getElementById('aqi-value');
    const aqiCategory = document.getElementById('aqi-category');
    const timeRangeSelect = document.getElementById('time-range');
    const historicalChartCanvas = document.getElementById('historical-chart');

    // Admin Login Elements
    const usernameInput = document.getElementById('username'); // Added username input reference
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');
    const adminLoginSection = document.getElementById('admin-login'); // Added missing reference
    const adminPanelSection = document.getElementById('admin-panel'); // Added missing reference

    // Admin Sensor Management Elements
    const addSensorBtn = document.getElementById('add-sensor-btn');
    const sensorNameInput = document.getElementById('sensor-name');
    const sensorAqiInput = document.getElementById('sensor-aqi');
    const sensorLatInput = document.getElementById('sensor-lat');
    const sensorLngInput = document.getElementById('sensor-lng');
    const sensorsTableBody = document.getElementById('sensors-table-body');

    // Admin Simulation Settings Elements
    const simulationActiveToggle = document.getElementById('simulation-active');
    const simulationIntervalInput = document.getElementById('simulation-interval');
    const saveSimulationBtn = document.getElementById('save-simulation-btn');

    // Admin Alert Config Elements
    // ... get elements for threshold inputs and save button ...
    const saveThresholdsBtn = document.getElementById('save-thresholds-btn');


    // Admin User Management Elements
    // ... get elements for user form, table, add button ...
    const addUserBtn = document.getElementById('add-user-btn');
    const usersTableBody = document.getElementById('users-table-body');

    // Admin System Status Elements
    const activeSensorsCountEl = document.getElementById('active-sensors-count');
    const simulationStatusEl = document.getElementById('simulation-status');
    const dataPointsTodayEl = document.getElementById('data-points-today'); // Added

    // Tab Elements
    const mainTabsContainer = document.querySelector('.main-tabs .tabs-list');
    const mainTabContents = document.querySelectorAll('.main-tabs > .tab-content');
    const adminTabsContainer = document.querySelector('.admin-tabs .tabs-list');
    const adminTabContents = document.querySelectorAll('.admin-tabs > .tab-content');


    // --- AQI Helper Functions ---
    function getAqiInfo(aqi) {
        // These thresholds should match the legend and potentially be configurable (from admin panel)
        // Example: const thresholds = getThresholdsFromAdmin();
        if (aqi <= 50) return { category: "Good", color: "#4ade80", className: "good" };
        if (aqi <= 100) return { category: "Moderate", color: "#facc15", className: "moderate" };
        if (aqi <= 150) return { category: "Unhealthy for Sensitive Groups", color: "#f97316", className: "usg" };
        if (aqi <= 200) return { category: "Unhealthy", color: "#ef4444", className: "unhealthy" };
        if (aqi <= 300) return { category: "Very Unhealthy", color: "#a855f7", className: "very-unhealthy" };
        return { category: "Hazardous", color: "#7f1d1d", className: "hazardous" };
    }

    function updateAqiIndicator(aqi) {
        const info = getAqiInfo(aqi);
        aqiIndicator.style.backgroundColor = info.color;
        aqiValue.textContent = aqi ?? 'N/A';
        aqiCategory.textContent = info.category;
    }

    // --- Map Functions (Leaflet) ---
    function initializeMap() {
        if (!mapContainer) return;
        // Centered on Colombo, Sri Lanka
        map = L.map(mapContainer).setView([6.9271, 79.8612], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Load initial sensor data
        loadSensorData();
    }

    function addSensorMarker(sensor) {
        if (!map) return;
        const aqiInfo = getAqiInfo(sensor.aqi);

        // Custom icon (optional, you can style it more)
        const iconHtml = `<div style="background-color: ${aqiInfo.color}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 1px solid #fff; box-shadow: 0 0 5px rgba(0,0,0,0.5);">${sensor.aqi}</div>`;
        const customIcon = L.divIcon({
            html: iconHtml,
            className: '', // Important to clear default leaflet styles if using complex HTML
            iconSize: [30, 30],
            iconAnchor: [15, 15] // Center the icon
        });

        const marker = L.marker([sensor.lat, sensor.lng], { icon: customIcon })
                       .addTo(map)
                       .bindPopup(`<b>${sensor.name}</b><br>AQI: ${sensor.aqi} (${aqiInfo.category})`);

        marker.on('click', () => {
            handleSensorSelection(sensor);
        });

        sensor.marker = marker; // Store marker reference
    }

     function updateSensorMarker(sensor) {
         if (!sensor || !sensor.marker) return;
         const aqiInfo = getAqiInfo(sensor.aqi);
         const iconHtml = `<div style="background-color: ${aqiInfo.color}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 1px solid #fff; box-shadow: 0 0 5px rgba(0,0,0,0.5);">${sensor.aqi}</div>`;
         const customIcon = L.divIcon({
             html: iconHtml,
             className: '',
             iconSize: [30, 30],
             iconAnchor: [15, 15]
         });
         sensor.marker.setIcon(customIcon);
         sensor.marker.setPopupContent(`<b>${sensor.name}</b><br>AQI: ${sensor.aqi} (${aqiInfo.category})`);

         // If this sensor is currently selected, update the details panel too
         if (selectedSensor && selectedSensor.id === sensor.id) {
             updateAqiIndicator(sensor.aqi);
         }
     }

    // --- Chart Functions (Chart.js) ---
    function initializeChart() {
        if (!historicalChartCanvas) return;
        const ctx = historicalChartCanvas.getContext('2d');
        historicalChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [], // Populate with time labels
                datasets: [{
                    label: 'AQI History',
                    data: [], // Populate with AQI data
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'AQI Value'
                        }
                    },
                    x: {
                         title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                }
            }
        });
    }

    function updateChart(sensorId, timeRange) {
        if (!historicalChart) return;
        console.log(`Fetching historical data for sensor ${sensorId}, range: ${timeRange}`);
        // --- TODO: Fetch or simulate historical data based on sensorId and timeRange ---
        // Example simulation:
        let labels = [];
        let data = [];
        const now = Date.now();
        let points = 0;
        let interval = 0;

        switch (timeRange) {
            case 'day':
                points = 24;
                interval = 60 * 60 * 1000; // Hourly for last 24h
                break;
            case 'week':
                points = 7;
                interval = 24 * 60 * 60 * 1000; // Daily for last week
                break;
            case 'month':
                points = 30; // Approx
                interval = 24 * 60 * 60 * 1000; // Daily for last month
                break;
            default:
                points = 24;
                interval = 60 * 60 * 1000;
        }

        for (let i = points - 1; i >= 0; i--) {
            const timestamp = now - i * interval;
            const date = new Date(timestamp);
            if (timeRange === 'day') {
                labels.push(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            } else {
                 labels.push(date.toLocaleDateString([], { month: 'short', day: 'numeric' }));
            }
            data.push(Math.floor(Math.random() * 150) + 20); // Random AQI data
        }


        historicalChart.data.labels = labels;
        historicalChart.data.datasets[0].data = data;
        historicalChart.update();
    }

    // --- Data Handling ---
    function loadSensorData() {
        if (API_ENDPOINT) {
            // TODO: Fetch from API
            console.warn("API fetching not implemented. Using simulation.");
            simulateInitialSensorData();
        } else {
            simulateInitialSensorData();
        }
    }

    function simulateInitialSensorData() {
        // Example data - replace with real data or fetch
        sensors = [
            { id: 1, name: "Wellawatte", lat: 6.876, lng: 79.858, aqi: 55, status: 'active' },
            { id: 2, name: "Fort", lat: 6.934, lng: 79.847, aqi: 72, status: 'active' },
            { id: 3, name: "Borella", lat: 6.914, lng: 79.878, aqi: 48, status: 'active' },
            { id: 4, name: "Nugegoda", lat: 6.867, lng: 79.888, aqi: 90, status: 'active' },
            { id: 5, name: "Dehiwala", lat: 6.851, lng: 79.866, aqi: 110, status: 'active' }
        ];
        sensors.forEach(addSensorMarker);
        updateAdminSensorTable();
        updateSystemStatus(); // Update status after loading
        startSimulation(); // Start simulation after initial load
    }

     function startSimulation() {
         if (simulationIntervalId) {
             clearInterval(simulationIntervalId); // Clear existing interval if any
         }
         if (!simulationActive) {
             console.log("Simulation is disabled.");
             updateSystemStatus(); // Ensure status reflects disabled state
             return;
         }

         const intervalMs = parseInt(simulationIntervalInput.value, 10) * 1000 || SIMULATION_INTERVAL_MS;
         console.log(`Starting simulation with interval: ${intervalMs}ms`);

         simulationIntervalId = setInterval(() => {
             if (!simulationActive) {
                 clearInterval(simulationIntervalId);
                 simulationIntervalId = null;
                 console.log("Simulation stopped.");
                 updateSystemStatus();
                 return;
             }
             sensors.forEach(sensor => {
                 // Simulate AQI change (+/- 5)
                 let change = Math.floor(Math.random() * 11) - 5;
                 sensor.aqi = Math.max(0, Math.min(500, sensor.aqi + change)); // Clamp AQI between 0 and 500
                 updateSensorMarker(sensor);
             });
             updateAdminSensorTable(); // Update table with new values
             updateSystemStatus();
             // If a sensor is selected, update its chart
             if (selectedSensor) {
                 updateChart(selectedSensor.id, timeRangeSelect.value);
             }
             console.log("Simulated data update cycle finished.");
         }, intervalMs);
         updateSystemStatus(); // Reflect running status immediately
     }

    // --- UI Update Functions ---
    function handleSensorSelection(sensor) {
        selectedSensor = sensor;
        sensorDescription.textContent = `Details for ${sensor.name}`;
        updateAqiIndicator(sensor.aqi);
        updateChart(sensor.id, timeRangeSelect.value);

        // Show details, hide placeholder
        sensorDetailsSection.classList.remove('hidden');
        noSensorSelectedSection.classList.add('hidden');

        // Optional: Pan map to the selected sensor
        if (map && sensor.marker) {
            map.setView([sensor.lat, sensor.lng], 14); // Zoom in a bit
            sensor.marker.openPopup();
        }
    }

    function clearSensorSelection() {
        selectedSensor = null;
        sensorDescription.textContent = 'Select a sensor on the map to view details';
        // Hide details, show placeholder
        sensorDetailsSection.classList.add('hidden');
        noSensorSelectedSection.classList.remove('hidden');
        // Clear chart maybe? Or leave the last one?
        // historicalChart.data.labels = [];
        // historicalChart.data.datasets[0].data = [];
        // historicalChart.update();
    }

    function setupTabs(tabsContainer, tabContents) {
         if (!tabsContainer) return;
         const tabTriggers = tabsContainer.querySelectorAll('.tab-trigger');

         tabsContainer.addEventListener('click', (event) => {
             const trigger = event.target.closest('.tab-trigger');
             if (!trigger) return;

             const targetTabId = trigger.dataset.tab;

             // Update triggers
             tabTriggers.forEach(t => t.classList.remove('active'));
             trigger.classList.add('active');

             // Update content
             tabContents.forEach(content => {
                 if (content.id === targetTabId) {
                     content.classList.add('active');
                 } else {
                     content.classList.remove('active');
                 }
             });
         });
     }

    // --- Admin Panel Functions ---
    function handleLogin() {
        const enteredUsername = usernameInput.value.trim();
        const enteredPassword = passwordInput.value;

        if (enteredUsername === ADMIN_USERNAME && enteredPassword === ADMIN_PASSWORD) {
            isAdminLoggedIn = true;
            adminLoginSection.classList.add('hidden');
            adminPanelSection.classList.remove('hidden');
            loginError.classList.add('hidden');
            usernameInput.value = ''; // Clear username field
            passwordInput.value = ''; // Clear password field
            loadAdminData(); // Load data needed for admin panel
            console.log('Admin login successful');
        } else {
            isAdminLoggedIn = false;
            loginError.textContent = 'Invalid username or password.'; // Updated error message
            loginError.classList.remove('hidden');
            console.log('Admin login failed');
        }
    }

     function loadAdminData() {
         // Load data needed specifically when admin logs in
         updateAdminSensorTable();
         updateAdminUserTable(); // Example
         updateSystemStatus();
         // Set initial values for settings forms
         simulationActiveToggle.checked = simulationActive;
         simulationIntervalInput.value = (simulationIntervalId ? (parseInt(simulationIntervalInput.value, 10)) : (SIMULATION_INTERVAL_MS / 1000)); // Show current interval
         // Load thresholds, etc.
     }

    function handleAddSensor() {
        const name = sensorNameInput.value.trim();
        const aqi = parseInt(sensorAqiInput.value, 10);
        const lat = parseFloat(sensorLatInput.value);
        const lng = parseFloat(sensorLngInput.value);

        if (!name || isNaN(aqi) || isNaN(lat) || isNaN(lng)) {
            alert('Please fill in all sensor fields correctly.');
            return;
        }

        const newSensor = {
            // Generate a simple ID (replace with proper ID generation if using API)
            id: sensors.length > 0 ? Math.max(...sensors.map(s => s.id)) + 1 : 1,
            name: name,
            lat: lat,
            lng: lng,
            aqi: aqi,
            status: 'active' // Default status
        };

        sensors.push(newSensor);
        addSensorMarker(newSensor); // Add to map
        updateAdminSensorTable(); // Update table
        updateSystemStatus(); // Update sensor count

        // Clear form
        sensorNameInput.value = '';
        sensorAqiInput.value = '50'; // Reset to default
        sensorLatInput.value = '';
        sensorLngInput.value = '';

        console.log('Added new sensor:', newSensor);
    }

     function handleDeleteSensor(sensorId) {
         if (!confirm(`Are you sure you want to delete sensor ID ${sensorId}?`)) {
             return;
         }

         const sensorIndex = sensors.findIndex(s => s.id === sensorId);
         if (sensorIndex > -1) {
             const sensorToRemove = sensors[sensorIndex];

             // Remove marker from map
             if (sensorToRemove.marker && map) {
                 map.removeLayer(sensorToRemove.marker);
             }

             // Remove from sensors array
             sensors.splice(sensorIndex, 1);

             // If the deleted sensor was selected, clear selection
             if (selectedSensor && selectedSensor.id === sensorId) {
                 clearSensorSelection();
             }

             // Update UI
             updateAdminSensorTable();
             updateSystemStatus();
             console.log(`Deleted sensor ID ${sensorId}`);
         } else {
             console.error(`Sensor with ID ${sensorId} not found for deletion.`);
         }
     }

     function handleEditSensor(sensorId) {
         // TODO: Implement editing logic
         // 1. Find sensor data
         // 2. Populate a modal or form with current data
         // 3. Handle form submission to update sensor data in the `sensors` array
         // 4. Update the marker (updateSensorMarker)
         // 5. Update the admin table (updateAdminSensorTable)
         alert(`Editing sensor ID ${sensorId} - Functionality not fully implemented.`);
     }


    function updateAdminSensorTable() {
        if (!sensorsTableBody) return;
        sensorsTableBody.innerHTML = ''; // Clear existing rows

        sensors.forEach(sensor => {
            const aqiInfo = getAqiInfo(sensor.aqi);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sensor.id}</td>
                <td>${sensor.name}</td>
                <td>${sensor.lat.toFixed(4)}, ${sensor.lng.toFixed(4)}</td>
                <td>${sensor.aqi}</td>
                <td><span class="badge badge-${aqiInfo.className}">${aqiInfo.category}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm edit-sensor-btn" data-id="${sensor.id}">Edit</button>
                    <button class="btn btn-outline btn-sm text-red-500 delete-sensor-btn" data-id="${sensor.id}">Delete</button>
                </td>
            `;
            sensorsTableBody.appendChild(row);
        });

         // Add event listeners for the new buttons
         sensorsTableBody.querySelectorAll('.edit-sensor-btn').forEach(btn => {
             btn.addEventListener('click', () => handleEditSensor(parseInt(btn.dataset.id, 10)));
         });
         sensorsTableBody.querySelectorAll('.delete-sensor-btn').forEach(btn => {
             btn.addEventListener('click', () => handleDeleteSensor(parseInt(btn.dataset.id, 10)));
         });
    }

     function handleSaveSimulationSettings() {
         simulationActive = simulationActiveToggle.checked;
         const newIntervalSeconds = parseInt(simulationIntervalInput.value, 10);

         if (isNaN(newIntervalSeconds) || newIntervalSeconds < 5 || newIntervalSeconds > 300) {
             alert("Invalid simulation interval. Please enter a value between 5 and 300 seconds.");
             // Optionally reset input to previous valid value
             simulationIntervalInput.value = (simulationIntervalId ? (parseInt(simulationIntervalInput.value, 10)) : (SIMULATION_INTERVAL_MS / 1000));
             return;
         }

         // Restart simulation with new settings
         startSimulation();
         alert("Simulation settings saved.");
     }

     function handleSaveThresholds() {
         // TODO: Get threshold values from inputs
         // Store them (e.g., in variables or local storage)
         // Update getAqiInfo function potentially if it uses these variables
         alert("Saving thresholds - Functionality not fully implemented.");
     }

     function handleAddUser() {
         // TODO: Get user details from form
         // Validate input
         // Add user (e.g., to an array or send to API)
         // Update user table
         // Clear form
         alert("Adding user - Functionality not fully implemented.");
     }

     function updateAdminUserTable() {
          if (!usersTableBody) return;
         // Populate users table without status column
         usersTableBody.innerHTML = `
             <tr>
                 <td>admin_user</td>
                 <td>admin@example.com</td>
                 <td><button class="btn btn-outline btn-sm text-red-500">Remove</button></td>
             </tr>
         `;
         // Add event listeners for actions
     }

    function updateSystemStatus() {
        if (activeSensorsCountEl) {
            activeSensorsCountEl.textContent = sensors.length;
        }
        if (simulationStatusEl) {
             simulationStatusEl.textContent = simulationActive && simulationIntervalId ? 'Running' : 'Stopped';
             simulationStatusEl.style.color = simulationActive && simulationIntervalId ? '#065f46' : '#991b1b'; // Green or Red
        }
        if (dataPointsTodayEl) {
            // TODO: Implement logic to track data points generated/fetched today
            // For now, just showing a placeholder
            dataPointsTodayEl.textContent = Math.floor(Math.random() * 1000); // Placeholder
        }
    }

    // Modal and confirmation dialog logic
    const editSensorModal = document.getElementById('edit-sensor-modal');
    const editSensorForm = document.getElementById('edit-sensor-form');
    const cancelEditSensorBtn = document.getElementById('cancel-edit-sensor');
    const editSensorNameInput = document.getElementById('edit-sensor-name');
    const editSensorAqiInput = document.getElementById('edit-sensor-aqi');
    const editSensorLatInput = document.getElementById('edit-sensor-lat');
    const editSensorLngInput = document.getElementById('edit-sensor-lng');

    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmMessageEl = document.getElementById('confirm-message');
    const confirmYesBtn = document.getElementById('confirm-yes');
    const confirmNoBtn = document.getElementById('confirm-no');
    let confirmationCallback = null;
    let editingSensorId = null;

    function showConfirmation(message, callback) {
        confirmMessageEl.textContent = message;
        confirmationModal.showModal();
        confirmationCallback = callback;
    }
    function hideConfirmation() {
        confirmationModal.close();
        confirmationCallback = null;
    }
    confirmYesBtn.addEventListener('click', () => {
        if (confirmationCallback) confirmationCallback();
        hideConfirmation();
    });
    confirmNoBtn.addEventListener('click', hideConfirmation);

    // Edit sensor handlers
    function openEditSensorModal(sensor) {
        editingSensorId = sensor.id;
        editSensorNameInput.value = sensor.name;
        editSensorAqiInput.value = sensor.aqi;
        editSensorLatInput.value = sensor.lat;
        editSensorLngInput.value = sensor.lng;
        editSensorModal.showModal();
    }
    cancelEditSensorBtn.addEventListener('click', () => {
        editSensorModal.close();
    });
    editSensorForm.addEventListener('submit', event => {
        event.preventDefault();
        const sensor = sensors.find(s => s.id === editingSensorId);
        if (!sensor) return;
        sensor.name = editSensorNameInput.value.trim();
        sensor.aqi = parseInt(editSensorAqiInput.value, 10) || sensor.aqi;
        sensor.lat = parseFloat(editSensorLatInput.value) || sensor.lat;
        sensor.lng = parseFloat(editSensorLngInput.value) || sensor.lng;
        updateSensorMarker(sensor);
        updateAdminSensorTable();
        editSensorModal.close();
    });

    // Override sensor table button wiring to use modals
    function updateAdminSensorTable() {
        if (!sensorsTableBody) return;
        sensorsTableBody.innerHTML = '';
        sensors.forEach(sensor => {
            const aqiInfo = getAqiInfo(sensor.aqi);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sensor.id}</td>
                <td>${sensor.name}</td>
                <td>${sensor.lat.toFixed(4)}, ${sensor.lng.toFixed(4)}</td>
                <td>${sensor.aqi}</td>
                <td><span class="badge badge-${aqiInfo.className}">${aqiInfo.category}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm edit-sensor-btn" data-id="${sensor.id}">Edit</button>
                    <button class="btn btn-outline btn-sm text-red-500 delete-sensor-btn" data-id="${sensor.id}">Delete</button>
                </td>
            `;
            sensorsTableBody.appendChild(row);
        });
        sensorsTableBody.querySelectorAll('.edit-sensor-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id, 10);
                const sensor = sensors.find(s => s.id === id);
                if (sensor) openEditSensorModal(sensor);
            });
        });
        sensorsTableBody.querySelectorAll('.delete-sensor-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id, 10);
                showConfirmation(
                    `Are you sure you want to delete sensor ID ${id}?`,
                    () => handleDeleteSensor(id)
                );
            });
        });
    }

    // Override user table removals to use confirmation dialog
    function updateAdminUserTable() {
        if (!usersTableBody) return;
        usersTableBody.innerHTML = '';
        // Example static users, replace with real data as needed
        const exampleUsers = [{ username: 'admin_user', email: 'admin@example.com' }];
        exampleUsers.forEach(u => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${u.username}</td>
                <td>${u.email}</td>
                <td><button class="btn btn-outline btn-sm text-red-500 remove-user-btn">Remove</button></td>
            `;
            usersTableBody.appendChild(row);
        });
        usersTableBody.querySelectorAll('.remove-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const row = btn.closest('tr');
                const username = row.children[0].textContent;
                showConfirmation(
                    `Are you sure you want to remove user ${username}?`,
                    () => {
                        row.remove();
                        console.log(`User removed: ${username}`);
                    }
                );
            });
        });
    }

    // --- Event Listeners ---
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', (event) => {
            if (selectedSensor) {
                updateChart(selectedSensor.id, event.target.value);
            }
        });
    }

    // Event listeners for login
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    if (usernameInput) {
        usernameInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                handleLogin();
            }
        });
    }
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                handleLogin();
            }
        });
    }

    if (addSensorBtn) {
        addSensorBtn.addEventListener('click', handleAddSensor);
    }

     if (saveSimulationBtn) {
         saveSimulationBtn.addEventListener('click', handleSaveSimulationSettings);
     }

     if (saveThresholdsBtn) {
         saveThresholdsBtn.addEventListener('click', handleSaveThresholds);
     }

     if (addUserBtn) {
         addUserBtn.addEventListener('click', handleAddUser);
     }

     // Handle simulation toggle change immediately
     if (simulationActiveToggle) {
         simulationActiveToggle.addEventListener('change', () => {
             simulationActive = simulationActiveToggle.checked;
             if (!simulationActive && simulationIntervalId) {
                 clearInterval(simulationIntervalId);
                 simulationIntervalId = null;
                 console.log("Simulation stopped via toggle.");
             } else if (simulationActive && !simulationIntervalId) {
                 startSimulation(); // Restart if toggled back on
             }
             updateSystemStatus(); // Update status text
         });
     }

    // Setup Tab Functionality
    setupTabs(mainTabsContainer, mainTabContents);
    setupTabs(adminTabsContainer, adminTabContents);


    // --- Initialization ---
    initializeMap();
    initializeChart();
    // Initial UI state
    clearSensorSelection(); // Ensure details are hidden initially
    updateSystemStatus(); // Show initial counts/status

    console.log('Air Quality Dashboard Initialized');

}); // End DOMContentLoaded