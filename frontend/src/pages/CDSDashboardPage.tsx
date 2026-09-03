import React, { useState, useEffect, useCallback } from 'react';
import { PatientProfile, FundusAnalysisRequest, AIRiskResult, DoctorFeedback } from '../types/cds';
import { PatientUploader } from '../components/PatientUploader';
import { InteractiveCDSViewer } from '../components/InteractiveCDSViewer';
import { RiskAssessmentPanel } from '../components/RiskAssessmentPanel';
import { ClinicalValidationBar } from '../components/ClinicalValidationBar';
import { MedicalReportModal } from '../components/MedicalReportModal';
import { ConsultationChatModal } from '../components/ConsultationChatModal';
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
  FileSpreadsheet,
} from 'lucide-react';
import { feedbackApi, doctorApi, screeningApi } from '../services/api';
import { mapScreeningToAIRiskResult } from '../services/screeningMapper';
import { MockAIService } from '../services/mockAiEngine';

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

export const CDSDashboardPage: React.FC = () => {
  const [assignedPatients, setAssignedPatients] = useState<DoctorPatientSummary[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activePatient, setActivePatient] = useState<PatientProfile | null>(null);
  const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(true);
  const [patientsError, setPatientsError] = useState<string | null>(null);

  // BUG 1 & 3 FIX: Initial state is null, NEVER MOCK_SAMPLE_RESULT
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
    // RESET analysisResult immediately when starting to switch patient
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
        // Explicitly set null if no screenings exist for this patient
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

  // BUG 2 FIX: Upload screening specifically for active assigned patient via POST /doctor/patients/{patientId}/screenings
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
        // Assert data integrity: patientId in response must match selectedPatientId
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

      // Explicit Mock AI only if explicit dev environment flag is set
      const enableMockAi = import.meta.env.VITE_ENABLE_MOCK_AI === 'true';
      if (enableMockAi) {
        console.warn('VITE_ENABLE_MOCK_AI is enabled. Falling back to local mock AI engine.');
        const result = await MockAIService.runFundusAnalysis(request, (status, percent) => {
          setAnalysisProgress({ status, percent });
        });
        setAnalysisResult(result);
        return;
      }

      // Production behavior: Fail cleanly without fake data
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
          feedback.clinicalNotes || 'Bác sĩ đã xác nhận kết quả chẩn đoán',
          feedback.adjustedCardioRisk || 'HIGH'
        );
      }

      await feedbackApi.submit({
        screeningId: feedback.analysisId || '00000000-0000-0000-0000-000000000000',
        clinicalDecision: feedback.decision || 'APPROVED',
        doctorNotes: feedback.clinicalNotes || 'Bác sĩ đã xác nhận kết quả chẩn đoán',
        correctRiskLevel: feedback.adjustedCardioRisk || 'HIGH',
        eligibleForRetraining: true,
      });

      setFeedbackSuccessMsg('Đã lưu đánh giá chuyên môn và cập nhật hồ sơ sàng lọc của bệnh nhân');
      setFeedbackSuccessToast(true);
      setTimeout(() => setFeedbackSuccessToast(false), 5000);
    } catch (err) {
      console.warn('Feedback submission error:', err);
    }
  };

  // 1. LOADING STATE
  if (isLoadingPatients) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-[#CCFBF1] rounded-3xl p-10 shadow-medical-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 animate-spin">
          <Loader2 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800">Đang tải danh sách bệnh nhân phân công</h3>
          <p className="text-xs text-slate-500">Hệ thống đang truy xuất hồ sơ y tế bệnh nhân thuộc quyền quản lý của Bác sĩ...</p>
        </div>
      </div>
    );
  }

  // 2. ERROR STATE
  if (patientsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] bg-white border-2 border-red-200 rounded-3xl p-8 shadow-medical-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="text-sm font-bold text-red-900">Không Thể Tải Danh Sách Bệnh Nhân</h3>
          <p className="text-xs text-slate-600">{patientsError}</p>
        </div>
        <button
          onClick={fetchAssignedPatients}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Thử Lại
        </button>
      </div>
    );
  }

  // 3. EMPTY STATE (No patients assigned)
  if (assignedPatients.length === 0 || !activePatient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] bg-white border border-[#CCFBF1] rounded-3xl p-10 shadow-medical-sm text-center space-y-5">
        <div className="w-20 h-20 rounded-3xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-inner">
          <Users className="w-10 h-10" />
        </div>
        <div className="space-y-2 max-w-lg">
          <h3 className="text-lg font-bold text-slate-900">Chưa Có Bệnh Nhân Được Phân Công</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tài khoản Bác sĩ của bạn hiện chưa được phân công quản lý bệnh nhân nào trong hệ thống AURA.
            Theo quy định bảo mật RBAC, Bác sĩ chỉ có quyền truy cập hồ sơ và ca khám của các bệnh nhân đã được phân công tiếp nhận.
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-500 text-left space-y-1 mt-3">
            <p className="font-semibold text-slate-700">📌 Hướng dẫn kích hoạt phân công:</p>
            <p>1. Liên hệ Quản trị viên (Admin) hoặc Lễ tân phòng khám để tiếp nhận danh sách chỉ định.</p>
            <p>2. Khi bệnh nhân đặt lịch hoặc được phân luồng, danh sách sẽ tự động hiển thị tại đây.</p>
          </div>
        </div>
        <button
          onClick={fetchAssignedPatients}
          className="px-5 py-2.5 bg-[#0891B2] hover:bg-[#0e7490] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
          Làm Mới Danh Sách Phân Công
        </button>
      </div>
    );
  }

  // 4. MAIN ASSIGNED PATIENT CDS WORKSPACE
  return (
    <div className="space-y-6">
      {/* Toast feedback success */}
      {feedbackSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 flex-shrink-0" />
          <span>{feedbackSuccessMsg}</span>
        </div>
      )}

      {analysisErrorMsg && (
        <div className="bg-white border-2 border-red-500 rounded-2xl p-4 shadow-md flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-100 text-red-700">
            <AlertTriangle className="w-5 h-5" />
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
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 text-[#0891B2] font-semibold font-mono-data">
                {activePatient.mrn || 'Chưa có MRN'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({activePatient.age ? `${activePatient.age} tuổi` : 'Chưa cập nhật tuổi'} • {activePatient.gender === 'Female' ? 'Nữ' : activePatient.gender === 'Male' ? 'Nam' : activePatient.gender || 'Chưa cập nhật'})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Huyết áp: <strong className="text-slate-800 font-mono-data">{activePatient.systolicBp && activePatient.diastolicBp ? `${activePatient.systolicBp}/${activePatient.diastolicBp} mmHg` : 'Chưa đo'}</strong> | HbA1c: <strong className="text-slate-800 font-mono-data">{activePatient.hba1c ? `${activePatient.hba1c}%` : 'Chưa xét nghiệm'}</strong> | Tiền sử: {activePatient.hasDiabetes === true ? 'Đái tháo đường' : activePatient.hasDiabetes === false ? 'Không ĐTĐ' : 'Chưa cập nhật'}
            </p>
          </div>
        </div>

        {/* Action Controls & Patient Switcher */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsChatModalOpen(true)}
            className="px-3 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-cyan-200"
          >
            <MessageSquare className="w-4 h-4 text-cyan-700" />
            Tư Vấn Bệnh Nhân
          </button>

          {analysisResult && (
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-emerald-200"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              Xuất Phiếu Khám PDF
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold hidden xl:block">Bệnh nhân phân công:</span>
            <select
              value={selectedPatientId || ''}
              onChange={(e) => handlePatientSelectChange(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#0891B2]"
            >
              {assignedPatients.map((p) => (
                <option key={p.patientId} value={p.patientId}>
                  {p.fullName || 'Bệnh nhân'} ({p.mrn || 'Chưa có MRN'}) — {p.age ? `${p.age}t` : 'N/A'} ({p.screeningCount} ca khám)
                </option>
              ))}
            </select>
            <button
              onClick={fetchAssignedPatients}
              title="Làm mới danh sách"
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
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
      />
    </div>
  );
};