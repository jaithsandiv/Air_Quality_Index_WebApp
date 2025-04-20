// Charts functionality for Air Quality Monitoring Dashboard
// Chart.js is loaded via CDN in the layout file

// Global variables
let dailyChart
let weeklyChart
let monthlyChart
let pollutantChart
let currentTimeRange = "daily"
let currentSensor = "all"
let chartData = {}

// Import necessary functions (assuming they are in separate modules)
// Or declare them if they are simple enough
// For example:
// function generateHistoricalData(timeRange) { ... }
// function exportToCSV(data, filename) { ... }

// Initialize charts
function initCharts() {
    // Generate data for each time range
    chartData = {
        daily: generateHistoricalData("daily"),
        weekly: generateHistoricalData("weekly"),
        monthly: generateHistoricalData("monthly"),
    }

    // Create daily chart
    createDailyChart()

    // Create weekly chart
    createWeeklyChart()

    // Create monthly chart
    createMonthlyChart()

    // Create pollutant chart
    createPollutantChart()
}

// Create daily chart
function createDailyChart() {
    const ctx = document.getElementById("daily-chart").getContext("2d")

    dailyChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: chartData.daily.map((d) => d.date),
            datasets: [
                {
                    label: "AQI",
                    data: chartData.daily.map((d) => d.aqi),
                    borderColor: "#8884d8",
                    backgroundColor: "rgba(136, 132, 216, 0.1)",
                    tension: 0.4,
                    fill: false,
                },
                {
                    label: "PM2.5",
                    data: chartData.daily.map((d) => d.pm25),
                    borderColor: "#82ca9d",
                    backgroundColor: "rgba(130, 202, 157, 0.1)",
                    tension: 0.4,
                    fill: false,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "top",
                },
                tooltip: {
                    mode: "index",
                    intersect: false,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Value",
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: "Time",
                    },
                },
            },
        },
    })
}

// Create weekly chart
function createWeeklyChart() {
    const ctx = document.getElementById("weekly-chart").getContext("2d")

    weeklyChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: chartData.weekly.map((d) => d.date),
            datasets: [
                {
                    label: "AQI",
                    data: chartData.weekly.map((d) => d.aqi),
                    borderColor: "#8884d8",
                    backgroundColor: "rgba(136, 132, 216, 0.1)",
                    tension: 0.4,
                    fill: false,
                },
                {
                    label: "PM2.5",
                    data: chartData.weekly.map((d) => d.pm25),
                    borderColor: "#82ca9d",
                    backgroundColor: "rgba(130, 202, 157, 0.1)",
                    tension: 0.4,
                    fill: false,
                },
                {
                    label: "PM10",
                    data: chartData.weekly.map((d) => d.pm10),
                    borderColor: "#ffc658",
                    backgroundColor: "rgba(255, 198, 88, 0.1)",
                    tension: 0.4,
                    fill: false,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "top",
                },
                tooltip: {
                    mode: "index",
                    intersect: false,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Value",
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: "Day",
                    },
                },
            },
        },
    })
}

// Create monthly chart
function createMonthlyChart() {
    const ctx = document.getElementById("monthly-chart").getContext("2d")

    monthlyChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: chartData.monthly.map((d) => d.date),
            datasets: [
                {
                    label: "Average AQI",
                    data: chartData.monthly.map((d) => d.aqi),
                    backgroundColor: "rgba(136, 132, 216, 0.7)",
                },
                {
                    label: "Average PM2.5",
                    data: chartData.monthly.map((d) => d.pm25),
                    backgroundColor: "rgba(130, 202, 157, 0.7)",
                },
                {
                    label: "Average PM10",
                    data: chartData.monthly.map((d) => d.pm10),
                    backgroundColor: "rgba(255, 198, 88, 0.7)",
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "top",
                },
                tooltip: {
                    mode: "index",
                    intersect: false,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Value",
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: "Day",
                    },
                },
            },
        },
    })
}

