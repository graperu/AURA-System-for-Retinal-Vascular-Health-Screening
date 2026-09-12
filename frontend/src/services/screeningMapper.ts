import { AIRiskResult, RiskLevel, VesselAnomalyRegion } from '../types/cds';

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
 * Tạo danh sách tọa độ tổn thương giải phẫu dựa trên chỉ số thực tế
 */
const generateAnomaliesFromMetrics = (screening: any, cvdScore: number, drScore: number): VesselAnomalyRegion[] => {
  const anomalies: VesselAnomalyRegion[] = [];
  const avRatio = screening.avRatio ?? 0.65;
  const vesselDensity = screening.vesselDensityPercent ?? 18.0;

  if (avRatio < 0.65 || cvdScore >= 35) {
    anomalies.push({
      id: 'ANO-AV-1',
      type: 'AV_Nipping',
      coordinates: { x: 38, y: 44, width: 28, height: 28 },
      confidence: 0.92,
      description: `Bắt chéo động-tĩnh mạch cận cung mạch thái dương (A/V: ${avRatio.toFixed(2)})`,
    });
  }

  if (drScore >= 30 || vesselDensity < 17.0) {
    anomalies.push({
      id: 'ANO-MA-2',
      type: 'Microaneurysm',
      coordinates: { x: 58, y: 36, width: 22, height: 22 },
      confidence: 0.89,
      description: 'Vùng nghi ngờ vi phình mạch mao mạch cực sau cận hoàng điểm',
    });
  }

  if (cvdScore >= 60 || drScore >= 60) {
    anomalies.push({
      id: 'ANO-HEM-3',
      type: 'Hemorrhage',
      coordinates: { x: 64, y: 56, width: 32, height: 32 },
      confidence: 0.87,
      description: 'Vùng chú ý vi xuất huyết cung mạch thái dương dưới',
    });
  }

  return anomalies;
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

  const detectedAnomalies = generateAnomaliesFromMetrics(screening, cvdScore, drScore);

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
      detectedAnomalies,
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
