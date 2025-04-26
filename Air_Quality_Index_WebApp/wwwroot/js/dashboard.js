// Main JavaScript for Air Quality Monitoring Dashboard

// Global variables
let isLoggedIn = false;
let userRole = "public";
let alerts = [];
let cityData = {};
let aqiTrend = "stable";
let sensors = [];
let users = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "monitoringAdmin" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "monitoringAdmin" },
    { id: 3, name: "Admin User", email: "admin@example.com", role: "systemAdmin" },
];

// Helper functions (AQI color, label, health recommendation, date formatting)
function getAqiColor(aqi) {
    if (aqi <= 50) {
        return "green"
    } else if (aqi <= 100) {
        return "yellow"
    } else if (aqi <= 150) {
        return "orange"
    } else if (aqi <= 200) {
        return "red"
    } else if (aqi <= 300) {
        return "purple"
    } else {
        return "maroon"
    }
}

function getAqiLabel(aqi) {
    if (aqi <= 50) {
        return "Good"
    } else if (aqi <= 100) {
        return "Moderate"
    } else if (aqi <= 150) {
        return "Unhealthy for Sensitive Groups"
    } else if (aqi <= 200) {
        return "Unhealthy"
    } else if (aqi <= 300) {
        return "Very Unhealthy"
    } else {
        return "Hazardous"
    }
}

function getHealthRecommendation(aqi) {
    if (aqi <= 50) {
        return "Enjoy outdoor activities."
    } else if (aqi <= 100) {
        return "Unusually sensitive people should consider reducing prolonged or heavy exertion."
    } else if (aqi <= 150) {
        return "Sensitive groups should reduce prolonged or heavy exertion."
    } else if (aqi <= 200) {
        return "Everyone should reduce prolonged or heavy exertion."
    } else if (aqi <= 300) {
        return "Everyone should avoid prolonged or heavy exertion. Sensitive groups should avoid all outdoor activities."
    } else {
        return "Everyone should avoid all outdoor activities."
    }
}

function formatDate(date) {
    const options = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
    return date.toLocaleDateString("en-US", options)
}

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
    // Initialize UI
    initUI()

    // Render login/logout button and attach event
    updateAuthUI();

    // Initialize map if map element exists
    if (document.getElementById("map")) {
        initMap()
    }

    // Initialize sensor map picker if element exists
    if (document.getElementById("sensor-map")) {
        initSensorMapPicker()
    }

    // Initialize charts if elements exist
    if (document.getElementById("daily-chart")) {
        initCharts()
    }

    // Generate city-wide data
    generateCityData()

    // Update city data every minute
    setInterval(updateCityData, 60000)

    // Generate initial alerts
    generateInitialAlerts()

    // Simulate random alerts
    setInterval(generateRandomAlert, 30000)

    // Populate sensors table
    fetchSensorsAndUpdateTable()

    // Populate users table
    populateUsersTable()

    // Add event listeners
    addEventListeners()
})

// Initialize UI
function initUI() {
    // Show/hide admin tab based on login status
    updateAdminVisibility()
}

