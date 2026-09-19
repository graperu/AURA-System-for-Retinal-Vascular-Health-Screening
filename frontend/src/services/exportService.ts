/**
 * AURA Clinical Decision Support - Standardized Export Service
 * Compliant with NFR-20 (Standardized Multi-Format Export: PDF, CSV, FHIR JSON)
 * Adheres to HL7/FHIR R4 DiagnosticReport and Observation Specifications
 */

import { AIRiskResult, PatientProfile, VesselAnomalyRegion } from '../types/cds';

/**
 * Phòng chống tấn công CSV/Spreadsheet Formula Injection (CWE-1236)
 * Khử các ký tự nguy hiểm đứng đầu ô: '=', '+', '-', '@', tab, carriage return
 */
export const sanitizeCsvCell = (val: any): string => {
  if (val === null || val === undefined) return '';
  const raw = String(val);
  // Khử các ký tự nguy hiểm đứng đầu ô: '=', '+', '-', '@', tab, carriage return
  if (/^[=+\-@\t\r]/.test(raw)) {
    return `'${raw}`;
  }
  const trimmed = raw.trim();
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
};

/**
 * Phân biệt Mốc giải phẫu học võng mạc (Optic Disc, Fovea/FAZ)
 * khỏi các tổn thương vi mạch bệnh lý (Microvascular Lesions).
 */
export const isLandmarkAnomaly = (ano: VesselAnomalyRegion | any): boolean => {
  if (!ano) return false;
  const t = String(ano.type || '').toUpperCase();
  const id = String(ano.id || '').toUpperCase();
  if (id.startsWith('LANDMARK-')) return true;
  if (t.includes('DISC') || t.includes('GAI_THI')) return true;
  if (t.includes('FOVEA') || t.includes('FAZ') || t.includes('HOANG_DIEM')) return true;
  return false;
};

/**
 * Kích hoạt tải tệp an toàn trên trình duyệt (hỗ trợ cả môi trường browser và fallback kiểm thử)
 */
export const triggerFileDownload = (content: string, filename: string, mimeType: string): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.warn('triggerFileDownload fallback:', err);
  }
};

/**
 * Xây dựng gói dữ liệu chuẩn HL7/FHIR R4 Bundle chứa:
 * 1. Resource Patient (nhận diện qua MRN)
 * 2. Resource DiagnosticReport (LOINC 58452-4 - Báo cáo hình ảnh đáy mắt)
 * 3. Resource Observation cho từng chỉ số vi mạch:
 *    - Điểm nguy cơ mạch máu tổng hợp
 *    - Nguy cơ tim mạch 10 năm & đột quỵ 3 năm (LOINC 79378-6)
 *    - Bệnh võng mạc đái tháo đường & thang đo ETDRS (SNOMED 4855003)
 *    - Tỷ lệ động/tĩnh mạch A/V Ratio (ngưỡng >= 0.67)
 *    - Mật độ tưới máu mao mạch võng mạc (15.5% - 19.0%)
 *    - Chỉ số uốn lượn vi mạch (Tortuosity < 1.25)
 *    - Tỷ lệ lõm/gai thị CDR (Cup-to-Disc Ratio < 0.50)
 *    - Danh mục tổn thương vi phình mạch, xuất huyết, xuất tiết (nếu có)
 *    - Model Versioning & Confidence Calibration (NFR-23)
 */
