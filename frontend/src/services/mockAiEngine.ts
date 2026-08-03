import {
  AIRiskResult,
  ClinicBatchJob,
  DoctorFeedback,
  FundusAnalysisRequest,
  PatientProfile,
} from '../types/cds';

export const MOCK_PATIENTS: PatientProfile[] = [
  {
    id: 'PAT-8821',
    mrn: 'MRN-2026-0941',
    fullName: 'Trần Văn Hoàng',
    age: 58,
    gender: 'Male',
    systolicBp: 154,
    diastolicBp: 96,
    hba1c: 8.2,
    hasDiabetes: true,
    hasHypertension: true,
    historyOfSmoking: true,
    lastExamDate: '2026-07-14',
    assignedDoctor: 'BS. CKII Nguyễn Thị Thanh',
  },
  {
    id: 'PAT-8822',
    mrn: 'MRN-2026-1033',
    fullName: 'Lê Thi Mai',
    age: 44,
    gender: 'Female',
    systolicBp: 128,
    diastolicBp: 82,
    hba1c: 5.9,
    hasDiabetes: false,
    hasHypertension: false,
    historyOfSmoking: false,
    lastExamDate: '2026-08-01',
    assignedDoctor: 'BS. Phan Định',
  },
  {
    id: 'PAT-8823',
    mrn: 'MRN-2026-1188',
    fullName: 'Phạm Đức Anh',
    age: 67,
    gender: 'Male',
    systolicBp: 168,
    diastolicBp: 102,
    hba1c: 9.4,
    hasDiabetes: true,
    hasHypertension: true,
    historyOfSmoking: true,
    lastExamDate: '2026-07-29',
    assignedDoctor: 'BS. CKII Nguyễn Thị Thanh',
  },
];

export const MOCK_SAMPLE_RESULT: AIRiskResult = {
  analysisId: 'ANALYSIS-2026-7741',
  status: 'COMPLETED',
  executionTimeMs: 14250,
  overallVascularRiskScore: 78,
  cardiovascularRisk: {
    level: 'High',
    score: 82,
    hypertensionStage: 'Giai đoạn II (Tăng huyết áp Trung bình - Cao)',
    threeYearStrokeRiskPercent: 18.5,
  },
  diabeticRetinopathyRisk: {
    level: 'Moderate',
    score: 64,
    etdrsGrade: 'Mức 43 (Bệnh võng mạc tiểu đường không tăng sinh nhẹ)',
    macularEdemaPresent: true,
  },
  glaucomaRisk: {
    level: 'Low',
    score: 22,
  },
  annotatedMap: {
    arteryVeinRatio: 0.52, // Abnormal ratio (normal is ~0.67)
    vesselDensityPercentage: 14.8,
    tortuosityIndex: 1.42,
    opticCupToDiscRatio: 0.38,
    detectedAnomalies: [
      {
        id: 'ANO-1',
        type: 'AV_Nipping',
        coordinates: { x: 38, y: 42, width: 8, height: 8 },
        confidence: 0.94,
        description: 'Bắt chéo động-tĩnh mạch (Gunn sign) chỉ số hẹp 0.52',
      },
      {
        id: 'ANO-2',
        type: 'Microaneurysm',
        coordinates: { x: 55, y: 31, width: 5, height: 5 },
        confidence: 0.88,
        description: 'Vi phình mạch khu vực bán kính 1.2mm từ hoàng điểm',
      },
      {
        id: 'ANO-3',
        type: 'Hemorrhage',
        coordinates: { x: 62, y: 58, width: 12, height: 10 },
        confidence: 0.91,
        description: 'Xuất huyết chấm/đốm nông võng mạc cực sau',
      },
    ],
  },
  xaiExplainability: [
    {
      title: 'Tỷ lệ Động/Tĩnh Mạch (A/V Ratio) Suy Giảm',
      impact: 'High',
      clinicalRationale:
        'Chỉ số A/V ratio đạt 0.52 (Ngưỡng chuẩn ≥0.67). Sự co hẹp động mạch nhỏ võng mạc phản ánh xơ cứng mạch máu hệ thống và tăng huyết áp mãn tính.',
    },
    {
      title: 'Vi Phình Mạch & Xuất Huyết Cực Sau',
      impact: 'High',
      clinicalRationale:
        'Phát hiện 3 vùng vi phình mạch kèm xuất huyết chấm nông khu vực hoàng điểm, dấu hiệu đặc trưng của tổn thương vi mạch do đái tháo đường.',
    },
    {
      title: 'Độ Uốn Lượn Mạch Máu (Vessel Tortuosity)',
      impact: 'Medium',
      clinicalRationale:
        'Chỉ số uốn lượn 1.42 vượt mức bình thường, liên quan tới biến đổi áp lực dòng chảy động mạch cảnh.',
    },
  ],
};

