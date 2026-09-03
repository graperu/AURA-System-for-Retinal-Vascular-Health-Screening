export type UserRole = 'patient' | 'doctor' | 'clinic' | 'admin';

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Severe';

export interface PatientProfile {
  id?: string;
  userId?: string;
  mrn: string; // Medical Record Number
  fullName: string;
  email?: string;
  dateOfBirth?: string | null;
  age?: number | null;
  gender: 'Male' | 'Female' | 'Other';
  phoneNumber?: string | null;
  address?: string | null;
  bloodType?: string | null;
  systolicBp?: number | null;
  diastolicBp?: number | null;
  hba1c?: number | null; // %
  hasDiabetes: boolean;
  diabetesType?: string | null;
  diabetesDurationYears?: number | null;
  hasHypertension: boolean;
  historyOfSmoking: boolean;
  historyOfHeartDisease?: boolean;
  historyOfStroke?: boolean;
  currentMedications?: string | null;
  allergies?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  lastExamDate?: string | null;
  assignedDoctor: string;
}

export interface FundusAnalysisRequest {
  requestId: string;
  patientId: string;
  clinicId: string;
  imageName: string;
  imageUrl: string;
  file?: File;
  scanType: 'Fundus_Macula' | 'Fundus_OpticDisc' | 'OCT_Scan';
  eyePosition: 'Left_OS' | 'Right_OD';
  uploadedAt: string;
}

export interface VesselAnomalyRegion {
  id: string;
  type: 'Focal_Narrowing' | 'AV_Nipping' | 'Microaneurysm' | 'Hard_Exudate' | 'Hemorrhage';
  coordinates: { x: number; y: number; width: number; height: number };
  confidence: number;
  description: string;
}

export interface AnnotatedVesselMap {
  heatmapUrl?: string;
  vesselMaskUrl?: string;
  arteryVeinRatio: number; // Normal range ~ 0.67 (2:3)
  vesselDensityPercentage: number;
  tortuosityIndex: number; // Vessel curvature metric
  opticCupToDiscRatio: number; // Normal 0.3 - 0.4
  detectedAnomalies: VesselAnomalyRegion[];
}

export interface AIRiskResult {
  analysisId: string;
  imageUrl?: string;
  status: 'QUEUED' | 'SEGMENTING_VESSELS' | 'CALCULATING_METRICS' | 'SCORING_RISK' | 'COMPLETED' | 'FAILED';
  executionTimeMs: number;
  overallVascularRiskScore: number; // 0 - 100
  cardiovascularRisk: {
    level: RiskLevel;
    score: number;
    hypertensionStage: string;
    threeYearStrokeRiskPercent: number;
  };
  diabeticRetinopathyRisk: {
    level: RiskLevel;
    score: number;
    etdrsGrade: string; // Early Treatment Diabetic Retinopathy Study scale
    macularEdemaPresent: boolean;
  };
  glaucomaRisk: {
    level: RiskLevel;
    score: number;
  };
  annotatedMap: AnnotatedVesselMap;
  xaiExplainability: {
    title: string;
    impact: 'High' | 'Medium' | 'Low';
    clinicalRationale: string;
  }[];
}

export interface DoctorFeedback {
  feedbackId: string;
  analysisId: string;
  doctorId: string;
  doctorName: string;
  decision: 'APPROVED' | 'MODIFIED' | 'REJECTED';
  adjustedCardioRisk?: RiskLevel;
  adjustedDrRisk?: RiskLevel;
  icd10Codes: string[];
  clinicalNotes: string;
  reviewedAt: string;
  signedDigitalSignature?: string;
}

export interface ClinicBatchJobItem {
  id: string;
  patientName: string;
  mrn: string;
  eye: 'OD' | 'OS';
  fileName: string;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR';
  riskLevel?: RiskLevel;
  riskScore?: number;
}

export interface ClinicBatchJob {
  batchId: string;
  clinicId: string;
  clinicName: string;
  totalImages: number;
  processedCount: number;
  failedCount: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
  createdAt: string;
  estimatedTimeRemainingSec: number;
  items: ClinicBatchJobItem[];
}