// Add event listeners
function addEventListeners() {
    // Login button
    const loginBtn = document.getElementById("login-btn")
    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            document.getElementById("login-form").style.display = "block"
            document.getElementById("main-content").style.display = "none"
        })
    }

    // Cancel login button
    const cancelLoginBtn = document.getElementById("cancel-login")
    if (cancelLoginBtn) {
        cancelLoginBtn.addEventListener("click", () => {
            document.getElementById("login-form").style.display = "none"
            document.getElementById("main-content").style.display = "block"
        })
    }

    // Auth form
    const authForm = document.getElementById("auth-form")
    if (authForm) {
        authForm.addEventListener("submit", async (e) => {
            e.preventDefault()

            // Get username and password
            const username = document.getElementById("username").value.trim()
            const password = document.getElementById("password").value

            // Simple validation
            if (!username || !password) {
                alert("Please enter both username and password.")
                return
            }

            // Send login request to backend
            try {
                const response = await fetch("/admin/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                })
                const result = await response.json()
                if (result.success) {
                    isLoggedIn = true
                    userRole = "systemAdmin"
                    updateAuthUI()
                    updateAdminVisibility()
                    document.getElementById("login-form").style.display = "none"
                    document.getElementById("main-content").style.display = "block"
                    // Automatically switch to admin tab after successful login
                    const adminTabBtn = document.getElementById("admin-tab-btn");
                    if (adminTabBtn) {
                        adminTabBtn.click();
                    }
                } else {
                    alert(result.message || "Login failed.")
                }
            } catch (err) {
                alert("Error connecting to server.")
            }
        })
    }

    // Historical data tabs
    const historicalTabs = document.querySelectorAll("#historical-tabs button")
    historicalTabs.forEach((tab) => {
        tab.addEventListener("click", function () {
            const timeRange = this.id.split("-")[0] // daily, weekly, monthly
            const sensor = document.getElementById("sensor-select").value

            updateCharts(sensor, timeRange)
        })
    })

    // Sensor select
    const sensorSelect = document.getElementById("sensor-select")
    if (sensorSelect) {
        sensorSelect.addEventListener("change", function () {
            const sensor = this.value
            const timeRange = document.querySelector("#historical-tabs button.active").id.split("-")[0]

            updateCharts(sensor, timeRange)
        })
    }

    // Export data button
    const exportDataBtn = document.getElementById("export-data")
    if (exportDataBtn) {
        exportDataBtn.addEventListener("click", exportChartData)
    }

    // Add sensor button
    const addSensorBtn = document.getElementById("add-sensor-btn")
    if (addSensorBtn) {
        addSensorBtn.addEventListener("click", addSensor)
    }

    // Add user button
    const addUserBtn = document.getElementById("add-user-btn")
    if (addUserBtn) {
        addUserBtn.addEventListener("click", () => {
            alert("In a real application, this would open a user creation form")
        })
    }

    // Save simulation settings button
    const saveSimulationBtn = document.getElementById("save-simulation")
    if (saveSimulationBtn) {
        saveSimulationBtn.addEventListener("click", () => {
            alert("Simulation settings saved successfully!")
        })
    }

    // Save alert settings button
    const saveAlertSettingsBtn = document.getElementById("save-alert-settings")
    if (saveAlertSettingsBtn) {
        saveAlertSettingsBtn.addEventListener("click", () => {
            alert("Alert settings saved successfully!")
        })
    }

    // Save system settings button
    const saveSystemSettingsBtn = document.getElementById("save-system-settings")
    if (saveSystemSettingsBtn) {
        saveSystemSettingsBtn.addEventListener("click", () => {
            alert("System settings saved successfully!")
        })
    }

    // Frequency slider
    const frequencySlider = document.getElementById("frequency-slider")
    if (frequencySlider) {
        frequencySlider.addEventListener("input", function () {
            document.getElementById("frequency-value").textContent = `${this.value} min`
        })
    }

    // Alert threshold sliders
    const thresholdSliders = [
        "moderate-threshold",
        "unhealthy-sensitive-threshold",
        "unhealthy-threshold",
        "very-unhealthy-threshold",
    ]

    thresholdSliders.forEach((id) => {
        const slider = document.getElementById(id)
        if (slider) {
            slider.addEventListener("input", function () {
                const valueId = id.replace("threshold", "value")
                document.getElementById(valueId).textContent = `AQI ${this.value}+`
            })
        }
    })
}

// Login
function login(role) {
    isLoggedIn = true;
    userRole = role;

    // Update UI
    updateAuthUI();
    updateAdminVisibility();

    // Show admin tab if the user is an admin
    const adminTab = document.getElementById("admin-tab");
    if (adminTab) {
        adminTab.style.display = userRole === "systemAdmin" || userRole === "monitoringAdmin" ? "block" : "none";
    }

    // Log for debugging
    console.log(`Logged in as ${userRole}`);
}

