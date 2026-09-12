import React, { useState, useEffect, useCallback } from 'react';
import { PatientProfile, FundusAnalysisRequest, AIRiskResult, DoctorFeedback } from '../types/cds';
import { PatientUploader } from '../components/PatientUploader';
import { InteractiveCDSViewer } from '../components/InteractiveCDSViewer';
import { RiskAssessmentPanel } from '../components/RiskAssessmentPanel';
import { ClinicalValidationBar } from '../components/ClinicalValidationBar';
import { MedicalReportModal } from '../components/MedicalReportModal';
import { ConsultationChatModal } from '../components/ConsultationChatModal';
import { DoctorPatientListPage } from './DoctorPatientListPage';
import {
  UserCheck,
  MessageSquare,
  Download,
  AlertTriangle,
  Users,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Eye,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import { doctorApi, screeningApi } from '../services/api';
import { mapScreeningToAIRiskResult } from '../services/screeningMapper';

const toApiRiskLevel = (riskLevel: string | undefined) => {
  if (!riskLevel) return undefined;
  return riskLevel === 'Severe' ? 'CRITICAL' : riskLevel.toUpperCase();
};

export interface DoctorPatientSummary {
  patientId: string;
  mrn?: string | null;
  fullName?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  age?: number | null;
  gender?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  systolicBp?: number | null;
  diastolicBp?: number | null;
  hba1c?: number | null;
  hasDiabetes?: boolean | null;
  hasHypertension?: boolean | null;
  lastScreeningAt?: string | null;
  latestRiskLevel?: string | null;
  screeningCount: number;
  assignedAt: string;
  assignmentStatus: string;
}

interface CDSDashboardPageProps {
  activeSection?: string;
  onNavigate?: (section: string) => void;
}

export const CDSDashboardPage: React.FC<CDSDashboardPageProps> = ({
  activeSection = 'cds-viewer',
  onNavigate,
}) => {
  const [assignedPatients, setAssignedPatients] = useState<DoctorPatientSummary[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activePatient, setActivePatient] = useState<PatientProfile | null>(null);
  const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(true);
  const [patientsError, setPatientsError] = useState<string | null>(null);

  // Medical analysis is empty until a successful backend response is received.
  const [analysisResult, setAnalysisResult] = useState<AIRiskResult | null>(null);
  const [isScreeningLoading, setIsScreeningLoading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ status: string; percent: number }>({
    status: '',
    percent: 0,
  });
  const [analysisErrorMsg, setAnalysisErrorMsg] = useState<string | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [feedbackSuccessToast, setFeedbackSuccessToast] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string>('Đã lưu xác nhận chẩn đoán thành công');

  const loadPatientDetails = useCallback(async (patientId: string, summaryFallback?: DoctorPatientSummary) => {
    setAnalysisResult(null);
    setIsScreeningLoading(true);
    setAnalysisErrorMsg(null);

    try {
      // 1. Fetch official Patient Profile from Backend
      const profileRes = await doctorApi.getPatientById(patientId);
      if (profileRes.success && profileRes.data) {
        const d = profileRes.data;
        const mapped: PatientProfile = {
          id: d.userId || patientId,
          userId: d.userId || patientId,
          mrn: d.mrn || null,
          fullName: d.fullName || null,
          email: d.email || summaryFallback?.email || null,
          dateOfBirth: d.dateOfBirth || null,
          age: d.age ?? summaryFallback?.age ?? null,
          gender: d.gender || null,
          phoneNumber: d.phoneNumber || summaryFallback?.phoneNumber || null,
          address: d.address || summaryFallback?.address || null,
          bloodType: d.bloodType || null,
          systolicBp: d.systolicBp ?? summaryFallback?.systolicBp ?? null,
          diastolicBp: d.diastolicBp ?? summaryFallback?.diastolicBp ?? null,
          hba1c: d.hba1c ?? summaryFallback?.hba1c ?? null,
          hasDiabetes: d.hasDiabetes ?? summaryFallback?.hasDiabetes ?? null,
          diabetesType: d.diabetesType || null,
          diabetesDurationYears: d.diabetesDurationYears ?? null,
          hasHypertension: d.hasHypertension ?? summaryFallback?.hasHypertension ?? null,
          historyOfSmoking: d.historyOfSmoking ?? null,
          historyOfHeartDisease: d.historyOfHeartDisease ?? null,
          historyOfStroke: d.historyOfStroke ?? null,
          currentMedications: d.currentMedications || null,
          allergies: d.allergies || null,
          emergencyContactName: d.emergencyContactName || null,
          emergencyContactPhone: d.emergencyContactPhone || null,
          assignedDoctor: d.assignedDoctor || null,
        };
        setActivePatient(mapped);
      } else if (summaryFallback) {
        setActivePatient({
          id: summaryFallback.patientId,
          userId: summaryFallback.patientId,
          mrn: summaryFallback.mrn || null,
          fullName: summaryFallback.fullName || null,
          email: summaryFallback.email || null,
          gender: summaryFallback.gender || null,
          age: summaryFallback.age ?? null,
          systolicBp: summaryFallback.systolicBp ?? null,
          diastolicBp: summaryFallback.diastolicBp ?? null,
          hba1c: summaryFallback.hba1c ?? null,
          hasDiabetes: summaryFallback.hasDiabetes ?? null,
          hasHypertension: summaryFallback.hasHypertension ?? null,
        });
      }

      // 2. Fetch Patient Screenings
      const screeningsRes = await doctorApi.getPatientScreenings(patientId);
      if (screeningsRes.success && Array.isArray(screeningsRes.data) && screeningsRes.data.length > 0) {
        const latestScreening = screeningsRes.data[0];
        setAnalysisResult(mapScreeningToAIRiskResult(latestScreening, latestScreening.imageUrl));
      } else {
        setAnalysisResult(null);
      }
    } catch (err) {
      console.warn('Error loading patient details:', err);
      setAnalysisResult(null);
      setAnalysisErrorMsg('Không thể tải kết quả sàng lọc của bệnh nhân.');
    } finally {
      setIsScreeningLoading(false);
    }
  }, []);

  const fetchAssignedPatients = useCallback(async () => {
    setIsLoadingPatients(true);
    setPatientsError(null);
    try {
      const res = await doctorApi.getAssignedPatients();
      if (res.success && Array.isArray(res.data)) {
        setAssignedPatients(res.data);
        if (res.data.length > 0) {
          const first = res.data[0];
          setSelectedPatientId(first.patientId);
          await loadPatientDetails(first.patientId, first);
        } else {
          setSelectedPatientId(null);
          setActivePatient(null);
          setAnalysisResult(null);
        }
      } else {
        setPatientsError(res.message || 'Không thể tải danh sách bệnh nhân được phân công.');
      }
    } catch (err) {
      setPatientsError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ phân công.');
    } finally {
      setIsLoadingPatients(false);
    }
  }, [loadPatientDetails]);

  useEffect(() => {
    fetchAssignedPatients();
  }, [fetchAssignedPatients]);

  const handlePatientSelectChange = (patientId: string) => {
    setSelectedPatientId(patientId);
    const selectedSummary = assignedPatients.find((p) => p.patientId === patientId);
    if (selectedSummary) {
      loadPatientDetails(patientId, selectedSummary);
    }
  };

  const handleStartAnalysis = async (request: FundusAnalysisRequest) => {
    if (!selectedPatientId || !activePatient) {
      setAnalysisErrorMsg('Vui lòng chọn một bệnh nhân được phân công trước khi tải ảnh.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisErrorMsg(null);
    setAnalysisProgress({ status: 'Khởi tạo kết nối AI Microservice...', percent: 15 });

    try {
      setAnalysisProgress({ status: 'Đang gửi ảnh đến AURA AI Core cho bệnh nhân...', percent: 45 });

      // Call doctor-specific screening endpoint
      const res = await doctorApi.createScreeningForPatient(selectedPatientId, request.imageUrl);

      if (res.success && res.data && res.data.status !== 'FAILED') {
        if (res.data.patientId && res.data.patientId !== selectedPatientId) {
          setAnalysisErrorMsg('Lỗi toàn vẹn dữ liệu: Ca sàng lọc không thuộc về bệnh nhân đang chọn.');
          setAnalysisResult(null);
          return;
        }

        setAnalysisProgress({ status: 'Đang xử lý kết quả Grad-CAM & chỉ số vi mạch...', percent: 85 });
        const mapped = mapScreeningToAIRiskResult(res.data, request.imageUrl);
        setAnalysisResult(mapped);

        // Refresh screening count in assigned patients list silently
        doctorApi.getAssignedPatients().then((r) => {
          if (r.success && Array.isArray(r.data)) {
            setAssignedPatients(r.data);
          }
        });
        return;
      }

      setAnalysisResult(null);
      setAnalysisErrorMsg(
        res.message || 'Máy chủ AI không thể phân tích ảnh hoặc đang ngoại tuyến. Vui lòng thử lại sau.'
      );
    } catch (err) {
      console.error('Doctor screening upload error:', err);
      setAnalysisResult(null);
      setAnalysisErrorMsg(
        err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ phân tích. Vui lòng thử lại.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveFeedback = async (feedback: DoctorFeedback) => {
    try {
      if (feedback.analysisId) {
        await screeningApi.doctorReview(
          feedback.analysisId,
          {
            decision: feedback.decision,
            doctorNotes: feedback.clinicalNotes || 'Bác sĩ đã xác nhận kết quả chẩn đoán',
            adjustedCardioRisk: toApiRiskLevel(feedback.adjustedCardioRisk),
            adjustedDrRisk: toApiRiskLevel(feedback.adjustedDrRisk),
            icd10Codes: feedback.icd10Codes,
          }
        );
      }

      setFeedbackSuccessMsg('Đã lưu đánh giá chuyên môn và cập nhật hồ sơ sàng lọc của bệnh nhân');
      setFeedbackSuccessToast(true);
      setTimeout(() => setFeedbackSuccessToast(false), 3500);
    } catch (err) {
      console.warn('Feedback submission error:', err);
    }
  };

  if (activeSection === 'patient-list') {
    return (
      <DoctorPatientListPage
        onSelectPatientForCDS={(patient) => {
          setActivePatient(patient);
          const pid = patient.userId || patient.id;
          if (pid) {
            setSelectedPatientId(pid);
            loadPatientDetails(pid);
          }
          onNavigate?.('cds-viewer');
        }}
        onNavigate={onNavigate}
      />
    );
  }

  if (isLoadingPatients) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800">Đang nạp dữ liệu Bác sĩ...</h3>
          <p className="text-xs text-slate-500">Đang đồng bộ danh sách bệnh nhân được phân công từ hệ thống.</p>
        </div>
      </div>
    );
  }

  if (!activePatient) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-slate-50 text-slate-500 border border-slate-200 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">Chưa có Bệnh nhân được phân công</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tài khoản bác sĩ hiện tại chưa được Cơ sở y tế hoặc Admin phân công tiếp nhận bệnh nhân nào.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onNavigate?.('patient-list')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Users className="w-4 h-4" />
              <span>Xem Danh Sách Bệnh Nhân</span>
            </button>
            <button
              onClick={fetchAssignedPatients}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tải lại</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {feedbackSuccessToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-md flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-100 flex-shrink-0" />
          <span>{feedbackSuccessMsg}</span>
        </div>
      )}

      {analysisErrorMsg && (
        <div className="bg-white border border-red-300 rounded-xl p-4 shadow-sm flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-50 text-red-700">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-bold text-slate-900">Thông Báo Sàng Lọc</h4>
            <p className="text-xs text-slate-600 leading-snug">{analysisErrorMsg}</p>
          </div>
          <button onClick={() => setAnalysisErrorMsg(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Patient Selection Bar & Clinical Header */}
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-5 shadow-medical-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#F0FDFA] text-[#0891B2] border border-[#CCFBF1] flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-[#134E4A]">{activePatient.fullName || 'Chưa cập nhật tên'}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 text-[#0891B2] font-semibold font-mono-data border border-cyan-200">
                {activePatient.mrn || 'Chưa có MRN'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({activePatient.age ? `${activePatient.age} tuổi` : 'Chưa cập nhật tuổi'} • {activePatient.gender === 'Female' ? 'Nữ' : activePatient.gender === 'Male' ? 'Nam' : activePatient.gender || 'Chưa cập nhật'})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
              <span>Huyết áp: <strong className="text-slate-800 font-mono-data">{activePatient.systolicBp && activePatient.diastolicBp ? `${activePatient.systolicBp}/${activePatient.diastolicBp} mmHg` : 'Chưa đo'}</strong></span>
              <span>HbA1c: <strong className="text-slate-800 font-mono-data">{activePatient.hba1c ? `${activePatient.hba1c}%` : 'Chưa xét nghiệm'}</strong></span>
              <span className="text-teal-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Hồ sơ lâm sàng đã xác thực
              </span>
            </p>
          </div>
        </div>

        {/* Patient Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate?.('patient-list')}
            className="px-3.5 py-2 bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0891B2] font-bold rounded-xl text-xs border border-[#CCFBF1] transition-colors flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            <span>Đổi Bệnh Nhân</span>
          </button>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-[#0891B2] to-[#0E7490] hover:from-[#0E7490] hover:to-[#0891B2] text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>In Phiếu Kết Quả</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Uploader Workspace (4 cols) & Right CDS Viewer / Empty State (8 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Image Uploader Workspace (4 cols) */}
        <div className="xl:col-span-4 space-y-6">
          <PatientUploader
            activePatient={activePatient}
            onStartAnalysis={handleStartAnalysis}
            isAnalyzing={isAnalyzing}
            analysisProgress={analysisProgress}
          />
        </div>

        {/* Right Column: Interactive Side-by-Side CDS Viewer OR Clean Empty State (8 cols) */}
        <div className="xl:col-span-8 space-y-6">
          {isScreeningLoading ? (
            <div className="bg-white border border-[#CCFBF1] rounded-2xl p-8 shadow-medical-sm text-center flex flex-col items-center justify-center min-h-[380px] space-y-3">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Đang tải lịch sử ca sàng lọc của bệnh nhân...</p>
            </div>
          ) : analysisResult ? (
            <InteractiveCDSViewer analysisResult={analysisResult} selectedEye="OD (Mắt Phải)" />
          ) : (
            <div className="bg-white border border-[#CCFBF1] rounded-2xl p-8 shadow-medical-sm text-center flex flex-col items-center justify-center min-h-[380px] space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                <Eye className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-base font-bold text-slate-800">Chưa Có Kết Quả Sàng Lọc</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bệnh nhân <strong className="text-slate-700">{activePatient.fullName || activePatient.mrn || 'này'}</strong> chưa có ca sàng lọc nào trong hệ thống.
                  Bác sĩ có thể tải lên ảnh chụp đáy mắt (Fundus) ở bảng bên trái để thực hiện phân tích và đánh giá nguy cơ vi mạch.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-Width Risk Assessment & Biomarkers Panel (ONLY when analysisResult exists) */}
      {analysisResult && <RiskAssessmentPanel result={analysisResult} />}

      {/* Doctor Audit Validation Bar & Sign-Off (ONLY when analysisResult exists) */}
      {analysisResult && (
        <ClinicalValidationBar
          analysisId={analysisResult.analysisId}
          onSaveFeedback={handleSaveFeedback}
        />
      )}

      {/* Modals */}
      {analysisResult && (
        <MedicalReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          patient={activePatient}
          result={analysisResult}
        />
      )}

      <ConsultationChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        currentUserRole="doctor"
        patientName={activePatient.fullName || 'Bệnh nhân'}
        patientMrn={activePatient.mrn || 'Chưa có MRN'}
        partnerUserId={activePatient.userId || activePatient.id}
      />
    </div>
  );
};
