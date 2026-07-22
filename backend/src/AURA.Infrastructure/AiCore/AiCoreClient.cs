using System.Net.Http.Json;
using AURA.Application.Analyses;

namespace AURA.Infrastructure.AiCore;

public sealed class AiCoreClient(HttpClient httpClient) : IAiCoreClient
{
    public async Task<AnalysisResult> AnalyzeAsync(DemoAnalysisRequest request, CancellationToken cancellationToken)
    {
        using var response = await httpClient.PostAsJsonAsync("/api/v1/analyze", request, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<AnalysisResult>(cancellationToken: cancellationToken)
            ?? throw new InvalidOperationException("AI Core returned an empty response.");
    }

    public async Task<bool> IsHealthyAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var response = await httpClient.GetAsync("/health", cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (HttpRequestException)
        {
            return false;
        }
        catch (TaskCanceledException)
        {
            return false;
        }
    }
}