// Logout
function logout() {
    // Call backend to sign out
    fetch('/Account/Logout', {
        method: 'POST',
        credentials: 'same-origin'
    }).then(() => {
        isLoggedIn = false;
        userRole = "public";
        updateAuthUI();
        updateAdminVisibility();
        // Hide admin tab
        const adminTab = document.getElementById("admin-tab");
        if (adminTab) {
            adminTab.style.display = "none";
        }
        // Switch to dashboard tab if on admin tab
        if (document.querySelector("#admin.active")) {
            const dashboardTab = document.getElementById("dashboard-tab");
            if (dashboardTab) {
                dashboardTab.click();
            }
        }
    });
}

// Update auth UI
function updateAuthUI() {
    const authSection = document.getElementById("user-auth-section")

    if (isLoggedIn) {
        authSection.innerHTML = `
      <span class="text-sm text-muted d-none d-md-inline me-2">
        Logged in as ${userRole === "monitoringAdmin" ? "Monitoring Admin" : "System Admin"}
      </span>
      <button id="logout-btn" class="btn btn-outline-secondary btn-sm">
        Logout
      </button>
    `

        // Add logout event listener
        document.getElementById("logout-btn").addEventListener("click", logout)
    } else {
        authSection.innerHTML = `
      <button id="login-btn" class="btn btn-outline-primary btn-sm">
        <i class="bi bi-person me-2"></i> Login
      </button>
    `

        // Add login event listener
        document.getElementById("login-btn").addEventListener("click", () => {
            document.getElementById("login-form").style.display = "block"
            document.getElementById("main-content").style.display = "none"
        })
    }
}

// Update admin visibility
function updateAdminVisibility() {
    // Show/hide admin tab
    const adminTab = document.getElementById("admin-tab");
    if (adminTab) {
        adminTab.style.display = isLoggedIn && (userRole === "systemAdmin" || userRole === "monitoringAdmin") ? "block" : "none";
    }

    // Show/hide system admin-only elements
    const systemAdminElements = document.querySelectorAll(".system-admin-only");
    systemAdminElements.forEach((el) => {
        el.style.display = isLoggedIn && userRole === "systemAdmin" ? "block" : "none";
    });

    // Show/hide admin-only elements
    const adminOnlyElements = document.querySelectorAll(".admin-only");
    adminOnlyElements.forEach((el) => {
        el.style.display = isLoggedIn && (userRole === "systemAdmin" || userRole === "monitoringAdmin") ? "block" : "none";
    });
}

// Generate city-wide data
function generateCityData() {
    // Generate random AQI value
    const aqi = Math.floor(Math.random() * 150) + 30

    // Generate related pollutant values
    const pm25 = Math.floor(aqi * 0.4) + Math.floor(Math.random() * 10)
    const pm10 = Math.floor(aqi * 0.6) + Math.floor(Math.random() * 15)
    const o3 = Math.floor(aqi * 0.2) + Math.floor(Math.random() * 8)
    const no2 = Math.floor(aqi * 0.15) + Math.floor(Math.random() * 6)

    // Store city data
    cityData = {
        aqi,
        pm25,
        pm10,
        o3,
        no2,
        lastUpdated: new Date(),
    }

    // Update UI
    updateCityDataUI()
}

// Update city data
function updateCityData() {
    // Generate new data
    const newData = {
        aqi: Math.floor(Math.random() * 150) + 30,
        pm25: Math.floor(Math.random() * 50) + 10,
        pm10: Math.floor(Math.random() * 80) + 20,
        o3: Math.floor(Math.random() * 40) + 5,
        no2: Math.floor(Math.random() * 30) + 5,
        lastUpdated: new Date(),
    }

    // Determine trend
    if (newData.aqi > cityData.aqi + 5) {
        aqiTrend = "up"
    } else if (newData.aqi < cityData.aqi - 5) {
        aqiTrend = "down"
    } else {
        aqiTrend = "stable"
    }

    // Update city data
    cityData = newData

    // Update UI
    updateCityDataUI()
}

