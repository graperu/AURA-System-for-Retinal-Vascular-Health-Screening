using AURA.Api.Contracts;
using AURA.Application.SystemStatus;
using Microsoft.AspNetCore.Mvc;

namespace AURA.Api.Controllers;

[ApiController]
public sealed class HealthController(ISystemStatusService systemStatusService) : ControllerBase
{
    [HttpGet("/health")]
    [ProducesResponseType(typeof(ApiEnvelope<SystemInfoResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<SystemInfoResponse>>> Get(CancellationToken cancellationToken)
    {
        var status = await systemStatusService.GetAsync(cancellationToken);
        return Ok(ApiEnvelope<SystemInfoResponse>.Ok(status, HttpContext.TraceIdentifier));
    }
}
