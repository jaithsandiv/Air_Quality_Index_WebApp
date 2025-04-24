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
        public DbSet<Location> Locations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AdminUser>().ToTable("AdminUser");
            modelBuilder.Entity<Sensor>().ToTable("Sensor");
            modelBuilder.Entity<SensorData>().ToTable("SensorData");
            modelBuilder.Entity<Location>().ToTable("Location");
        }
    }
}
