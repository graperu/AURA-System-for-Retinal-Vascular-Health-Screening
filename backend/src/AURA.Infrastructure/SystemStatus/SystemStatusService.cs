using AURA.Application.Analyses;
using AURA.Application.SystemStatus;
using AURA.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AURA.Infrastructure.SystemStatus;

public sealed class SystemStatusService(
    AuraDbContext dbContext,
    IAiCoreClient aiCoreClient,
    IConfiguration configuration) : ISystemStatusService
{
    public async Task<SystemInfoResponse> GetAsync(CancellationToken cancellationToken)
    {
        var databaseHealthy = await CanConnectToDatabase(cancellationToken);
        var aiCoreHealthy = await aiCoreClient.IsHealthyAsync(cancellationToken);
        var status = databaseHealthy && aiCoreHealthy ? "healthy" : "degraded";

        return new SystemInfoResponse(
            "AURA API",
            "1.0.0-milestone.1",
            configuration["ASPNETCORE_ENVIRONMENT"] ?? "Production",
            status,
            new DependencyStatus(databaseHealthy ? "healthy" : "unavailable"),
            new DependencyStatus(aiCoreHealthy ? "healthy" : "unavailable"),
            DateTime.UtcNow);
    }

    private async Task<bool> CanConnectToDatabase(CancellationToken cancellationToken)
    {
        try
        {
            return await dbContext.Database.CanConnectAsync(cancellationToken);
        }
        catch (Exception exception) when (exception is InvalidOperationException or TimeoutException or Npgsql.NpgsqlException)
        {
            return false;
        }
    }
}
