/**
 * @deprecated
 * FILE NÀY ĐÃ ĐƯỢC ĐÁNH DẤU DEPRECATED VÀ VÔ HIỆU HÓA HOÀN TOÀN TRONG PRODUCTION (SRS AUDIT COMPLIANCE).
 * Toàn bộ hệ thống AURA đã chuyển đổi 100% sang REST API thật tại Backend Spring Boot và AI Vision Service.
 * Tệp này chỉ được lưu lại làm tài liệu tham chiếu cấu trúc (Stub) cho các bộ Unit Test ngoại tuyến cũ.
 * KHÔNG ĐƯỢC IMPORT HOẶC SỬ DỤNG TRONG BẤT KỲ LUỒNG VẬN HÀNH NÀO CỦA ỨNG DỤNG.
 */

import {
  AIRiskResult,
  ClinicBatchJob,
  DoctorFeedback,
  FundusAnalysisRequest,
  PatientProfile,
} from '../types/cds';
import { generateDynamicHeatmapDataUrl } from '../utils/dynamicHeatmapEngine';

export const MOCK_PATIENTS: PatientProfile[] = [
  {
    id: 'PAT-8820',
    mrn: 'MRN-2026-0941',
    fullName: 'Bệnh nhân Nguyễn Trọng Nam',
    age: 58,
    gender: 'Male',
    systolicBp: 154,
    diastolicBp: 96,
    hba1c: 8.2,
    hasDiabetes: true,
    hasHypertension: true,
    historyOfSmoking: true,
    lastExamDate: '2026-09-03',
    assignedDoctor: 'Bác sĩ chuyên khoa',
    phone: '0912 345 678',
    riskLevel: 'High',
    riskScore: 85,
    reviewStatus: 'PENDING_REVIEW',
    findingsSummary: 'Đã thực hiện 9 ca khám sàng lọc. Bắt chéo động-tĩnh mạch (Gunn sign), co hẹp vi mạch đáy mắt.',
    avatarColor: 'from-red-500 to-rose-600',
  },
  {
    id: 'PAT-8821',
    mrn: 'MRN-2026-0942',
    fullName: 'Trần Văn Hoàng',
    age: 58,
    gender: 'Male',
    systolicBp: 154,
    diastolicBp: 96,
    hba1c: 8.2,
    hasDiabetes: true,
    hasHypertension: true,
    historyOfSmoking: true,
    lastExamDate: '2026-09-02',
    assignedDoctor: 'Bác sĩ chuyên khoa',
    phone: '0912 345 679',
    riskLevel: 'High',
    riskScore: 82,
    reviewStatus: 'PENDING_REVIEW',
    findingsSummary: 'Bắt chéo động-tĩnh mạch (Gunn sign), hẹp lòng mạch tiểu động mạch độ II, nghi ngờ NPDR nhẹ.',
    avatarColor: 'from-orange-500 to-red-600',
  },
  {
    id: 'PAT-8822',
    mrn: 'MRN-2026-1033',
    fullName: 'Lê Thị Mai',
    age: 44,
    gender: 'Female',
    systolicBp: 128,
    diastolicBp: 82,
    hba1c: 5.9,
    hasDiabetes: false,
    hasHypertension: false,
    historyOfSmoking: false,
    lastExamDate: '2026-09-01',
    assignedDoctor: 'BS. Phan Định',
    phone: '0988 234 567',
    riskLevel: 'Low',
    riskScore: 28,
    reviewStatus: 'REVIEWED',
    findingsSummary: 'Cấu trúc vi mạch đáy mắt bình thường, không có dấu hiệu phình vi mạch hay xuất huyết.',
    avatarColor: 'from-emerald-500 to-teal-600',
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
    lastExamDate: '2026-08-30',
    assignedDoctor: 'Bác sĩ chuyên khoa',
    phone: '0903 888 999',
    riskLevel: 'Severe',
    riskScore: 91,
    reviewStatus: 'CRITICAL',
    findingsSummary: 'BÁO ĐỘNG ĐỎ: Xuất huyết chấm nông, xuất tiết cứng hoàng điểm kèm hẹp nặng vi mạch (A/V: 0.48).',
    avatarColor: 'from-purple-600 to-indigo-700',
  },
  {
    id: 'PAT-8824',
    mrn: 'MRN-2026-1204',
    fullName: 'Nguyễn Văn Hùng',
    age: 52,
    gender: 'Male',
    systolicBp: 142,
    diastolicBp: 90,
    hba1c: 7.1,
    hasDiabetes: true,
    hasHypertension: true,
    historyOfSmoking: false,
    lastExamDate: '2026-08-28',
    assignedDoctor: 'Bác sĩ chuyên khoa',
    phone: '0977 123 456',
    riskLevel: 'Moderate',
    riskScore: 62,
    reviewStatus: 'PENDING_REVIEW',
    findingsSummary: 'Hẹp vi mạch khu trú vùng thái dương trên, vi phình mạch rải rác.',
    avatarColor: 'from-amber-500 to-orange-600',
  },
  {
    id: 'PAT-8825',
    mrn: 'MRN-2026-1219',
    fullName: 'Đặng Thị Lan',
    age: 61,
    gender: 'Female',
    systolicBp: 136,
    diastolicBp: 86,
    hba1c: 6.8,
    hasDiabetes: true,
    hasHypertension: false,
    historyOfSmoking: false,
    lastExamDate: '2026-08-25',
    assignedDoctor: 'BS. Phan Định',
    phone: '0918 567 890',
    riskLevel: 'Moderate',
    riskScore: 54,
    reviewStatus: 'REVIEWED',
    findingsSummary: 'Theo dõi tiến triển bệnh võng mạc đái tháo đường giai đoạn sớm, vi mạch tương đối ổn định.',
    avatarColor: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'PAT-8826',
    mrn: 'MRN-2026-1233',
    fullName: 'Vũ Đình Quang',
    age: 72,
    gender: 'Male',
    systolicBp: 175,
    diastolicBp: 108,
    hba1c: 8.8,
    hasDiabetes: true,
    hasHypertension: true,
    historyOfSmoking: true,
    lastExamDate: '2026-08-22',
    assignedDoctor: 'Bác sĩ chuyên khoa',
    phone: '0933 445 566',
    riskLevel: 'High',
    riskScore: 86,
    reviewStatus: 'PENDING_REVIEW',
    findingsSummary: 'Xơ cứng động mạch võng mạc (dây bạc), nguy cơ nhồi máu vi mạch và đột quỵ cấp.',
    avatarColor: 'from-rose-600 to-red-700',
  },
  {
    id: 'PAT-8827',
    mrn: 'MRN-2026-1248',
    fullName: 'Bùi Thị Bích',
    age: 38,
    gender: 'Female',
    systolicBp: 118,
    diastolicBp: 76,
    hba1c: 5.4,
    hasDiabetes: false,
    hasHypertension: false,
    historyOfSmoking: false,
    lastExamDate: '2026-08-20',
    assignedDoctor: 'BS. Phan Định',
    phone: '0966 789 012',
    riskLevel: 'Low',
    riskScore: 18,
    reviewStatus: 'REVIEWED',
    findingsSummary: 'Gai thị hồng rõ, tỷ lệ C/D 0.3 bình thường, không tổn hại lớp sợi thần kinh võng mạc.',
    avatarColor: 'from-teal-500 to-emerald-600',
  },
  {
    id: 'PAT-8828',
    mrn: 'MRN-2026-1262',
    fullName: 'Ngô Thanh Tùng',
    age: 50,
    gender: 'Male',
    systolicBp: 148,
    diastolicBp: 94,
    hba1c: 7.6,
    hasDiabetes: true,
    hasHypertension: true,
    historyOfSmoking: true,
    lastExamDate: '2026-08-18',
    assignedDoctor: 'Bác sĩ chuyên khoa',
    phone: '0908 991 223',
    riskLevel: 'High',
    riskScore: 76,
    reviewStatus: 'PENDING_REVIEW',
    findingsSummary: 'Hiện tượng bắt chéo động-tĩnh mạch kèm giãn phình tĩnh mạch khẩu kính không đều.',
    avatarColor: 'from-red-500 to-pink-600',
  },
  {
    id: 'PAT-8829',
    mrn: 'MRN-2026-1277',
    fullName: 'Đỗ Thị Thu',
    age: 65,
    gender: 'Female',
    systolicBp: 152,
    diastolicBp: 92,
    hba1c: 6.9,
    hasDiabetes: false,
    hasHypertension: true,
    historyOfSmoking: false,
    lastExamDate: '2026-08-15',
    assignedDoctor: 'BS. Phan Định',
    phone: '0913 224 466',
    riskLevel: 'Moderate',
    riskScore: 68,
    reviewStatus: 'REVIEWED',
    findingsSummary: 'Tăng huyết áp võng mạc giai đoạn II (dấu hiệu Salus), cần kiểm soát HA mục tiêu < 130/80.',
    avatarColor: 'from-amber-600 to-yellow-600',
  },
  {
    id: 'PAT-8830',
    mrn: 'MRN-2026-1291',
    fullName: 'Hoàng Minh Tuấn',
    age: 46,
    gender: 'Male',
    systolicBp: 132,
    diastolicBp: 84,
    hba1c: 6.2,
    hasDiabetes: false,
    hasHypertension: false,
    historyOfSmoking: true,
    lastExamDate: '2026-08-12',
    assignedDoctor: 'Bác sĩ chuyên khoa',
    phone: '0972 556 778',
    riskLevel: 'Low',
    riskScore: 36,
    reviewStatus: 'REVIEWED',
    findingsSummary: 'Mạng lưới vi mạch bình thường, lưu ý giảm hút thuốc để phòng ngừa xơ vữa mạch máu.',
    avatarColor: 'from-sky-500 to-indigo-600',
  },
  {
    id: 'PAT-8831',
    mrn: 'MRN-2026-1305',
    fullName: 'Trương Ngọc Ánh',
    age: 55,
    gender: 'Female',
    systolicBp: 160,
    diastolicBp: 98,
    hba1c: 8.5,
    hasDiabetes: true,
    hasHypertension: true,
    historyOfSmoking: false,
    lastExamDate: '2026-08-08',
    assignedDoctor: 'Bác sĩ chuyên khoa',
    phone: '0945 667 889',
    riskLevel: 'High',
    riskScore: 79,
    reviewStatus: 'PENDING_REVIEW',
    findingsSummary: 'Phát hiện xuất huyết đốm cạnh hoàng điểm OD, nghi ngờ phù hoàng điểm do đái tháo đường.',
    avatarColor: 'from-orange-500 to-rose-600',
  },
  {
    id: 'PAT-8832',
    mrn: 'MRN-2026-1320',
    fullName: 'Lý Quốc Bảo',
    age: 63,
    gender: 'Male',
    systolicBp: 146,
    diastolicBp: 92,
    hba1c: 7.0,
    hasDiabetes: true,
    hasHypertension: true,
    historyOfSmoking: true,
    lastExamDate: '2026-08-05',
    assignedDoctor: 'BS. Phan Định',
    phone: '0922 334 455',
    riskLevel: 'Moderate',
    riskScore: 59,
    reviewStatus: 'REVIEWED',
    findingsSummary: 'Tổn thương vi mạch nhẹ, tỷ lệ A/V 0.58. Khuyến nghị tái khám sau 3 tháng.',
    avatarColor: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'PAT-8833',
    mrn: 'MRN-2026-1335',
    fullName: 'Dương Thúy Hằng',
    age: 41,
    gender: 'Female',
    systolicBp: 122,
    diastolicBp: 78,
    hba1c: 5.6,
    hasDiabetes: false,
    hasHypertension: false,
    historyOfSmoking: false,
    lastExamDate: '2026-07-31',
    assignedDoctor: 'BS. Phan Định',
    phone: '0981 112 233',
    riskLevel: 'Low',
    riskScore: 22,
    reviewStatus: 'REVIEWED',
    findingsSummary: 'Kết quả sàng lọc hoàn toàn bình thường, không phát hiện dấu hiệu bệnh lý mạch máu võng mạc.',
    avatarColor: 'from-teal-600 to-green-600',
  },
  {
    id: 'PAT-8834',
    mrn: 'MRN-2026-1350',
    fullName: 'Tạ Quang Khải',
    age: 69,
    gender: 'Male',
    systolicBp: 172,
    diastolicBp: 104,
    hba1c: 9.1,
    hasDiabetes: true,
    hasHypertension: true,
    historyOfSmoking: true,
    lastExamDate: '2026-07-28',
    assignedDoctor: 'Bác sĩ chuyên khoa',
    phone: '0909 887 766',
    riskLevel: 'Severe',
    riskScore: 89,
    reviewStatus: 'CRITICAL',
    findingsSummary: 'BÁO ĐỘNG ĐỎ: Đốm xuất huyết võng mạc diện rộng, co thắt tiểu động mạch cấp tính.',
    avatarColor: 'from-red-600 to-rose-700',
  },
  {
    id: 'PAT-8835',
    mrn: 'MRN-2026-1365',
    fullName: 'Nguyễn Thị Kim Oanh',
    age: 59,
    gender: 'Female',
    systolicBp: 138,
    diastolicBp: 88,
    hba1c: 6.6,
    hasDiabetes: false,
    hasHypertension: true,
    historyOfSmoking: false,
    lastExamDate: '2026-07-24',
    assignedDoctor: 'Bác sĩ chuyên khoa',
    phone: '0937 445 566',
    riskLevel: 'Moderate',
    riskScore: 49,
    reviewStatus: 'REVIEWED',
    findingsSummary: 'Dấu hiệu tăng huyết áp võng mạc độ I, vi mạch chưa có tổn thương cấu trúc vĩnh viễn.',
    avatarColor: 'from-amber-500 to-emerald-600',
  },
  {
    id: 'PAT-8836',
    mrn: 'MRN-2026-1380',
    fullName: 'Phan Văn Trực',
    age: 54,
    gender: 'Male',
    systolicBp: 156,
    diastolicBp: 96,
    hba1c: 7.8,
    hasDiabetes: true,
    hasHypertension: true,
    historyOfSmoking: false,
    lastExamDate: '2026-07-20',
    assignedDoctor: 'BS. Phan Định',
    phone: '0919 778 899',
    riskLevel: 'High',
    riskScore: 78,
    reviewStatus: 'PENDING_REVIEW',
    findingsSummary: 'Vi phình mạch nhiều ổ, cần chụp huỳnh quang đáy mắt FFA để xác định rò rỉ dịch.',
    avatarColor: 'from-rose-500 to-orange-600',
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
    heatmapUrl: '',
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
      title: 'Độ Uốn Lượn Mạch Máu',
      impact: 'Medium',
      clinicalRationale:
        'Chỉ số uốn lượn 1.42 vượt mức bình thường, liên quan tới biến đổi áp lực dòng chảy động mạch cảnh.',
    },
  ],
};

