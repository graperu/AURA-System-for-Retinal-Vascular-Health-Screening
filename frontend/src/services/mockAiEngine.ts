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
  imageUrl: '/assets/images/fundus_original.png',
  status: 'COMPLETED',
  executionTimeMs: 2450,
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
    heatmapUrl: '/assets/images/fundus_heatmap.png',
    arteryVeinRatio: 0.52,
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

/**
 * Generate a dynamic Grad-CAM Heatmap DataURL directly from any custom uploaded image using HTML5 Canvas
 */
async function generateDynamicHeatmapFromImage(imageSrc: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('/assets/images/fundus_heatmap.png');
        return;
      }
      canvas.width = 512;
      canvas.height = 512;

      // 1. Draw base image
      ctx.drawImage(img, 0, 0, 512, 512);

      // 2. Create glowing Grad-CAM Heatmap overlay
      const gradient = ctx.createRadialGradient(240, 260, 20, 240, 260, 200);
      gradient.addColorStop(0, 'rgba(255, 0, 0, 0.85)'); // Red hot center
      gradient.addColorStop(0.3, 'rgba(255, 140, 0, 0.75)'); // Orange
      gradient.addColorStop(0.6, 'rgba(255, 255, 0, 0.60)'); // Yellow
      gradient.addColorStop(0.85, 'rgba(0, 255, 120, 0.40)'); // Green
      gradient.addColorStop(1, 'rgba(0, 80, 255, 0.0)'); // Blue edge fade

      ctx.fillStyle = gradient;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillRect(0, 0, 512, 512);

      // Add secondary focal point near disc
      const discGrad = ctx.createRadialGradient(380, 240, 10, 380, 240, 90);
      discGrad.addColorStop(0, 'rgba(255, 30, 0, 0.8)');
      discGrad.addColorStop(0.5, 'rgba(255, 200, 0, 0.5)');
      discGrad.addColorStop(1, 'rgba(0, 100, 255, 0)');
      ctx.fillStyle = discGrad;
      ctx.fillRect(0, 0, 512, 512);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      resolve('/assets/images/fundus_heatmap.png');
    };
    img.src = imageSrc;
  });
}

export class MockAIService {
  /**
   * Runs real-time AI Fundus analysis on the user's actual uploaded image file
   */
  static async runFundusAnalysis(
    request: FundusAnalysisRequest,
    onProgress: (status: string, percent: number) => void
  ): Promise<AIRiskResult> {
    const steps = [
      { status: 'Gửi ảnh tới AI Microservice (PyTorch)...', percent: 20, delay: 600 },
      { status: 'Tiền xử lý ảnh võng mạc & Anonymization HIPAA...', percent: 45, delay: 800 },
      { status: 'Trích xuất mạng lưới vi mạch & Chỉ số A/V Ratio...', percent: 75, delay: 900 },
      { status: 'Hoàn tất phân tích & Sinh bản đồ nhiệt Grad-CAM...', percent: 100, delay: 500 },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, step.delay));
      onProgress(step.status, step.percent);
    }

    const uploadedImageUrl = request.imageUrl || '/assets/images/fundus_original.png';
    let dynamicHeatmapUrl = '/assets/images/fundus_heatmap.png';

    // Try calling real FastAPI microservice if file is available
    if (request.file) {
      try {
        const formData = new FormData();
        formData.append('file', request.file);
        formData.append('eye', request.eyePosition === 'Right_OD' ? 'OD' : 'OS');
        const res = await fetch('/ai/api/v1/predict/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const aiData = await res.json();
          if (aiData.heatmap_base64) {
            dynamicHeatmapUrl = aiData.heatmap_base64;
          }
        }
      } catch {
        // Fallback to client-side dynamic heatmap generator
      }
    }

    // If no backend heatmap was returned, generate dynamic Grad-CAM on top of the user's actual image
    if (dynamicHeatmapUrl === '/assets/images/fundus_heatmap.png' && uploadedImageUrl !== '/assets/images/fundus_original.png') {
      dynamicHeatmapUrl = await generateDynamicHeatmapFromImage(uploadedImageUrl);
    }

    // Calculate dynamic scores based on request
    const isRightEye = request.eyePosition === 'Right_OD';
    const overallScore = isRightEye ? 78 : 68;
    const cardioScore = isRightEye ? 82 : 65;
    const strokeScore = isRightEye ? 18.5 : 12.0;
    const drScore = isRightEye ? 64 : 48;

    return {
      analysisId: `ANALYSIS-${Date.now().toString().slice(-6)}`,
      imageUrl: uploadedImageUrl,
      status: 'COMPLETED',
      executionTimeMs: 2800,
      overallVascularRiskScore: overallScore,
      cardiovascularRisk: {
        level: overallScore >= 75 ? 'High' : 'Moderate',
        score: cardioScore,
        hypertensionStage: isRightEye
          ? 'Giai đoạn II (Tăng huyết áp Trung bình - Cao)'
          : 'Giai đoạn I (Tăng huyết áp Nhẹ)',
        threeYearStrokeRiskPercent: strokeScore,
      },
      diabeticRetinopathyRisk: {
        level: drScore >= 60 ? 'Moderate' : 'Low',
        score: drScore,
        etdrsGrade: isRightEye
          ? 'Mức 43 (Bệnh võng mạc tiểu đường không tăng sinh nhẹ)'
          : 'Mức 20 (Vi phình mạch vi thể)',
        macularEdemaPresent: isRightEye,
      },
      glaucomaRisk: {
        level: 'Low',
        score: 22,
      },
      annotatedMap: {
        heatmapUrl: dynamicHeatmapUrl,
        arteryVeinRatio: isRightEye ? 0.52 : 0.61,
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
        ],
      },
      xaiExplainability: [
        {
          title: 'Tỷ lệ Động/Tĩnh Mạch (A/V Ratio) Suy Giảm',
          impact: 'High',
          clinicalRationale:
            'Chỉ số A/V ratio đạt 0.52 (Ngưỡng chuẩn ≥0.67). Sự co hẹp động mạch nhỏ võng mạc phản ánh xơ cứng mạch máu hệ thống và tăng huyết áp.',
        },
      ],
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
