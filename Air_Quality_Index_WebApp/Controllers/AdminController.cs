using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Air_Quality_Index_WebApp.Data;
using Air_Quality_Index_WebApp.Models;
using Air_Quality_Index_WebApp.Services;
using Newtonsoft.Json.Linq;

namespace Air_Quality_Index_WebApp.Controllers
{
    [Route("admin")]
    public class AdminController : Controller
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
            double? pm25 = data["iaqi"]?["pm25"]?["v"]?.Value<double>();
            double? pm10 = data["iaqi"]?["pm10"]?["v"]?.Value<double>();
            double? o3 = data["iaqi"]?["o3"]?["v"]?.Value<double>();
            double? no2 = data["iaqi"]?["no2"]?["v"]?.Value<double>();
            DateTime timestamp = DateTime.UtcNow;

            // Find or create a sensor for this city
            var sensor = await _context.Sensors.FirstOrDefaultAsync(s => s.Name.ToLower() == city.ToLower());
            if (sensor == null)
            {
                // For demo: create a new sensor with default location
                var location = await _context.Locations.FirstOrDefaultAsync();
                sensor = new Sensor
                {
                    Name = city,
                    Location = location,
                    LocationId = location?.LocationId ?? 1,
                    Status = "Active"
                };
                _context.Sensors.Add(sensor);
                await _context.SaveChangesAsync();
            }

            var sensorData = new SensorData
            {
                SensorId = sensor.SensorId,
                Timestamp = timestamp,
                AQI = aqi,
                PM25 = pm25,
                PM10 = pm10,
                O3 = o3,
                NO2 = no2
            };
            _context.SensorData.Add(sensorData);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"WAQI data for {city} saved.", aqi, pm25, pm10, o3, no2 });
        }

        // POST: /admin/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { success = false, message = "Username and password are required." });

            // Find admin user by username
            var admin = await _context.AdminUsers.FirstOrDefaultAsync(u => u.Username == request.Username);
            if (admin == null)
                return Unauthorized(new { success = false, message = "Invalid username or password." });

            // Compare password hash (assuming PasswordHash is a hash, e.g., SHA256)
            var inputHash = AuthHelper.HashPassword(request.Password); // You may need to implement this helper
            if (admin.PasswordHash != inputHash)
                return Unauthorized(new { success = false, message = "Invalid username or password." });

            // Success: return a simple success response (for demo, no JWT/session)
            return Ok(new { success = true, message = "Login successful." });
        }

        public class LoginRequest
        {
            public string Username { get; set; }
            public string Password { get; set; }
        }

        // --- SENSOR MANAGEMENT API ENDPOINTS ---

        // GET: /admin/sensors
        [HttpGet("sensors")]
        public async Task<IActionResult> GetSensors()
        {
            var sensors = await _context.Sensors.Include(s => s.Location).ToListAsync();
            var result = sensors.Select(s => new {
                id = s.SensorId,
                name = s.Name,
                status = s.Status,
                lat = s.Location?.Latitude,
                lng = s.Location?.Longitude,
                locationId = s.LocationId,
                locationName = s.Location?.Name
            });
            return Ok(result);
        }

        // POST: /admin/sensors
        [HttpPost("sensors")]
        public async Task<IActionResult> AddSensor([FromBody] AddSensorRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return BadRequest(new { success = false, message = "Sensor name is required." });

            // Find or create location
            var location = await _context.Locations.FirstOrDefaultAsync(l => l.Latitude == req.Lat && l.Longitude == req.Lng);
            if (location == null)
            {
                location = new Location { Name = req.Name + " Location", Latitude = req.Lat, Longitude = req.Lng };
                _context.Locations.Add(location);
                await _context.SaveChangesAsync();
            }

            var sensor = new Sensor
            {
                Name = req.Name,
                Status = "Active",
                LocationId = location.LocationId
            };
            _context.Sensors.Add(sensor);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Sensor added.", id = sensor.SensorId });
        }

        public class AddSensorRequest
        {
            public string Name { get; set; }
            public double Lat { get; set; }
            public double Lng { get; set; }
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
    } // end class
}
