using AURA.Api.Contracts;
using Microsoft.AspNetCore.Diagnostics;

namespace AURA.Api.Middleware;

public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        logger.LogError(exception, "Unhandled request error for trace {TraceId}", context.TraceIdentifier);
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsJsonAsync(
            ApiEnvelope<object>.Fail(
                new ApiError("INTERNAL_ERROR", "An unexpected error occurred."),
                context.TraceIdentifier),
            cancellationToken);
        return true;
    }
}
