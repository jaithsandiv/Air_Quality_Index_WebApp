using Air_Quality_Index_WebApp.Models;
using Microsoft.EntityFrameworkCore;

namespace Air_Quality_Index_WebApp.Data
{
    public class AirQualityContext : DbContext
    {
        public AirQualityContext(DbContextOptions<AirQualityContext> options) : base(options)
        {
        }

        public DbSet<AdminUser> AdminUsers { get; set; }
        public DbSet<Sensor> Sensors { get; set; }
        public DbSet<SensorData> SensorData { get; set; }
        public DbSet<SimulationSettings> SimulationSettings { get; set; }
        public DbSet<AlertThreshold> AlertThresholds { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AdminUser>().ToTable("AdminUser");
            modelBuilder.Entity<Sensor>().ToTable("Sensor");
            modelBuilder.Entity<SensorData>().ToTable("SensorData");
            modelBuilder.Entity<SimulationSettings>().ToTable("SimulationSettings");
            modelBuilder.Entity<AlertThreshold>().ToTable("AlertThreshold");
            
            // Set up cascade delete for SensorData when a Sensor is deleted
            modelBuilder.Entity<SensorData>()
                .HasOne(sd => sd.Sensor)
                .WithMany(s => s.SensorData)
                .HasForeignKey(sd => sd.SensorId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Seed initial simulation settings
            modelBuilder.Entity<SimulationSettings>().HasData(
                new SimulationSettings { SimulationSettingsId = 1, Enabled = true, IntervalSeconds = 30 }
            );
            
            // Seed initial alert thresholds
            modelBuilder.Entity<AlertThreshold>().HasData(
                new AlertThreshold {
                    AlertThresholdId = 1, 
                    ModerateThreshold = 51, 
                    UnhealthySensitiveThreshold = 101, 
                    UnhealthyThreshold = 151, 
                    VeryUnhealthyThreshold = 201, 
                    HazardousThreshold = 301,
                    LastUpdated = System.DateTime.UtcNow
                }
            );
        }
    }
}
