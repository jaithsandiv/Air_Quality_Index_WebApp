// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration ---
    const API_ENDPOINT = '/admin/sensors'; // Updated to point to our actual backend API endpoint
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
    // Add thresholds state variable
    let aqiThresholds = {
        moderateThreshold: 51,
        unhealthySensitiveThreshold: 101,
        unhealthyThreshold: 151,
        veryUnhealthyThreshold: 201,
        hazardousThreshold: 301
    };

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
        // Use dynamic thresholds from our aqiThresholds object
        if (aqi < aqiThresholds.moderateThreshold) return { category: "Good", color: "#4ade80", className: "good" };
        if (aqi < aqiThresholds.unhealthySensitiveThreshold) return { category: "Moderate", color: "#facc15", className: "moderate" };
        if (aqi < aqiThresholds.unhealthyThreshold) return { category: "Unhealthy for Sensitive Groups", color: "#f97316", className: "usg" };
        if (aqi < aqiThresholds.veryUnhealthyThreshold) return { category: "Unhealthy", color: "#ef4444", className: "unhealthy" };
        if (aqi < aqiThresholds.hazardousThreshold) return { category: "Very Unhealthy", color: "#a855f7", className: "very-unhealthy" };
        return { category: "Hazardous", color: "#7f1d1d", className: "hazardous" };
    }

    function updateAqiIndicator(aqi) {
        const info = getAqiInfo(aqi);
        aqiIndicator.style.backgroundColor = info.color;
        aqiValue.textContent = aqi ?? 'N/A';
        aqiCategory.textContent = info.category;
    }

    // --- AQI Legend Update Function ---
    function updateAqiLegend() {
        const legendContainer = document.querySelector('.aqi-legend');
        if (!legendContainer) return;
        
        // Clear existing legend items
        legendContainer.innerHTML = '';
        
        // Create and add the new legend items based on current thresholds
        // Good
        const goodItem = createLegendItem('#4ade80', 'Good', `0-${aqiThresholds.moderateThreshold - 1}`);
        legendContainer.appendChild(goodItem);
        
        // Moderate
        const moderateItem = createLegendItem('#facc15', 'Moderate', 
            `${aqiThresholds.moderateThreshold}-${aqiThresholds.unhealthySensitiveThreshold - 1}`);
        legendContainer.appendChild(moderateItem);
        
        // Unhealthy for Sensitive Groups
        const usgItem = createLegendItem('#f97316', 'Unhealthy for Sensitive Groups', 
            `${aqiThresholds.unhealthySensitiveThreshold}-${aqiThresholds.unhealthyThreshold - 1}`);
        legendContainer.appendChild(usgItem);
        
        // Unhealthy
        const unhealthyItem = createLegendItem('#ef4444', 'Unhealthy', 
            `${aqiThresholds.unhealthyThreshold}-${aqiThresholds.veryUnhealthyThreshold - 1}`);
        legendContainer.appendChild(unhealthyItem);
        
        // Very Unhealthy
        const veryUnhealthyItem = createLegendItem('#a855f7', 'Very Unhealthy', 
            `${aqiThresholds.veryUnhealthyThreshold}-${aqiThresholds.hazardousThreshold - 1}`);
        legendContainer.appendChild(veryUnhealthyItem);
        
        // Hazardous
        const hazardousItem = createLegendItem('#7f1d1d', 'Hazardous', 
            `${aqiThresholds.hazardousThreshold}+`);
        legendContainer.appendChild(hazardousItem);
        
        console.log('AQI legend updated with custom thresholds');
    }

    // Helper function to create a legend item
    function createLegendItem(color, category, range) {
        const item = document.createElement('div');
        item.className = 'aqi-category';
        item.innerHTML = `
            <div class="aqi-color" style="background-color: ${color};"></div>
            <p>${category}</p>
            <p>${range}</p>
        `;
        return item;
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
        
        // Fetch real historical data from our new API endpoint
        fetch(`/Home/SensorHistory?sensorId=${sensorId}&timeRange=${timeRange}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Received historical data:', data);
                
                if (data.labels && data.data) {
                    // Update chart with real data
                    historicalChart.data.labels = data.labels;
                    historicalChart.data.datasets[0].data = data.data;
                    
                    // Update chart colors based on data values
                    const colors = data.data.map(value => getAqiInfo(value).color);
                    historicalChart.data.datasets[0].borderColor = colors[0] || 'rgb(75, 192, 192)';
                    
                    // Add gradient fill
                    const ctx = historicalChart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    const mainColor = colors[0] || 'rgb(75, 192, 192)';
                    gradient.addColorStop(0, mainColor + '80'); // Add transparency
                    gradient.addColorStop(1, mainColor + '10');
                    historicalChart.data.datasets[0].backgroundColor = gradient;
                    
                    historicalChart.update();
                } else {
                    console.warn('No historical data available for this sensor/timeframe');
                    // Clear chart or show placeholder message
                    historicalChart.data.labels = [];
                    historicalChart.data.datasets[0].data = [];
                    historicalChart.update();
                }
            })
            .catch(error => {
                console.error('Error fetching historical data:', error);
                
                // Show error in chart or use placeholder data
                historicalChart.data.labels = ['Error loading data'];
                historicalChart.data.datasets[0].data = [0];
                historicalChart.update();
            });
    }

    // --- Data Handling ---
    function loadSensorData() {
        console.log('Loading sensor data from API endpoint:', API_ENDPOINT);
        
        if (API_ENDPOINT) {
            fetch(API_ENDPOINT)
                .then(response => response.json())
                .then(data => {
                    console.log('Received sensor data:', data);
                    if (Array.isArray(data) && data.length > 0) {
                        sensors = data.map(sensor => ({
                            id: sensor.id,
                            name: sensor.name,
                            lat: sensor.lat,
                            lng: sensor.lng,
                            aqi: sensor.aqi,
                            status: sensor.status || 'active',
                            lastUpdated: sensor.lastUpdated
                        }));
                        
                        // Clear existing markers from map if any
                        sensors.forEach(sensor => {
                            if (sensor.marker && map) {
                                map.removeLayer(sensor.marker);
                                sensor.marker = null;
                            }
                        });
                        
                        console.log('Processed sensor data:', sensors);
                        sensors.forEach(addSensorMarker);
                        updateAdminSensorTable();
                        updateSystemStatus();
                        
                        // Set up refresh timer to periodically reload data
                        setupSensorDataRefresh();
                    } else {
                        console.warn('No sensors found, falling back to simulation');
                        simulateInitialSensorData();
                    }
                })
                .catch(error => {
                    console.error('Error fetching sensor data:', error);
                    simulateInitialSensorData();
                });
        } else {
            console.warn('No API endpoint provided, using simulation');
            simulateInitialSensorData();
        }
    }

    function setupSensorDataRefresh() {
        // Refresh sensor data every 15 seconds to show simulation results
        if (simulationIntervalId) {
            clearInterval(simulationIntervalId);
        }
        
        const refreshInterval = 15000; // 15 seconds
        simulationIntervalId = setInterval(() => {
            console.log('Refreshing sensor data from API');
            fetch(API_ENDPOINT)
                .then(response => response.json())
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) {
                        // Update AQI values and marker colors
                        data.forEach(apiSensor => {
                            const sensor = sensors.find(s => s.id === apiSensor.id);
                            if (sensor) {
                                sensor.aqi = apiSensor.aqi;
                                sensor.status = apiSensor.status;
                                sensor.lastUpdated = apiSensor.lastUpdated;
                                updateSensorMarker(sensor);
                            }
                        });
                        
                        // Update UI components
                        updateAdminSensorTable();
                        updateSystemStatus();
                        
                        // If a sensor is selected, update its chart
                        if (selectedSensor) {
                            const updatedSensor = data.find(s => s.id === selectedSensor.id);
                            if (updatedSensor) {
                                selectedSensor.aqi = updatedSensor.aqi;
                                updateAqiIndicator(selectedSensor.aqi);
                                updateChart(selectedSensor.id, timeRangeSelect.value);
                            }
                        }
                    }
                })
                .catch(error => {
                    console.error('Error refreshing sensor data:', error);
                });
        }, refreshInterval);
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
                    
                    // Special handling for admin-users tab
                    if (targetTabId === 'admin-users') {
                        console.log('Loading users as user management tab was activated');
                        loadAdminUsers();
                    }
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
        // Call backend login endpoint
        fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: enteredUsername, password: enteredPassword })
        })
        .then(async response => {
            const result = await response.json();
            if (response.ok && result.success) {
                isAdminLoggedIn = true;
                adminLoginSection.classList.add('hidden');
                adminPanelSection.classList.remove('hidden');
                loginError.classList.add('hidden');
                usernameInput.value = '';
                passwordInput.value = '';                
                loadAdminData();
                console.log('Admin login successful');
            } else {
                isAdminLoggedIn = false;
                loginError.textContent = result.message || 'Invalid username or password.';
                loginError.classList.remove('hidden');
                console.log('Admin login failed');
            }
        })
        .catch(err => {
            console.error('Login request error:', err);
            loginError.textContent = 'Login failed. Please try again.';
            loginError.classList.remove('hidden');
        });
    }

     function loadAdminData() {
         // Load data needed specifically when admin logs in
         updateAdminSensorTable();
         loadAdminUsers(); // Call the loadAdminUsers function directly
         updateSystemStatus();
         loadSimulationSettings();
         // Set initial values for settings forms
         simulationActiveToggle.checked = simulationActive;
         simulationIntervalInput.value = (simulationIntervalId ? (parseInt(simulationIntervalInput.value, 10)) : (SIMULATION_INTERVAL_MS / 1000)); // Show current interval
         // Load thresholds, etc.
         loadThresholds();
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

        console.log(`Adding new sensor: ${name} (${lat}, ${lng}) with AQI ${aqi}`);

        // Create request data
        const sensorData = {
            name: name,
            lat: lat,
            lng: lng,
            initialAQI: aqi
        };

        // Send to backend API
        fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sensorData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            if (data.success) {
                // Create the new sensor object with the returned data
                const newSensor = {
                    id: data.id,
                    name: data.name,
                    lat: data.lat,
                    lng: data.lng,
                    aqi: data.aqi,
                    status: 'active'
                };

                // Add to local sensors array
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
            } else {
                console.error('Failed to add sensor:', data.message);
                alert('Failed to add sensor: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error adding sensor:', error);
            alert('Error adding sensor. Please try again.');
        });
    }

     function handleDeleteSensor(sensorId) {
         console.log(`Attempting to delete sensor ID ${sensorId}`);

         // Call backend API to delete the sensor
         fetch(`${API_ENDPOINT}/${sensorId}`, {
             method: 'DELETE'
         })
         .then(response => response.json())
         .then(data => {
             console.log('Delete response:', data);
             
             if (data.success) {
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
                     console.log(`Successfully deleted sensor ID ${sensorId}`);
                 }
             } else {
                 console.error(`Failed to delete sensor ID ${sensorId}:`, data.message);
                 alert('Failed to delete sensor: ' + data.message);
             }
         })
         .catch(error => {
             console.error('Error deleting sensor:', error);
             alert('Error deleting sensor. Please try again.');
         });
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
             // Reset input to previous valid value
             loadSimulationSettings();
             return;
         }

         console.log(`Saving simulation settings: enabled=${simulationActive}, interval=${newIntervalSeconds}s`);

         // Send settings to backend API
         fetch('/admin/simulation', {
             method: 'PUT',
             headers: {
                 'Content-Type': 'application/json',
             },
             body: JSON.stringify({
                 enabled: simulationActive,
                 intervalSeconds: newIntervalSeconds
             })
         })
         .then(response => response.json())
         .then(data => {
             console.log('Simulation settings response:', data);
             if (data.success) {
                 // Update UI with confirmed settings
                 simulationActive = data.enabled;
                 simulationActiveToggle.checked = data.enabled;
                 simulationIntervalInput.value = data.intervalSeconds;
                 
                 // Check diagnostics after saving
                 setTimeout(checkSimulationDiagnostics, 1000);
                 
                 // Reload sensor data to reflect changes
                 loadSensorData();
                 
                 alert("Simulation settings saved successfully.");
             } else {
                 console.error('Failed to save simulation settings:', data.message);
                 alert('Failed to save simulation settings: ' + data.message);
                 loadSimulationSettings(); // Reload current settings from backend
             }
         })
         .catch(error => {
             console.error('Error saving simulation settings:', error);
             alert('Error saving simulation settings. Please try again.');
         });
     }

     function handleSaveThresholds() {
         const moderateThreshold = parseInt(document.getElementById('moderate-threshold').value, 10);
         const unhealthySensitiveThreshold = parseInt(document.getElementById('unhealthy-sensitive-threshold').value, 10);
         const unhealthyThreshold = parseInt(document.getElementById('unhealthy-threshold').value, 10);
         const veryUnhealthyThreshold = parseInt(document.getElementById('very-unhealthy-threshold').value, 10);
         const hazardousThreshold = parseInt(document.getElementById('hazardous-threshold').value, 10);

         if (isNaN(moderateThreshold) || isNaN(unhealthySensitiveThreshold) || isNaN(unhealthyThreshold) || isNaN(veryUnhealthyThreshold) || isNaN(hazardousThreshold)) {
             alert("Invalid threshold values. Please enter valid numbers.");
             return;
         }

         console.log(`Saving thresholds: moderate=${moderateThreshold}, unhealthySensitive=${unhealthySensitiveThreshold}, unhealthy=${unhealthyThreshold}, veryUnhealthy=${veryUnhealthyThreshold}, hazardous=${hazardousThreshold}`);

         // Send thresholds to backend API
         fetch('/admin/thresholds', {
             method: 'PUT',
             headers: {
                 'Content-Type': 'application/json',
             },
             body: JSON.stringify({
                 moderateThreshold: moderateThreshold,
                 unhealthySensitiveThreshold: unhealthySensitiveThreshold,
                 unhealthyThreshold: unhealthyThreshold,
                 veryUnhealthyThreshold: veryUnhealthyThreshold,
                 hazardousThreshold: hazardousThreshold
             })
         })
         .then(response => response.json())
         .then(data => {
             console.log('Thresholds response:', data);
             if (data.success) {
                 // Update local state with confirmed thresholds
                 aqiThresholds = {
                     moderateThreshold: data.moderateThreshold,
                     unhealthySensitiveThreshold: data.unhealthySensitiveThreshold,
                     unhealthyThreshold: data.unhealthyThreshold,
                     veryUnhealthyThreshold: data.veryUnhealthyThreshold,
                     hazardousThreshold: data.hazardousThreshold
                 };
                 
                 // Update the AQI legend with the new thresholds
                 updateAqiLegend();
                 
                 // Update any selected sensor's AQI category display
                 if (selectedSensor) {
                     updateAqiIndicator(selectedSensor.aqi);
                 }
                 
                 // Update sensor table to reflect new threshold categories
                 updateAdminSensorTable();
                 
                 alert("Thresholds saved successfully.");
             } else {
                 console.error('Failed to save thresholds:', data.message);
                 alert('Failed to save thresholds: ' + data.message);
                 loadThresholds(); // Reload current thresholds from backend
             }
         })
         .catch(error => {
             console.error('Error saving thresholds:', error);
             alert('Error saving thresholds. Please try again.');
         });
     }

     function handleAddUser() {
         const username = document.getElementById('user-username').value.trim();
         const email = document.getElementById('user-email').value.trim();
         const password = document.getElementById('user-password').value;

         if (!username || !email || !password) {
             alert('Please fill in all user fields.');
             return;
         }

         if (!validateEmail(email)) {
             alert('Please enter a valid email address.');
             return;
         }

         console.log(`Adding new admin user: ${username} (${email})`);

         // Create request data
         const userData = {
             username: username,
             email: email,
             password: password
         };

         // Send to backend API (updated to use admin controller)
         fetch('/admin/users', {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
             },
             body: JSON.stringify(userData)
         })
         .then(response => response.json())
         .then(data => {
             console.log('User registration response:', data);
             if (data.success) {
                 // Clear form
                 document.getElementById('user-username').value = '';
                 document.getElementById('user-email').value = '';
                 document.getElementById('user-password').value = '';

                 // Refresh user table
                 loadAdminUsers();
                 
                 console.log('Added new admin user:', data.username);
             } else {
                 console.error('Failed to add user:', data.message);
             }
         })
         .catch(error => {
             console.error('Error adding user:', error);
             alert('Error adding user. Please try again.');
         });
     }

     function loadAdminUsers() {
         console.log('Loading admin users from API endpoint: /admin/users');
         
         fetch('/admin/users')
             .then(response => {
                 console.log('Users response status:', response.status);
                 if (!response.ok) {
                     throw new Error(`HTTP error! Status: ${response.status}`);
                 }
                 return response.json();
             })
             .then(data => {
                 console.log('Received admin users data:', data);
                 // Log more details about the data received
                 if (Array.isArray(data)) {
                     console.log(`Received ${data.length} users`);
                     data.forEach(user => {
                         console.log(`User: ${user.username}, Email: ${user.email}, ID: ${user.id}`);
                     });
                 } else {
                     console.log('Data is not an array:', typeof data);
                 }
                 updateAdminUserTable(data);
             })
             .catch(error => {
                 console.error('Error fetching admin users:', error);
                 // Display a fallback with an error message instead of showing an alert
                 if (usersTableBody) {
                     usersTableBody.innerHTML = '<tr><td colspan="3" class="text-center text-red-500">Error loading users. Check console for details.</td></tr>';
                 }
             });
     }

     function handleDeleteUser(userId, username) {
         console.log(`Attempting to delete user ID ${userId}: ${username}`);

         // Call backend API to delete the user
         fetch(`/admin/users/${userId}`, {  // Updated to use admin/users endpoint
             method: 'DELETE'
         })
         .then(response => response.json())
         .then(data => {
             console.log('Delete user response:', data);
             
             if (data.success) {
                 // Refresh user table
                 loadAdminUsers();
                 console.log(`Successfully deleted user ID ${userId}`);
             } else {
                 console.error(`Failed to delete user ID ${userId}:`, data.message);
             }
         })
         .catch(error => {
             console.error('Error deleting user:', error);
             alert('Error deleting user. Please try again.');
         });
     }

     function updateAdminUserTable(users) {
         if (!usersTableBody) return;
         
         usersTableBody.innerHTML = '';
         
         if (!users || users.length === 0) {
             const row = document.createElement('tr');
             row.innerHTML = '<td colspan="3" class="text-center">No admin users found</td>';
             usersTableBody.appendChild(row);
             return;
         }
         
         users.forEach(user => {
             const row = document.createElement('tr');
             row.innerHTML = `
                 <td>${user.username}</td>
                 <td>${user.email}</td>
                 <td>
                     <button class="btn btn-outline btn-sm text-red-500 delete-user-btn" data-id="${user.id}" data-username="${user.username}">Remove</button>
                 </td>
             `;
             usersTableBody.appendChild(row);
         });
         
         // Add event listeners for delete buttons
         usersTableBody.querySelectorAll('.delete-user-btn').forEach(btn => {
             btn.addEventListener('click', () => {
                 const userId = parseInt(btn.dataset.id, 10);
                 const username = btn.dataset.username;
                 
                 showConfirmation(
                     `Are you sure you want to remove user "${username}"?`,
                     () => handleDeleteUser(userId, username)
                 );
             });
         });
     }

     function validateEmail(email) {
         const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
         return re.test(String(email).toLowerCase());
     }

    function updateSystemStatus() {
        // Fetch system status from backend API
        fetch('/admin/system-status')
            .then(response => response.json())
            .then(data => {
                console.log('System status data:', data);
                
                if (activeSensorsCountEl) {
                    activeSensorsCountEl.textContent = data.activeSensorsCount;
                }
                
                if (simulationStatusEl) {
                    simulationStatusEl.textContent = data.simulationRunning ? 'Running' : 'Stopped';
                    simulationStatusEl.style.color = data.simulationRunning ? '#065f46' : '#991b1b'; // Green or Red
                    
                    // Update local state to match backend
                    simulationActive = data.simulationRunning;
                }
                
                if (dataPointsTodayEl) {
                    dataPointsTodayEl.textContent = data.dataPointsToday;
                }
            })
            .catch(error => {
                console.error('Error fetching system status:', error);
                
                // Fallback to locally calculated values if API fails
                if (activeSensorsCountEl) {
                    activeSensorsCountEl.textContent = sensors.length;
                }
                
                if (simulationStatusEl) {
                    simulationStatusEl.textContent = simulationActive ? 'Running' : 'Stopped';
                    simulationStatusEl.style.color = simulationActive ? '#065f46' : '#991b1b';
                }
                
                if (dataPointsTodayEl) {
                    dataPointsTodayEl.textContent = 'N/A'; // Show N/A when API fails
                }
            });
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
        editSensorLatInput.value = sensor.lat.toFixed(6); // Format with 6 decimal places
        editSensorLngInput.value = sensor.lng.toFixed(6); // Format with 6 decimal places
        editSensorModal.showModal();
    }
    cancelEditSensorBtn.addEventListener('click', () => {
        editSensorModal.close();
    });
    editSensorForm.addEventListener('submit', event => {
        event.preventDefault();
        const sensor = sensors.find(s => s.id === editingSensorId);
        if (!sensor) return;
        
        const name = editSensorNameInput.value.trim();
        const aqi = parseInt(editSensorAqiInput.value, 10);
        const lat = parseFloat(editSensorLatInput.value);
        const lng = parseFloat(editSensorLngInput.value);
        
        if (!name || isNaN(aqi) || isNaN(lat) || isNaN(lng)) {
            alert('Please fill in all fields correctly.');
            return;
        }
        
        console.log(`Updating sensor ID ${editingSensorId}: ${name} (${lat}, ${lng}) with AQI ${aqi}`);
        
        // Call the backend API to update the sensor
        fetch(`${API_ENDPOINT}/${editingSensorId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                lat: lat,
                lng: lng,
                aqi: aqi
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Update response:', data);
            if (data.success) {
                // Update local data
                sensor.name = name;
                sensor.aqi = aqi;
                sensor.lat = lat;
                sensor.lng = lng;
                
                // Update marker on map
                updateSensorMarker(sensor);
                
                // Update table
                updateAdminSensorTable();
                
                // If this sensor is selected, update details panel
                if (selectedSensor && selectedSensor.id === sensor.id) {
                    handleSensorSelection(sensor);
                }
                
                console.log(`Successfully updated sensor ID ${editingSensorId}`);
            } else {
                console.error(`Failed to update sensor ID ${editingSensorId}:`, data.message);
                alert('Failed to update sensor: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error updating sensor:', error);
            alert('Error updating sensor. Please try again.');
        })
        .finally(() => {
            editSensorModal.close();
        });
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
    function updateAdminUserTable(users) {
        if (!usersTableBody) return;
         
        usersTableBody.innerHTML = '';
         
        if (!users || users.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="3" class="text-center">No admin users found</td>';
            usersTableBody.appendChild(row);
            return;
        }
         
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>
                    <button class="btn btn-outline btn-sm text-red-500 delete-user-btn" data-id="${user.id}" data-username="${user.username}">Remove</button>
                </td>
            `;
            usersTableBody.appendChild(row);
        });
         
        // Add event listeners for delete buttons
        usersTableBody.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = parseInt(btn.dataset.id, 10);
                const username = btn.dataset.username;
                 
                showConfirmation(
                    `Are you sure you want to remove user "${username}"?`,
                    () => handleDeleteUser(userId, username)
                );
            });
        });
    }

    function loadSimulationSettings() {
        console.log('Loading simulation settings from backend');
        
        fetch('/admin/simulation')
            .then(response => response.json())
            .then(data => {
                console.log('Received simulation settings:', data);
                
                // Update UI with current settings
                simulationActive = data.enabled;
                simulationActiveToggle.checked = data.enabled;
                simulationIntervalInput.value = data.intervalSeconds;
                
                // Update status display
                updateSystemStatus();
            })
            .catch(error => {
                console.error('Error loading simulation settings:', error);
            });
    }

    function checkSimulationDiagnostics() {
        console.log('Checking simulation diagnostics...');
        
        fetch('/admin/simulation/diagnostics')
            .then(response => response.json())
            .then(data => {
                console.log('%c Simulation Diagnostics:', 'background: #222; color: #bada55; font-size: 14px; font-weight: bold;');
                console.log('Server time:', new Date(data.serverTime).toLocaleString());
                console.log('Settings ID:', data.settings.id);
                console.log('Enabled:', data.settings.enabled);
                console.log('Interval (seconds):', data.settings.intervalSeconds);
                console.log('Local simulationActive:', simulationActive);
                console.log('UI toggle checked:', simulationActiveToggle.checked);
                console.log('UI interval value:', simulationIntervalInput.value);
                console.log('Current clientside interval ID:', simulationIntervalId);
            })
            .catch(error => {
                console.error('Error fetching simulation diagnostics:', error);
            });
    }

    function loadThresholds() {
        console.log('Loading thresholds from backend');
        
        fetch('/admin/thresholds')
            .then(response => response.json())
            .then(data => {
                console.log('Received thresholds:', data);
                
                // Update local state with current thresholds
                aqiThresholds = {
                    moderateThreshold: data.moderateThreshold,
                    unhealthySensitiveThreshold: data.unhealthySensitiveThreshold,
                    unhealthyThreshold: data.unhealthyThreshold,
                    veryUnhealthyThreshold: data.veryUnhealthyThreshold,
                    hazardousThreshold: data.hazardousThreshold
                };
                
                // Update UI with current thresholds
                document.getElementById('moderate-threshold').value = data.moderateThreshold;
                document.getElementById('unhealthy-sensitive-threshold').value = data.unhealthySensitiveThreshold;
                document.getElementById('unhealthy-threshold').value = data.unhealthyThreshold;
                document.getElementById('very-unhealthy-threshold').value = data.veryUnhealthyThreshold;
                document.getElementById('hazardous-threshold').value = data.hazardousThreshold;
                
                // Update the AQI legend with the loaded thresholds
                updateAqiLegend();
            })
            .catch(error => {
                console.error('Error loading thresholds:', error);
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

    // Event listeners for logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            fetch('/auth/logout', { method: 'POST' })
                .then(() => {
                    isAdminLoggedIn = false;
                    adminPanelSection.classList.add('hidden');
                    adminLoginSection.classList.remove('hidden');
                    clearSensorSelection();
                    console.log('Admin logged out');
                })
                .catch(err => console.error('Logout failed:', err));
        });
    }

    // --- Initialization ---
    console.log('Initializing Air Quality Dashboard');
    initializeMap();
    initializeChart();
    // Initial UI state
    clearSensorSelection(); // Ensure details are hidden initially
    updateSystemStatus(); // Show initial counts/status

    console.log('Air Quality Dashboard Initialized');

}); // End DOMContentLoaded