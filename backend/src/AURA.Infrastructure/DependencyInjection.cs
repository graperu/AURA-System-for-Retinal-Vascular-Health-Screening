using AURA.Application.Analyses;
using AURA.Application.SystemStatus;
using AURA.Infrastructure.AiCore;
using AURA.Infrastructure.Persistence;
using AURA.Infrastructure.SystemStatus;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace AURA.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres")
            ?? throw new InvalidOperationException("ConnectionStrings:Postgres is required.");

        services.AddDbContext<AuraDbContext>(options => options.UseNpgsql(connectionString));
        services.Configure<AiCoreOptions>(configuration.GetSection(AiCoreOptions.SectionName));
        services.AddHttpClient<IAiCoreClient, AiCoreClient>((provider, client) =>
        {
            var options = provider.GetRequiredService<IOptions<AiCoreOptions>>().Value;
            client.BaseAddress = new Uri(options.BaseUrl);
            client.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);
        });
        services.AddScoped<ISystemStatusService, SystemStatusService>();
        return services;
    }
}
