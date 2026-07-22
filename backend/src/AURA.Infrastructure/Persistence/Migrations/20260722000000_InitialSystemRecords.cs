using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace AURA.Infrastructure.Persistence.Migrations;

[DbContext(typeof(AuraDbContext))]
[Migration("20260722000000_InitialSystemRecords")]
public partial class InitialSystemRecords : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "system_records",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_system_records", x => x.id));

        migrationBuilder.InsertData(
            table: "system_records",
            columns: new[] { "id", "name", "created_at_utc" },
            values: new object[] { new Guid("a8f41d5c-a1bf-40c3-b5ab-582331397bd3"), "AURA Milestone 1", new DateTime(2026, 7, 22, 0, 0, 0, DateTimeKind.Utc) });
    }

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropTable(name: "system_records");
}
