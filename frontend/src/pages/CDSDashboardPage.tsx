import React, { useState, useEffect, useCallback } from 'react';
import { PatientProfile, FundusAnalysisRequest, AIRiskResult, DoctorFeedback } from '../types/cds';
import { PatientUploader } from '../components/PatientUploader';
import { InteractiveCDSViewer } from '../components/InteractiveCDSViewer';
import { RiskAssessmentPanel } from '../components/RiskAssessmentPanel';
import { ClinicalValidationBar } from '../components/ClinicalValidationBar';
import { MedicalReportModal } from '../components/MedicalReportModal';
import { MedicalProfileModal } from '../components/MedicalProfileModal';
import { ConsultationChatModal } from '../components/ConsultationChatModal';
import { DoctorPatientListPage } from './DoctorPatientListPage';
import { DoctorRiskAnalyticsView } from '../features/doctor/DoctorRiskAnalyticsView';
import { DoctorReportsView } from '../features/doctor/DoctorReportsView';
import { DoctorConsultationView } from '../features/doctor/DoctorConsultationView';
import { DoctorDashboardView } from '../features/doctor/DoctorDashboardView';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';
import { pageTransitionVariants } from '../utils/motion';
import { useAuraReducedMotion } from '../hooks/useAuraReducedMotion';
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
  UploadCloud,
} from 'lucide-react';
import { doctorApi, screeningApi } from '../services/api';
import { mapScreeningToAIRiskResult } from '../services/screeningMapper';
import { useAnalysisProgress } from '../hooks/useAnalysisProgress';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { realtimeBus } from '../services/realtimeService';
import { stompClient } from '../services/websocketService';

const toApiRiskLevel = (riskLevel: string | undefined) => {
  if (!riskLevel) return undefined;
  return riskLevel === 'Severe' ? 'CRITICAL' : riskLevel.toUpperCase();
};

export interface DoctorPatientSummary {
  id?: string;
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
  initialPatient?: PatientProfile | null;
  initialLoading?: boolean;
}

