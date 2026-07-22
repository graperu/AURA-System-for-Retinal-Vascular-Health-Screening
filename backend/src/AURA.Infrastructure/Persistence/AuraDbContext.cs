using AURA.Domain.SystemRecords;
using Microsoft.EntityFrameworkCore;

namespace AURA.Infrastructure.Persistence;

public sealed class AuraDbContext(DbContextOptions<AuraDbContext> options) : DbContext(options)
{
    public DbSet<SystemRecord> SystemRecords => Set<SystemRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SystemRecord>(entity =>
        {
            entity.ToTable("system_records");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
            entity.Property(item => item.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
            entity.HasData(new SystemRecord
            {
                Id = new Guid("a8f41d5c-a1bf-40c3-b5ab-582331397bd3"),
                Name = "AURA Milestone 1",
                CreatedAtUtc = new DateTime(2026, 7, 22, 0, 0, 0, DateTimeKind.Utc)
            });
        });
    }
}
