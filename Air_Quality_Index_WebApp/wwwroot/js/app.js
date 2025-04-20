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
    const loginBtn = document.getElementById('login-btn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            console.log('Login button clicked');
            // For demo purposes - toggle between logged in/out state
            if (isLoggedIn) {
                isLoggedIn = false;
                userRole = 'public';
                loginBtn.innerHTML = '<i class="bi bi-person me-2"></i> Login';
                alert('You have been logged out');
            } else {
                // In a real application, this would show a login form
                isLoggedIn = true;
                userRole = 'monitoringAdmin';
                loginBtn.innerHTML = '<i class="bi bi-person-check me-2"></i> Logout';
                alert('You have been logged in as Admin');
            }
        });
    }
}