/**
 * Generate a dynamic Grad-CAM Heatmap DataURL directly from any custom uploaded image using dynamicHeatmapEngine
 */
async function generateDynamicHeatmapFromImage(
  imageSrc: string,
  options: {
    riskScore?: number;
    anomalies?: any[];
    selectedEye?: string;
  } = {}
): Promise<string> {
  return generateDynamicHeatmapDataUrl(imageSrc, options);
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
      { status: 'Gửi ảnh tới AI Microservice...', percent: 20, delay: 600 },
      { status: 'Tiền xử lý ảnh võng mạc & Anonymization HIPAA...', percent: 45, delay: 800 },
      { status: 'Trích xuất mạng lưới vi mạch & Chỉ số A/V Ratio...', percent: 75, delay: 900 },
      { status: 'Hoàn tất phân tích & Sinh bản đồ nhiệt Grad-CAM...', percent: 100, delay: 500 },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, step.delay));
      onProgress(step.status, step.percent);
    }

    const uploadedImageUrl = request.imageUrl || '/assets/images/fundus_original.png';
    let dynamicHeatmapUrl = '';

    // Generate client-side dynamic Grad-CAM heatmap if needed

    // MED-04 FIX: Standard physiological baseline references for offline test mock
    // Completely eliminates pseudo-random ASCII string hashing and modulo tricks
    const dynamicAvRatio = 0.66;
    const dynamicVesselDensity = 17.5;
    const dynamicTortuosity = 1.14;
    const dynamicVcdr = 0.35;
    const cardioScore = 28;
    const hypertensionStage = 'Bình thường (Huyết áp trong giới hạn kiểm soát)';
    const strokeScore = 5.6;
    const drScore = 18;
    const etdrsGrade = 'Cấp độ 0 (Không phát hiện bệnh võng mạc tiểu đường)';
    const glaucomaScore = 18;
    const overallScore = 28;

    const isRightEye = request.eyePosition === 'Right_OD';

    // Standard clinical anomaly references for offline test mock
    const anomalies = [
      {
        id: 'ANO-101',
        type: 'Focal_Narrowing' as any,
        coordinates: { x: 45, y: 40, width: 8, height: 8 },
        confidence: 0.88,
        description: `Đoạn co thắt tiểu động mạch khu trú, chỉ số A/V: ${dynamicAvRatio}`,
      },
      {
        id: 'ANO-102',
        type: 'Microaneurysm' as any,
        coordinates: { x: 55, y: 35, width: 6, height: 6 },
        confidence: 0.85,
        description: 'Vi phình mạch rải rác ngoài vùng hoàng điểm',
      },
    ];

    // If no backend heatmap was returned, generate dynamic Grad-CAM on top of the user's actual image
    if (!dynamicHeatmapUrl) {
      dynamicHeatmapUrl = await generateDynamicHeatmapFromImage(uploadedImageUrl, {
        riskScore: overallScore,
        anomalies,
        selectedEye: isRightEye ? 'OD' : 'OS',
      });
    }

    return {
      analysisId: `ANALYSIS-${Date.now().toString().slice(-6)}`,
      imageUrl: uploadedImageUrl,
      status: 'COMPLETED',
      executionTimeMs: 2450,
      overallVascularRiskScore: overallScore,
      cardiovascularRisk: {
        level: overallScore >= 75 ? 'High' : (overallScore >= 45 ? 'Moderate' : 'Low'),
        score: cardioScore,
        hypertensionStage,
        threeYearStrokeRiskPercent: strokeScore,
      },
      strokeRisk: {
        level: strokeScore >= 15 ? 'High' : (strokeScore >= 8 ? 'Moderate' : 'Low'),
        score: strokeScore,
        threeYearStrokeRiskPercent: strokeScore,
      },
      diabeticRetinopathyRisk: {
        level: drScore >= 60 ? 'High' : (drScore >= 40 ? 'Moderate' : 'Low'),
        score: drScore,
        etdrsGrade,
        macularEdemaPresent: drScore >= 60,
      },
      glaucomaRisk: {
        level: glaucomaScore >= 50 ? 'Moderate' : 'Low',
        score: glaucomaScore,
      },
      annotatedMap: {
        heatmapUrl: dynamicHeatmapUrl,
        arteryVeinRatio: dynamicAvRatio,
        vesselDensityPercentage: dynamicVesselDensity,
        tortuosityIndex: dynamicTortuosity,
        opticCupToDiscRatio: dynamicVcdr,
        detectedAnomalies: anomalies,
      },
      xaiExplainability: [
        {
          title: `Tỷ lệ Động/Tĩnh Mạch A/V: ${dynamicAvRatio}`,
          impact: dynamicAvRatio < 0.58 ? 'High' : 'Medium',
          clinicalRationale: `Chỉ số A/V ratio đo lường đạt ${dynamicAvRatio} (Ngưỡng sinh lý chuẩn >= 0.67). ${
            dynamicAvRatio < 0.58
              ? 'Phản ánh tình trạng co hẹp tiểu động mạch võng mạc đáng kể do áp lực dòng máu tăng cao.'
              : 'Mạch máu duy trì độ giãn nở tương đối đồng đều, không ghi nhận co thắt cục bộ nặng.'
          }`,
        },
        {
          title: `Mật Độ Tưới Máu Vi Mạch: ${dynamicVesselDensity}%`,
          impact: dynamicVesselDensity < 14.5 ? 'High' : 'Low',
          clinicalRationale: `Mật độ mao mạch đo được ${dynamicVesselDensity}% (Chuẩn: 15.5% - 19.0%). ${
            dynamicVesselDensity < 14.5
              ? 'Có hiện tượng giảm tưới máu vi mạch cực sau, cần theo dõi biến chứng đáy mắt đái tháo đường.'
              : 'Mạng lưới tưới máu võng mạc phân bố đều đặn quanh đĩa thị và hoàng điểm.'
          }`,
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