export const CDSDashboardPage: React.FC<CDSDashboardPageProps> = ({
  activeSection = 'cds-viewer',
  onNavigate,
  initialPatient = null,
  initialLoading,
}) => {
  const { user: currentUser } = useAuth();
  const { t, isVi } = useLanguage();
  const prefersReducedMotion = useAuraReducedMotion();
  const doctorDisplayName = currentUser?.name || (isVi ? 'Bác sĩ chuyên khoa' : 'Attending Specialist');

  const [assignedPatients, setAssignedPatients] = useState<DoctorPatientSummary[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(initialPatient?.id || initialPatient?.userId || null);
  const [activePatient, setActivePatient] = useState<PatientProfile | null>(initialPatient);
  const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(initialLoading ?? (initialPatient ? false : true));
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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isNewScanOpen, setIsNewScanOpen] = useState(false);
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
      setIsNewScanOpen(false);

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
        const effectiveId = patientId || summaryFallback?.userId || summaryFallback?.id || summaryFallback?.patientId;
        if (effectiveId) {
          const [profileResult, screeningsResult] = await Promise.allSettled([
            doctorApi.getPatientById(effectiveId),
            doctorApi.getPatientScreenings(effectiveId),
          ]);

          // Process profile response
          if (profileResult.status === 'fulfilled' && profileResult.value.success && profileResult.value.data) {
            const d = profileResult.value.data;
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

          // Process screenings response
          if (screeningsResult.status === 'fulfilled' && screeningsResult.value.success && Array.isArray(screeningsResult.value.data) && screeningsResult.value.data.length > 0) {
            const targetScreening = specificScreeningId
              ? screeningsResult.value.data.find((s: any) => String(s.id) === String(specificScreeningId)) || screeningsResult.value.data[0]
              : screeningsResult.value.data[0];
            setAnalysisResult(mapScreeningToAIRiskResult(targetScreening, targetScreening.imageUrl));
          } else {
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

  // Universal Real-time State Synchronization for Doctor Portal (FR-15, FR-20, FR-21, Flow 1)
  useRealtimeSync(
    [
      'screening:created',
      'screening:completed',
      'screening:new',
      'screening:reviewed',
      'screening:deleted',
      'screening:update',
      'SCAN_UPLOADED',
      'doctor:assignment',
      'profile:update',
      'batch:created',
      'batch:update',
    ],
    async () => {
      await fetchAssignedPatients();
      if (selectedPatientId) {
        await loadPatientDetails(selectedPatientId, activePatient);
      }
    },
    { pollIntervalMs: 12000, syncOnFocus: true }
  );

  // STOMP WebSocket push subscription for doctor notifications & worklist updates
  useEffect(() => {
    if (!currentUser?.id) return;
    stompClient.connect();
    const unsubNotif = stompClient.subscribe(`/topic/notifications.${currentUser.id}`, (payload: any) => {
      realtimeBus.handleIncomingPayload(payload, 'websocket');
    });
    return () => {
      unsubNotif();
    };
  }, [currentUser?.id]);

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

    setIsNewScanOpen(false);
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

        // Broadcast to patient portal and worklist in real time
        realtimeBus.emit('screening:new', mapped);

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

        // Broadcast review event in real time to patient and analytics
        realtimeBus.emit('screening:reviewed', feedback);
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

  // 0. Phân hệ Bảng điều khiển Bác sĩ (Doctor Dashboard - Requirement R4)
  if (activeSection === 'dashboard') {
    return (
      <motion.div
        key="doctor-dashboard"
        custom={prefersReducedMotion}
        variants={pageTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <DoctorDashboardView
          assignedPatients={assignedPatients}
          onSelectPatientForCDS={(pid, sid, pt) => handleSelectPatientForCDS(pid, sid, pt)}
          onNavigate={onNavigate}
          doctorName={doctorDisplayName}
          loading={isLoadingPatients}
          onRefresh={fetchAssignedPatients}
        />
      </motion.div>
    );
  }

  // 1. Phân hệ Danh sách bệnh nhân
  if (activeSection === 'patient-list') {
    return (
      <motion.div
        key="doctor-patient-list"
        custom={prefersReducedMotion}
        variants={pageTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
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
      </motion.div>
    );
  }

  // 2. Phân hệ Thống kê nguy cơ lâm sàng & hiệu suất (FR-21)
  if (activeSection === 'risk-analytics') {
    return (
      <motion.div
        key="doctor-risk-analytics"
        custom={prefersReducedMotion}
        variants={pageTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <DoctorRiskAnalyticsView
          assignedPatients={assignedPatients}
          onSelectPatientForCDS={(pid, sid, pt) => handleSelectPatientForCDS(pid, sid, pt)}
          onNavigate={onNavigate}
        />
      </motion.div>
    );
  }

  // 3. Phân hệ Báo cáo y khoa & Ký duyệt chẩn đoán (FR-15, FR-16)
  if (activeSection === 'reports') {
    return (
      <motion.div
        key="doctor-reports"
        custom={prefersReducedMotion}
        variants={pageTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <DoctorReportsView
          assignedPatients={assignedPatients}
          onReviewAndSign={(pid, sid, pt) => handleSelectPatientForCDS(pid, sid, pt)}
          doctorName={doctorDisplayName}
        />
      </motion.div>
    );
  }

  // 4. Phân hệ Trao đổi trực tuyến với bệnh nhân qua chat tư vấn (FR-20)
  if (activeSection === 'consultation') {
    return (
      <motion.div
        key="doctor-consultation"
        custom={prefersReducedMotion}
        variants={pageTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <DoctorConsultationView
          assignedPatients={assignedPatients}
          initialSelectedPatientId={selectedPatientId}
          currentUserId={currentUser?.id}
          doctorName={doctorDisplayName}
          onSelectPatientForCDS={(patientId, pt) => {
            handleSelectPatientForCDS(patientId, undefined, pt);
          }}
        />
      </motion.div>
    );
  }

  // 5. Hồ sơ bác sĩ (Doctor Medical Profile - FR-8)
  if (activeSection === 'medical-profile') {
    return (
      <motion.div
        key="doctor-medical-profile"
        custom={prefersReducedMotion}
        variants={pageTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-700">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {isVi ? 'Hồ Sơ Bác Sĩ' : 'Doctor Profile'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isVi ? 'Thông tin tài khoản chuyên khoa của bạn' : 'Your specialist account information'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Avatar & Name */}
              <div className="md:col-span-2 flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold shrink-0">
                  {(currentUser?.name || 'BS')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{currentUser?.name || (isVi ? 'Bác sĩ chuyên khoa' : 'Doctor')}</h3>
                  <p className="text-sm text-slate-500">{currentUser?.roleTitle || (isVi ? 'Bác sĩ' : 'Doctor')}</p>
                  {currentUser?.organization && (
                    <p className="text-xs text-slate-400 mt-0.5">{currentUser.organization}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isVi ? 'Địa chỉ Email' : 'Email Address'}</p>
                <p className="text-sm font-bold text-slate-800 break-all">{currentUser?.email || '—'}</p>
              </div>

              {/* Role */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isVi ? 'Vai trò hệ thống' : 'System Role'}</p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isVi ? 'Bác sĩ chuyên khoa' : 'Specialist Doctor'}
                  </span>
                </div>
              </div>

              {/* ID */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isVi ? 'Mã Bác sĩ (ID)' : 'Doctor ID'}</p>
                <p className="text-xs font-mono text-slate-600 break-all">{currentUser?.id || '—'}</p>
              </div>

              {/* Patients assigned */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isVi ? 'Bệnh nhân được phân công' : 'Assigned Patients'}</p>
                <p className="text-sm font-bold text-slate-800">{assignedPatients.length} {isVi ? 'bệnh nhân' : 'patients'}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 6. Màn hình Bàn chẩn đoán ảnh CDS (Mặc định: 'cds-viewer')
  if (isLoadingPatients) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-[#3478F6] animate-spin" />
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
              className="px-4 py-2 bg-[#3478F6] hover:bg-[#2563EB] text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
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
    <motion.div
      key="cds-viewer-main"
      custom={prefersReducedMotion}
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-4"
    >
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

      {/* Top Header Bar */}
      <div className="bg-white border border-[#EAECF0] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE] flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                onClick={() => setIsProfileModalOpen(true)}
                className="text-base font-bold text-slate-900 truncate hover:text-[#3478F6] hover:underline cursor-pointer"
                title={isVi ? 'Xem hồ sơ bệnh nhân' : 'View patient profile'}
              >
                {activePatient.fullName || (isVi ? 'Chưa cập nhật tên' : 'Unnamed')}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-[#EEF5FF] text-[#3478F6] font-semibold font-mono-data border border-[#C7D7FE]">
                {activePatient.mrn || 'Chưa có MRN'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({activePatient.age ? `${activePatient.age} ${t('doctor.cds.yearsOld', 'tuổi')}` : 'Chưa cập nhật tuổi'} •{' '}
                {activePatient.gender === 'Female' ? t('common.gender.female', 'Nữ') : t('common.gender.male', 'Nam')})
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3">
              <span>
                {t('doctor.cds.bloodPressure', 'Huyết áp')}:{' '}
                <strong className="text-slate-800 font-mono-data">
                  {activePatient.systolicBp && activePatient.diastolicBp
                    ? `${activePatient.systolicBp}/${activePatient.diastolicBp} mmHg`
                    : 'Chưa đo'}
                </strong>
              </span>
              <span>
                {t('doctor.cds.hba1c', 'HbA1c')}:{' '}
                <strong className="text-slate-800 font-mono-data">
                  {activePatient.hba1c ? `${activePatient.hba1c}%` : 'Chưa đo'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="px-3 py-1.5 bg-[#F5F6F8] hover:bg-[#EAECF0] text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-[#EAECF0]"
            title={isVi ? 'Xem hồ sơ bệnh nhân' : 'View patient profile'}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#3478F6]" />
            <span>{isVi ? 'Hồ Sơ' : 'Profile'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsNewScanOpen(!isNewScanOpen)}
            className={`px-3 py-1.5 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border ${
              isNewScanOpen
                ? 'bg-slate-800 hover:bg-slate-900 text-white border-slate-700'
                : 'bg-white hover:bg-slate-50 text-[#3478F6] border-[#3478F6]/40 hover:border-[#3478F6]'
            }`}
            data-testid="cds-new-scan-btn"
            title={isVi ? 'Kích hoạt tải ảnh mới cho bệnh nhân này' : 'Upload new scan for this patient'}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{isNewScanOpen ? (isVi ? 'Đóng Tải Ảnh' : 'Close Upload') : (isVi ? 'Tải Ảnh Mới' : 'New Scan')}</span>
          </button>
          <button
            onClick={() => setIsChatModalOpen(true)}
            className="px-3 py-1.5 bg-[#F5F6F8] hover:bg-[#EAECF0] text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-[#EAECF0]"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#3478F6]" />
            <span>{isVi ? 'Nhắn Tin' : 'Message'}</span>
          </button>
          <button
            onClick={() => setIsReportModalOpen(true)}
            disabled={!analysisResult}
            className="px-3 py-1.5 bg-[#3478F6] hover:bg-[#2563EB] text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isVi ? 'In Phiếu' : 'Report'}</span>
          </button>
        </div>
      </div>

      {/* 3-COLUMN CLINICAL REVIEW WORKSPACE (Requirement R4) */}
      <div className="flex flex-col xl:flex-row gap-5 items-start">
        {/* ===================================================================
            CỘT TRÁI (260-300px, 280px): DANH SÁCH BỆNH NHÂN (PATIENT QUEUE)
        =================================================================== */}
        <div className="w-full xl:w-[260px] 2xl:w-[280px] shrink-0 space-y-3">
          <div className="bg-white rounded-2xl border border-[#EAECF0] p-3.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#3478F6]" />
                {isVi ? 'Danh Sách Bệnh Nhân' : 'Patient Queue'}
              </span>
              <span className="text-[11px] font-mono-data font-bold text-[#3478F6] bg-[#EEF5FF] px-2 py-0.5 rounded-full border border-[#C7D7FE]">
                {assignedPatients.length}
              </span>
            </div>

            {/* Patient Cards List */}
            <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {assignedPatients.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  {isVi ? 'Chưa có bệnh nhân nào' : 'No patients found'}
                </div>
              ) : (
                assignedPatients.map((p) => {
                  const isSelected =
                    String(p.patientId) === String(activePatient.id) ||
                    String(p.patientId) === String(activePatient.userId) ||
                    String(p.mrn) === String(activePatient.mrn);

                  return (
                    <motion.div
                      key={p.patientId}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ duration: 0.12 }}
                      onClick={() => handleSelectPatientForCDS(p.patientId, undefined, p)}
                      className={`p-3 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'border-[#3478F6] bg-[#EEF5FF]/40 shadow-xs ring-1 ring-[#3478F6]'
                          : 'border-[#EAECF0] bg-white hover:border-[#D0D5DD] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {p.fullName || (isVi ? 'Bệnh nhân' : 'Patient')}
                        </h4>
                        <span className="text-[10px] font-mono-data font-bold text-[#3478F6] bg-[#EEF5FF] px-1.5 py-0.5 rounded border border-[#C7D7FE]">
                          {p.mrn || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          {p.age ? `${p.age}t` : ''} • {p.gender === 'Female' ? 'Nữ' : 'Nam'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            p.latestRiskLevel === 'HIGH' || p.latestRiskLevel === 'CRITICAL'
                              ? 'bg-[#FEF3F2] text-[#EF4444] border border-[#FEE4E2]'
                              : p.latestRiskLevel === 'MODERATE'
                              ? 'bg-[#FFFAEB] text-[#F59E0B] border border-[#FEF0C7]'
                              : 'bg-[#ECFDF3] text-[#22C55E] border border-[#D1FADF]'
                          }`}
                        >
                          {p.latestRiskLevel || 'Chờ khám'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ===================================================================
            CỘT GIỮA (FLEX-GROW): TRÌNH XEM ẢNH & KẾT QUẢ AI (CDS VIEWER)
        =================================================================== */}
        <div className="flex-1 min-w-0 space-y-4">
          {isScreeningLoading ? (
            <div className="bg-white border border-[#EAECF0] rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[420px] space-y-3">
              <Loader2 className="w-8 h-8 text-[#3478F6] animate-spin" />
              <p className="text-xs text-slate-500 font-medium">
                {t('doctor.cds.loadingScreeningHistory', isVi ? 'Đang tải ca sàng lọc của bệnh nhân...' : 'Loading patient screening...')}
              </p>
            </div>
          ) : (
            <>
              {/* Inline Quick Uploader Card when isNewScanOpen is true (NFR-14) */}
              {isNewScanOpen && (
                <div className="bg-white border border-[#3478F6]/30 ring-2 ring-[#3478F6]/10 rounded-2xl p-5 shadow-xs space-y-3 transition-all animate-fadeIn" data-testid="cds-inline-uploader-panel">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#EEF5FF] text-[#3478F6] flex items-center justify-center">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {isVi ? 'Tải ảnh sàng lọc mới (Quy trình 3-chạm)' : 'Upload New Retinal Scan (3-Click Workflow)'}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {isVi ? `Bệnh nhân: ${activePatient.fullName || 'N/A'}` : `Patient: ${activePatient.fullName || 'N/A'}`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNewScanOpen(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      {isVi ? 'Đóng' : 'Close'}
                    </button>
                  </div>
                  <PatientUploader
                    key={`inline-new-scan-${activePatient.id || activePatient.userId || activePatient.mrn || 'default-patient'}`}
                    activePatient={activePatient}
                    onStartAnalysis={async (req) => {
                      setIsNewScanOpen(false);
                      await handleStartAnalysis(req);
                    }}
                    isAnalyzing={isAnalyzing}
                    analysisProgress={analysisProgress}
                    analysisError={analysisErrorMsg || progressError}
                    onRetry={() => {
                      resetProgress();
                      setAnalysisErrorMsg(null);
                    }}
                  />
                </div>
              )}

              {analysisResult ? (
                <div className="space-y-4">
                  {/* Interactive Fundus & Grad-CAM Heatmap Viewer */}
                  <InteractiveCDSViewer
                    analysisResult={analysisResult}
                    selectedEye={
                      analysisResult.eyePosition === 'Left_OS' || analysisResult.eyePosition === 'OS'
                        ? (isVi ? 'Mắt Trái (OS)' : 'Left Eye (OS)')
                        : (isVi ? 'Mắt Phải (OD)' : 'Right Eye (OD)')
                    }
                  />

                  {/* Full-Width Biomarkers & Risk Assessment */}
                  <RiskAssessmentPanel result={analysisResult} />
                </div>
              ) : !isNewScanOpen ? (
                <div className="bg-white border border-[#EAECF0] rounded-2xl p-6 shadow-xs space-y-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE] flex items-center justify-center mx-auto">
                    <Eye className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h3 className="text-sm font-bold text-slate-800">
                      {isVi ? 'Chưa Có Kết Quả Sàng Lọc' : 'No Active Screening'}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {isVi
                        ? `Bệnh nhân ${activePatient.fullName || ''} chưa có kết quả phân tích đáy mắt. Tải ảnh mới để chạy mô hình AI.`
                        : `Patient ${activePatient.fullName || ''} has no screening records. Upload retinal scan below to start.`}
                    </p>
                  </div>

                  {/* Fast Patient Uploader for this patient */}
                  <div className="text-left pt-2">
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
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* ===================================================================
            CỘT PHẢI (320-360px, 340px): ĐÁNH GIÁ & KÝ DUYỆT BÁC SĨ (DOCTOR ASSESSMENT)
        =================================================================== */}
        <div className="w-full xl:w-[320px] 2xl:w-[340px] shrink-0 space-y-4">
          {analysisResult ? (
            <div className="space-y-4">
              <ClinicalValidationBar
                analysisId={analysisResult.analysisId}
                onSaveFeedback={handleSaveFeedback}
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-5 text-center text-xs text-slate-400 space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600">
                {isVi ? 'Bảng Đánh Giá Lâm Sàng' : 'Clinical Assessment'}
              </p>
              <p>
                {isVi
                  ? 'Bảng ký duyệt và nhận định chuyên môn sẽ kích hoạt ngay khi có ảnh và kết quả AI.'
                  : 'Physician sign-off panel will activate once screening results are present.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isProfileModalOpen && activePatient && (
        <MedicalProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          patient={activePatient}
          onSave={(updated) => {
            setActivePatient(updated);
            fetchAssignedPatients();
          }}
        />
      )}

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
    </motion.div>
  );
};

