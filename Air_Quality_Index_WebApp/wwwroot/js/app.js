// Main application initialization script

document.addEventListener('DOMContentLoaded', function() {
    console.log('AirVision Colombo app initializing...');
    
    // Initialize login functionality
    initAuth();
    
    // Initialize map if map element exists
    if (document.getElementById('map')) {
        console.log('Initializing map...');
        initMap();
    }
    
    // Initialize charts if chart elements exist
    if (document.getElementById('daily-chart') || 
        document.getElementById('weekly-chart') || 
        document.getElementById('monthly-chart')) {
        console.log('Initializing charts...');
        initCharts();
    }
    
    console.log('AirVision Colombo app initialized successfully');
});

// Authentication initialization
function initAuth() {
    // The login button logic is now handled in dashboard.js
}
