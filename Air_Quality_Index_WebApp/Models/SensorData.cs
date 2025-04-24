using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Air_Quality_Index_WebApp.Models
{
    public class SensorData
    {
        [Key]
        public int SensorDataId { get; set; }

        [Required]
        public int SensorId { get; set; }

        [ForeignKey("SensorId")]
        public Sensor? Sensor { get; set; }

        [Required]
        public DateTime Timestamp { get; set; }

        [Required]
        public int AQI { get; set; }

        public double? PM25 { get; set; }
        public double? PM10 { get; set; }
        public double? O3 { get; set; }
        public double? NO2 { get; set; }
    }
}
