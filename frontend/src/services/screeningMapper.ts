import { AIRiskResult, RiskLevel } from '../types/cds';

/**
 * Chuyển đổi mức rủi ro do backend trả về (LOW/MODERATE/HIGH/CRITICAL hoặc
 * Low/Moderate/High) sang RiskLevel mà giao diện đang dùng ('Low' | 'Moderate' | 'High' | 'Severe').
 */
export const toFrontendRiskLevel = (level?: string | null): RiskLevel => {
  switch ((level || '').toUpperCase()) {
    case 'CRITICAL':
      return 'Severe';
    case 'HIGH':
      return 'High';
    case 'MODERATE':
      return 'Moderate';
    default:
      return 'Low';
  }
};

/**
 * Chuyển đổi bản ghi Screening thật từ backend (Spring Boot + AURA AI Core thật)
 * sang định dạng AIRiskResult mà RiskAssessmentPanel / InteractiveCDSViewer /
 * MedicalReportModal đang dùng để hiển thị (FR-3, FR-4, FR-5).
 */
export const mapScreeningToAIRiskResult = (screening: any, fallbackImageUrl: string): AIRiskResult => {
  const cvdScore = screening.cardiovascularRiskScore ?? 0;
  const drScore = screening.diabeticRetinopathyRiskScore ?? 0;
  const strokeScore = screening.strokeRiskScore ?? cvdScore;
  const overallScore = Math.round(
    screening.confidence != null ? screening.confidence * 100 : (cvdScore + drScore) / 2
  );

  return {
    analysisId: screening.id,
    imageUrl: screening.imageUrl || fallbackImageUrl,
    status: 'COMPLETED',
    executionTimeMs: 0,
    overallVascularRiskScore: overallScore,
    cardiovascularRisk: {
      level: toFrontendRiskLevel(screening.cardiovascularRiskLevel),
      score: cvdScore,
      hypertensionStage: screening.hypertensionRiskLevel || 'Chưa xác định',
      threeYearStrokeRiskPercent: strokeScore,
    },
    diabeticRetinopathyRisk: {
      level: toFrontendRiskLevel(screening.diabeticRetinopathyRiskLevel),
      score: drScore,
      etdrsGrade: 'Theo phân tích AURA AI',
      macularEdemaPresent: drScore >= 50,
    },
    glaucomaRisk: {
      level: 'Low',
      score: 0,
    },
    annotatedMap: {
      heatmapUrl: screening.heatmapBase64 || undefined,
      arteryVeinRatio: screening.avRatio ?? 0,
      vesselDensityPercentage: screening.vesselDensityPercent ?? 0,
      tortuosityIndex: screening.tortuosityIndex ?? 0,
      opticCupToDiscRatio: screening.verticalCdr ?? 0,
      detectedAnomalies: [],
    },
    xaiExplainability: [
      {
        title: 'Phân Tích Cấu Trúc Vi Mạch (AURA AI)',
        impact: cvdScore >= 65 ? 'High' : cvdScore >= 40 ? 'Medium' : 'Low',
        clinicalRationale: screening.findings || 'Đang chờ dữ liệu phân tích chi tiết.',
      },
      {
        title: 'Khuyến Nghị Sức Khỏe Tự Động (FR-5)',
        impact: cvdScore >= 65 ? 'High' : 'Medium',
        clinicalRationale: screening.recommendations || 'Chưa có khuyến nghị.',
      },
    ],
  };
};
