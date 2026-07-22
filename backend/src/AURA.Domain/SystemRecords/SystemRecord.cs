namespace AURA.Domain.SystemRecords;

public sealed class SystemRecord
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
