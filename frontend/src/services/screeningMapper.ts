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

export const computeEtdrsGrade = (grade?: string | null, score?: number, level?: string | null): string => {
  if (grade && !grade.toLowerCase().includes('theo phân tích') && !grade.toLowerCase().includes('không dr') && !grade.toLowerCase().includes('no dr')) {
    return grade;
  }
  const s = score ?? 0;
  const l = (level || '').toUpperCase();
  if (s >= 80 || l.includes('CRITICAL') || l.includes('SEVERE')) {
    return 'Cấp độ 4 (PDR - Tăng sinh)';
  }
  if (s >= 65 || l.includes('HIGH')) {
    return 'Cấp độ 3 (NPDR nặng - Tiền tăng sinh)';
  }
  if (s >= 40 || l.includes('MODERATE') || l.includes('MEDIUM')) {
    return 'Cấp độ 2 (NPDR trung bình)';
  }
  if (s >= 25) {
    return 'Cấp độ 1 (NPDR nhẹ - Vi phình mạch)';
  }
  return 'Cấp độ 0 (Không DR)';
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

  // Parse an toàn trường detectedAnomalies từ chuỗi JSON string hoặc mảng thật
  let detectedAnomalies: VesselAnomalyRegion[] = [];
  if (typeof (screening as any).detectedAnomalies === 'string' && (screening as any).detectedAnomalies.trim().length > 2) {
    try {
      const parsed = JSON.parse((screening as any).detectedAnomalies);
      if (Array.isArray(parsed)) {
        detectedAnomalies = parsed;
      }
    } catch (e) {
      console.warn('Lỗi phân tích detectedAnomalies:', e);
    }
  } else if (Array.isArray((screening as any).detectedAnomalies)) {
    detectedAnomalies = (screening as any).detectedAnomalies;
  } else if (typeof (screening as any).annotatedMap?.detectedAnomalies === 'string' && (screening as any).annotatedMap.detectedAnomalies.trim().length > 2) {
    try {
      const parsed = JSON.parse((screening as any).annotatedMap.detectedAnomalies);
      if (Array.isArray(parsed)) {
        detectedAnomalies = parsed;
      }
    } catch (e) {
      console.warn('Lỗi phân tích annotatedMap.detectedAnomalies:', e);
    }
  } else if (Array.isArray((screening as any).annotatedMap?.detectedAnomalies)) {
    detectedAnomalies = (screening as any).annotatedMap.detectedAnomalies;
  }

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
      etdrsGrade: computeEtdrsGrade(
        screening.etdrsGrade,
        drScore,
        screening.diabeticRetinopathyRiskLevel
      ),
      macularEdemaPresent: Boolean((screening as any).macularEdemaPresent ?? false),
    },
    glaucomaRisk: {
      level: toFrontendRiskLevel(screening.glaucomaRiskLevel),
      score: screening.glaucomaRiskScore ?? 0,
    },
    annotatedMap: {
      heatmapUrl: screening.heatmapBase64 || screening.annotatedMap?.heatmapUrl || undefined,
      vesselMaskUrl: screening.vesselMaskUrl || screening.annotatedMap?.vesselMaskUrl || undefined,
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
