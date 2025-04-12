// Map functionality for Air Quality Monitoring Dashboard

// Import Leaflet library
import * as L from "leaflet"

// Define sensor locations
const sensorLocations = [
    { id: 1, name: "Colombo Fort", lat: 6.9271, lng: 79.8612 },
    { id: 2, name: "Dehiwala", lat: 6.8504, lng: 79.865 },
    { id: 3, name: "Mount Lavinia", lat: 6.8295, lng: 79.8663 },
    { id: 4, name: "Kolonnawa", lat: 6.935, lng: 79.8888 },
    { id: 5, name: "Kotte", lat: 6.9031, lng: 79.9025 },
    { id: 6, name: "Moratuwa", lat: 6.7949, lng: 79.8799 },
    { id: 7, name: "Peliyagoda", lat: 6.9597, lng: 79.8844 },
    { id: 8, name: "Battaramulla", lat: 6.8965, lng: 79.918 },
    { id: 9, name: "Wellawatte", lat: 6.8744, lng: 79.8644 },
    { id: 10, name: "Borella", lat: 6.9142, lng: 79.878 },
]

// Global variables
let map
let sensorMap
let markers = []
let sensorData = []
let pickerMarker

// Function to generate random sensor data
function generateSensorData(previousAqi) {
    const aqiChange = Math.random() * 20 - 10 // Random change between -10 and 10
    let newAqi = Math.max(0, Math.min(500, (previousAqi || 50) + aqiChange)) // Ensure AQI stays within 0-500 range
    newAqi = Math.round(newAqi)

    return {
        aqi: newAqi,
        pm25: Math.round(Math.random() * 150),
        pm10: Math.round(Math.random() * 200),
        o3: Math.round(Math.random() * 100),
        no2: Math.round(Math.random() * 80),
        lastUpdated: new Date(),
    }
}

// Function to get AQI color
function getAqiColor(aqi) {
    if (aqi <= 50) return "#00e400" // Good
    if (aqi <= 100) return "#ffff00" // Moderate
    if (aqi <= 150) return "#ff7e00" // Unhealthy for Sensitive Groups
    if (aqi <= 200) return "#ff0000" // Unhealthy
    if (aqi <= 300) return "#8f3f97" // Very Unhealthy
    return "#7e0023" // Hazardous
}

// Function to get AQI badge class
function getAqiBadgeClass(aqi) {
    if (aqi <= 50) return "bg-success"
    if (aqi <= 100) return "bg-warning"
    if (aqi <= 150) return "bg-orange"
    if (aqi <= 200) return "bg-danger"
    if (aqi <= 300) return "bg-purple"
    return "bg-dark"
}

// Function to get AQI label
function getAqiLabel(aqi) {
    if (aqi <= 50) return "Good"
    if (aqi <= 100) return "Moderate"
    if (aqi <= 150) return "Unhealthy for Sensitive Groups"
    if (aqi <= 200) return "Unhealthy"
    if (aqi <= 300) return "Very Unhealthy"
    return "Hazardous"
}

// Initialize main map
function initMap() {
    // Create map centered on Colombo
    map = L.map("map").setView([6.9271, 79.8612], 12)

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Initialize sensors with data
    initSensors()

    // Update sensor data every 30 seconds
    setInterval(updateSensors, 30000)
}

// Initialize sensor map picker (for admin panel)
function initSensorMapPicker() {
    if (!document.getElementById("sensor-map")) return

    // Create map centered on Colombo
    sensorMap = L.map("sensor-map").setView([6.9271, 79.8612], 12)

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(sensorMap)

    // Add initial marker
    const initialLat = Number.parseFloat(document.getElementById("latitude").value)
    const initialLng = Number.parseFloat(document.getElementById("longitude").value)

    pickerMarker = L.marker([initialLat, initialLng], {
        draggable: true,
    }).addTo(sensorMap)

    // Update lat/lng inputs when marker is dragged
    pickerMarker.on("dragend", (event) => {
        const marker = event.target
        const position = marker.getLatLng()
        document.getElementById("latitude").value = position.lat.toFixed(4)
        document.getElementById("longitude").value = position.lng.toFixed(4)
    })

    // Add click event to map
    sensorMap.on("click", (e) => {
        const position = e.latlng
        document.getElementById("latitude").value = position.lat.toFixed(4)
        document.getElementById("longitude").value = position.lng.toFixed(4)

        // Update marker position
        pickerMarker.setLatLng(position)
    })
}

// Initialize sensors with data
function initSensors() {
    // Clear existing markers
    markers.forEach((marker) => map.removeLayer(marker))
    markers = []

    // Initialize sensors with data
    sensorData = sensorLocations.map((location) => ({
        ...location,
        ...generateSensorData(),
    }))

    // Add markers to map
    sensorData.forEach((sensor) => {
        const marker = createMarker(sensor)
        markers.push(marker)
    })

    // Fit map to sensor bounds
    const bounds = L.latLngBounds(sensorData.map((s) => [s.lat, s.lng]))
    map.fitBounds(bounds, { padding: [50, 50] })
}

// Update sensor data
function updateSensors() {
    // Update sensor data
    sensorData = sensorData.map((sensor) => ({
        ...sensor,
        ...generateSensorData(sensor.aqi),
    }))

    // Update markers
    sensorData.forEach((sensor, index) => {
        // Remove old marker
        map.removeLayer(markers[index])

        // Create new marker
        const marker = createMarker(sensor)
        markers[index] = marker
    })
}

// Create marker for sensor
function createMarker(sensor) {
    // Create custom icon based on AQI
    const icon = L.divIcon({
        className: "custom-marker-icon",
        html: `<div style="background-color: ${getAqiColor(sensor.aqi)}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
    })

    // Create marker
    const marker = L.marker([sensor.lat, sensor.lng], { icon }).addTo(map)

    // Create popup content
    const popupContent = `
    <div class="card border-0 shadow-none p-0" style="width: 250px;">
      <div class="p-3">
        <h5 class="fw-bold">${sensor.name}</h5>
        <div class="d-flex align-items-center gap-2 mt-1">
          <span class="badge ${getAqiBadgeClass(sensor.aqi)}">
            AQI: ${sensor.aqi}
          </span>
          <span class="small">${getAqiLabel(sensor.aqi)}</span>
        </div>
        
        <div class="mt-3">
          <div class="row g-2 small">
            <div class="col-6">PM2.5: ${sensor.pm25} µg/m³</div>
            <div class="col-6">PM10: ${sensor.pm10} µg/m³</div>
            <div class="col-6">O₃: ${sensor.o3} ppb</div>
            <div class="col-6">NO₂: ${sensor.no2} ppb</div>
          </div>
        </div>
        
        <div class="mt-3 small text-muted">
          Last updated: ${sensor.lastUpdated.toLocaleTimeString()}
        </div>
      </div>
    </div>
  `

    // Bind popup to marker
    marker.bindPopup(popupContent)

    return marker
}

