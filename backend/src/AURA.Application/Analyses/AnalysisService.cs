namespace AURA.Application.Analyses;

public sealed class AnalysisService(IAiCoreClient aiCoreClient) : IAnalysisService
{
    public Task<AnalysisResult> AnalyzeAsync(DemoAnalysisRequest request, CancellationToken cancellationToken) =>
        aiCoreClient.AnalyzeAsync(request, cancellationToken);
}
