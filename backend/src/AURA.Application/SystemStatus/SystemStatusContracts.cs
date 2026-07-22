namespace AURA.Application.SystemStatus;

public sealed record DependencyStatus(string Status);

public sealed record SystemInfoResponse(
    string Name,
    string Version,
    string Environment,
    string Status,
    DependencyStatus Database,
    DependencyStatus AiCore,
    DateTime TimestampUtc);

public interface ISystemStatusService
{
    Task<SystemInfoResponse> GetAsync(CancellationToken cancellationToken);
}
