document.addEventListener('DOMContentLoaded', function () {
    const fetchBtn = document.getElementById('fetch-waqi-btn');
    const statusDiv = document.getElementById('waqi-fetch-status');
    if (fetchBtn) {
        fetchBtn.addEventListener('click', async function () {
            statusDiv.textContent = 'Fetching WAQI data...';
            statusDiv.className = 'mb-3 text-info';
            try {
                const response = await fetch('/admin/fetch-waqi?city=colombo');
                const data = await response.json();
                if (response.ok) {
                    statusDiv.textContent = `Success: AQI=${data.aqi}, PM2.5=${data.pm25}, PM10=${data.pm10}, O3=${data.o3}, NO2=${data.no2}`;
                    statusDiv.className = 'mb-3 text-success';
                } else {
                    statusDiv.textContent = 'Error: ' + (data.message || 'Failed to fetch data');
                    statusDiv.className = 'mb-3 text-danger';
                }
            } catch (err) {
                statusDiv.textContent = 'Error: ' + err;
                statusDiv.className = 'mb-3 text-danger';
            }
        });
    }
});