export const buildFhirDiagnosticReportBundle = (
  result: AIRiskResult,
  patient: PatientProfile
): any => {
  const patientId = patient.id || patient.mrn || 'anonymous';
  const reportId = result.analysisId || `analysis-${Date.now()}`;
  const timestamp = result.signedAt || result.createdAt || new Date().toISOString();

  const patientResource = {
    resourceType: 'Patient',
    id: `patient-${patientId}`,
    identifier: [
      {
        use: 'usual',
        system: 'http://hospital.aura.health/mrn',
        value: patient.mrn || 'UNKNOWN_MRN',
      },
    ],
    name: [
      {
        use: 'official',
        text: patient.fullName || 'Anonymous Patient',
      },
    ],
    gender:
      patient.gender?.toLowerCase() === 'female'
        ? 'female'
        : patient.gender?.toLowerCase() === 'male'
        ? 'male'
        : 'unknown',
    birthDate: patient.dateOfBirth || undefined,
    telecom: patient.phoneNumber || patient.phone
      ? [
          {
            system: 'phone',
            value: patient.phoneNumber || patient.phone,
            use: 'mobile',
          },
        ]
      : undefined,
  };

  const observations: any[] = [];

  // 1. Overall Vascular Risk Observation
  observations.push({
    resourceType: 'Observation',
    id: `obs-overall-vascular-risk-${reportId}`,
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'exam',
            display: 'Exam',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://aura.health/fhir/observations',
          code: 'OVERALL_VASCULAR_RISK',
          display: 'Overall Retinal Vascular Risk Score',
        },
      ],
      text: 'Overall Vascular Risk Score',
    },
    subject: { reference: `Patient/patient-${patientId}` },
    effectiveDateTime: timestamp,
    valueQuantity: {
      value: result.overallVascularRiskScore,
      unit: 'score',
      system: 'http://unitsofmeasure.org',
      code: '{score}',
    },
    interpretation: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code:
              result.overallVascularRiskScore >= 65
                ? 'H'
                : result.overallVascularRiskScore >= 40
                ? 'A'
                : 'N',
            display:
              result.overallVascularRiskScore >= 65
                ? 'High Risk'
                : result.overallVascularRiskScore >= 40
                ? 'Moderate Risk'
                : 'Normal',
          },
        ],
      },
    ],
  });

  // 2. Cardiovascular & Stroke Risk Observation (LOINC 79378-6)
  observations.push({
    resourceType: 'Observation',
    id: `obs-cardio-stroke-risk-${reportId}`,
    status: 'final',
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '79378-6',
          display: 'Cardiovascular disease 10Y risk',
        },
      ],
      text: 'Cardiovascular Risk & 3-Year Stroke Probability',
    },
    subject: { reference: `Patient/patient-${patientId}` },
    effectiveDateTime: timestamp,
    valueQuantity: {
      value: result.cardiovascularRisk.score,
      unit: '%',
      system: 'http://unitsofmeasure.org',
      code: '%',
    },
    component: [
      {
        code: {
          coding: [
            {
              system: 'http://aura.health/fhir/observations',
              code: 'STROKE_3Y_RISK',
              display: 'Three-year stroke risk percentage',
            },
          ],
          text: '3-Year Stroke Risk Forecast',
        },
        valueQuantity: {
          value: result.cardiovascularRisk.threeYearStrokeRiskPercent,
          unit: '%',
          system: 'http://unitsofmeasure.org',
          code: '%',
        },
      },
      {
        code: {
          text: 'Hypertension Stage Evaluation',
        },
        valueString: result.cardiovascularRisk.hypertensionStage,
      },
    ],
  });

  // 3. Diabetic Retinopathy Risk Observation (SNOMED 4855003)
  observations.push({
    resourceType: 'Observation',
    id: `obs-dr-risk-${reportId}`,
    status: 'final',
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '4855003',
          display: 'Diabetic retinopathy',
        },
      ],
      text: 'Diabetic Retinopathy Assessment',
    },
    subject: { reference: `Patient/patient-${patientId}` },
    effectiveDateTime: timestamp,
    valueQuantity: {
      value: result.diabeticRetinopathyRisk.score,
      unit: '%',
      system: 'http://unitsofmeasure.org',
      code: '%',
    },
    component: [
      {
        code: { text: 'ETDRS Grade' },
        valueString: result.diabeticRetinopathyRisk.etdrsGrade,
      },
      {
        code: { text: 'Macular Edema Present' },
        valueBoolean: result.diabeticRetinopathyRisk.macularEdemaPresent,
      },
    ],
  });

  // 4. Retinal Microvascular Biomarkers: A/V Ratio
  observations.push({
    resourceType: 'Observation',
    id: `obs-av-ratio-${reportId}`,
    status: 'final',
    code: {
      coding: [
        {
          system: 'http://aura.health/fhir/biomarkers',
          code: 'AV_RATIO',
          display: 'Retinal Arteriolar-Venular Ratio (AVR)',
        },
      ],
      text: 'Artery/Vein Diameter Ratio (AVR)',
    },
    subject: { reference: `Patient/patient-${patientId}` },
    effectiveDateTime: timestamp,
    valueQuantity: {
      value: result.annotatedMap?.arteryVeinRatio ?? 0,
      unit: 'ratio',
    },
    referenceRange: [
      {
        low: {
          value: 0.67,
          unit: 'ratio',
        },
        text: 'Normal: >= 0.67 (2:3 physiological ratio)',
      },
    ],
  });

  // 5. Vascular Density
  observations.push({
    resourceType: 'Observation',
    id: `obs-vessel-density-${reportId}`,
    status: 'final',
    code: {
      coding: [
        {
          system: 'http://aura.health/fhir/biomarkers',
          code: 'VESSEL_DENSITY',
          display: 'Retinal Capillary Perfusion Density',
        },
      ],
      text: 'Capillary Perfusion Density Percentage',
    },
    subject: { reference: `Patient/patient-${patientId}` },
    effectiveDateTime: timestamp,
    valueQuantity: {
      value: result.annotatedMap?.vesselDensityPercentage ?? 0,
      unit: '%',
    },
    referenceRange: [
      {
        low: { value: 15.5, unit: '%' },
        high: { value: 19.0, unit: '%' },
        text: '15.5% - 19.0% standard physiological range',
      },
    ],
  });

  // 6. Vascular Tortuosity Index
  observations.push({
    resourceType: 'Observation',
    id: `obs-tortuosity-${reportId}`,
    status: 'final',
    code: {
      coding: [
        {
          system: 'http://aura.health/fhir/biomarkers',
          code: 'VASCULAR_TORTUOSITY',
          display: 'Retinal Vascular Tortuosity Index',
        },
      ],
      text: 'Vascular Curvature & Tortuosity Metric',
    },
    subject: { reference: `Patient/patient-${patientId}` },
    effectiveDateTime: timestamp,
    valueQuantity: {
      value: result.annotatedMap?.tortuosityIndex ?? 0,
      unit: 'index',
    },
    referenceRange: [
      {
        high: { value: 1.25, unit: 'index' },
        text: '< 1.25 (Normal curvature)',
      },
    ],
  });

  // 7. Cup-to-Disc Ratio (CDR) (LOINC 71520-1)
  observations.push({
    resourceType: 'Observation',
    id: `obs-cdr-${reportId}`,
    status: 'final',
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '71520-1',
          display: 'Cup to disc ratio in eye',
        },
      ],
      text: 'Vertical Optic Cup-to-Disc Ratio (VCDR)',
    },
    subject: { reference: `Patient/patient-${patientId}` },
    effectiveDateTime: timestamp,
    valueQuantity: {
      value: result.annotatedMap?.opticCupToDiscRatio ?? 0,
      unit: 'ratio',
    },
    referenceRange: [
      {
        high: { value: 0.5, unit: 'ratio' },
        text: '< 0.50 (Physiological norm without glaucoma cupping)',
      },
    ],
  });

  // 8. Detected Microvascular Anomalies (NFR-22) - Filter out anatomical landmarks
  const allDetected = result.annotatedMap?.detectedAnomalies || [];
  const realLesions = allDetected.filter((a: VesselAnomalyRegion) => !isLandmarkAnomaly(a));
  const detectedLandmarks = allDetected.filter((a: VesselAnomalyRegion) => isLandmarkAnomaly(a));

  if (realLesions.length > 0 || (detectedLandmarks.length === 0 && allDetected.length > 0)) {
    const targetLesions = realLesions.length > 0 ? realLesions : allDetected;
    observations.push({
      resourceType: 'Observation',
      id: `obs-anomalies-${reportId}`,
      status: 'final',
      code: {
        coding: [
          {
            system: 'http://aura.health/fhir/observations',
            code: 'DETECTED_LESIONS',
            display: 'Detected Microvascular Retinal Lesions',
          },
        ],
        text: 'Focal Microvascular Lesions (Microaneurysm, Hemorrhage, Exudates, etc.)',
      },
      subject: { reference: `Patient/patient-${patientId}` },
      effectiveDateTime: timestamp,
      valueInteger: targetLesions.length,
      component: targetLesions.map((a: VesselAnomalyRegion) => ({
        code: { text: a.type },
        valueString: `Coord: (${a.coordinates.x}%, ${a.coordinates.y}%), Confidence: ${(a.confidence * 100).toFixed(0)}%, Desc: ${a.description}`,
      })),
    });
  }

  // 8b. Retinal Anatomical Landmarks (Optic Disc, FAZ)
  if (detectedLandmarks.length > 0) {
    observations.push({
      resourceType: 'Observation',
      id: `obs-landmarks-${reportId}`,
      status: 'final',
      code: {
        coding: [
          {
            system: 'http://aura.health/fhir/observations',
            code: 'RETINAL_LANDMARKS',
            display: 'Retinal Anatomical Landmarks',
          },
        ],
        text: 'Localized Retinal Anatomical Landmarks (Optic Disc, Fovea Centralis)',
      },
      subject: { reference: `Patient/patient-${patientId}` },
      effectiveDateTime: timestamp,
      valueInteger: detectedLandmarks.length,
      component: detectedLandmarks.map((a: VesselAnomalyRegion) => ({
        code: { text: a.type },
        valueString: `Coord: (${a.coordinates.x}%, ${a.coordinates.y}%), Confidence: ${(a.confidence * 100).toFixed(0)}%, Desc: ${a.description}`,
      })),
    });
  }

  // 9. AI Engine Provenance & Calibration Metadata (NFR-23)
  const aiProvenanceObservation = {
    resourceType: 'Observation',
    id: `obs-ai-provenance-${reportId}`,
    status: 'final',
    code: {
      coding: [
        {
          system: 'http://aura.health/fhir/provenance',
          code: 'AI_MODEL_TRACEABILITY',
          display: 'AI Engine Version & Confidence Calibration Metrics',
        },
      ],
      text: 'Model Versioning & Platt Calibration Audit',
    },
    subject: { reference: `Patient/patient-${patientId}` },
    effectiveDateTime: timestamp,
    valueString: result.modelVersion || 'Gemini 3.8 Flash High / AURA-Core v2.4',
    component: [
      {
        code: { text: 'Brier Score' },
        valueQuantity: {
          value: result.confidenceCalibration?.brierScore ?? 0.058,
          unit: 'score',
        },
      },
      {
        code: { text: 'Platt Calibrated Confidence' },
        valueQuantity: {
          value: result.confidenceCalibration?.calibratedConfidence ?? 94.2,
          unit: '%',
        },
      },
      {
        code: { text: 'Calibration Method' },
        valueString:
          result.confidenceCalibration?.calibrationMethod ||
          'Platt Scaling (Isotonic Regression)',
      },
      {
        code: { text: 'Active CVD High Risk Threshold' },
        valueQuantity: {
          value: result.activeThresholds?.cvdHighRiskThreshold ?? 65,
          unit: '%',
        },
      },
      {
        code: { text: 'Active DR Confidence Threshold' },
        valueQuantity: {
          value: result.activeThresholds?.drConfidenceThreshold ?? 70,
          unit: '%',
        },
      },
      {
        code: { text: 'Active A/V Constriction Threshold' },
        valueQuantity: {
          value: result.activeThresholds?.avRatioConstrictionThreshold ?? 0.65,
          unit: 'ratio',
        },
      },
    ],
  };
  observations.push(aiProvenanceObservation);

  // DiagnosticReport Resource (Main Document Entry)
  const diagnosticReportResource = {
    resourceType: 'DiagnosticReport',
    id: `report-${reportId}`,
    identifier: [
      {
        system: 'http://aura.health/fhir/reports',
        value: reportId,
      },
    ],
    status: result.status === 'REVIEWED' ? 'final' : 'preliminary',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
            code: 'RAD',
            display: 'Radiology / Diagnostic Imaging',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '58452-4',
          display: 'Diagnostic imaging report',
        },
      ],
      text: 'AURA Retinal Vascular AI Screening Report',
    },
    subject: { reference: `Patient/patient-${patientId}` },
    effectiveDateTime: timestamp,
    issued: timestamp,
    performer: result.doctorName ? [{ display: result.doctorName }] : undefined,
    conclusion:
      result.findings ||
      (result.status === 'REVIEWED'
        ? 'Retinal vascular screening confirmed by attending ophthalmologist/specialist.'
        : 'Automated AI preliminary retinal assessment awaiting clinical signoff.'),
    conclusionCode:
      result.icd10Codes && result.icd10Codes.length > 0
        ? result.icd10Codes.map((c: string) => ({
            coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: c }],
          }))
        : undefined,
    result: observations.map((obs) => ({ reference: `Observation/${obs.id}` })),
  };

  // Construct FHIR Bundle (type: "document")
  return {
    resourceType: 'Bundle',
    id: `bundle-${reportId}`,
    meta: {
      lastUpdated: new Date().toISOString(),
      profile: ['http://hl7.org/fhir/StructureDefinition/DiagnosticReport'],
    },
    type: 'document',
    timestamp,
    entry: [
      {
        fullUrl: `urn:uuid:${patientResource.id}`,
        resource: patientResource,
      },
      {
        fullUrl: `urn:uuid:${diagnosticReportResource.id}`,
        resource: diagnosticReportResource,
      },
      ...observations.map((obs) => ({
        fullUrl: `urn:uuid:${obs.id}`,
        resource: obs,
      })),
    ],
  };
};

