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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AdminUser>().ToTable("AdminUser");
            modelBuilder.Entity<Sensor>().ToTable("Sensor");
            modelBuilder.Entity<SensorData>().ToTable("SensorData");
            modelBuilder.Entity<SimulationSettings>().ToTable("SimulationSettings");
            
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
        }
    }
}
