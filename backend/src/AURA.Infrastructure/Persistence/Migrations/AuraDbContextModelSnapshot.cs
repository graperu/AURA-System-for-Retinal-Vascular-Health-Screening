using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace AURA.Infrastructure.Persistence.Migrations;

[DbContext(typeof(AuraDbContext))]
partial class AuraDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
        modelBuilder.HasAnnotation("ProductVersion", "8.0.11");
        modelBuilder.Entity("AURA.Domain.SystemRecords.SystemRecord", entity =>
        {
            entity.Property<Guid>("Id").HasColumnType("uuid").HasColumnName("id");
            entity.Property<DateTime>("CreatedAtUtc").HasColumnType("timestamp with time zone").HasColumnName("created_at_utc");
            entity.Property<string>("Name").IsRequired().HasMaxLength(100).HasColumnType("character varying(100)").HasColumnName("name");
            entity.HasKey("Id");
            entity.ToTable("system_records");
            entity.HasData(new
            {
                Id = new Guid("a8f41d5c-a1bf-40c3-b5ab-582331397bd3"),
                Name = "AURA Milestone 1",
                CreatedAtUtc = new DateTime(2026, 7, 22, 0, 0, 0, DateTimeKind.Utc)
            });
        });
    }
}
