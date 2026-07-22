using System.ComponentModel.DataAnnotations;

namespace AURA.Application.Analyses;

public sealed record DemoAnalysisRequest(
    [Required] Guid AnalysisId,
    [Required] Guid ExaminationId,
    [Required] Guid ImageId,
    [Required, RegularExpression("^(Fundus|OCT)$", ErrorMessage = "ImageType must be Fundus or OCT.")] string ImageType,
    [Required, Url] string ImageUrl) : IValidatableObject
{
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (AnalysisId == Guid.Empty)
            yield return new ValidationResult("AnalysisId must not be empty.", [nameof(AnalysisId)]);
        if (ExaminationId == Guid.Empty)
            yield return new ValidationResult("ExaminationId must not be empty.", [nameof(ExaminationId)]);
        if (ImageId == Guid.Empty)
            yield return new ValidationResult("ImageId must not be empty.", [nameof(ImageId)]);
    }
}

public sealed record AnalysisResult(
    Guid AnalysisId,
    string Status,
    IReadOnlyList<string> Findings,
    string RiskLevel,
    decimal Confidence,
    string ModelVersion,
    DateTime ProcessedAt,
    string Disclaimer);

public interface IAnalysisService
{
    Task<AnalysisResult> AnalyzeAsync(DemoAnalysisRequest request, CancellationToken cancellationToken);
}

public interface IAiCoreClient
{
    Task<AnalysisResult> AnalyzeAsync(DemoAnalysisRequest request, CancellationToken cancellationToken);
    Task<bool> IsHealthyAsync(CancellationToken cancellationToken);
}
