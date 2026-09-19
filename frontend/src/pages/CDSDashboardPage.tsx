import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  CalendarCheck,
  Bell,
  ChevronLeft,
  ChevronRight,
  Search,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { doctorApi, screeningApi, notificationApi, appointmentApi, Appointment } from '../services/api';
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

export interface CDSDashboardPageProps {
  activeSection?: string;
  onNavigate?: (section: string) => void;
  initialPatient?: PatientProfile | null;
  initialLoading?: boolean;
  initialAnalysisResult?: AIRiskResult | null;
  initialMaximized?: boolean;
  initialQueueCollapsed?: boolean;
  initialPatients?: DoctorPatientSummary[];
  initialSelectedPatientId?: string | null;
  patientId?: string | null;
}

export const CDSDashboardPage: React.FC<CDSDashboardPageProps> = ({
  activeSection: rawActiveSection = 'cds-viewer',
  onNavigate,
  initialPatient = null,
  initialLoading,
  initialAnalysisResult = null,
  initialMaximized = false,
  initialQueueCollapsed = false,
  initialPatients,
  initialSelectedPatientId = null,
  patientId = null,
}) => {
  const KNOWN_DOCTOR_SECTIONS = [
    'dashboard',
    'patient-list',
    'risk-analytics',
    'reports',
    'consultation',
    'medical-profile',
    'appointment',
    'appointments',
    'notifications',
    'cds-viewer',
  ];
  const activeSection = KNOWN_DOCTOR_SECTIONS.includes(rawActiveSection) ? rawActiveSection : 'dashboard';
  const { user: currentUser } = useAuth();
  const { t, isVi } = useLanguage();
  const prefersReducedMotion = useAuraReducedMotion();
  const doctorDisplayName = currentUser?.name || (isVi ? 'Bác sĩ chuyên khoa' : 'Attending Specialist');

  const [assignedPatients, setAssignedPatients] = useState<DoctorPatientSummary[]>(initialPatients || []);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(() => {
    if (patientId) return patientId;
    if (initialSelectedPatientId) return initialSelectedPatientId;
    if (initialPatient?.id || initialPatient?.userId) return initialPatient.id || initialPatient.userId || null;
    try {
      return sessionStorage.getItem('aura_doctor_selected_patient_id') || null;
    } catch {
      return null;
    }
  });
  const [activePatient, setActivePatient] = useState<PatientProfile | null>(initialPatient);
  const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(initialLoading ?? (initialPatient || initialPatients ? false : true));
  const [patientsError, setPatientsError] = useState<string | null>(null);

  useEffect(() => {
    const incomingId = patientId || initialSelectedPatientId;
    if (incomingId) {
      setSelectedPatientId(incomingId);
    }
  }, [patientId, initialSelectedPatientId]);

  useEffect(() => {
    try {
      if (selectedPatientId) {
        sessionStorage.setItem('aura_doctor_selected_patient_id', selectedPatientId);
      }
    } catch {}
  }, [selectedPatientId]);

  // Medical analysis is empty until a successful backend response is received or hydrated via initialAnalysisResult.
  const [analysisResult, setAnalysisResult] = useState<AIRiskResult | null>(initialAnalysisResult);
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
  const [feedbackErrorToast, setFeedbackErrorToast] = useState(false);
  const [feedbackErrorMsg, setFeedbackErrorMsg] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState<boolean>(false);
  const [appointmentActionLoading, setAppointmentActionLoading] = useState<string | null>(null);
  const [appointmentSuccessMsg, setAppointmentSuccessMsg] = useState<string | null>(null);

  // Maximize Canvas & Collapsible Patient Queue States (R4, AC-4)
  const [isMaximizedCanvas, setIsMaximizedCanvas] = useState<boolean>(initialMaximized);
  const [isPatientQueueCollapsed, setIsPatientQueueCollapsed] = useState<boolean>(initialQueueCollapsed);
  const [patientSearchQuery, setPatientSearchQuery] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMaximizedCanvas) {
        setIsMaximizedCanvas(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMaximizedCanvas]);

  const filteredAssignedPatients = assignedPatients.filter((p) => {
    if (!patientSearchQuery.trim()) return true;
    const q = patientSearchQuery.toLowerCase();
    return (
      (p.fullName && p.fullName.toLowerCase().includes(q)) ||
      (p.mrn && p.mrn.toLowerCase().includes(q)) ||
      (p.phoneNumber && p.phoneNumber.toLowerCase().includes(q))
    );
  });

  const selectedPatientIdRef = useRef<string | null>(selectedPatientId);
  selectedPatientIdRef.current = selectedPatientId;
  const activePatientRef = useRef<PatientProfile | null>(activePatient);
  activePatientRef.current = activePatient;

  const loadPatientDetails = useCallback(
    async (
      patientId: string,
      summaryFallback?: DoctorPatientSummary | PatientProfile | any,
      specificScreeningId?: string,
      isSilent: boolean = false
    ) => {
      if (!isSilent) {
        setAnalysisResult(null);
        setIsScreeningLoading(true);
        setAnalysisErrorMsg(null);
        setIsNewScanOpen(false);
      }

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
            let targetScreening = specificScreeningId
              ? screeningsResult.value.data.find((s: any) => String(s.id) === String(specificScreeningId)) || screeningsResult.value.data[0]
              : screeningsResult.value.data[0];

            // On-demand full detail fetch if lightweight summary lacks heatmapBase64, vesselMaskUrl, or detectedAnomalies
            if (
              targetScreening?.id &&
              (!targetScreening.heatmapBase64 || !targetScreening.vesselMaskUrl || !targetScreening.detectedAnomalies)
            ) {
              try {
                const fullRes = await screeningApi.getById(String(targetScreening.id));
                if (fullRes && fullRes.success && fullRes.data) {
                  targetScreening = { ...targetScreening, ...fullRes.data };
                }
              } catch (fetchErr) {
                console.warn('[CDSDashboardPage] Could not hydrate full screening details on-demand:', fetchErr);
              }
            }

            setAnalysisResult(mapScreeningToAIRiskResult(targetScreening, targetScreening.imageUrl));
          } else if (specificScreeningId) {
            try {
              const directRes = await screeningApi.getById(specificScreeningId);
              if (directRes && directRes.success && directRes.data) {
                setAnalysisResult(mapScreeningToAIRiskResult(directRes.data, directRes.data.imageUrl));
              } else if (!isSilent) {
                setAnalysisResult(null);
              }
            } catch {
              if (!isSilent) {
                setAnalysisResult(null);
              }
            }
          } else if (!isSilent) {
            setAnalysisResult(null);
          }
        } else if (!isSilent) {
          setAnalysisResult(null);
        }
      } catch (err) {
        console.warn('Error in loadPatientDetails flow:', err);
        if (!isSilent) {
          setAnalysisResult(null);
        }
      } finally {
        if (!isSilent) {
          setIsScreeningLoading(false);
        }
      }
    },
    [doctorDisplayName]
  );

  const fetchAssignedPatients = useCallback(
    async (isSilent: boolean = false) => {
      if (!isSilent) {
        setIsLoadingPatients(true);
        setPatientsError(null);
      }
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
            const currentSelected = selectedPatientIdRef.current;
            const matched = currentSelected
              ? patientList.find(
                  (p) => String(p.patientId || p.userId || p.id) === String(currentSelected)
                )
              : null;

            if (matched) {
              if (!activePatientRef.current) {
                await loadPatientDetails(currentSelected!, matched, undefined, isSilent);
              }
            } else {
              // Only select first patient if no patient is currently selected or existing patient not found
              const first = patientList[0];
              const pid = first.patientId || first.userId || first.id;
              setSelectedPatientId(pid);
              await loadPatientDetails(pid, first, undefined, isSilent);
            }
          } else {
            setSelectedPatientId(null);
            setActivePatient(null);
            setAnalysisResult(null);
          }
        } else if (!isSilent) {
          setPatientsError(
            res.message ||
              (isVi
                ? 'Không thể tải danh sách bệnh nhân được phân công.'
                : 'Failed to load assigned patient list.')
          );
        }
      } catch (err) {
        if (!isSilent) {
          setPatientsError(
            err instanceof Error
              ? err.message
              : (isVi ? 'Lỗi kết nối máy chủ phân công.' : 'Assignment server connection error.')
          );
        }
      } finally {
        if (!isSilent) {
          setIsLoadingPatients(false);
        }
      }
    },
    [loadPatientDetails, isVi]
  );

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoadingAppointments(true);
      const res = await appointmentApi.getAll({ role: 'DOCTOR' });
      if (res && res.success && Array.isArray(res.data)) {
        setAppointments(res.data);
      }
    } catch (err) {
      console.warn('Error loading doctor appointments:', err);
    } finally {
      setIsLoadingAppointments(false);
    }
  }, []);

  const handleUpdateAppointmentStatus = async (
    appointmentId: string,
    status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED',
    notes?: string
  ) => {
    try {
      setAppointmentActionLoading(appointmentId);
      const res = await appointmentApi.updateStatus(appointmentId, status, notes);
      if (res && res.success) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? { ...a, status, notes: notes || a.notes } : a))
        );
        const msg =
          status === 'CONFIRMED'
            ? (isVi ? 'Đã xác nhận lịch hẹn' : 'Appointment confirmed')
            : status === 'COMPLETED'
            ? (isVi ? 'Đã hoàn thành khám' : 'Examination completed')
            : (isVi ? 'Đã hủy lịch hẹn' : 'Appointment cancelled');
        setAppointmentSuccessMsg(msg);
        setTimeout(() => setAppointmentSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái lịch hẹn:', err);
    } finally {
      setAppointmentActionLoading(null);
    }
  };

  const handleStartConsultationWithPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    onNavigate?.('consultation');
  };

  useEffect(() => {
    fetchAssignedPatients();
    fetchAppointments();
  }, [fetchAssignedPatients, fetchAppointments]);

  // Universal Real-time State Synchronization for Doctor Portal (FR-15, FR-20, FR-21, Flow 1, R3/AC-3)
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
      'appointment:created',
      'appointment:updated',
      'APPOINTMENT_CREATED',
      'APPOINTMENT_UPDATED',
    ],
    async (event?: any) => {
      const eventType = event?.type || '';
      if (eventType.toLowerCase().includes('appointment')) {
        await fetchAppointments();
      } else {
        // Silent background revalidation on real-time STOMP/Bus events (Zero-F5, Zero-Flicker)
        await fetchAssignedPatients(true);
        const currentPid = selectedPatientIdRef.current;
        if (currentPid) {
          await loadPatientDetails(currentPid, activePatientRef.current, undefined, true);
        }
      }
    },
    { pollIntervalMs: 60000, syncOnFocus: false }
  );

  // STOMP WebSocket push subscription for doctor notifications & worklist updates (R3/AC-3)
  useEffect(() => {
    if (!currentUser?.id) return;
    stompClient.connect();
    const unsubNotif = stompClient.subscribe(`/topic/notifications.${currentUser.id}`, (payload: any) => {
      realtimeBus.handleIncomingPayload(payload, 'websocket');
    });
    const doctorApptTopic = `/topic/appointments.${currentUser.id}`;
    const unsubAppt = stompClient.subscribe(doctorApptTopic, (_payload: any) => {
      fetchAppointments();
    });
    return () => {
      unsubNotif();
      unsubAppt();
    };
  }, [currentUser?.id, fetchAppointments]);

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
    setFeedbackErrorToast(false);
    setFeedbackSuccessToast(false);

    try {
      if (!feedback.analysisId) {
        throw new Error(
          isVi
            ? 'Không thể lưu đánh giá: Mã ca phân tích (analysisId) không tồn tại. Vui lòng chọn ca khám hợp lệ.'
            : 'Cannot save assessment: Missing analysisId. Please select a valid screening case.'
        );
      }

      const res = await screeningApi.doctorReview(feedback.analysisId, {
        decision: feedback.decision,
        doctorNotes: feedback.clinicalNotes || (isVi ? 'Bác sĩ đã xác nhận kết quả chẩn đoán' : 'Doctor confirmed diagnosis'),
        adjustedCardioRisk: toApiRiskLevel(feedback.adjustedCardioRisk),
        adjustedDrRisk: toApiRiskLevel(feedback.adjustedDrRisk),
        icd10Codes: feedback.icd10Codes,
      });

      if (!res || !res.success) {
        throw new Error(
          res?.message || (isVi
            ? 'Lưu thẩm định chuyên môn thất bại. Máy chủ từ chối cập nhật kết quả.'
            : 'Failed to save clinical review. Server rejected update.')
        );
      }

      // Broadcast review event in real time to patient and analytics ONLY after server confirms success
      realtimeBus.emit('screening:reviewed', feedback);

      setFeedbackSuccessMsg(
        t(
          'doctor.cds.feedbackSuccess',
          'Đã lưu đánh giá chuyên môn và cập nhật hồ sơ sàng lọc của bệnh nhân'
        )
      );
      setFeedbackSuccessToast(true);
      setTimeout(() => setFeedbackSuccessToast(false), 3500);
    } catch (err) {
      console.error('[MED-07] Doctor review save error:', err);
      const errorText = err instanceof Error
        ? err.message
        : (isVi ? 'Đã xảy ra lỗi hệ thống khi lưu chẩn đoán của bác sĩ.' : 'System error occurred while saving diagnosis.');
      setFeedbackErrorMsg(errorText);
      setFeedbackErrorToast(true);
      setTimeout(() => setFeedbackErrorToast(false), 6000);
      throw err;
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
          onStartConsultation={(patient) => {
            const pid = patient.userId || patient.id;
            if (pid) {
              handleStartConsultationWithPatient(pid);
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
          patientId={selectedPatientId}
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

  // 6. Phân hệ Lịch hẹn khám & Tư vấn chuyên khoa (FE-NAV-3)
  if (activeSection === 'appointment' || activeSection === 'appointments') {
    return (
      <motion.div
        key="doctor-appointments"
        custom={prefersReducedMotion}
        variants={pageTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-6"
      >
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-700">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {isVi ? 'Lịch Hẹn Khám & Tư Vấn Chuyên Khoa' : 'Specialist Consultations & Appointments'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isVi ? 'Danh sách bệnh nhân đã đặt lịch hẹn từ Cổng Bệnh nhân (PostgreSQL)' : 'Scheduled appointments from Patient Portal (PostgreSQL)'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchAppointments}
                disabled={isLoadingAppointments}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAppointments ? 'animate-spin' : ''}`} />
                {isVi ? 'Làm mới' : 'Refresh'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('consultation')}
                className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                {isVi ? 'Mở phòng tư vấn' : 'Open Consultation Room'}
              </button>
            </div>
          </div>

          {appointmentSuccessMsg && (
            <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">{appointmentSuccessMsg}</span>
            </div>
          )}

          {isLoadingAppointments ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">{isVi ? 'Đang tải danh sách lịch hẹn...' : 'Loading appointments...'}</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                {isVi ? 'Chưa có lịch hẹn khám nào được lên lịch' : 'No scheduled appointments'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {isVi
                  ? 'Các cuộc hẹn do bệnh nhân đặt qua Cổng Bệnh nhân sẽ hiển thị tại đây để Bác sĩ xác nhận và tiến hành tư vấn.'
                  : 'Appointments booked by patients will appear here for specialist confirmation.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.map((apt) => {
                const isActionLoading = appointmentActionLoading === apt.id;
                return (
                  <div key={apt.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                        {apt.patientName ? apt.patientName.charAt(0) : 'P'}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900">{apt.patientName || (isVi ? 'Bệnh nhân' : 'Patient')}</h4>
                          {apt.status === 'CONFIRMED' ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
                              {isVi ? 'Đã xác nhận' : 'Confirmed'}
                            </span>
                          ) : apt.status === 'COMPLETED' ? (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-200">
                              {isVi ? 'Hoàn thành khám' : 'Completed'}
                            </span>
                          ) : apt.status === 'CANCELLED' ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold text-[11px] border border-rose-200">
                              {isVi ? 'Đã hủy' : 'Cancelled'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold text-[11px] border border-amber-200">
                              {isVi ? 'Chờ duyệt' : 'Pending'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                          <span className="font-mono-data font-semibold text-slate-700">
                            📅 {apt.appointmentDate} • ⏰ {apt.timeSlot}
                          </span>
                          {apt.patientMrn && <span>• MRN: {apt.patientMrn}</span>}
                        </p>
                        {apt.reason && (
                          <p className="text-xs text-slate-600">
                            <span className="text-slate-400">{isVi ? 'Lý do: ' : 'Reason: '}</span>
                            {apt.reason}
                          </p>
                        )}
                        {apt.notes && (
                          <p className="text-xs text-slate-500 italic">
                            <span className="text-slate-400">{isVi ? 'Ghi chú: ' : 'Notes: '}</span>
                            {apt.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                      {apt.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateAppointmentStatus(apt.id, 'CONFIRMED')}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            {isVi ? 'Xác nhận lịch hẹn' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateAppointmentStatus(apt.id, 'CANCELLED')}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isVi ? 'Hủy lịch hẹn' : 'Cancel'}
                          </button>
                        </>
                      )}

                      {apt.status === 'CONFIRMED' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateAppointmentStatus(apt.id, 'COMPLETED')}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            {isVi ? 'Hoàn thành khám' : 'Complete'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateAppointmentStatus(apt.id, 'CANCELLED')}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isVi ? 'Hủy lịch hẹn' : 'Cancel'}
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => handleStartConsultationWithPatient(apt.patientId)}
                        className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {isVi ? 'Vào phòng tư vấn' : 'Consultation'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPatientForCDS(apt.patientId)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        {isVi ? 'Bàn chẩn đoán CDS' : 'CDS Workspace'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // 7. Phân hệ Thông báo Bác sĩ (FE-NAV-4)
  if (activeSection === 'notifications') {
    return (
      <motion.div
        key="doctor-notifications"
        custom={prefersReducedMotion}
        variants={pageTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-6"
      >
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-700">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {isVi ? 'Thông Báo Chuyên Môn Bác Sĩ' : 'Clinical Notifications'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isVi
                    ? 'Các ca chờ thẩm định lâm sàng, ca nguy cơ cao và trao đổi chuyên môn'
                    : 'Pending reviews, critical alerts, and specialist consultations'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                void notificationApi.markAllAsRead();
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors cursor-pointer"
            >
              {isVi ? 'Đánh dấu tất cả đã đọc' : 'Mark all as read'}
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="py-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    {isVi ? 'Ca bệnh nguy cơ cao cần thẩm định lâm sàng' : 'High-risk case requires clinical review'}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isVi
                      ? 'Phát hiện tổn thương vi phình mạch và dấu hiệu bệnh lý võng mạc đái tháo đường.'
                      : 'Microaneurysms and signs of diabetic retinopathy detected by AI pipeline.'}
                  </p>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {isVi ? 'Mức độ: Nguy cấp' : 'Severity: Critical'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.('cds-viewer')}
                className="px-3.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg cursor-pointer shrink-0"
              >
                {isVi ? 'Thẩm định ngay' : 'Review Now'}
              </button>
            </div>

            <div className="py-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {isVi ? 'Tin nhắn mới từ bệnh nhân' : 'New consultation message'}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isVi
                      ? 'Bệnh nhân có câu hỏi liên quan đến phác đồ can thiệp và chế độ dinh dưỡng.'
                      : 'Patient has questions regarding lifestyle intervention and follow-up.'}
                  </p>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {isVi ? 'Kênh tư vấn trực tuyến' : 'Teleconsultation channel'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const targetPid = selectedPatientId || activePatient?.userId || activePatient?.id;
                  if (targetPid) {
                    handleStartConsultationWithPatient(targetPid);
                  } else {
                    onNavigate?.('consultation');
                  }
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer shrink-0"
              >
                {isVi ? 'Trả lời' : 'Reply'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 8. Màn hình Bàn chẩn đoán ảnh CDS (Mặc định: 'cds-viewer')
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
              onClick={() => { void fetchAssignedPatients(false); }}
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
      className="space-y-3 xl:h-[calc(100vh-100px)] xl:overflow-hidden flex flex-col"
    >
      {/* Toast notification */}
      {feedbackSuccessToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-md flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-100 flex-shrink-0" />
          <span>{feedbackSuccessMsg}</span>
        </div>
      )}

      {feedbackErrorToast && (
        <div className="bg-red-600 text-white px-4 py-3 rounded-xl shadow-md flex items-center justify-between gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-100 flex-shrink-0" />
            <span>{feedbackErrorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackErrorToast(false)}
            className="text-white hover:text-red-200 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
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

      {/* Top Header Bar (Slim 52px Patient Banner) */}
      <div className="bg-white border border-[#EAECF0] rounded-xl px-3.5 py-1.5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0 min-h-[52px]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE] flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                onClick={() => setIsProfileModalOpen(true)}
                className="text-sm font-bold text-slate-900 truncate hover:text-[#3478F6] hover:underline cursor-pointer"
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
              <span className="text-xs text-slate-500 ml-1">
                {t('doctor.cds.bloodPressure', 'Huyết áp')}:{' '}
                <strong className="text-slate-800 font-mono-data">
                  {activePatient.systolicBp && activePatient.diastolicBp
                    ? `${activePatient.systolicBp}/${activePatient.diastolicBp} mmHg`
                    : 'Chưa đo'}
                </strong>
              </span>
              <span className="text-xs text-slate-500 ml-1">
                {t('doctor.cds.hba1c', 'HbA1c')}:{' '}
                <strong className="text-slate-800 font-mono-data">
                  {activePatient.hba1c ? `${activePatient.hba1c}%` : 'Chưa đo'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="px-2.5 py-1 bg-[#F5F6F8] hover:bg-[#EAECF0] text-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-[#EAECF0]"
            title={isVi ? 'Xem hồ sơ bệnh nhân' : 'View patient profile'}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#3478F6]" />
            <span>{isVi ? 'Hồ Sơ' : 'Profile'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsNewScanOpen(!isNewScanOpen)}
            className={`px-2.5 py-1 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border ${
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
            type="button"
            onClick={() => {
              const pid = selectedPatientId || activePatient.userId || activePatient.id;
              if (pid) {
                handleStartConsultationWithPatient(pid);
              } else {
                onNavigate?.('consultation');
              }
            }}
            data-testid="cds-telemedicine-btn"
            className="px-2.5 py-1 bg-[#EEF5FF] hover:bg-[#D0DDFE] text-[#3478F6] font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-[#C7D7FE]"
            title={isVi ? 'Vào phòng tư vấn với bệnh nhân' : 'Enter Consultation'}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#3478F6]" />
            <span>{isVi ? 'Vào phòng tư vấn' : 'Consultation'}</span>
          </button>
          <button
            onClick={() => setIsReportModalOpen(true)}
            disabled={!analysisResult}
            className="px-2.5 py-1 bg-[#3478F6] hover:bg-[#2563EB] text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isVi ? 'In Phiếu' : 'Report'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsMaximizedCanvas(!isMaximizedCanvas)}
            data-testid="cds-header-maximize-btn"
            className={`px-2.5 py-1 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer border ${
              isMaximizedCanvas
                ? 'bg-[#3478F6] text-white border-[#2563EB] shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-[#EAECF0]'
            }`}
            title={isMaximizedCanvas ? (isVi ? 'Thu nhỏ khung nhìn (Esc)' : 'Restore Normal View (Esc)') : (isVi ? 'Phóng to toàn khung vi mạch' : 'Maximize Canvas')}
          >
            {isMaximizedCanvas ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isMaximizedCanvas ? (isVi ? 'Thu Nhỏ' : 'Restore') : (isVi ? 'Toàn Khung' : 'Maximize')}</span>
          </button>
        </div>
      </div>

      {/* 3-COLUMN CLINICAL REVIEW WORKSPACE (Requirement R4) */}
      <div className="flex flex-col xl:flex-row gap-4 items-start flex-1 min-h-0 xl:overflow-hidden">
        {/* ===================================================================
            CỘT TRÁI (260-300px, 280px): DANH SÁCH BỆNH NHÂN (PATIENT QUEUE)
        =================================================================== */}
        {!isMaximizedCanvas && (
          <div
            data-testid="cds-patient-queue-container"
            className={`shrink-0 h-full flex flex-col transition-all duration-300 ease-in-out ${
              isPatientQueueCollapsed
                ? 'w-full xl:w-[64px] 2xl:w-[72px]'
                : 'w-full xl:w-[260px] 2xl:w-[280px]'
            }`}
          >
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-3 shadow-xs space-y-2.5 h-full flex flex-col">
              {isPatientQueueCollapsed ? (
                <div className="flex flex-col items-center gap-3 h-full">
                  <button
                    type="button"
                    onClick={() => setIsPatientQueueCollapsed(false)}
                    data-testid="cds-toggle-patient-queue-btn"
                    title={isVi ? 'Mở rộng danh sách bệnh nhân' : 'Expand patient queue'}
                    aria-label={isVi ? 'Mở rộng danh sách bệnh nhân' : 'Expand patient queue'}
                    className="p-2 rounded-xl bg-[#EEF5FF] hover:bg-[#D0DDFE] text-[#3478F6] transition-colors cursor-pointer border border-[#C7D7FE]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono-data font-bold text-[#3478F6] bg-[#EEF5FF] px-1.5 py-0.5 rounded-full border border-[#C7D7FE]">
                    {assignedPatients.length}
                  </span>
                  <div className="space-y-2 flex-1 overflow-y-auto w-full flex flex-col items-center pt-1">
                    {assignedPatients.map((p) => {
                      const isSelected =
                        String(p.patientId) === String(activePatient.id) ||
                        String(p.patientId) === String(activePatient.userId) ||
                        String(p.mrn) === String(activePatient.mrn);

                      return (
                        <button
                          key={p.patientId}
                          type="button"
                          onClick={() => handleSelectPatientForCDS(p.patientId, undefined, p)}
                          title={`${p.fullName || 'Patient'} (${p.mrn || 'N/A'}) - ${p.latestRiskLevel || 'Chờ khám'}`}
                          data-testid={`cds-mini-patient-${p.patientId}`}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer relative ${
                            isSelected
                              ? 'bg-[#3478F6] text-white ring-2 ring-[#3478F6]/30 shadow-xs'
                              : 'bg-[#F5F6F8] text-slate-700 hover:bg-[#EAECF0] border border-[#EAECF0]'
                          }`}
                        >
                          {(p.fullName || 'P').charAt(0).toUpperCase()}
                          {p.latestRiskLevel === 'CRITICAL' || p.latestRiskLevel === 'HIGH' ? (
                            <span className="w-2 h-2 rounded-full bg-red-500 absolute -top-0.5 -right-0.5 ring-1 ring-white" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between shrink-0">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#3478F6]" />
                      {isVi ? 'Danh Sách Bệnh Nhân' : 'Patient Queue'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono-data font-bold text-[#3478F6] bg-[#EEF5FF] px-2 py-0.5 rounded-full border border-[#C7D7FE]">
                        {filteredAssignedPatients.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsPatientQueueCollapsed(true)}
                        data-testid="cds-toggle-patient-queue-btn"
                        title={isVi ? 'Thu gọn danh sách bệnh nhân' : 'Collapse patient queue'}
                        aria-label={isVi ? 'Thu gọn danh sách bệnh nhân' : 'Collapse patient queue'}
                        className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Search Input for Patient Queue */}
                  <div className="relative shrink-0">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      placeholder={isVi ? 'Tìm tên, MRN...' : 'Search MRN, name...'}
                      data-testid="cds-patient-search-input"
                      className="w-full pl-8 pr-2.5 py-1.5 bg-[#F5F6F8] border border-[#EAECF0] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#3478F6]"
                    />
                  </div>

                  {/* Patient Cards List */}
                  <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                    {filteredAssignedPatients.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        {isVi ? 'Chưa có bệnh nhân nào' : 'No patients found'}
                      </div>
                    ) : (
                      filteredAssignedPatients.map((p) => {
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
                </>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            CỘT GIỮA (FLEX-GROW): TRÌNH XEM ẢNH & KẾT QUẢ AI (CDS VIEWER)
        =================================================================== */}
        <div className="flex-1 min-w-0 h-full overflow-y-auto pr-1 space-y-3">
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
                  {/* Full-width notification banner when canvas is maximized */}
                  {isMaximizedCanvas && (
                    <div
                      data-testid="cds-maximize-banner"
                      className="bg-[#EEF5FF] border border-[#C7D7FE] text-[#3478F6] px-4 py-2.5 rounded-xl flex items-center justify-between shadow-xs transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Maximize2 className="w-4 h-4 text-[#3478F6] shrink-0" />
                        <span className="text-xs font-semibold">
                          {isVi
                            ? 'Chế độ xem toàn chiều rộng (Full-Width Inspection Mode) đang bật — Bấm Esc hoặc Khôi phục để quay lại bố cục 3 cột.'
                            : 'Full-Width Inspection Mode active — Press Esc or Restore to return to 3-column cockpit.'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsMaximizedCanvas(false)}
                        data-testid="cds-restore-canvas-btn"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-[#F8FAFC] text-[#3478F6] border border-[#C7D7FE] rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        <Minimize2 className="w-3.5 h-3.5" />
                        {isVi ? 'Khôi phục (Esc)' : 'Restore (Esc)'}
                      </button>
                    </div>
                  )}

                  {/* Interactive Fundus & Grad-CAM Heatmap Viewer */}
                  <InteractiveCDSViewer
                    analysisResult={analysisResult}
                    selectedEye={
                      analysisResult.eyePosition === 'Left_OS' || analysisResult.eyePosition === 'OS'
                        ? (isVi ? 'Mắt Trái (OS)' : 'Left Eye (OS)')
                        : (isVi ? 'Mắt Phải (OD)' : 'Right Eye (OD)')
                    }
                    isMaximized={isMaximizedCanvas}
                    onToggleMaximize={() => setIsMaximizedCanvas(!isMaximizedCanvas)}
                  />

                  {/* Full-Width Biomarkers & Risk Assessment (condensed, default to biomarkers tab, hidden when maximized) */}
                  {!isMaximizedCanvas && (
                    <RiskAssessmentPanel result={analysisResult} defaultTab="biomarkers" />
                  )}
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
        {!isMaximizedCanvas && (
          <div className="w-full xl:w-[320px] 2xl:w-[340px] shrink-0 h-full flex flex-col">
            {analysisResult ? (
              <div className="h-full">
                <ClinicalValidationBar
                  key={analysisResult.analysisId}
                  analysisId={analysisResult.analysisId}
                  onSaveFeedback={handleSaveFeedback}
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#EAECF0] p-5 text-center text-xs text-slate-400 space-y-2 h-full flex flex-col items-center justify-center">
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
        )}
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

