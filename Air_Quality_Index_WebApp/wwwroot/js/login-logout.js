// Handles toggling between login and logout UI and logout logic

document.addEventListener('DOMContentLoaded', function () {
    // Simulate login state (replace with real logic as needed)
    let isLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';

    function updateAuthUI() {
        document.getElementById('login-section').style.display = isLoggedIn ? 'none' : 'block';
        document.getElementById('logout-section').style.display = isLoggedIn ? 'block' : 'none';
    }

    updateAuthUI();

    // Handle login (simulate, replace with real AJAX/auth logic)
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', function (e) {
            e.preventDefault();
            // Simulate successful login
            isLoggedIn = true;
            localStorage.setItem('isAdminLoggedIn', 'true');
            updateAuthUI();
        });
    }

    // On logout, also call dashboard.js logout if available
    document.addEventListener('click', function (e) {
        if (e.target && e.target.id === 'logout-btn') {
            isLoggedIn = false;
            localStorage.setItem('isAdminLoggedIn', 'false');
            updateAuthUI();
            // Call dashboard.js logout to hide admin controls
            if (typeof window.logout === 'function') {
                window.logout();
            } else if (window.parent && typeof window.parent.logout === 'function') {
                window.parent.logout();
            }
            // As a fallback, reload the page to ensure all UI resets
            setTimeout(function() { window.location.reload(); }, 100);
        }
    });
});
