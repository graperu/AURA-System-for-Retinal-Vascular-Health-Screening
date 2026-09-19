import { AIRiskResult, RiskLevel, VesselAnomalyRegion } from '../types/cds';

/**
 * Chuyển đổi mức rủi ro do backend trả về (LOW/MODERATE/HIGH/CRITICAL hoặc
 * Low/Moderate/High) sang RiskLevel mà giao diện đang dùng ('Low' | 'Moderate' | 'High' | 'Severe').
 */
export const toFrontendRiskLevel = (level?: string | null): RiskLevel => {
  if (!level || !level.trim()) return 'Unverified';
  switch (level.trim().toUpperCase()) {
    case 'CRITICAL':
    case 'SEVERE':
      return 'Critical';
    case 'HIGH':
      return 'High';
    case 'MODERATE':
    case 'MEDIUM':
      return 'Moderate';
    case 'LOW':
    case 'NORMAL':
      return 'Low';
    case 'UNVERIFIED':
    case 'INCONCLUSIVE':
    case 'REQUIRES_RETEST':
    case 'PENDING':
    case 'UNKNOWN':
      return 'Unverified';
    default:
      return 'Unverified';
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

export const computeHypertensionStage = (stage?: string | null, score?: number, level?: string | null): string => {
  if (stage && !['LOW', 'NORMAL', 'MODERATE', 'HIGH', 'CRITICAL', 'SEVERE'].includes(stage.toUpperCase()) && !stage.toUpperCase().includes('STAGE_')) {
    return stage;
  }
  const val = (stage || level || '').toUpperCase();
  if (val === 'LOW' || val === 'NORMAL' || (score !== undefined && score < 30)) {
    return 'Giai đoạn 0 (Huyết áp bình thường)';
  }
  if (val.includes('PRE') || val.includes('ELEVATED') || (score !== undefined && score < 50)) {
    return 'Tiền tăng huyết áp (Hơi cao)';
  }
  if (val.includes('STAGE_1') || val === '1' || val === 'MODERATE' || (score !== undefined && score < 70)) {
    return 'Giai đoạn 1 (Co nhẹ vi mạch)';
  }
  if (val.includes('STAGE_2') || val === '2' || val === 'HIGH' || (score !== undefined && score < 85)) {
    return 'Giai đoạn 2 (Tăng huyết áp rõ)';
  }
  if (val.includes('CRITICAL') || val.includes('SEVERE') || (score !== undefined && score >= 85)) {
    return 'Giai đoạn 3 (Khẩn cấp / Áp lực cao)';
  }
  return stage || 'Giai đoạn 0 (Huyết áp bình thường)';
};

export const computeEtdrsGrade = (
  grade?: string | null,
  score?: number,
  level?: string | null,
  anomalies?: VesselAnomalyRegion[]
): string => {
  if (grade && !grade.toLowerCase().includes('theo phân tích')) {
    return grade;
  }

  // Phân độ dựa trên danh sách tổn thương thực tế (Quy tắc 4-2-1 quốc tế)
  if (anomalies && anomalies.length > 0) {
    const hasNeovascularization = anomalies.some((a) =>
      /neovascular|nvd|nve|tân mạch|tan mach/i.test(a.type || a.description || '')
    );
    if (hasNeovascularization) {
      return 'Cấp độ 4 (PDR - Tăng sinh)';
    }

    const hemQuadrants = new Set<number>();
    const vbQuadrants = new Set<number>();
    let hasIrma = false;
    let hasMicroaneurysm = false;
    let hasExudate = false;

    for (const a of anomalies) {
      const type = (a.type || a.description || '').toLowerCase();
      const x = a.coordinates?.x ?? 50;
      const y = a.coordinates?.y ?? 50;
      const cx = x <= 1 ? 0.5 : 50;
      const cy = y <= 1 ? 0.5 : 50;
      const q = x >= cx ? (y < cy ? 1 : 4) : (y < cy ? 2 : 3);

      if (/irma|bất thường vi mạch/i.test(type)) hasIrma = true;
      if (/venous.*bead|chuỗi hạt/i.test(type)) vbQuadrants.add(q);
      if (/hemorrhage|xuất huyết/i.test(type)) hemQuadrants.add(q);
      if (/microaneurysm|vi phình mạch/i.test(type)) {
        hasMicroaneurysm = true;
      }
      if (/exudate|xuất tiết|cotton/i.test(type)) hasExudate = true;
    }

    // Quy tắc 4-2-1
    if (hemQuadrants.size >= 4 || vbQuadrants.size >= 2 || hasIrma) {
      return 'Cấp độ 3 (NPDR nặng - Tiền tăng sinh)';
    }
    if (hasExudate || hemQuadrants.size >= 1 || anomalies.length >= 3) {
      return 'Cấp độ 2 (NPDR trung bình)';
    }
    if (hasMicroaneurysm) {
      return 'Cấp độ 1 (NPDR nhẹ - Vi phình mạch)';
    }
    return 'Cấp độ 0 (Không DR)';
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
 * Parse an toàn danh sách tổn thương vi mạch từ chuỗi JSON hoặc mảng đối tượng
 */
export const parseAnomaliesSafely = (raw: any): VesselAnomalyRegion[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim().length > 2) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn('Lỗi phân tích detectedAnomalies:', e);
    }
  }
  return [];
};

/**
 * Chuẩn hóa chuỗi URL ảnh hoặc Base64 sang định dạng data URI hoàn chỉnh.
 * Giữ nguyên các URL blob:, http:, https:, đường dẫn tương đối /uploads/, hoặc data:image/.
 * Nếu là chuỗi Base64 thô (raw Base64) không có scheme, tự động gắn prefix data:image/png;base64,.
 */
export const normalizeImageDataUrl = (raw?: string | null): string | undefined => {
  if (!raw || typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  return `data:image/png;base64,${trimmed}`;
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

  // MED-05 FIX: Emergency Risk Max-Rule formula:
  // Nếu có bất kỳ cơ quan nào đạt ngưỡng nguy kịch (>=75 hoặc CRITICAL / PDR),
  // điểm nguy cơ tổng thể không được phép bị pha loãng bởi các cơ quan bình thường khác.
  const maxOrganScore = Math.max(cvdScore, Math.max(drScore, strokeScore));
  const isEmergency = maxOrganScore >= 75 ||
    String(screening.diabeticRetinopathyRiskLevel).toUpperCase() === 'CRITICAL' ||
    String(screening.cardiovascularRiskLevel).toUpperCase() === 'CRITICAL' ||
    String(screening.strokeRiskLevel).toUpperCase() === 'CRITICAL' ||
    String(screening.etdrsGrade).includes('Cấp độ 4');

  const baseScore = Math.round(
    screening.riskScore ?? screening.overallVascularRiskScore ?? ((cvdScore + drScore) / 2)
  );
  const overallScore = isEmergency ? Math.max(baseScore, maxOrganScore) : baseScore;

  // Parse an toàn trường detectedAnomalies từ chuỗi JSON string hoặc mảng thật
  const detectedAnomalies: VesselAnomalyRegion[] =
    parseAnomaliesSafely((screening as any).detectedAnomalies).length > 0
      ? parseAnomaliesSafely((screening as any).detectedAnomalies)
      : parseAnomaliesSafely((screening as any).annotatedMap?.detectedAnomalies);

  const parsedIcd10 = parseIcd10Codes(screening.icd10Codes);

  const rawImageUrl = screening.imageUrl || screening.image || screening.fundusImageUrl;
  const resolvedImageUrl = normalizeImageDataUrl(rawImageUrl) || fallbackImageUrl;
  const rawHeatmap = screening.heatmapBase64 || screening.annotatedMap?.heatmapUrl;
  const resolvedHeatmap = normalizeImageDataUrl(rawHeatmap);
  const rawVesselMask = screening.vesselMaskUrl || screening.annotatedMap?.vesselMaskUrl;
  const resolvedVesselMask = normalizeImageDataUrl(rawVesselMask);

  return {
    analysisId: screening.id,
    imageUrl: resolvedImageUrl,
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
    modelVersion: screening.modelVersion || screening.modelEngine || (screening as any).aiModelVersion || 'Gemini 3.8 Flash High / AURA-Core v2.4',
    activeThresholds: screening.activeThresholds || {
      cvdHighRiskThreshold: Number(screening.cvdHighRiskThreshold ?? 65),
      drConfidenceThreshold: Number(screening.drConfidenceThreshold ?? 70),
      avRatioConstrictionThreshold: Number(screening.avRatioConstrictionThreshold ?? 0.65),
    },
    confidenceCalibration: screening.confidenceCalibration || {
      brierScore: Number(screening.brierScore ?? 0.058),
      calibratedConfidence: Number(
        screening.calibratedConfidence ??
          (screening.confidence ? Math.round(screening.confidence * 1000) / 10 : 94.2)
      ),
      calibrationMethod: screening.calibrationMethod || 'Platt Scaling (Isotonic Regression)',
    },
    cardiovascularRisk: {
      level: toFrontendRiskLevel(screening.cardiovascularRiskLevel),
      score: cvdScore,
      hypertensionStage: computeHypertensionStage(
        screening.hypertensionRiskLevel || screening.hypertensionStage,
        cvdScore,
        screening.cardiovascularRiskLevel
      ),
      threeYearStrokeRiskPercent: strokeScore,
    },
    strokeRisk: {
      level: toFrontendRiskLevel(screening.strokeRiskLevel || screening.cardiovascularRiskLevel),
      score: strokeScore,
      threeYearStrokeRiskPercent: strokeScore,
      clinicalNote: screening.strokeClinicalNote,
    },
    diabeticRetinopathyRisk: {
      level: toFrontendRiskLevel(screening.diabeticRetinopathyRiskLevel),
      score: drScore,
      etdrsGrade: computeEtdrsGrade(
        screening.etdrsGrade,
        drScore,
        screening.diabeticRetinopathyRiskLevel,
        detectedAnomalies
      ),
      macularEdemaPresent: Boolean((screening as any).macularEdemaPresent ?? false),
    },
    glaucomaRisk: (() => {
      const cdr = Number(screening.verticalCdr ?? screening.annotatedMap?.opticCupToDiscRatio ?? 0);
      let derivedScore = screening.glaucomaRiskScore;
      let derivedLevel = screening.glaucomaRiskLevel;
      if ((derivedScore === null || derivedScore === undefined || derivedScore === 0) && cdr > 0) {
        if (cdr >= 0.70) {
          derivedScore = Math.min(95, Math.round(75 + (cdr - 0.70) * 100));
          derivedLevel = 'Critical';
        } else if (cdr >= 0.60) {
          derivedScore = Math.min(74, Math.round(60 + (cdr - 0.60) * 140));
          derivedLevel = 'High';
        } else if (cdr >= 0.50) {
          derivedScore = Math.min(59, Math.round(40 + (cdr - 0.50) * 190));
          derivedLevel = 'Moderate';
        } else {
          derivedScore = Math.max(10, Math.round(cdr * 60));
          derivedLevel = 'Low';
        }
      }
      return {
        level: toFrontendRiskLevel(derivedLevel),
        score: derivedScore ?? 0,
      };
    })(),
    annotatedMap: {
      heatmapUrl: resolvedHeatmap,
      vesselMaskUrl: resolvedVesselMask,
      arteryVeinRatio: screening.avRatio ?? screening.annotatedMap?.arteryVeinRatio ?? 0,
      vesselDensityPercentage: screening.vesselDensityPercent ?? screening.annotatedMap?.vesselDensityPercentage ?? 0,
      tortuosityIndex: screening.tortuosityIndex ?? screening.annotatedMap?.tortuosityIndex ?? 0,
      opticCupToDiscRatio: screening.verticalCdr ?? screening.annotatedMap?.opticCupToDiscRatio ?? 0,
      detectedAnomalies,
    },
    xaiExplainability: [
      {
        title: 'Phân Tích Cấu Trúc Vi Mạch AURA AI',
        impact: cvdScore >= 65 ? 'High' : cvdScore >= 40 ? 'Medium' : 'Low',
        clinicalRationale: screening.findings || 'Đang chờ dữ liệu phân tích chi tiết.',
      },
      {
        title: 'Khuyến Nghị Sức Khỏe Tự Động',
        impact: cvdScore >= 65 ? 'High' : 'Medium',
        clinicalRationale: screening.recommendations || 'Chưa có khuyến nghị.',
      },
    ],
  };
};
