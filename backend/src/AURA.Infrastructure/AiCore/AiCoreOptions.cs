namespace AURA.Infrastructure.AiCore;

public sealed class AiCoreOptions
{
    public const string SectionName = "AiCore";
    public string BaseUrl { get; init; } = "http://localhost:8000";
    public int TimeoutSeconds { get; init; } = 10;
}