export class MockAIService {
  /**
   * Simulates real-time AI microservice progress updates over 12 seconds
   */
  static async runFundusAnalysis(
    request: FundusAnalysisRequest,
    onProgress: (status: string, percent: number) => void
  ): Promise<AIRiskResult> {
    const steps = [
      { status: 'Gửi ảnh tới AI Microservice (PyTorch)...', percent: 10, delay: 1000 },
      { status: 'Tiền xử lý ảnh võng mạc & Anonymization HIPAA...', percent: 25, delay: 2000 },
      { status: 'Trích xuất mạng lưới mạch máu (Retinal Vessel Segmentation)...', percent: 45, delay: 3000 },
      { status: 'Tính toán chỉ số Động/Tĩnh Mạch A/V Ratio & Tortuosity...', percent: 70, delay: 3000 },
      { status: 'Đánh giá rủi ro Tim Mạch & Đái Tháo Đường XAI...', percent: 90, delay: 2000 },
      { status: 'Hoàn tất phân tích & Tạo Bản đồ Nhiệt (Heatmap)...', percent: 100, delay: 1000 },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, step.delay));
      onProgress(step.status, step.percent);
    }

    return {
      ...MOCK_SAMPLE_RESULT,
      analysisId: `ANALYSIS-${Date.now().toString().slice(-6)}`,
    };
  }

  /**
   * Simulates Clinic Bulk Batch Upload and Screening Job
   */
  static getMockBatchJob(): ClinicBatchJob {
    const items = Array.from({ length: 120 }).map((_, index) => {
      const patientNum = 1000 + index;
      const isDone = index < 85;
      const isProcessing = index >= 85 && index < 90;
      const risks: ('Low' | 'Moderate' | 'High' | 'Severe')[] = ['Low', 'Moderate', 'High', 'Severe'];
      const randomRisk = risks[Math.floor(Math.random() * risks.length)];
      return {
        id: `BATCH-ITEM-${index + 1}`,
        patientName: `Bệnh nhân BK-${patientNum}`,
        mrn: `MRN-BK-${patientNum}`,
        eye: index % 2 === 0 ? ('OD' as const) : ('OS' as const),
        fileName: `retina_scan_${index + 1}.dcm`,
        status: isDone ? ('DONE' as const) : isProcessing ? ('PROCESSING' as const) : ('PENDING' as const),
        riskLevel: isDone ? randomRisk : undefined,
        riskScore: isDone ? Math.floor(Math.random() * 60) + 30 : undefined,
      };
    });

    return {
      batchId: 'BATCH-2026-088',
      clinicId: 'CLN-CENTRAL-01',
      clinicName: 'Bệnh viện Đa khoa Trung ương — Khoa Mắt',
      totalImages: 120,
      processedCount: 85,
      failedCount: 1,
      status: 'IN_PROGRESS',
      createdAt: '2026-08-03 14:10:00',
      estimatedTimeRemainingSec: 420,
      items,
    };
  }
}
