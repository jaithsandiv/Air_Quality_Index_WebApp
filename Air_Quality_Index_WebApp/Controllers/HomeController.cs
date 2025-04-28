using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Air_Quality_Index_WebApp.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System;
using System.Collections.Generic;

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

    // GET: /Home/SensorHistory?sensorId=1&timeRange=day
    [HttpGet("Home/SensorHistory")]
    public async Task<IActionResult> GetSensorHistoricalData(int sensorId, string timeRange = "day")
    {
        try
        {
            if (sensorId <= 0)
            {
                return BadRequest(new { error = "Invalid sensor ID" });
            }

            // Check if sensor exists
            var sensorExists = await _context.Sensors.AnyAsync(s => s.SensorId == sensorId);
            if (!sensorExists)
            {
                return NotFound(new { error = "Sensor not found" });
            }

            // Calculate time range
            var endTime = DateTime.UtcNow;
            var startTime = endTime;

            switch (timeRange.ToLower())
            {
                case "day":
                    startTime = endTime.AddDays(-1);
                    break;
                case "week":
                    startTime = endTime.AddDays(-7);
                    break;
                case "month":
                    startTime = endTime.AddMonths(-1);
                    break;
                default:
                    startTime = endTime.AddDays(-1); // Default to 1 day
                    break;
            }

            // Create appropriate sampling based on time range
            TimeSpan samplingInterval;
            string timeFormat;

            switch (timeRange.ToLower())
            {
                case "day":
                    samplingInterval = TimeSpan.FromHours(1); // Hourly for day view
                    timeFormat = "HH:mm";
                    break;
                case "week":
                    samplingInterval = TimeSpan.FromHours(6); // Every 6 hours for week view
                    timeFormat = "MM/dd HH:mm";
                    break;
                case "month":
                    samplingInterval = TimeSpan.FromDays(1); // Daily for month view
                    timeFormat = "MM/dd";
                    break;
                default:
                    samplingInterval = TimeSpan.FromHours(1);
                    timeFormat = "HH:mm";
                    break;
            }

            // Fetch the data for the specified sensor and time range
            var sensorData = await _context.SensorData
                .Where(sd => sd.SensorId == sensorId && sd.Timestamp >= startTime && sd.Timestamp <= endTime)
                .OrderBy(sd => sd.Timestamp)
                .ToListAsync();

            // If no data, return empty result
            if (!sensorData.Any())
            {
                return Ok(new
                {
                    sensorId = sensorId,
                    timeRange = timeRange,
                    labels = new string[0],
                    data = new int[0]
                });
            }

            // Sample the data at regular intervals to avoid overwhelming the chart
            var sampledData = new List<(DateTime Timestamp, int AQI)>();
            var currentSampleTime = startTime;

            while (currentSampleTime <= endTime)
            {
                // Find the closest data point to the current sample time
                var closestDataPoint = sensorData
                    .Where(sd => Math.Abs((sd.Timestamp - currentSampleTime).TotalMinutes) < samplingInterval.TotalMinutes)
                    .OrderBy(sd => Math.Abs((sd.Timestamp - currentSampleTime).TotalMinutes))
                    .FirstOrDefault();

                if (closestDataPoint != null)
                {
                    sampledData.Add((closestDataPoint.Timestamp, closestDataPoint.AQI));
                }

                currentSampleTime = currentSampleTime.Add(samplingInterval);
            }

            // Format the data for the chart
            var labels = sampledData.Select(d => d.Timestamp.ToString(timeFormat)).ToArray();
            var values = sampledData.Select(d => d.AQI).ToArray();

            return Ok(new
            {
                sensorId = sensorId,
                timeRange = timeRange,
                labels = labels,
                data = values
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving historical data for sensor {sensorId}");
            return StatusCode(500, new { error = "An error occurred while retrieving sensor historical data" });
        }
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
