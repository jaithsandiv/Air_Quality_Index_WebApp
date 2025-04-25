using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Air_Quality_Index_WebApp.Models;

namespace Air_Quality_Index_WebApp.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    private readonly Air_Quality_Index_WebApp.Data.AirQualityContext _context;

    public HomeController(ILogger<HomeController> logger, Air_Quality_Index_WebApp.Data.AirQualityContext context)
    {
        _logger = logger;
        _context = context;
    }

    public IActionResult Index()
    {
        // Get all sensors and locations
        var sensors = _context.Sensors.ToList();
        var locations = _context.Locations.ToList();

        // Get latest sensor data for each sensor
        var latestSensorData = _context.SensorData
            .ToList() // Materialize in memory to avoid EF Core translation issues
            .GroupBy(sd => sd.SensorId)
            .Select(g => g.OrderByDescending(sd => sd.Timestamp).FirstOrDefault())
            .Where(sd => sd != null)
            .Cast<SensorData>() // Ensure non-nullable list
            .ToList();

        var model = new DashboardViewModel
        {
            Sensors = sensors,
            Locations = locations,
            LatestSensorData = latestSensorData
        };
        return View(model);
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [HttpGet]
    [Route("api/sensors/mapdata")]
    public IActionResult GetMapSensorData()
    {
        var sensors = _context.Sensors.ToList();
        var locations = _context.Locations.ToList();
        var latestSensorData = _context.SensorData
            .ToList() // Materialize in memory to avoid EF Core translation issues
            .GroupBy(sd => sd.SensorId)
            .Select(g => g.OrderByDescending(sd => sd.Timestamp).FirstOrDefault())
            .Where(sd => sd != null)
            .Cast<SensorData>() // Ensure non-nullable list
            .ToList();

        var mapData = sensors.Select(sensor => {
            var location = locations.FirstOrDefault(l => l.LocationId == sensor.LocationId);
            var data = latestSensorData.FirstOrDefault(d => d.SensorId == sensor.SensorId);
            return new {
                id = sensor.SensorId,
                name = sensor.Name,
                lat = location?.Latitude,
                lng = location?.Longitude,
                aqi = data?.AQI ?? 0,
                pm25 = data?.PM25 ?? 0,
                pm10 = data?.PM10 ?? 0,
                o3 = data?.O3 ?? 0,
                no2 = data?.NO2 ?? 0,
                lastUpdated = data?.Timestamp
            };
        });
        return Json(mapData);
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
