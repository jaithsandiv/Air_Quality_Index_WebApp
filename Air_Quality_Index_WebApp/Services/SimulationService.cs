using Air_Quality_Index_WebApp.Data;
using Air_Quality_Index_WebApp.Models;
using Microsoft.EntityFrameworkCore;

namespace Air_Quality_Index_WebApp.Services
{
    public class SimulationService : IHostedService, IDisposable
    {
        private Timer? _timer;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<SimulationService> _logger;
        private bool _isRunning = false;
        private SimulationSettings _currentSettings = new SimulationSettings { SimulationSettingsId = 1, Enabled = true, IntervalSeconds = 30 };
        private static readonly object _lockObject = new object();

        public SimulationService(
            IServiceScopeFactory scopeFactory,
            ILogger<SimulationService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Simulation Service is starting.");
            
            // Initialize timer but don't start it yet
            _timer = new Timer(ExecuteSimulation, null, Timeout.Infinite, Timeout.Infinite);
            
            // Start simulation if enabled
            await UpdateSimulationTimer();
        }

        public async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Simulation Service is stopping.");
            
            // Stop the timer
            _timer?.Change(Timeout.Infinite, Timeout.Infinite);
            _isRunning = false;
            
            await Task.CompletedTask;
        }

        public void Dispose()
        {
            _timer?.Dispose();
        }

        public async Task UpdateSimulationTimer()
        {
            try
            {
                lock (_lockObject)
                {
                    // Stop the current timer if it's running
                    _timer?.Change(Timeout.Infinite, Timeout.Infinite);
                    _isRunning = false;
                    _logger.LogInformation("Simulation timer stopped during settings update");
                }

                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AirQualityContext>();
                
                // Get simulation settings
                var settings = await dbContext.SimulationSettings.FirstOrDefaultAsync();
                if (settings == null)
                {
                    // Create default settings if none exist
                    settings = new SimulationSettings { SimulationSettingsId = 1, Enabled = true, IntervalSeconds = 30 };
                    dbContext.SimulationSettings.Add(settings);
                    await dbContext.SaveChangesAsync();
                }
                
                // Update current settings
                _currentSettings = settings;
                _logger.LogInformation("Retrieved settings from database: Enabled={Enabled}, IntervalSeconds={Interval}", 
                    settings.Enabled, settings.IntervalSeconds);
                
                lock (_lockObject)
                {
                    if (settings.Enabled)
                    {
                        // Convert seconds to milliseconds for timer
                        int intervalMs = settings.IntervalSeconds * 1000;
                        
                        // Start a new timer with the updated interval
                        // First run in 2 seconds, then every intervalMs
                        _timer?.Change(2000, intervalMs);
                        _isRunning = true;
                        _logger.LogInformation("Simulation started/updated with interval of {Interval} seconds", settings.IntervalSeconds);
                    }
                    else
                    {
                        _logger.LogInformation("Simulation remains stopped as per settings");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating simulation timer");
            }
        }

        private void ExecuteSimulation(object? state)
        {
            // Don't start a new simulation if one is already running or if simulation is disabled
            if (!_isRunning)
            {
                _logger.LogInformation("Skipping simulation cycle - simulation is disabled");
                return;
            }

            // Run simulation asynchronously
            _ = RunSimulationAsync();
        }

        private async Task RunSimulationAsync()
        {
            try
            {
                if (!_isRunning)
                {
                    _logger.LogInformation("Simulation cycle skipped: Simulation is disabled");
                    return;
                }

                _logger.LogInformation("Running simulation cycle with settings: Enabled={Enabled}, IntervalSeconds={Interval}", 
                    _currentSettings.Enabled, _currentSettings.IntervalSeconds);

                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AirQualityContext>();
                
                // Get all active sensors
                var activeSensors = await dbContext.Sensors
                    .Where(s => s.Status == "Active")
                    .ToListAsync();
                
                if (!activeSensors.Any())
                {
                    _logger.LogInformation("No active sensors found for simulation");
                    return;
                }
                
                _logger.LogInformation("Found {Count} active sensors for simulation", activeSensors.Count);
                
                var dataPoints = new List<SensorData>();
                var random = new Random();
                var timestamp = DateTime.UtcNow;
                
                foreach (var sensor in activeSensors)
                {
                    // Get latest AQI for this sensor
                    var latestData = await dbContext.SensorData
                        .Where(sd => sd.SensorId == sensor.SensorId)
                        .OrderByDescending(sd => sd.Timestamp)
                        .FirstOrDefaultAsync();
                    
                    // Generate new AQI value (previous AQI +/- random change between -5 and 5)
                    int currentAqi = latestData?.AQI ?? 50; // Default to 50 if no previous data
                    int change = random.Next(-5, 6);
                    int newAqi = Math.Clamp(currentAqi + change, 0, 500); // Keep AQI between 0 and 500
                    
                    // Create new sensor data record
                    var newData = new SensorData
                    {
                        SensorId = sensor.SensorId,
                        Timestamp = timestamp,
                        AQI = newAqi
                    };
                    
                    dataPoints.Add(newData);
                    _logger.LogDebug("Generated data point for sensor {SensorId}: AQI {OldAQI} -> {NewAQI}", 
                        sensor.SensorId, currentAqi, newAqi);
                }
                
                // Save all data points at once
                await dbContext.SensorData.AddRangeAsync(dataPoints);
                await dbContext.SaveChangesAsync();
                
                _logger.LogInformation("Simulation cycle completed: Generated {Count} new data points at {Timestamp}", 
                    dataPoints.Count, timestamp);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error running simulation");
            }
        }

        public async Task<int> GetDataPointsGeneratedToday()
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AirQualityContext>();
                
                var today = DateTime.UtcNow.Date;
                var tomorrow = today.AddDays(1);
                
                return await dbContext.SensorData
                    .Where(sd => sd.Timestamp >= today && sd.Timestamp < tomorrow)
                    .CountAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting data points count");
                return 0;
            }
        }
        
        // Helper method to get current simulation settings for diagnostics
        public SimulationSettings GetCurrentSettings()
        {
            return _currentSettings;
        }

        // Helper method to check if simulation is currently running
        public bool IsRunning()
        {
            return _isRunning;
        }
    }
}