// Update city data UI
function updateCityDataUI() {
    // Update AQI value
    const cityAqiElement = document.getElementById("city-aqi")
    if (cityAqiElement) {
        cityAqiElement.textContent = cityData.aqi
        cityAqiElement.style.color = getAqiColor(cityData.aqi)
    }

    // Update AQI label
    const aqiLabelElement = document.getElementById("aqi-label")
    if (aqiLabelElement) {
        aqiLabelElement.textContent = getAqiLabel(cityData.aqi)
    }

    // Update AQI trend
    const aqiTrendElement = document.getElementById("aqi-trend")
    if (aqiTrendElement) {
        // Update text
        aqiTrendElement.textContent = aqiTrend === "down" ? "Improving ↓" : aqiTrend === "up" ? "Worsening ↑" : "Stable"

        // Update class
        aqiTrendElement.className = "badge"
        if (aqiTrend === "down") {
            aqiTrendElement.classList.add("bg-success")
        } else if (aqiTrend === "up") {
            aqiTrendElement.classList.add("bg-danger")
        } else {
            aqiTrendElement.classList.add("bg-secondary")
        }
    }

    // Update pollutant values
    document.getElementById("pm25-value").textContent = `${cityData.pm25} µg/m³`
    document.getElementById("pm10-value").textContent = `${cityData.pm10} µg/m³`
    document.getElementById("o3-value").textContent = `${cityData.o3} ppb`
    document.getElementById("no2-value").textContent = `${cityData.no2} ppb`

    // Update pollutant bars
    document.getElementById("pm25-bar").style.width = `${Math.min(100, (cityData.pm25 / 100) * 100)}%`
    document.getElementById("pm10-bar").style.width = `${Math.min(100, (cityData.pm10 / 150) * 100)}%`
    document.getElementById("o3-bar").style.width = `${Math.min(100, (cityData.o3 / 70) * 100)}%`
    document.getElementById("no2-bar").style.width = `${Math.min(100, (cityData.no2 / 50) * 100)}%`

    // Update health recommendation
    document.getElementById("health-recommendation").textContent = getHealthRecommendation(cityData.aqi)
}

// Generate initial alerts
function generateInitialAlerts() {
    // Add initial alert
    alerts.push({
        level: "warning",
        message: "Elevated AQI levels detected in Colombo Central",
        timestamp: new Date(),
    })

    // Update alerts UI
    updateAlertsUI()
}

// Generate random alert
function generateRandomAlert() {
    // 20% chance of generating an alert
    if (Math.random() > 0.8) {
        const areas = ["Colombo Central", "Dehiwala", "Mount Lavinia", "Kolonnawa", "Kotte"]
        const levels = ["info", "warning", "critical"]
        const randomArea = areas[Math.floor(Math.random() * areas.length)]
        const randomLevel = levels[Math.floor(Math.random() * levels.length)]

        const newAlert = {
            level: randomLevel,
            message: `${randomLevel === "critical" ? "Dangerous" : "Elevated"} AQI levels detected in ${randomArea}`,
            timestamp: new Date(),
        }

        // Add alert to beginning of array
        alerts.unshift(newAlert)

        // Keep only the 5 most recent alerts
        if (alerts.length > 5) {
            alerts = alerts.slice(0, 5)
        }

        // Update alerts UI
        updateAlertsUI()
    }
}

