using AURA.Api.Contracts;
using AURA.Application.SystemStatus;
using Microsoft.AspNetCore.Mvc;

namespace AURA.Api.Controllers;

[ApiController]
[Route("api/v1/system")]
public sealed class SystemController(ISystemStatusService systemStatusService) : ControllerBase
{
    [HttpGet("info")]
    public async Task<ActionResult<ApiEnvelope<SystemInfoResponse>>> Info(CancellationToken cancellationToken)
    {
        var info = await systemStatusService.GetAsync(cancellationToken);
        return Ok(ApiEnvelope<SystemInfoResponse>.Ok(info, HttpContext.TraceIdentifier));
    }
}
