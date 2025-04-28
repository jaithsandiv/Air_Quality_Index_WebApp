using System.ComponentModel.DataAnnotations;

namespace Air_Quality_Index_WebApp.Models
{
    public class SimulationSettings
    {
        [Key]
        public int SimulationSettingsId { get; set; } = 1;

        [Required]
        public bool Enabled { get; set; } = true;

        [Required]
        [Range(5, 300)]
        public int IntervalSeconds { get; set; } = 30;
    }
}