using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Air_Quality_Index_WebApp.Data;
using Air_Quality_Index_WebApp.Models;
using Air_Quality_Index_WebApp.Services;
using Newtonsoft.Json.Linq;

namespace Air_Quality_Index_WebApp.Controllers
{
    [Route("admin")]
    [ApiController]  // Add this attribute to make it a proper API controller
    public class AdminController : ControllerBase  // Change to ControllerBase for API controllers
    {
        private readonly AirQualityContext _context;
        private readonly WaqiService _waqiService;

        public AdminController(AirQualityContext context, WaqiService waqiService)
        {
            _context = context;
            _waqiService = waqiService;
        }

        // GET: /admin/fetch-waqi?city=beijing
        [HttpGet("fetch-waqi")]
        public async Task<IActionResult> FetchWaqiData(string city)
        {
            var waqiData = await _waqiService.FetchCityFeedAsync(city);
            if (waqiData["status"]?.ToString() != "ok")
                return BadRequest("Failed to fetch WAQI data");

            var data = waqiData["data"];
            int aqi = data["aqi"]?.Value<int>() ?? 0;
            DateTime timestamp = DateTime.UtcNow;

            // Find or create a sensor for this city
            var sensor = await _context.Sensors.FirstOrDefaultAsync(s => s.Name.ToLower() == city.ToLower());
            if (sensor == null)
            {
                // For demo: create a new sensor with default location coordinates
                // In a real app, you might want to geocode the city name to get coordinates
                double defaultLat = 0.0; // Default latitude
                double defaultLng = 0.0; // Default longitude
                
                sensor = new Sensor
                {
                    Name = city,
                    Latitude = defaultLat,
                    Longitude = defaultLng,
                    Status = "Active"
                };
                _context.Sensors.Add(sensor);
                await _context.SaveChangesAsync();
            }

            var sensorData = new SensorData
            {
                SensorId = sensor.SensorId,
                Timestamp = timestamp,
                AQI = aqi
            };
            _context.SensorData.Add(sensorData);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"WAQI data for {city} saved.", aqi });
        }

        // --- SENSOR MANAGEMENT API ENDPOINTS ---

        // GET: /admin/sensors
        [HttpGet("sensors")]
        public async Task<IActionResult> GetSensors()
        {
            var sensors = await _context.Sensors.ToListAsync();
            var sensorsWithLatestData = new List<object>();
            
            foreach (var sensor in sensors)
            {
                // Get the latest sensor data for each sensor
                var latestData = await _context.SensorData
                    .Where(sd => sd.SensorId == sensor.SensorId)
                    .OrderByDescending(sd => sd.Timestamp)
                    .FirstOrDefaultAsync();
                
                sensorsWithLatestData.Add(new {
                    id = sensor.SensorId,
                    name = sensor.Name,
                    status = sensor.Status,
                    lat = sensor.Latitude,
                    lng = sensor.Longitude,
                    aqi = latestData?.AQI ?? 0,
                    lastUpdated = latestData?.Timestamp
                });
            }
            
            return Ok(sensorsWithLatestData);
        }

        // POST: /admin/sensors
        [HttpPost("sensors")]
        public async Task<IActionResult> AddSensor([FromBody] AddSensorRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return BadRequest(new { success = false, message = "Sensor name is required." });

            if (req.InitialAQI < 0)
                return BadRequest(new { success = false, message = "Initial AQI must be a non-negative value." });

            // Create new sensor with coordinates directly included
            var sensor = new Sensor
            {
                Name = req.Name,
                Latitude = req.Lat,
                Longitude = req.Lng,
                Status = "Active"
            };

            _context.Sensors.Add(sensor);
            await _context.SaveChangesAsync();

            // Create initial sensor data with provided AQI value
            var sensorData = new SensorData
            {
                SensorId = sensor.SensorId,
                AQI = req.InitialAQI,
                Timestamp = DateTime.UtcNow
            };

            _context.SensorData.Add(sensorData);
            await _context.SaveChangesAsync();

            return Ok(new { 
                success = true, 
                message = "Sensor added successfully.", 
                id = sensor.SensorId,
                name = sensor.Name,
                lat = sensor.Latitude,
                lng = sensor.Longitude,
                aqi = sensorData.AQI
            });
        }

        public class AddSensorRequest
        {
            public string Name { get; set; } = string.Empty;
            public double Lat { get; set; }
            public double Lng { get; set; }
            public int InitialAQI { get; set; } = 50; // Default value
        }

        // PUT: /admin/sensors/{id}/status
        [HttpPut("sensors/{id}/status")]
        public async Task<IActionResult> UpdateSensorStatus(int id, [FromBody] UpdateSensorStatusRequest req)
        {
            var sensor = await _context.Sensors.FindAsync(id);
            if (sensor == null)
                return NotFound(new { success = false, message = "Sensor not found." });
            sensor.Status = req.Status;
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Sensor status updated." });
        }

        public class UpdateSensorStatusRequest
        {
            public string Status { get; set; }
        }

        // PUT: /admin/sensors/{id}
        [HttpPut("sensors/{id}")]
        public async Task<IActionResult> UpdateSensor(int id, [FromBody] UpdateSensorRequest req)
        {
            var sensor = await _context.Sensors.FindAsync(id);
            if (sensor == null)
                return NotFound(new { success = false, message = "Sensor not found." });
            
            // Update the sensor properties
            sensor.Name = req.Name ?? sensor.Name;
            sensor.Latitude = req.Lat ?? sensor.Latitude;
            sensor.Longitude = req.Lng ?? sensor.Longitude;
            
            // Update the sensor in the database
            _context.Sensors.Update(sensor);
            await _context.SaveChangesAsync();
            
            // If the AQI was updated, add a new SensorData entry
            if (req.AQI.HasValue)
            {
                var sensorData = new SensorData
                {
                    SensorId = sensor.SensorId,
                    AQI = req.AQI.Value,
                    Timestamp = DateTime.UtcNow
                };
                
                _context.SensorData.Add(sensorData);
                await _context.SaveChangesAsync();
            }
            
            return Ok(new { 
                success = true, 
                message = "Sensor updated successfully.",
                id = sensor.SensorId,
                name = sensor.Name,
                lat = sensor.Latitude,
                lng = sensor.Longitude,
                aqi = req.AQI
            });
        }

        public class UpdateSensorRequest
        {
            public string? Name { get; set; }
            public double? Lat { get; set; }
            public double? Lng { get; set; }
            public int? AQI { get; set; }
        }

        // DELETE: /admin/sensors/{id}
        [HttpDelete("sensors/{id}")]
        public async Task<IActionResult> DeleteSensor(int id)
        {
            var sensor = await _context.Sensors.FindAsync(id);
            if (sensor == null)
                return NotFound(new { success = false, message = "Sensor not found." });
            _context.Sensors.Remove(sensor);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Sensor deleted." });
        }

        // --- USER MANAGEMENT API ENDPOINTS ---

        // GET: /admin/users
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var users = await _context.AdminUsers
                    .Select(u => new { 
                        id = u.AdminUserId, 
                        username = u.Username, 
                        email = u.Email 
                    })
                    .ToListAsync();
                
                return Ok(users);
            }
            catch (Exception ex)
            {
                // Log the exception
                Console.WriteLine($"Error in GetUsers: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving users." });
            }
        }

        // POST: /admin/users
        [HttpPost("users")]
        public async Task<IActionResult> AddUser([FromBody] AddUserRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password) || string.IsNullOrWhiteSpace(req.Email))
                return BadRequest(new { success = false, message = "Username, password, and email are required." });

            // Check if username or email already exists
            var existingUser = await _context.AdminUsers
                .FirstOrDefaultAsync(u => u.Username == req.Username || u.Email == req.Email);

            if (existingUser != null)
            {
                if (existingUser.Username == req.Username)
                    return BadRequest(new { success = false, message = "Username already exists." });
                
                if (existingUser.Email == req.Email)
                    return BadRequest(new { success = false, message = "Email already exists." });
            }

            // Hash the password
            string passwordHash = PasswordHashService.HashPassword(req.Password);

            // Create new admin user
            var newUser = new AdminUser
            {
                Username = req.Username,
                PasswordHash = passwordHash,
                Email = req.Email
            };

            _context.AdminUsers.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok(new { 
                success = true, 
                message = "Admin user added successfully.",
                id = newUser.AdminUserId,
                username = newUser.Username,
                email = newUser.Email
            });
        }

        // DELETE: /admin/users/{id}
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.AdminUsers.FindAsync(id);
            if (user == null)
                return NotFound(new { success = false, message = "User not found." });

            _context.AdminUsers.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "User deleted successfully." });
        }

        public class AddUserRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
        }
    } // end class
}