// Create pollutant chart
function createPollutantChart() {
    const ctx = document.getElementById("pollutant-chart").getContext("2d")

    // Use first 5 data points from daily data
    const data = chartData.daily.slice(0, 5)

    pollutantChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: data.map((d) => d.date),
            datasets: [
                {
                    label: "PM2.5 (µg/m³)",
                    data: data.map((d) => d.pm25),
                    backgroundColor: "rgba(130, 202, 157, 0.7)",
                },
                {
                    label: "PM10 (µg/m³)",
                    data: data.map((d) => d.pm10),
                    backgroundColor: "rgba(255, 198, 88, 0.7)",
                },
                {
                    label: "O₃ (ppb)",
                    data: data.map((d) => d.o3),
                    backgroundColor: "rgba(136, 132, 216, 0.7)",
                },
                {
                    label: "NO₂ (ppb)",
                    data: data.map((d) => d.no2),
                    backgroundColor: "rgba(255, 128, 66, 0.7)",
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "top",
                },
                tooltip: {
                    mode: "index",
                    intersect: false,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Value",
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: "Time",
                    },
                },
            },
        },
    })
}

// Update charts based on selected sensor and time range
function updateCharts(sensor, timeRange) {
    // Update current selections
    currentSensor = sensor
    currentTimeRange = timeRange

    // Generate new data if needed
    if (!chartData[timeRange]) {
        chartData[timeRange] = generateHistoricalData(timeRange)
    }

    // Update charts based on time range
    switch (timeRange) {
        case "daily":
            updateDailyChart()
            break
        case "weekly":
            updateWeeklyChart()
            break
        case "monthly":
            updateMonthlyChart()
            break
    }

    // Update pollutant chart
    updatePollutantChart()
}

// Update daily chart
function updateDailyChart() {
    // Update chart data
    dailyChart.data.labels = chartData.daily.map((d) => d.date)
    dailyChart.data.datasets[0].data = chartData.daily.map((d) => d.aqi)
    dailyChart.data.datasets[1].data = chartData.daily.map((d) => d.pm25)

    // Update chart
    dailyChart.update()
}

// Update weekly chart
function updateWeeklyChart() {
    // Update chart data
    weeklyChart.data.labels = chartData.weekly.map((d) => d.date)
    weeklyChart.data.datasets[0].data = chartData.weekly.map((d) => d.aqi)
    weeklyChart.data.datasets[1].data = chartData.weekly.map((d) => d.pm25)
    weeklyChart.data.datasets[2].data = chartData.weekly.map((d) => d.pm10)

    // Update chart
    weeklyChart.update()
}

// Update monthly chart
function updateMonthlyChart() {
    // Update chart data
    monthlyChart.data.labels = chartData.monthly.map((d) => d.date)
    monthlyChart.data.datasets[0].data = chartData.monthly.map((d) => d.aqi)
    monthlyChart.data.datasets[1].data = chartData.monthly.map((d) => d.pm25)
    monthlyChart.data.datasets[2].data = chartData.monthly.map((d) => d.pm10)

    // Update chart
    monthlyChart.update()
}

// Update pollutant chart
function updatePollutantChart() {
    // Use first 5 data points from current time range data
    const data = chartData[currentTimeRange].slice(0, 5)

    // Update chart data
    pollutantChart.data.labels = data.map((d) => d.date)
    pollutantChart.data.datasets[0].data = data.map((d) => d.pm25)
    pollutantChart.data.datasets[1].data = data.map((d) => d.pm10)
    pollutantChart.data.datasets[2].data = data.map((d) => d.o3)
    pollutantChart.data.datasets[3].data = data.map((d) => d.no2)

    // Update chart
    pollutantChart.update()
}

// Export chart data to CSV
function exportChartData() {
    const data = chartData[currentTimeRange]
    const filename = `air-quality-data-${currentSensor}-${currentTimeRange}.csv`

    exportToCSV(data, filename)
}

