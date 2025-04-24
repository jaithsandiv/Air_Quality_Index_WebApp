using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Air_Quality_Index_WebApp.Models
{
    public class Sensor
    {
        [Key]
        public int SensorId { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public int LocationId { get; set; }

        [ForeignKey("LocationId")]
        public Location? Location { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = string.Empty;

        // Navigation property
        public ICollection<SensorData>? SensorData { get; set; }
    }
}
