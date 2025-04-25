using System.Collections.Generic;
using Air_Quality_Index_WebApp.Models;

namespace Air_Quality_Index_WebApp.Models
{
    public class DashboardViewModel
    {
        public List<Sensor> Sensors { get; set; } = new();
        public List<Location> Locations { get; set; } = new();
        public List<SensorData> LatestSensorData { get; set; } = new();
    }
}
