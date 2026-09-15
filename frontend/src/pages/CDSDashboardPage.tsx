import React, { useState, useEffect, useCallback } from 'react';
import { PatientProfile, FundusAnalysisRequest, AIRiskResult, DoctorFeedback } from '../types/cds';
import { PatientUploader } from '../components/PatientUploader';
import { InteractiveCDSViewer } from '../components/InteractiveCDSViewer';
import { RiskAssessmentPanel } from '../components/RiskAssessmentPanel';
import { ClinicalValidationBar } from '../components/ClinicalValidationBar';
import { MedicalReportModal } from '../components/MedicalReportModal';
import { ConsultationChatModal } from '../components/ConsultationChatModal';
import { DoctorPatientListPage } from './DoctorPatientListPage';
import { DoctorRiskAnalyticsView } from '../features/doctor/DoctorRiskAnalyticsView';
import { DoctorReportsView } from '../features/doctor/DoctorReportsView';
import { DoctorConsultationView } from '../features/doctor/DoctorConsultationView';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  UserCheck,
  MessageSquare,
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
import { useAnalysisProgress } from '../hooks/useAnalysisProgress';

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
  const { user: currentUser } = useAuth();
  const { t, isVi } = useLanguage();
  const doctorDisplayName = currentUser?.name || (isVi ? 'Bác sĩ chuyên khoa' : 'Attending Specialist');

  const [assignedPatients, setAssignedPatients] = useState<DoctorPatientSummary[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activePatient, setActivePatient] = useState<PatientProfile | null>(null);
  const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(true);
  const [patientsError, setPatientsError] = useState<string | null>(null);

  // Medical analysis is empty until a successful backend response is received.
  const [analysisResult, setAnalysisResult] = useState<AIRiskResult | null>(null);
  const [isScreeningLoading, setIsScreeningLoading] = useState<boolean>(false);
  const {
    isAnalyzing,
    error: progressError,
    analysisProgress,
    startProgress,
    completeProgress,
    failProgress,
    resetProgress,
  } = useAnalysisProgress();
  const [analysisErrorMsg, setAnalysisErrorMsg] = useState<string | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [feedbackSuccessToast, setFeedbackSuccessToast] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string>('');

  const loadPatientDetails = useCallback(
    async (
      patientId: string,
      summaryFallback?: DoctorPatientSummary | PatientProfile | any,
      specificScreeningId?: string
    ) => {
      setAnalysisResult(null);
      setIsScreeningLoading(true);
      setAnalysisErrorMsg(null);

      // 1. Gán ngay thông tin bệnh nhân fallback vào activePatient để giao diện phản hồi tức thì
      if (summaryFallback) {
        setActivePatient({
          id: summaryFallback.userId || summaryFallback.id || summaryFallback.patientId || patientId,
          userId: summaryFallback.userId || summaryFallback.id || summaryFallback.patientId || patientId,
          mrn: summaryFallback.mrn || null,
          fullName: summaryFallback.fullName || null,
          email: summaryFallback.email || null,
          dateOfBirth: summaryFallback.dateOfBirth || null,
          gender: summaryFallback.gender || null,
          age: summaryFallback.age ?? null,
          phoneNumber: summaryFallback.phoneNumber || summaryFallback.phone || null,
          address: summaryFallback.address || null,
          bloodType: summaryFallback.bloodType || null,
          systolicBp: summaryFallback.systolicBp ?? null,
          diastolicBp: summaryFallback.diastolicBp ?? null,
          hba1c: summaryFallback.hba1c ?? null,
          hasDiabetes: summaryFallback.hasDiabetes ?? null,
          diabetesType: summaryFallback.diabetesType || null,
          diabetesDurationYears: summaryFallback.diabetesDurationYears ?? null,
          hasHypertension: summaryFallback.hasHypertension ?? null,
          historyOfSmoking: summaryFallback.historyOfSmoking ?? null,
          historyOfHeartDisease: summaryFallback.historyOfHeartDisease ?? null,
          historyOfStroke: summaryFallback.historyOfStroke ?? null,
          currentMedications: summaryFallback.currentMedications || null,
          allergies: summaryFallback.allergies || null,
          emergencyContactName: summaryFallback.emergencyContactName || null,
          emergencyContactPhone: summaryFallback.emergencyContactPhone || null,
          assignedDoctor: summaryFallback.assignedDoctor || doctorDisplayName,
        });
      }

      try {
        // 2. Tải hồ sơ bệnh nhân chính thức từ Backend (ưu tiên chi tiết lâm sàng đầy đủ)
        const effectiveId = patientId || summaryFallback?.userId || summaryFallback?.id || summaryFallback?.patientId;
        if (effectiveId) {
          try {
            const profileRes = await doctorApi.getPatientById(effectiveId);
            if (profileRes.success && profileRes.data) {
              const d = profileRes.data;
              const mapped: PatientProfile = {
                id: d.userId || d.id || effectiveId,
                userId: d.userId || d.id || effectiveId,
                mrn: d.mrn || summaryFallback?.mrn || null,
                fullName: d.fullName || summaryFallback?.fullName || null,
                email: d.email || summaryFallback?.email || null,
                dateOfBirth: d.dateOfBirth || summaryFallback?.dateOfBirth || null,
                age: d.age ?? summaryFallback?.age ?? null,
                gender: d.gender || summaryFallback?.gender || null,
                phoneNumber: d.phoneNumber || summaryFallback?.phoneNumber || summaryFallback?.phone || null,
                address: d.address || summaryFallback?.address || null,
                bloodType: d.bloodType || summaryFallback?.bloodType || null,
                systolicBp: d.systolicBp ?? summaryFallback?.systolicBp ?? null,
                diastolicBp: d.diastolicBp ?? summaryFallback?.diastolicBp ?? null,
                hba1c: d.hba1c ?? summaryFallback?.hba1c ?? null,
                hasDiabetes: d.hasDiabetes ?? summaryFallback?.hasDiabetes ?? null,
                diabetesType: d.diabetesType || summaryFallback?.diabetesType || null,
                diabetesDurationYears: d.diabetesDurationYears ?? summaryFallback?.diabetesDurationYears ?? null,
                hasHypertension: d.hasHypertension ?? summaryFallback?.hasHypertension ?? null,
                historyOfSmoking: d.historyOfSmoking ?? summaryFallback?.historyOfSmoking ?? null,
                historyOfHeartDisease: d.historyOfHeartDisease ?? summaryFallback?.historyOfHeartDisease ?? null,
                historyOfStroke: d.historyOfStroke ?? summaryFallback?.historyOfStroke ?? null,
                currentMedications: d.currentMedications || summaryFallback?.currentMedications || null,
                allergies: d.allergies || summaryFallback?.allergies || null,
                emergencyContactName: d.emergencyContactName || summaryFallback?.emergencyContactName || null,
                emergencyContactPhone: d.emergencyContactPhone || summaryFallback?.emergencyContactPhone || null,
                assignedDoctor: d.assignedDoctor || summaryFallback?.assignedDoctor || doctorDisplayName,
              };
              setActivePatient(mapped);
            }
          } catch (profileErr) {
            console.warn('Notice loading patient profile by ID:', profileErr);
          }
        }

        // 3. Tải lịch sử các ca sàng lọc của bệnh nhân
        if (effectiveId) {
          try {
            const screeningsRes = await doctorApi.getPatientScreenings(effectiveId);
            if (screeningsRes.success && Array.isArray(screeningsRes.data) && screeningsRes.data.length > 0) {
              const targetScreening = specificScreeningId
                ? screeningsRes.data.find((s: any) => String(s.id) === String(specificScreeningId)) || screeningsRes.data[0]
                : screeningsRes.data[0];
              setAnalysisResult(mapScreeningToAIRiskResult(targetScreening, targetScreening.imageUrl));
            } else {
              setAnalysisResult(null);
            }
          } catch (screeningErr) {
            console.warn('Notice loading screenings for patient:', screeningErr);
            setAnalysisResult(null);
          }
        } else {
          setAnalysisResult(null);
        }
      } catch (err) {
        console.warn('Error in loadPatientDetails flow:', err);
        setAnalysisResult(null);
      } finally {
        setIsScreeningLoading(false);
      }
    },
    [doctorDisplayName]
  );

  const fetchAssignedPatients = useCallback(async () => {
    setIsLoadingPatients(true);
    setPatientsError(null);
    try {
      const res = await doctorApi.getAssignedPatients();
      let patientList: any[] = [];
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          patientList = res.data;
        } else if (Array.isArray((res.data as any).items)) {
          patientList = (res.data as any).items;
        } else if (Array.isArray((res.data as any).content)) {
          patientList = (res.data as any).content;
        }
      }

      if (res.success) {
        setAssignedPatients(patientList);
        if (patientList.length > 0) {
          const first = patientList[0];
          const pid = first.patientId || first.userId || first.id;
          setSelectedPatientId(pid);
          await loadPatientDetails(pid, first);
        } else {
          setSelectedPatientId(null);
          setActivePatient(null);
          setAnalysisResult(null);
        }
      } else {
        setPatientsError(
          res.message ||
            (isVi
              ? 'Không thể tải danh sách bệnh nhân được phân công.'
              : 'Failed to load assigned patient list.')
        );
      }
    } catch (err) {
      setPatientsError(
        err instanceof Error
          ? err.message
          : (isVi ? 'Lỗi kết nối máy chủ phân công.' : 'Assignment server connection error.')
      );
    } finally {
      setIsLoadingPatients(false);
    }
  }, [loadPatientDetails, isVi]);

  useEffect(() => {
    fetchAssignedPatients();
  }, [fetchAssignedPatients]);

  const handleSelectPatientForCDS = useCallback(
    async (
      patientId: string,
      screeningId?: string,
      directPatient?: DoctorPatientSummary | PatientProfile | any
    ) => {
      setSelectedPatientId(patientId);
      const summaryFallback =
        directPatient ||
        assignedPatients.find(
          (p) =>
            String(p.patientId) === String(patientId) ||
            String((p as any).id) === String(patientId) ||
            String((p as any).userId) === String(patientId)
        );
      await loadPatientDetails(patientId, summaryFallback, screeningId);
      onNavigate?.('cds-viewer');
    },
    [assignedPatients, loadPatientDetails, onNavigate]
  );

  const handleStartAnalysis = async (
    request: FundusAnalysisRequest & {
      eye?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
    },
  ) => {
    const targetPatientId = selectedPatientId || activePatient?.userId || activePatient?.id;
    if (!targetPatientId || !activePatient) {
      setAnalysisErrorMsg(
        t(
          'doctor.cds.selectPatientFirst',
          'Vui lòng chọn một bệnh nhân được phân công trước khi tải ảnh.'
        )
      );
      return;
    }

    startProgress();
    setAnalysisErrorMsg(null);

    try {
      // Call doctor-specific screening endpoint
      const res = await doctorApi.createScreeningForPatient(targetPatientId, {
        imageUrl: request.imageUrl,
        eyePosition: request.eyePosition || request.eye || 'Right_OD',
        eye: request.eye || request.eyePosition || 'Right_OD',
        scanType: request.scanType || 'Fundus_Macula',
        fileName: request.fileName || request.imageName || 'fundus_scan.png',
        fileSize: request.fileSize,
        mimeType: request.mimeType || 'image/png',
      });

      if (!res.success || !res.data || res.data.status === 'FAILED') {
        throw new Error(
          (res.data?.status === 'FAILED' && res.data?.findings)
            ? res.data.findings
            : (res.message || (isVi ? 'Máy chủ AI không thể phân tích ảnh hoặc đang ngoại tuyến. Vui lòng thử lại sau.' : 'AI engine could not analyze image or is offline. Please retry later.'))
        );
      }

      const mapped = mapScreeningToAIRiskResult(res.data, request.imageUrl);

      completeProgress(async () => {
        setAnalysisResult(mapped);

        // Refresh screening count in assigned patients list silently
        doctorApi.getAssignedPatients().then((r) => {
          if (r.success && Array.isArray(r.data)) {
            setAssignedPatients(r.data);
          }
        });
      });
    } catch (err) {
      console.error('Doctor screening upload error:', err);
      const errMsg =
        err instanceof Error
          ? err.message
          : (isVi ? 'Không thể kết nối đến máy chủ phân tích. Vui lòng thử lại.' : 'Failed to connect to analysis server. Please retry.');
      failProgress(errMsg);
      setAnalysisErrorMsg(errMsg);
    }
  };

  const handleSaveFeedback = async (feedback: DoctorFeedback) => {
    try {
      if (feedback.analysisId) {
        await screeningApi.doctorReview(feedback.analysisId, {
          decision: feedback.decision,
          doctorNotes: feedback.clinicalNotes || (isVi ? 'Bác sĩ đã xác nhận kết quả chẩn đoán' : 'Doctor confirmed diagnosis'),
          adjustedCardioRisk: toApiRiskLevel(feedback.adjustedCardioRisk),
          adjustedDrRisk: toApiRiskLevel(feedback.adjustedDrRisk),
          icd10Codes: feedback.icd10Codes,
        });
      }

      setFeedbackSuccessMsg(
        t(
          'doctor.cds.feedbackSuccess',
          'Đã lưu đánh giá chuyên môn và cập nhật hồ sơ sàng lọc của bệnh nhân'
        )
      );
      setFeedbackSuccessToast(true);
      setTimeout(() => setFeedbackSuccessToast(false), 3500);
    } catch (err) {
      console.warn('Feedback submission error:', err);
    }
  };

  // 1. Phân hệ Danh sách bệnh nhân
  if (activeSection === 'patient-list') {
    return (
      <DoctorPatientListPage
        onSelectPatientForCDS={(patient) => {
          const pid = patient.userId || patient.id;
          if (pid) {
            handleSelectPatientForCDS(pid, undefined, patient);
          } else {
            setActivePatient(patient);
            onNavigate?.('cds-viewer');
          }
        }}
        onNavigate={onNavigate}
      />
    );
  }

  // 2. Phân hệ Thống kê nguy cơ lâm sàng & hiệu suất (FR-21)
  if (activeSection === 'risk-analytics') {
    return (
      <DoctorRiskAnalyticsView
        assignedPatients={assignedPatients}
        onSelectPatientForCDS={(pid, sid, pt) => handleSelectPatientForCDS(pid, sid, pt)}
        onNavigate={onNavigate}
      />
    );
  }

  // 3. Phân hệ Báo cáo y khoa & Ký duyệt chẩn đoán (FR-15, FR-16)
  if (activeSection === 'reports') {
    return (
      <DoctorReportsView
        assignedPatients={assignedPatients}
        onReviewAndSign={(pid, sid, pt) => handleSelectPatientForCDS(pid, sid, pt)}
        doctorName={doctorDisplayName}
      />
    );
  }

  // 4. Phân hệ Trao đổi trực tuyến với bệnh nhân qua chat tư vấn (FR-20)
  if (activeSection === 'consultation') {
    return (
      <DoctorConsultationView
        assignedPatients={assignedPatients}
        initialSelectedPatientId={selectedPatientId}
        currentUserId={currentUser?.id}
        doctorName={doctorDisplayName}
        onSelectPatientForCDS={(patientId, pt) => {
          handleSelectPatientForCDS(patientId, undefined, pt);
        }}
      />
    );
  }

  // 5. Màn hình Bàn chẩn đoán ảnh CDS (Mặc định: 'cds-viewer')
  if (isLoadingPatients) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-[#0891B2] animate-spin" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800">{t('doctor.cds.loading', 'Đang nạp dữ liệu Bác sĩ...')}</h3>
          <p className="text-xs text-slate-500">{t('doctor.cds.syncing', 'Đang đồng bộ danh sách bệnh nhân được phân công từ hệ thống.')}</p>
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
            <h3 className="text-base font-bold text-slate-900">{t('doctor.cds.noAssignedTitle', 'Chưa có Bệnh nhân được phân công')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t(
                'doctor.cds.noAssignedDesc',
                'Tài khoản bác sĩ hiện tại chưa được Cơ sở y tế hoặc Admin phân công tiếp nhận bệnh nhân nào.'
              )}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onNavigate?.('patient-list')}
              className="px-4 py-2 bg-[#0891B2] hover:bg-[#0E7490] text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>{t('doctor.cds.viewPatientList', 'Xem Danh Sách Bệnh Nhân')}</span>
            </button>
            <button
              onClick={fetchAssignedPatients}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t('doctor.cds.reload', 'Tải lại')}</span>
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
            <h4 className="text-xs font-bold text-slate-900">{t('doctor.cds.screeningNotice', 'Thông Báo Sàng Lọc')}</h4>
            <p className="text-xs text-slate-600 leading-snug">{analysisErrorMsg}</p>
          </div>
          <button
            onClick={() => setAnalysisErrorMsg(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Patient Selection Bar & Clinical Header */}
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-4 sm:p-5 shadow-medical-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-[#F0FDFA] text-[#0891B2] border border-[#CCFBF1] flex items-center justify-center font-bold shrink-0 shadow-xs">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-[#134E4A] truncate">
                {activePatient.fullName || (isVi ? 'Chưa cập nhật tên' : 'Unnamed')}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 text-[#0891B2] font-semibold font-mono-data border border-cyan-200 shrink-0">
                {activePatient.mrn || (isVi ? 'Chưa có MRN' : 'No MRN')}
              </span>
              <span className="text-xs text-slate-500 font-medium shrink-0">
                ({activePatient.age ? `${activePatient.age} ${t('doctor.cds.yearsOld', 'tuổi')}` : (isVi ? 'Chưa cập nhật tuổi' : 'Age not recorded')} •{' '}
                {activePatient.gender === 'Female' ? t('common.gender.female', 'Nữ') : activePatient.gender === 'Male' ? t('common.gender.male', 'Nam') : (isVi ? 'Chưa cập nhật' : 'Unrecorded')})
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                {t('doctor.cds.bloodPressure', 'Huyết áp')}:{' '}
                <strong className="text-slate-800 font-mono-data">
                  {activePatient.systolicBp && activePatient.diastolicBp
                    ? `${activePatient.systolicBp}/${activePatient.diastolicBp} mmHg`
                    : t('doctor.cds.notMeasured', 'Chưa đo')}
                </strong>
              </span>
              <span>
                {t('doctor.cds.hba1c', 'HbA1c')}:{' '}
                <strong className="text-slate-800 font-mono-data">
                  {activePatient.hba1c ? `${activePatient.hba1c}%` : t('doctor.cds.notTested', 'Chưa xét nghiệm')}
                </strong>
              </span>
              <span className="text-teal-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" /> {t('doctor.cds.attendingDoctor', 'Bác sĩ phụ trách')}: {doctorDisplayName}
              </span>
            </div>
          </div>
        </div>

        {/* Patient Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 self-stretch sm:self-auto justify-end">
          <button
            onClick={() => onNavigate?.('patient-list')}
            className="px-3.5 py-2 bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0891B2] font-bold rounded-xl text-xs border border-[#CCFBF1] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Users className="w-4 h-4" />
            <span>{t('doctor.cds.switchPatient', isVi ? 'Đổi BN' : 'Switch')}</span>
          </button>
          <button
            onClick={() => setIsChatModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4 text-[#0891B2]" />
            <span>{t('doctor.cds.message', isVi ? 'Nhắn Tin' : 'Message')}</span>
          </button>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-[#0891B2] to-[#0E7490] hover:from-[#0E7490] hover:to-[#0891B2] text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>{t('doctor.cds.printResult', isVi ? 'In Kết Quả' : 'Print Report')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Uploader Workspace (5 cols) & Right CDS Viewer / Empty State (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Uploader Workspace (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <PatientUploader
            key={activePatient.id || activePatient.userId || activePatient.mrn || 'default-patient'}
            activePatient={activePatient}
            onStartAnalysis={handleStartAnalysis}
            isAnalyzing={isAnalyzing}
            analysisProgress={analysisProgress}
            analysisError={analysisErrorMsg || progressError}
            onRetry={() => {
              resetProgress();
              setAnalysisErrorMsg(null);
            }}
          />
        </div>

        {/* Right Column: Interactive Side-by-Side CDS Viewer OR Clean Empty State (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {isScreeningLoading ? (
            <div className="bg-white border border-[#CCFBF1] rounded-2xl p-8 shadow-medical-sm text-center flex flex-col items-center justify-center min-h-[380px] space-y-3">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">{t('doctor.cds.loadingScreeningHistory', isVi ? 'Đang tải ca sàng lọc của bệnh nhân...' : 'Loading patient screening...')}</p>
            </div>
          ) : analysisResult ? (
            <InteractiveCDSViewer
              analysisResult={analysisResult}
              selectedEye={
                analysisResult.eyePosition === 'Left_OS' || analysisResult.eyePosition === 'OS'
                  ? (isVi ? 'OS (Mắt Trái)' : 'OS (Left Eye)')
                  : (isVi ? 'OD (Mắt Phải)' : 'OD (Right Eye)')
              }
            />
          ) : (
            <div className="bg-white border border-[#CCFBF1] rounded-2xl p-8 shadow-medical-sm text-center flex flex-col items-center justify-center min-h-[380px] space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                <Eye className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-sm font-bold text-slate-800">{t('doctor.cds.noResultsYet', isVi ? 'Chưa Có Kết Quả Sàng Lọc' : 'No Screening Results')}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isVi
                    ? `Bệnh nhân ${activePatient.fullName || activePatient.mrn || ''} chưa có ca khám. Tải ảnh ở cột bên trái để phân tích AI.`
                    : `No screening records for patient ${activePatient.fullName || activePatient.mrn || ''}. Upload fundus scan on the left.`}
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
          doctorName={doctorDisplayName}
        />
      )}

      <ConsultationChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        currentUserRole="doctor"
        patientName={activePatient.fullName || (isVi ? 'Bệnh nhân' : 'Patient')}
        patientMrn={activePatient.mrn || (isVi ? 'Chưa có MRN' : 'No MRN')}
        doctorName={doctorDisplayName}
        partnerUserId={activePatient.userId || activePatient.id}
        currentUserId={currentUser?.id}
      />
    </div>
  );
};
