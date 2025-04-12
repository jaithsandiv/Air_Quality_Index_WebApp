// Utility functions for Air Quality Monitoring Dashboard

// Get color based on AQI value
function getAqiColor(aqi) {
    if (aqi <= 50) return "#4ade80" // Good - Green
    if (aqi <= 100) return "#facc15" // Moderate - Yellow
    if (aqi <= 150) return "#f97316" // Unhealthy for Sensitive Groups - Orange
    if (aqi <= 200) return "#ef4444" // Unhealthy - Red
    if (aqi <= 300) return "#a855f7" // Very Unhealthy - Purple
    return "#7f1d1d" // Hazardous - Maroon
}

// Get label based on AQI value
function getAqiLabel(aqi) {
    if (aqi <= 50) return "Good"
    if (aqi <= 100) return "Moderate"
    if (aqi <= 150) return "Unhealthy for Sensitive Groups"
    if (aqi <= 200) return "Unhealthy"
    if (aqi <= 300) return "Very Unhealthy"
    return "Hazardous"
}

// Get badge class based on AQI value
function getAqiBadgeClass(aqi) {
    if (aqi <= 50) return "bg-success"
    if (aqi <= 100) return "bg-warning"
    if (aqi <= 150) return "bg-orange"
    if (aqi <= 200) return "bg-danger"
    if (aqi <= 300) return "bg-purple"
    return "bg-dark"
}

// Get health recommendation based on AQI value
function getHealthRecommendation(aqi) {
    if (aqi <= 50) {
        return "Air quality is good. Enjoy outdoor activities."
    } else if (aqi <= 100) {
        return "Moderate air quality. Sensitive individuals should consider limiting prolonged outdoor exertion."
    } else if (aqi <= 150) {
        return "Unhealthy for sensitive groups. Reduce prolonged or heavy outdoor exertion."
    } else {
        return "Unhealthy air quality. Everyone should reduce outdoor activities."
    }
}

// Generate random AQI data for a sensor
function generateSensorData(baseAqi) {
    // If baseAqi is provided, generate a value close to it
    // Otherwise, generate a random value between 30 and 180
    const aqi = baseAqi
        ? Math.max(10, Math.min(300, baseAqi + (Math.random() * 20 - 10)))
        : Math.floor(Math.random() * 150) + 30

    // Generate related pollutant values
    const pm25 = Math.floor(aqi * 0.4) + Math.floor(Math.random() * 10)
    const pm10 = Math.floor(aqi * 0.6) + Math.floor(Math.random() * 15)
    const o3 = Math.floor(aqi * 0.2) + Math.floor(Math.random() * 8)
    const no2 = Math.floor(aqi * 0.15) + Math.floor(Math.random() * 6)

    return {
        aqi: Math.round(aqi),
        pm25,
        pm10,
        o3,
        no2,
        lastUpdated: new Date(),
    }
}

// Generate historical data for charts
function generateHistoricalData(timeRange) {
    const data = []
    let dataPoints = 0
    let dateFormat = ""

    // Set number of data points and date format based on time range
    switch (timeRange) {
        case "daily":
            dataPoints = 24
            dateFormat = "hour"
            break
        case "weekly":
            dataPoints = 7
            dateFormat = "day"
            break
        case "monthly":
            dataPoints = 30
            dateFormat = "day"
            break
        default:
            dataPoints = 24
            dateFormat = "hour"
    }

    // Generate data points
    for (let i = 0; i < dataPoints; i++) {
        let date = ""

        if (dateFormat === "hour") {
            // Format as hour (e.g., "9 AM")
            const hour = i % 24
            date = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour} ${hour >= 12 ? "PM" : "AM"}`
        } else if (dateFormat === "day") {
            // Format as day (e.g., "Mon 12")
            const today = new Date()
            const day = new Date()
            day.setDate(today.getDate() - (dataPoints - 1) + i)
            date = `${day.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}`
        }

        // Generate random AQI value with some trend
        // For daily, simulate higher values during rush hours
        let baseAqi = 50 + Math.random() * 50

        if (timeRange === "daily") {
            // Morning rush hour (7-9 AM)
            if (i >= 7 && i <= 9) {
                baseAqi += 30 + Math.random() * 20
            }
            // Evening rush hour (5-7 PM)
            else if (i >= 17 && i <= 19) {
                baseAqi += 40 + Math.random() * 20
            }
            // Night time (lower values)
            else if (i >= 22 || i <= 4) {
                baseAqi = Math.max(30, baseAqi - 20)
            }
        }

        // Generate related pollutant values
        const aqi = Math.round(baseAqi)
        const pm25 = Math.floor(aqi * 0.4) + Math.floor(Math.random() * 10)
        const pm10 = Math.floor(aqi * 0.6) + Math.floor(Math.random() * 15)
        const o3 = Math.floor(aqi * 0.2) + Math.floor(Math.random() * 8)
        const no2 = Math.floor(aqi * 0.15) + Math.floor(Math.random() * 6)

        data.push({
            date,
            aqi,
            pm25,
            pm10,
            o3,
            no2,
        })
    }

    return data
}

// Format date for display
function formatDate(date) {
    return date.toLocaleString()
}

// Export data to CSV
function exportToCSV(data, filename) {
    // Create CSV content
    const headers = "Date,AQI,PM2.5,PM10,O3,NO2\n"
    const csvContent = data.reduce((acc, row) => {
        return acc + `${row.date},${row.aqi},${row.pm25},${row.pm10},${row.o3},${row.no2}\n`
    }, headers)

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