// Update alerts UI
function updateAlertsUI() {
    const alertsContainer = document.getElementById("alerts-container")

    if (alertsContainer) {
        if (alerts.length === 0) {
            alertsContainer.innerHTML = `
        <div class="text-center py-4 text-muted">
          <p>No alerts at this time.</p>
        </div>
      `
        } else {
            let alertsHTML = ""

            alerts.forEach((alert) => {
                let badgeClass = "bg-secondary"
                let badgeText = "Info"

                if (alert.level === "warning") {
                    badgeClass = "bg-warning"
                    badgeText = "Warning"
                } else if (alert.level === "critical") {
                    badgeClass = "bg-danger"
                    badgeText = "Critical"
                }

                alertsHTML += `
          <div class="alert-item ${alert.level}">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="d-flex align-items-center gap-2 mb-1">
                  <span class="badge ${badgeClass}">${badgeText}</span>
                  <span class="small text-muted">
                    ${formatDate(alert.timestamp)}
                  </span>
                </div>
                <p class="fw-medium">${alert.message}</p>
              </div>
            </div>
          </div>
        `
            })

            alertsContainer.innerHTML = alertsHTML
        }
    }
}

// Fetch sensors from backend and update table
async function fetchSensorsAndUpdateTable() {
    try {
        const res = await fetch('/admin/sensors');
        sensors = await res.json();
        populateSensorsTable();
    } catch (err) {
        alert('Failed to load sensors from server.');
    }
}

