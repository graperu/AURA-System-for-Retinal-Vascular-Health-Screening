using AURA.Api.Contracts;
using AURA.Api.Controllers;
using AURA.Application.SystemStatus;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace AURA.Api.Tests;

public sealed class SystemInfoTests
{
    [Fact]
    public async Task Info_returns_consistent_success_envelope()
    {
        var controller = new SystemController(new StubSystemStatusService())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { TraceIdentifier = "test-trace" }
            }
        };

        var response = await controller.Info(CancellationToken.None);
        var ok = Assert.IsType<OkObjectResult>(response.Result);
        var body = Assert.IsType<ApiEnvelope<SystemInfoResponse>>(ok.Value);

        Assert.True(body.Success);
        Assert.Equal("AURA API", body.Data?.Name);
        Assert.Null(body.Error);
        Assert.Equal("test-trace", body.TraceId);
    }
}

internal sealed class StubSystemStatusService : ISystemStatusService
{
    public Task<SystemInfoResponse> GetAsync(CancellationToken cancellationToken) => Task.FromResult(
        new SystemInfoResponse(
            "AURA API",
            "test",
            "Testing",
            "healthy",
            new DependencyStatus("healthy"),
            new DependencyStatus("healthy"),
            DateTime.UtcNow));
}
