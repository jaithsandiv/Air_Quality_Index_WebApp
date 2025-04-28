using System;
using System.ComponentModel.DataAnnotations;

namespace Air_Quality_Index_WebApp.Models
{
    public class AlertThreshold
    {
        [Key]
        public int AlertThresholdId { get; set; }
        
        [Required]
        public int ModerateThreshold { get; set; } = 51;
        
        [Required]
        public int UnhealthySensitiveThreshold { get; set; } = 101;
        
        [Required]
        public int UnhealthyThreshold { get; set; } = 151;
        
        [Required]
        public int VeryUnhealthyThreshold { get; set; } = 201;
        
        [Required]
        public int HazardousThreshold { get; set; } = 301;
        
        // When the thresholds were last updated
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}