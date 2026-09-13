import { AIRiskResult, RiskLevel, VesselAnomalyRegion } from '../types/cds';

/**
 * Chuyển đổi mức rủi ro do backend trả về (LOW/MODERATE/HIGH/CRITICAL hoặc
 * Low/Moderate/High) sang RiskLevel mà giao diện đang dùng ('Low' | 'Moderate' | 'High' | 'Severe').
 */
export const toFrontendRiskLevel = (level?: string | null): RiskLevel => {
  switch ((level || '').toUpperCase()) {
    case 'CRITICAL':
    case 'SEVERE':
      return 'Severe';
    case 'HIGH':
      return 'High';
    case 'MODERATE':
    case 'MEDIUM':
      return 'Moderate';
    default:
      return 'Low';
  }
};

/**
 * Chuẩn hóa và bóc tách danh mục mã ICD-10 từ chuỗi hoặc mảng lưu trong database.
 * Hỗ trợ cả mảng JSON, chuỗi phân cách bởi dấu phẩy, dấu chấm phẩy hoặc xuống dòng.
 */
export const parseIcd10Codes = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((c) => String(c).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((c) => String(c).trim()).filter(Boolean);
        }
      } catch {
        // Fallback sang phân tách bằng ký tự ngăn cách
      }
    }
    return trimmed.split(/[\n,;]+/).map((c) => c.trim()).filter(Boolean);
  }
  return [];
};

/**
 * Chuyển đổi bản ghi Screening thật từ backend (Spring Boot + AURA AI Core thật)
 * sang định dạng AIRiskResult mà RiskAssessmentPanel / InteractiveCDSViewer /
 * MedicalReportModal đang dùng để hiển thị (FR-3, FR-4, FR-5, FR-6, FR-7).
 */
export const mapScreeningToAIRiskResult = (screening: any, fallbackImageUrl: string): AIRiskResult => {
  const cvdScore = screening.cardiovascularRiskScore ?? 0;
  const drScore = screening.diabeticRetinopathyRiskScore ?? 0;
  const strokeScore = screening.strokeRiskScore ?? cvdScore;

  // Sửa dứt điểm công thức tính điểm:
  // Lấy screening.riskScore ?? screening.overallVascularRiskScore ?? Math.round((cvdScore + drScore) / 2).
  // TUYỆT ĐỐI KHÔNG dùng confidence * 100!
  const overallScore = Math.round(
    screening.riskScore ?? screening.overallVascularRiskScore ?? ((cvdScore + drScore) / 2)
  );

  // Xóa bỏ hoàn toàn hàm sinh tọa độ tổn thương giả lập generateAnomaliesFromMetrics.
  // Lấy detectedAnomalies thật nếu có, nếu không thì trả về mảng rỗng [].
  const detectedAnomalies: VesselAnomalyRegion[] = Array.isArray(screening.detectedAnomalies)
    ? screening.detectedAnomalies
    : Array.isArray(screening.annotatedMap?.detectedAnomalies)
    ? screening.annotatedMap.detectedAnomalies
    : [];

  const parsedIcd10 = parseIcd10Codes(screening.icd10Codes);

  return {
    analysisId: screening.id,
    imageUrl: screening.imageUrl || fallbackImageUrl,
    status: screening.status || 'COMPLETED',
    executionTimeMs: screening.executionTimeMs ?? 0,
    overallVascularRiskScore: overallScore,
    riskScore: screening.riskScore ?? overallScore,
    eyePosition: screening.eyePosition || screening.eye || 'OD',
    scanType: screening.scanType || 'Fundus_Macula',
    icd10Codes: parsedIcd10,
    doctorNotes: screening.doctorNotes || screening.notes || undefined,
    digitalSignature: screening.digitalSignature || undefined,
    signedAt: screening.signedAt || undefined,
    createdAt: screening.createdAt || undefined,
    doctorName: screening.doctorName || undefined,
    doctorId: screening.doctorId || undefined,
    patientId: screening.patientId || undefined,
    findings: screening.findings || undefined,
    recommendations: screening.recommendations || undefined,
    cardiovascularRisk: {
      level: toFrontendRiskLevel(screening.cardiovascularRiskLevel),
      score: cvdScore,
      hypertensionStage: screening.hypertensionRiskLevel || 'Chưa xác định',
      threeYearStrokeRiskPercent: strokeScore,
    },
    diabeticRetinopathyRisk: {
      level: toFrontendRiskLevel(screening.diabeticRetinopathyRiskLevel),
      score: drScore,
      etdrsGrade: screening.etdrsGrade || 'Theo phân tích AURA AI',
      macularEdemaPresent: drScore >= 50,
    },
    glaucomaRisk: {
      level: toFrontendRiskLevel(screening.glaucomaRiskLevel),
      score: screening.glaucomaRiskScore ?? 0,
    },
    annotatedMap: {
      heatmapUrl: screening.heatmapBase64 || screening.annotatedMap?.heatmapUrl || undefined,
      arteryVeinRatio: screening.avRatio ?? screening.annotatedMap?.arteryVeinRatio ?? 0,
      vesselDensityPercentage: screening.vesselDensityPercent ?? screening.annotatedMap?.vesselDensityPercentage ?? 0,
      tortuosityIndex: screening.tortuosityIndex ?? screening.annotatedMap?.tortuosityIndex ?? 0,
      opticCupToDiscRatio: screening.verticalCdr ?? screening.annotatedMap?.opticCupToDiscRatio ?? 0,
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
