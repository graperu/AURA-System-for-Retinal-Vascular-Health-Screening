namespace AURA.Api.Contracts;

public sealed record ApiError(string Code, string Message, object? Details = null);

public sealed record ApiEnvelope<T>(bool Success, T? Data, ApiError? Error, string TraceId)
{
    public static ApiEnvelope<T> Ok(T data, string traceId) => new(true, data, null, traceId);
    public static ApiEnvelope<T> Fail(ApiError error, string traceId) => new(false, default, error, traceId);
}