function populateSensorsTable() {
    const tableBody = document.getElementById("sensors-table-body");
    if (tableBody) {
        let html = "";
        sensors.forEach((sensor) => {
            html += `
        <tr>
          <td>${sensor.id}</td>
          <td>${sensor.name}</td>
          <td>${sensor.lat?.toFixed(4)}, ${sensor.lng?.toFixed(4)}</td>
          <td>
            <div class="form-check form-switch">
              <input class="form-check-input sensor-status-toggle" type="checkbox" 
                data-sensor-id="${sensor.id}" ${sensor.status === "Active" ? "checked" : ""}>
              <span class="${sensor.status === "Active" ? "text-success" : "text-muted"}">
                ${sensor.status === "Active" ? "Active" : "Inactive"}
              </span>
            </div>
          </td>
          <td>
            <button class="btn btn-sm btn-link text-danger delete-sensor" data-sensor-id="${sensor.id}">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
        });
        tableBody.innerHTML = html;
        // Add event listeners for sensor status toggles
        const statusToggles = document.querySelectorAll(".sensor-status-toggle");
        statusToggles.forEach((toggle) => {
            toggle.addEventListener("change", function () {
                const sensorId = Number.parseInt(this.getAttribute("data-sensor-id"));
                toggleSensorStatus(sensorId, this.checked);
            });
        });
        // Add event listeners for delete buttons
        const deleteButtons = document.querySelectorAll(".delete-sensor");
        deleteButtons.forEach((button) => {
            button.addEventListener("click", function () {
                const sensorId = Number.parseInt(this.getAttribute("data-sensor-id"));
                deleteSensor(sensorId);
            });
        });
    }
}

async function addSensor() {
    const name = document.getElementById("sensor-name").value.trim();
    const lat = Number.parseFloat(document.getElementById("latitude").value);
    const lng = Number.parseFloat(document.getElementById("longitude").value);
    const addBtn = document.getElementById("add-sensor-btn");
    if (!name) {
        alert("Please enter a sensor name");
        return;
    }
    if (isNaN(lat) || isNaN(lng)) {
        alert("Please enter valid latitude and longitude.");
        return;
    }
    if (addBtn) addBtn.disabled = true;
    try {
        const res = await fetch('/admin/sensors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, lat, lng })
        });
        const result = await res.json();
        if (res.ok && result.success) {
            document.getElementById("sensor-name").value = "";
            document.getElementById("latitude").value = "";
            document.getElementById("longitude").value = "";
            alert(`Sensor "${name}" added successfully!`);
            fetchSensorsAndUpdateTable();
        } else {
            alert(result.message || 'Failed to add sensor.');
        }
    } catch (err) {
        alert('Failed to add sensor.');
    } finally {
        if (addBtn) addBtn.disabled = false;
    }
}

async function toggleSensorStatus(sensorId, isActive) {
    const status = isActive ? "Active" : "Inactive";
    try {
        const res = await fetch(`/admin/sensors/${sensorId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const result = await res.json();
        if (res.ok && result.success) {
            fetchSensorsAndUpdateTable();
        } else {
            alert(result.message || 'Failed to update sensor status.');
        }
    } catch (err) {
        alert('Failed to update sensor status.');
    }
}

async function deleteSensor(sensorId) {
    if (confirm("Are you sure you want to delete this sensor?")) {
        try {
            const res = await fetch(`/admin/sensors/${sensorId}`, { method: 'DELETE' });
            const result = await res.json();
            if (res.ok && result.success) {
                fetchSensorsAndUpdateTable();
            } else {
                alert(result.message || 'Failed to delete sensor.');
            }
        } catch (err) {
            alert('Failed to delete sensor.');
        }
    }
}

// Populate users table
function populateUsersTable() {
    const tableBody = document.getElementById("users-table-body")

    if (tableBody) {
        let html = ""

        users.forEach((user) => {
            html += `
        <tr>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.role === "systemAdmin" ? "System Admin" : "Monitoring Admin"}</td>
          <td>
            <button class="btn btn-sm btn-link text-danger delete-user" data-user-id="${user.id}"
              ${user.role === "systemAdmin" && user.id === 3 ? "disabled" : ""}>
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `
        })

        tableBody.innerHTML = html

        // Add event listeners for delete buttons
        const deleteButtons = document.querySelectorAll(".delete-user")
        deleteButtons.forEach((button) => {
            button.addEventListener("click", function () {
                const userId = Number.parseInt(this.getAttribute("data-user-id"))
                deleteUser(userId)
            })
        })
    }
}

// Delete user
function deleteUser(userId) {
    // Confirm deletion
    if (confirm("Are you sure you want to delete this user?")) {
        // Remove user from array
        users = users.filter((u) => u.id !== userId)

        // Update users table
        populateUsersTable()
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Open login modal on button click
    const openLoginBtn = document.getElementById('open-login-btn');
    if (openLoginBtn) {
        openLoginBtn.addEventListener('click', function() {
            const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
            loginModal.show();
        });
    }

    // Handle login form submission
    const loginForm = document.getElementById('auth-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('login-error');
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
            if (!username || !password) {
                errorDiv.textContent = 'Please enter both username and password.';
                errorDiv.style.display = 'block';
                return;
            }
            try {
                const response = await fetch('/Account/Login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
                });
                const result = await response.json();
                if (result.success) {
                    // Hide modal
                    const loginModalEl = document.getElementById('loginModal');
                    const loginModal = bootstrap.Modal.getInstance(loginModalEl);
                    if (loginModal) loginModal.hide();
                    // Show admin controls
                    showAdminControls();
                } else {
                    errorDiv.textContent = result.error || 'Login failed.';
                    errorDiv.style.display = 'block';
                }
            } catch (err) {
                errorDiv.textContent = 'An error occurred. Please try again.';
                errorDiv.style.display = 'block';
            }
        });
    }

    // Show admin controls if authenticated
    function showAdminControls() {
        // Show admin tab
        const adminTab = document.getElementById('admin-tab');
        if (adminTab) adminTab.style.display = 'block';
        // Optionally, reload page or fetch user state
        fetchSensorsAndUpdateTable();
    }

    // Optionally, check authentication state on load and show admin controls if needed
});

// Ensure sensors are always loaded after login and after any sensor change
function showAdminControls() {
    const adminTab = document.getElementById('admin-tab');
    if (adminTab) adminTab.style.display = 'block';
    fetchSensorsAndUpdateTable();
}