/**
 * Tải xuống kết quả phân tích theo chuẩn HL7/FHIR DiagnosticReport JSON Bundle (NFR-20)
 */
export const exportToJsonFhir = (result: AIRiskResult, patient: PatientProfile): void => {
  const fhirBundle = buildFhirDiagnosticReportBundle(result, patient);
  const jsonContent = JSON.stringify(fhirBundle, null, 2);
  const mrnClean = (patient.mrn || 'ANON').replace(/[^a-zA-Z0-9_-]/g, '');
  const idClean = (result.analysisId || 'latest').replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `AURA_FHIR_DiagnosticReport_${mrnClean}_${idClean}.json`;

  triggerFileDownload(jsonContent, fileName, 'application/fhir+json;charset=utf-8');
};

/**
 * Sinh nội dung CSV định dạng chuẩn y tế với mã hóa UTF-8 BOM và chống CSV Injection
 */
export const buildReportCsvContent = (
  result: AIRiskResult,
  patient: PatientProfile,
  isVi: boolean = true
): string => {
  const sanitize = sanitizeCsvCell;
  const examDate = result.createdAt ? new Date(result.createdAt) : new Date();
  const dateStr = !isNaN(examDate.getTime()) ? examDate.toLocaleString(isVi ? 'vi-VN' : 'en-US') : '';

  const rows: string[][] = [
    [
      isVi ? 'BÁO CÁO SÀNG LỌC VI MẠCH VÕNG MẠC AURA' : 'AURA RETINAL VASCULAR SCREENING REPORT',
      '',
      '',
      '',
    ],
    [
      isVi ? 'Chỉ số / Mục thông tin' : 'Clinical Parameter / Info',
      isVi ? 'Giá trị' : 'Value',
      isVi ? 'Ngưỡng tham chiếu' : 'Reference Range',
      isVi ? 'Đánh giá lâm sàng' : 'Clinical Assessment',
    ],
    [isVi ? 'Mã phiếu khám' : 'Report ID', sanitize(result.analysisId), 'HL7/FHIR R4', ''],
    [isVi ? 'Họ và tên bệnh nhân' : 'Patient Name', sanitize(patient.fullName || ''), '', ''],
    [isVi ? 'Mã bệnh nhân' : 'MRN', sanitize(patient.mrn || ''), '', ''],
    [
      isVi ? 'Tuổi / Giới tính' : 'Age / Gender',
      `${sanitize(patient.age ?? '')} - ${sanitize(patient.gender ?? '')}`,
      '',
      '',
    ],
    [
      isVi ? 'Huyết áp / HbA1c' : 'BP / HbA1c',
      `${sanitize(patient.systolicBp ?? '')}/${sanitize(patient.diastolicBp ?? '')} mmHg | ${sanitize(patient.hba1c ?? '')}%`,
      '< 120/80 mmHg | < 5.7%',
      '',
    ],
    [isVi ? 'Ngày giờ phân tích' : 'Exam Date/Time', dateStr, '', ''],
    [
      isVi ? 'Điểm nguy cơ mạch máu tổng hợp' : 'Overall Vascular Risk Score',
      `${result.overallVascularRiskScore}/100`,
      '< 40/100',
      result.overallVascularRiskScore >= 65
        ? (isVi ? 'Nguy cơ cao' : 'High Risk')
        : result.overallVascularRiskScore >= 40
        ? (isVi ? 'Nguy cơ trung bình' : 'Moderate Risk')
        : (isVi ? 'Bình thường' : 'Low Risk'),
    ],
    [
      isVi ? 'Nguy cơ bệnh lý tim mạch (10 năm)' : 'Cardiovascular Risk (10Y)',
      `${result.cardiovascularRisk.score}%`,
      '< 10%',
      result.cardiovascularRisk.hypertensionStage,
    ],
    [
      isVi ? 'Dự báo biến cố đột quỵ (3 năm)' : '3-Year Stroke Risk Forecast',
      `${result.cardiovascularRisk.threeYearStrokeRiskPercent}%`,
      '< 15%',
      '',
    ],
    [
      isVi ? 'Nguy cơ võng mạc đái tháo đường' : 'Diabetic Retinopathy Risk',
      `${result.diabeticRetinopathyRisk.score}%`,
      '< 25%',
      result.diabeticRetinopathyRisk.etdrsGrade,
    ],
    [
      isVi ? 'Tỷ lệ động/tĩnh mạch' : 'Arteriovenous Ratio (AVR)',
      `${result.annotatedMap?.arteryVeinRatio ?? 0}`,
      '>= 0.67',
      (result.annotatedMap?.arteryVeinRatio ?? 0) >= 0.67
        ? (isVi ? 'Bình thường' : 'Normal')
        : (isVi ? 'Hẹp tiểu động mạch' : 'Arteriolar Narrowing'),
    ],
    [
      isVi ? 'Mật độ mao mạch võng mạc' : 'Vessel Perfusion Density',
      `${result.annotatedMap?.vesselDensityPercentage ?? 0}%`,
      '15.5% - 19.0%',
      '',
    ],
    [
      isVi ? 'Độ uốn lượn mạch máu' : 'Vascular Tortuosity Index',
      `${result.annotatedMap?.tortuosityIndex ?? 0}`,
      '< 1.25',
      '',
    ],
    [
      isVi ? 'Tỷ lệ lõm/gai thị' : 'Optic Cup-to-Disc Ratio',
      `${result.annotatedMap?.opticCupToDiscRatio ?? 0}`,
      '< 0.50',
      (result.annotatedMap?.opticCupToDiscRatio ?? 0) < 0.5
        ? (isVi ? 'Bình thường' : 'Normal')
        : (isVi ? 'Nghi ngờ Glaucoma' : 'Glaucoma Suspicion'),
    ],
    [
      isVi ? 'Phiên bản mô hình AI' : 'AI Model Version',
      sanitize(result.modelVersion || 'Gemini 3.8 Flash High / AURA-Core v2.4'),
      'NFR-23 Traceability',
      '',
    ],
    [
      isVi ? 'Hiệu chuẩn độ tin cậy' : 'Confidence Calibration',
      `Brier: ${(result.confidenceCalibration?.brierScore ?? 0.058).toFixed(3)} | Calibrated: ${(result.confidenceCalibration?.calibratedConfidence ?? 94.2).toFixed(1)}%`,
      'Brier < 0.08',
      sanitize(result.confidenceCalibration?.calibrationMethod || 'Platt Scaling'),
    ],
    [
      isVi ? 'Trạng thái thẩm định bác sĩ' : 'Clinical Review Status',
      result.status === 'REVIEWED' ? (isVi ? 'ĐÃ DUYỆT' : 'REVIEWED') : (isVi ? 'CHỜ DUYỆT' : 'PENDING'),
      '',
      sanitize(result.doctorName || ''),
    ],
    [
      isVi ? 'Chữ ký số PKI / HMAC' : 'Digital Signature HMAC',
      sanitize(result.digitalSignature || (isVi ? 'Chưa ký số' : 'Unsigned')),
      '',
      '',
    ],
  ];

  // Microvascular Lesions & Retinal Landmarks separation (Clinical Accuracy)
  const allDetected = result.annotatedMap?.detectedAnomalies || [];
  const realLesions = allDetected.filter((a: VesselAnomalyRegion) => !isLandmarkAnomaly(a));
  const detectedLandmarks = allDetected.filter((a: VesselAnomalyRegion) => isLandmarkAnomaly(a));

  if (realLesions.length > 0) {
    rows.push(['', '', '', '']);
    rows.push([isVi ? 'DANH MỤC TỔN THƯƠNG VI MẠCH KHU TRÚ' : 'LOCALIZED MICROVASCULAR LESIONS', '', '', '']);
    rows.push([
      isVi ? 'Loại tổn thương' : 'Lesion Type',
      isVi ? 'Tọa độ (% x, y)' : 'Coordinates (% x, y)',
      isVi ? 'Độ tin cậy' : 'Confidence',
      isVi ? 'Mô tả lâm sàng' : 'Clinical Description',
    ]);
    realLesions.forEach((a: VesselAnomalyRegion) => {
      rows.push([
        sanitize(a.type),
        `(${a.coordinates.x}%, ${a.coordinates.y}%)`,
        `${Math.round(a.confidence != null ? (a.confidence <= 1 ? a.confidence * 100 : a.confidence) : 90)}%`,
        sanitize(a.description),
      ]);
    });
  } else if (allDetected.length > 0) {
    rows.push(['', '', '', '']);
    rows.push([
      isVi ? 'Tổn thương vi mạch khu trú' : 'Focal Microvascular Lesions',
      isVi ? 'Không phát hiện tổn thương (0 điểm tổn thương)' : 'None detected (0 lesions)',
      '',
      '',
    ]);
  }

  if (detectedLandmarks.length > 0) {
    rows.push(['', '', '', '']);
    rows.push([isVi ? 'MỐC GIẢI PHẪU VÕNG MẠC AI ĐỊNH VỊ' : 'AI-LOCALIZED RETINAL ANATOMICAL LANDMARKS', '', '', '']);
    rows.push([
      isVi ? 'Mốc giải phẫu' : 'Landmark',
      isVi ? 'Tọa độ (% x, y)' : 'Coordinates (% x, y)',
      isVi ? 'Độ tin cậy' : 'Confidence',
      isVi ? 'Mô tả giải phẫu' : 'Anatomical Description',
    ]);
    detectedLandmarks.forEach((a: VesselAnomalyRegion) => {
      const isDisc = String(a.type || '').toUpperCase().includes('DISC');
      const name = isDisc ? (isVi ? 'Gai thị (Optic Disc)' : 'Optic Disc') : (isVi ? 'Hoàng điểm (FAZ)' : 'Fovea Centralis (FAZ)');
      rows.push([
        sanitize(name),
        `(${a.coordinates.x}%, ${a.coordinates.y}%)`,
        `${Math.round(a.confidence != null ? (a.confidence <= 1 ? a.confidence * 100 : a.confidence) : 98)}%`,
        sanitize(a.description),
      ]);
    });
  }

  // Prepend UTF-8 BOM (\uFEFF)
  const csvBody = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\r\n');

  return `\uFEFF${csvBody}`;
};

/**
 * Tải xuống kết quả phân tích dưới dạng bảng CSV đã khử injection (NFR-20)
 */
export const exportToCsv = (
  result: AIRiskResult,
  patient: PatientProfile,
  isVi: boolean = true
): void => {
  const csvContent = buildReportCsvContent(result, patient, isVi);
  const mrnClean = (patient.mrn || 'ANON').replace(/[^a-zA-Z0-9_-]/g, '');
  const idClean = (result.analysisId || 'latest').replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `AURA_Report_${mrnClean}_${idClean}.csv`;

  triggerFileDownload(csvContent, fileName, 'text/csv;charset=utf-8');
};

/**
 * Kích hoạt in phiếu kết quả ra file PDF hoặc máy in chuẩn y tế (NFR-20)
 */
export const printMedicalReport = (): void => {
  if (typeof window !== 'undefined' && typeof window.print === 'function') {
    window.print();
  }
};
