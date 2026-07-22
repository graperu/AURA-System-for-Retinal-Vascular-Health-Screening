using AURA.Api.Contracts;
using AURA.Application.Analyses;
using Microsoft.AspNetCore.Mvc;

namespace AURA.Api.Controllers;

[ApiController]
[Route("api/v1/analyses")]
public sealed class AnalysesController(IAnalysisService analysisService) : ControllerBase
{
    [HttpPost("demo")]
    public async Task<ActionResult<ApiEnvelope<AnalysisResult>>> Demo(
        [FromBody] DemoAnalysisRequest request,
        CancellationToken cancellationToken)
    {
        var result = await analysisService.AnalyzeAsync(request, cancellationToken);
        return Ok(ApiEnvelope<AnalysisResult>.Ok(result, HttpContext.TraceIdentifier));
    }
}
