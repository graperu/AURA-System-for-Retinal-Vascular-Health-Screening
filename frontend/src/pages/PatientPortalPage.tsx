import React, { useState, useEffect } from "react";
import { UserSession } from "../types/auth";
import { PatientDashboardView } from "../features/patient/PatientDashboardView";
import { PatientHistoryView, PatientHistoryItem } from "../features/patient/PatientHistoryView";
import { PatientUploadWizard } from "../features/patient/PatientUploadWizard";
import { PatientScreeningResultView } from "../features/patient/PatientScreeningResultView";
import { AppointmentBookingModal } from "../features/patient/AppointmentBookingModal";
import { SkeletonProfile } from "../components/ui/StateFeedback";
import { MedicalReportModal } from "../components/MedicalReportModal";
import { ConsultationChatModal } from "../components/ConsultationChatModal";
import { CreditPurchaseModal, getClinicalFeatures } from "../components/CreditPurchaseModal";
import { MedicalProfileModal } from "../components/MedicalProfileModal";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Pagination } from "../components/ui/Pagination";
import { useAnalysisProgress } from "../hooks/useAnalysisProgress";
import {
  AIRiskResult,
  FundusAnalysisRequest,
  PatientProfile,
} from "../types/cds";
import { screeningApi, chatApi, billingApi, patientApi, notificationApi, appointmentApi } from "../services/api";
import { stompClient } from "../services/websocketService";
import { mapScreeningToAIRiskResult, parseIcd10Codes } from "../services/screeningMapper";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { realtimeBus, RealtimeEvent } from "../services/realtimeService";
import { useRealtimeSync } from "../hooks/useRealtimeSync";
import { AnimatePresence, motion } from "framer-motion";
import { pageTransitionVariants } from "../utils/motion";
import { useAuraReducedMotion } from "../hooks/useAuraReducedMotion";
import {
  Eye,
  Heart,
  Activity,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  CreditCard,
  History,
  Bell,
  Clock,
  UserCog,
  UploadCloud,
  LayoutDashboard,
  Zap,
  ArrowRight,
  Stethoscope,
  Send,
  QrCode,
  AlertTriangle,
  FileText,
  Loader2,
  RefreshCw,
  CalendarCheck,
  Calendar,
  Phone,
  MapPin,
  Check,
  CheckCheck,
  Trash2,
  Mail,
  MailCheck,
  ExternalLink,
} from "lucide-react";
import { formatRelativeTime } from "../components/layout/NotificationBell";
const formatDoctorName = (doc: any, fallback: string = ''): string => {
  if (!doc) return fallback;
  if (typeof doc === 'string') return doc;
  if (typeof doc === 'object') {
    return doc.fullName || doc.name || doc.assignedDoctor || fallback;
  }
  return String(doc);
};

interface PatientPortalPageProps {
  user: UserSession;
  activeView?: string;
  activeSection?: string;
  onNavigate?: (viewId: string) => void;
  initialPatient?: PatientProfile;
  initialProfileLoading?: boolean;
}

export const PatientPortalPage: React.FC<PatientPortalPageProps> = ({
  user,
  activeView: rawActiveView,
  activeSection,
  onNavigate = () => undefined,
  initialPatient,
  initialProfileLoading,
}) => {
  const effectiveActiveView = rawActiveView || activeSection || "dashboard";
  const KNOWN_VIEWS = [
    'dashboard',
    'upload-scan',
    'screening-result',
    'cds-viewer',
    'appointment',
    'appointments',
    'medical-profile',
    'scan-history',
    'consultation',
    'consultation-chat',
    'billing',
    'notifications',
  ];
  const activeView = KNOWN_VIEWS.includes(effectiveActiveView) ? effectiveActiveView : 'dashboard';
  const { t, isVi } = useLanguage();
  const { updateUser } = useAuth();
  const prefersReducedMotion = useAuraReducedMotion();
  const [patient, setPatient] = useState<PatientProfile>(() => initialPatient || {
    fullName: user.name || (isVi ? "Bệnh nhân" : "Patient"),
    mrn: user.mrn || "",
    gender: "Other",
    age: null,
    systolicBp: null,
    diastolicBp: null,
    hba1c: null,
    hasDiabetes: null,
    hasHypertension: null,
    historyOfSmoking: null,
    historyOfHeartDisease: null,
    historyOfStroke: null,
    assignedDoctor: null,
    bloodType: null,
    updatedAt: null,
  });

  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(
    initialProfileLoading !== undefined ? initialProfileLoading : !initialPatient
  );
  const [isProfileError, setIsProfileError] = useState<boolean>(false);

  const [analysisResult, setAnalysisResult] = useState<AIRiskResult | null>(() => {
    try {
      const cached = sessionStorage.getItem("aura_patient_analysis_result");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (analysisResult) {
        sessionStorage.setItem("aura_patient_analysis_result", JSON.stringify(analysisResult));
      }
    } catch (e) {
      console.warn("Could not cache analysis result to sessionStorage:", e);
    }
  }, [analysisResult]);
  const {
    isAnalyzing,
    analysisProgress,
    startProgress,
    completeProgress,
    failProgress,
    resetProgress,
  } = useAnalysisProgress();

  // Realtime AI Ready Notification
  const [showAiNotification, setShowAiNotification] = useState<boolean>(false);
  const [analysisErrorMsg, setAnalysisErrorMsg] = useState<string | null>(null);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [userCredits, setUserCredits] = useState<number>(() => {
    try {
      const cached = localStorage.getItem("aura_patient_credits");
      if (cached !== null) {
        const parsed = parseInt(cached, 10);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch {}
    return 10; // Giữ giá trị khởi tạo an toàn trong lúc đợi API tải, tránh giật banner đỏ
  });
  const [isCreditsLoading, setIsCreditsLoading] = useState<boolean>(true);

  const updateCreditsSafely = (credits: number) => {
    setUserCredits(credits);
    setIsCreditsLoading(false);
    try {
      localStorage.setItem("aura_patient_credits", String(credits));
    } catch {}
  };

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isBillingLoading, setIsBillingLoading] = useState<boolean>(true);
  const [selectedCreditPackageId, setSelectedCreditPackageId] = useState<number | undefined>(undefined);
  const [availablePackages, setAvailablePackages] = useState<any[]>([
    { id: 1, name: "Gói Cơ Bản (Khám Đơn)", price: 50000, credits: 1, validityDays: 30, scope: "INDIVIDUAL", active: true },
    { id: 2, name: "Gói Tiêu Chuẩn (Cá Nhân)", price: 200000, credits: 5, validityDays: 90, scope: "INDIVIDUAL", active: true },
    { id: 3, name: "Gói Gia Đình (Định Kỳ)", price: 500000, credits: 15, validityDays: 180, scope: "INDIVIDUAL", active: true },
  ]);
  const [upcomingAppointment, setUpcomingAppointment] = useState<{
    id?: string;
    doctorName: string;
    doctorId?: string;
    date: string;
    time: string;
    reason?: string;
    status?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem("aura_patient_upcoming_appointment");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const fetchUpcomingAppointment = async () => {
    try {
      const res = await appointmentApi.getUpcoming();
      if (res && res.success && res.data) {
        const apt = res.data;
        const details = {
          id: apt.id,
          doctorName: apt.doctorName || (isVi ? "BS. Chuyên Khoa Võng Mạc" : "Retina Specialist"),
          doctorId: apt.doctorId,
          date: apt.appointmentDate,
          time: apt.timeSlot,
          reason: apt.reason || (isVi ? "Tầm soát định kỳ vi mạch võng mạc" : "Retinal screening"),
          status: apt.status,
        };
        setUpcomingAppointment(details);
        try {
          localStorage.setItem("aura_patient_upcoming_appointment", JSON.stringify(details));
        } catch {}
      } else if (res && res.success && !res.data) {
        setUpcomingAppointment(null);
        try {
          localStorage.removeItem("aura_patient_upcoming_appointment");
        } catch {}
      }
    } catch (e) {
      console.warn("Could not fetch upcoming appointment:", e);
    }
  };

  const handleCancelAppointment = async () => {
    if (upcomingAppointment?.id) {
      try {
        await appointmentApi.updateStatus(upcomingAppointment.id, 'CANCELLED', 'Bệnh nhân chủ động hủy');
      } catch (e) {
        console.warn("Could not cancel appointment on server:", e);
      }
    }
    setUpcomingAppointment(null);
    try {
      localStorage.removeItem("aura_patient_upcoming_appointment");
    } catch {}
  };

  const handleAppointmentSuccess = async (details: {
    doctorName: string;
    doctorId: string;
    date: string;
    time: string;
    reason: string;
  }) => {
    await fetchUpcomingAppointment();
    await fetchProfileData();
    if (details.doctorName) {
      setPatient((prev) => ({ ...prev, assignedDoctor: details.doctorName }));
    }
    if (details.doctorId) {
      setAssignedDoctorId(details.doctorId);
    }
    setIsRegisterModalOpen(false);
  };

  // In-app chat messages for dedicated consultation view
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [assignedDoctorId, setAssignedDoctorId] = useState<string | null>(null);
  const [newChatText, setNewChatText] = useState("");
  const chatMessagesEndRef = React.useRef<HTMLDivElement | null>(null);

  // Scan History
  const [scanHistory, setScanHistory] = useState<PatientHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);

  // Real-time notifications state & synchronization (FR-9)
  const [portalNotifications, setPortalNotifications] = useState<any[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState<boolean>(false);
  const [notifFilterTab, setNotifFilterTab] = useState<'ALL' | 'UNREAD' | 'AI' | 'DOCTOR' | 'SYSTEM'>('ALL');
  const [notifCurrentPage, setNotifCurrentPage] = useState<number>(1);
  const [notifPageSize, setNotifPageSize] = useState<number>(10);

  const loadPortalNotifications = React.useCallback(async () => {
    setIsLoadingNotifications(true);
    try {
      const res = await notificationApi.getNotifications();
      if (res && res.success && Array.isArray(res.data)) {
        setPortalNotifications(res.data);
      }
    } catch (e) {
      console.warn("Could not load notifications in PatientPortalPage:", e);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    if (effectiveActiveView === "notifications" || rawActiveView === "notifications") {
      void loadPortalNotifications();
    }
  }, [effectiveActiveView, rawActiveView, loadPortalNotifications]);

  useEffect(() => {
    const unsubCreated = realtimeBus.subscribe('NOTIFICATION_CREATED', (evt) => {
      const data = evt?.data || evt?.payload || evt;
      if (data && (data.title || data.message)) {
        setPortalNotifications((prev) => {
          const id = String(data.id || Date.now());
          if (prev.some((n) => String(n.id) === id)) return prev;
          return [data, ...prev];
        });
      }
    });

    const unsubRead = realtimeBus.subscribe('NOTIFICATION_READ', (evt) => {
      const id = evt?.data?.id;
      if (id) {
        setPortalNotifications((prev) =>
          prev.map((n) => (String(n.id) === String(id) ? { ...n, isRead: true, read: true } : n))
        );
      }
    });

    const unsubUnread = realtimeBus.subscribe('NOTIFICATION_UNREAD', (evt) => {
      const id = evt?.data?.id;
      if (id) {
        setPortalNotifications((prev) =>
          prev.map((n) => (String(n.id) === String(id) ? { ...n, isRead: false, read: false } : n))
        );
      }
    });

    const unsubCleared = realtimeBus.subscribe(['NOTIFICATION_CLEARED', 'NOTIFICATION_ALL_READ'], () => {
      setPortalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
    });

    return () => {
      unsubCreated();
      unsubRead();
      unsubUnread();
      unsubCleared();
    };
  }, []);

  const handleMarkNotifAsRead = async (id: string) => {
    setPortalNotifications((prev) =>
      prev.map((n) => (String(n.id) === String(id) ? { ...n, isRead: true, read: true } : n))
    );
    try {
      await notificationApi.markAsRead(id);
      realtimeBus.emit('NOTIFICATION_READ', { id });
    } catch (e) {
      console.warn("Error marking notification as read:", e);
    }
  };

  const handleMarkNotifAsUnread = async (id: string) => {
    setPortalNotifications((prev) =>
      prev.map((n) => (String(n.id) === String(id) ? { ...n, isRead: false, read: false } : n))
    );
    try {
      await notificationApi.markAsUnread(id);
      realtimeBus.emit('NOTIFICATION_UNREAD', { id });
    } catch (e) {
      console.warn("Error marking notification as unread:", e);
    }
  };

  const handleMarkAllNotifsAsRead = async () => {
    setPortalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
    try {
      await notificationApi.markAllAsRead();
      realtimeBus.emit('NOTIFICATION_CLEARED', { remainingUnread: 0 });
    } catch (e) {
      console.warn("Error marking all notifications as read:", e);
    }
  };

  const handleDeleteNotif = async (id: string) => {
    const target = portalNotifications.find((n) => String(n.id) === String(id));
    const wasUnread = target ? !target.isRead && !target.read : false;
    setPortalNotifications((prev) => prev.filter((n) => String(n.id) !== String(id)));
    try {
      await notificationApi.deleteNotification(id);
      if (wasUnread) {
        realtimeBus.emit('NOTIFICATION_READ', { id });
      }
    } catch (e) {
      console.warn("Error deleting notification:", e);
    }
  };

  const resolveTargetSectionFromNotif = (notif: any): string => {
    const rawLink = String(notif?.linkUrl || notif?.link || '').trim();
    const cleanLink = rawLink.replace(/^\//, '').toLowerCase();

    if (cleanLink.includes('scan-history') || cleanLink.includes('history') || cleanLink.includes('reports')) {
      return 'scan-history';
    }
    if (cleanLink.includes('upload') || cleanLink.includes('retinal-upload')) {
      return 'upload-scan';
    }
    if (cleanLink.includes('appointment')) {
      return 'appointment';
    }
    if (cleanLink.includes('consultation') || cleanLink.includes('chat')) {
      return 'consultation';
    }
    if (cleanLink.includes('profile')) {
      return 'medical-profile';
    }
    if (cleanLink.includes('billing') || cleanLink.includes('credit')) {
      return 'billing';
    }

    const typeUpper = String(notif?.type || '').toUpperCase();
    if (typeUpper.includes('AI') || typeUpper.includes('SCAN') || typeUpper.includes('REVIEW')) {
      return 'scan-history';
    }
    if (typeUpper.includes('APPOINTMENT')) {
      return 'appointment';
    }
    if (typeUpper.includes('CHAT') || typeUpper.includes('CONSULT')) {
      return 'consultation';
    }
    if (typeUpper.includes('BILLING') || typeUpper.includes('CREDIT')) {
      return 'billing';
    }

    return 'dashboard';
  };

  const handleNotifClick = (notif: any) => {
    if (!notif) return;
    const isUnread = !notif.isRead && !notif.read;
    if (isUnread && notif.id) {
      void handleMarkNotifAsRead(String(notif.id));
    }
    const targetSection = resolveTargetSectionFromNotif(notif);
    onNavigate(targetSection);
  };

  const unreadNotifCount = React.useMemo(() => {
    return portalNotifications.filter((n) => !n.isRead && !n.read).length;
  }, [portalNotifications]);

  const filteredPortalNotifications = React.useMemo(() => {
    return portalNotifications.filter((n) => {
      const isUnread = !n.isRead && !n.read;
      if (notifFilterTab === 'UNREAD') return isUnread;
      const tUpper = String(n.type || '').toUpperCase();
      const titleUpper = String(n.title || '').toUpperCase();
      if (notifFilterTab === 'AI') {
        return tUpper.includes('AI') || tUpper.includes('SCAN') || titleUpper.includes('AI') || titleUpper.includes('SÀNG LỌC');
      }
      if (notifFilterTab === 'DOCTOR') {
        return tUpper.includes('DOCTOR') || tUpper.includes('REVIEW') || titleUpper.includes('BÁC SĨ') || titleUpper.includes('THẨM ĐỊNH');
      }
      if (notifFilterTab === 'SYSTEM') {
        return tUpper.includes('SYSTEM') || tUpper.includes('APPOINTMENT') || tUpper.includes('BILLING') || tUpper.includes('ALERT');
      }
      return true;
    });
  }, [portalNotifications, notifFilterTab]);

  useEffect(() => {
    setNotifCurrentPage(1);
  }, [notifFilterTab]);

  const totalNotifPages = Math.max(1, Math.ceil(filteredPortalNotifications.length / notifPageSize));
  const paginatedPortalNotifications = React.useMemo(() => {
    const start = (notifCurrentPage - 1) * notifPageSize;
    return filteredPortalNotifications.slice(start, start + notifPageSize);
  }, [filteredPortalNotifications, notifCurrentPage, notifPageSize]);

  const assignedDoctorName = formatDoctorName(patient.assignedDoctor);
  const doctorSpecialty = isVi ? "Chuyên khoa Mắt & Tim Mạch" : "Ophthalmology & Cardiology";

  const reviewStatus = React.useMemo(() => {
    const isReviewed = analysisResult?.status === 'REVIEWED' || scanHistory.some((s) => s.status === 'REVIEWED' || s.doctorReviewed);
    if (isReviewed) {
      return {
        status: 'reviewed',
        label: isVi ? 'Đã duyệt' : 'Reviewed',
        variant: 'success' as const,
      };
    }
    const hasScreening = Boolean(analysisResult || scanHistory.length > 0);
    if (hasScreening) {
      return {
        status: 'pending',
        label: isVi ? 'Đang chờ duyệt' : 'Pending Review',
        variant: 'warning' as const,
      };
    }
    return {
      status: 'draft',
      label: isVi ? 'Chưa gửi' : 'Not Submitted',
      variant: 'neutral' as const,
    };
  }, [analysisResult, scanHistory, isVi]);

  const loadBillingData = async (silent = false) => {
    if (!silent) setIsBillingLoading(true);
    try {
      const [subRes, payRes, pkgRes] = await Promise.all([
        billingApi.mySubscriptions(),
        billingApi.myPayments(),
        billingApi.packages("INDIVIDUAL").catch(() => ({ success: false, data: [] })),
      ]);
      if (subRes.success && Array.isArray(subRes.data)) {
        setSubscriptions(subRes.data);
        const total = subRes.data
          .filter((s: any) => s.status === "ACTIVE")
          .reduce((sum: number, s: any) => sum + (s.remainingCredits || 0), 0);
        updateCreditsSafely(total);
      }
      if (payRes.success && Array.isArray(payRes.data)) {
        setPaymentHistory(payRes.data);
      }
      if (pkgRes && pkgRes.success && Array.isArray(pkgRes.data) && pkgRes.data.length > 0) {
        const activeList = pkgRes.data.filter((p: any) => p.active !== false);
        activeList.sort((a: any, b: any) => Number(a.price || 0) - Number(b.price || 0));
        if (activeList.length > 0) {
          setAvailablePackages(activeList);
        }
      }
    } catch (e) {
      console.warn("Could not load billing data:", e);
    } finally {
      setIsCreditsLoading(false);
      setIsBillingLoading(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      setIsProfileLoading(true);
      setIsProfileError(false);
      const profileRes = await patientApi.getProfile();
      if (profileRes.success && profileRes.data) {
        const safeDocName = formatDoctorName(profileRes.data.assignedDoctor, '');
        setPatient({
          id: profileRes.data.id,
          userId: profileRes.data.userId,
          fullName: profileRes.data.fullName || user.name || (isVi ? "Bệnh nhân" : "Patient"),
          mrn: profileRes.data.mrn || user.mrn || "",
          gender: profileRes.data.gender || "Other",
          dateOfBirth: profileRes.data.dateOfBirth,
          age: profileRes.data.age,
          phoneNumber: profileRes.data.phoneNumber,
          address: profileRes.data.address,
          bloodType: profileRes.data.bloodType || null,
          systolicBp: profileRes.data.systolicBp,
          diastolicBp: profileRes.data.diastolicBp,
          hba1c: profileRes.data.hba1c,
          hasDiabetes: profileRes.data.hasDiabetes,
          diabetesType: profileRes.data.diabetesType,
          diabetesDurationYears: profileRes.data.diabetesDurationYears,
          hasHypertension: profileRes.data.hasHypertension,
          historyOfSmoking: profileRes.data.historyOfSmoking,
          historyOfHeartDisease: profileRes.data.historyOfHeartDisease,
          historyOfStroke: profileRes.data.historyOfStroke,
          currentMedications: profileRes.data.currentMedications,
          allergies: profileRes.data.allergies,
          emergencyContactName: profileRes.data.emergencyContactName,
          emergencyContactPhone: profileRes.data.emergencyContactPhone,
          assignedDoctor: safeDocName || null,
          updatedAt: profileRes.data.updatedAt || null,
        });
        setAssignedDoctorId(profileRes.data.assignedDoctorId || null);
        if (profileRes.data.assignedDoctorId) {
          const chatRes = await chatApi.getConversation(
            profileRes.data.assignedDoctorId,
          );
          if (chatRes.success && Array.isArray(chatRes.data)) {
            setChatMessages(
              chatRes.data.map((message: any) => ({
                id: message.id,
                sender:
                  message.senderId === profileRes.data.assignedDoctorId
                    ? "doctor"
                    : "patient",
                text: message.messageText,
                time: message.createdAt
                  ? new Date(message.createdAt).toLocaleTimeString(isVi ? "vi-VN" : "en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : (isVi ? "Không có thời gian" : "No timestamp"),
              })),
            );
          }
        } else {
          setChatMessages([]);
        }
      }
    } catch (e) {
      console.warn("Could not fetch patient medical profile from DB:", e);
      setIsProfileError(true);
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Load real history from PostgreSQL (FR-6)
  const loadScreeningHistory = async (isSilent = false, overwriteResult = true) => {
    try {
      if (!isSilent) setIsHistoryLoading(true);
      const res = await screeningApi.getAll();
      const rawList: any[] = Array.isArray(res?.data)
        ? res.data
        : (res?.data as any)?.items || (res?.data as any)?.content || [];
      if (res && res.success && rawList.length > 0) {
        const mapped: PatientHistoryItem[] = rawList.map((item: any) => {
          const cvdScore = item.cardiovascularRiskScore ?? 0;
          const drScore = item.diabeticRetinopathyRiskScore ?? 0;
          const score = Math.round(
            item.riskScore ?? item.overallVascularRiskScore ?? ((cvdScore + drScore) / 2)
          );
          const computedLevel =
            score >= 80 ? "Critical" : score >= 65 ? "High" : score >= 40 ? "Moderate" : "Low";

          return {
            id: item.id,
            rawId: item.id,
            createdAt: item.createdAt || new Date().toISOString(),
            eyePosition: item.eyePosition || item.eye || "OD",
            scanType: item.scanType || "Fundus_Macula",
            riskScore: score,
            riskLevel: item.riskLevel || computedLevel,
            status: item.status || "ANALYZED",
            doctorReviewed: item.status === "REVIEWED" || Boolean(item.reviewDecision),
            reviewDecision: item.reviewDecision || (item.status === 'REJECTED' ? 'REJECTED' : undefined),
            doctorName: item.doctorName || (item.doctorId ? (isVi ? "Bác sĩ phụ trách" : "Assigned Doctor") : undefined),
            doctorNotes: item.doctorNotes || item.notes,
            digitalSignature: item.digitalSignature,
            signedAt: item.signedAt,
            icd10Codes: parseIcd10Codes(item.icd10Codes),
            imageUrl: item.imageUrl,
            rawScreening: item,
            notes: item.doctorNotes || item.findings,
          };
        });
        setScanHistory(mapped);

        // Tự động load kết quả sàng lọc mới nhất lên Viewer (chỉ khi overwriteResult = true)
        if (overwriteResult) {
          const latest = rawList[0];
          if (latest && latest.status !== "FAILED") {
            // Nạp chi tiết đầy đủ (ảnh Base64 thực tế & heatmap) nếu danh sách tóm tắt thiếu
            if (latest.id && (!latest.heatmapBase64 || !latest.imageUrl || latest.imageUrl.startsWith('/api/'))) {
              try {
                const fullRes = await screeningApi.getById(String(latest.id));
                if (fullRes && fullRes.success && fullRes.data) {
                  setAnalysisResult(mapScreeningToAIRiskResult(fullRes.data, fullRes.data.imageUrl || latest.imageUrl));
                } else {
                  setAnalysisResult(mapScreeningToAIRiskResult(latest, latest.imageUrl));
                }
              } catch {
                setAnalysisResult(mapScreeningToAIRiskResult(latest, latest.imageUrl));
              }
            } else {
              setAnalysisResult(mapScreeningToAIRiskResult(latest, latest.imageUrl));
            }
          } else if (!latest) {
            setAnalysisResult(null);
          }
        }
      } else {
        setScanHistory([]);
        if (overwriteResult) {
          setAnalysisResult(null);
        }
      }
    } catch (e) {
      console.warn("Could not fetch screenings from DB:", e);
    } finally {
      if (!isSilent) setIsHistoryLoading(false);
    }
  };

  const handleDeleteScreening = async (id: string) => {
    try {
      const res = await screeningApi.delete(id);
      if (res && res.success === false && res.code !== "NOT_FOUND") {
        console.warn("Screening delete API response:", res.message);
        throw new Error(res.message || (isVi ? "Không thể xóa ca khám" : "Failed to delete screening"));
      }
      setScanHistory((prev) => prev.filter((s) => s.id !== id && s.rawId !== id));
      realtimeBus.emit('screening:deleted', { id });
      await loadScreeningHistory(true, true);
    } catch (err) {
      console.warn("Screening delete error:", err);
      await loadScreeningHistory(true, false);
      throw err;
    }
  };

  const handleBatchDeleteScreenings = async (ids: string[]) => {
    try {
      const res = await screeningApi.batchDelete(ids);
      if (res && res.success === false) {
        console.warn("Screening batch delete API response:", res.message);
        throw new Error(res.message || (isVi ? "Không thể xóa các ca khám đã chọn" : "Failed to delete selected screenings"));
      }
      const idSet = new Set(ids);
      setScanHistory((prev) => prev.filter((s) => !idSet.has(s.id) && !idSet.has(s.rawId || "")));
      realtimeBus.emit('screening:deleted', { ids });
      await loadScreeningHistory(true, true);
    } catch (err) {
      console.warn("Screening batch delete error:", err);
      await loadScreeningHistory(true, false);
      throw err;
    }
  };

  const handleSelectScreeningForViewer = async (item: PatientHistoryItem) => {
    try {
      const realId = item.rawId || item.id;
      const res = await screeningApi.getById(realId);
      if (res.success && res.data) {
        setAnalysisResult(mapScreeningToAIRiskResult(res.data, res.data.imageUrl || item.imageUrl || ""));
      } else if (item.rawScreening) {
        setAnalysisResult(mapScreeningToAIRiskResult(item.rawScreening, item.imageUrl || ""));
      }
    } catch (err) {
      console.warn("Could not fetch screening detail for viewer:", err);
      if (item.rawScreening) {
        setAnalysisResult(mapScreeningToAIRiskResult(item.rawScreening, item.imageUrl || ""));
      }
    }
    onNavigate("screening-result");
  };

  const handleUploadNewScanClick = () => {
    onNavigate("upload-scan");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      const uploader = document.getElementById("patient-uploader-card");
      if (uploader) {
        uploader.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      const fileInput = document.getElementById("patient-uploader-od-input");
      if (fileInput) {
        (fileInput as HTMLInputElement).click();
      }
    }, 150);
  };

  const handleOpenReportFromHistory = async (item: PatientHistoryItem) => {
    try {
      const realId = item.rawId || item.id;
      const res = await screeningApi.getById(realId);
      if (res.success && res.data) {
        setAnalysisResult(mapScreeningToAIRiskResult(res.data, res.data.imageUrl || item.imageUrl || ""));
      } else if (item.rawScreening) {
        setAnalysisResult(mapScreeningToAIRiskResult(item.rawScreening, item.imageUrl || ""));
      }
    } catch (err) {
      console.warn("Could not fetch screening detail for report:", err);
      if (item.rawScreening) {
        setAnalysisResult(mapScreeningToAIRiskResult(item.rawScreening, item.imageUrl || ""));
      }
    }
    setIsReportModalOpen(true);
  };

  // Load real history, profile, appointments, and billing transactions on mount in parallel
  useEffect(() => {
    const fetchRealData = async () => {
      await Promise.allSettled([
        loadScreeningHistory(),
        fetchProfileData(),
        fetchUpcomingAppointment(),
        loadBillingData(false),
      ]);
    };
    fetchRealData();
  }, []);

  // Auto-fetch fresh billing & payment transactions when switching to the billing view
  useEffect(() => {
    if (activeView === 'billing') {
      loadBillingData(true);
    }
  }, [activeView]);

  // Universal Real-time State Synchronization across all clinical topics (FR-6, FR-10, FR-12, Flow 2 & Flow 4)
  useRealtimeSync(
    [
      'screening:new',
      'screening:created',
      'screening:completed',
      'screening:reviewed',
      'screening:update',
      'screening:deleted',
      'doctor:reviewed',
      'RESULT_REVIEWED',
      'notification:new',
      'billing:update',
      'credit:change',
      'profile:update',
      'doctor:assignment',
      'appointment:created',
      'appointment:updated',
      'APPOINTMENT_CREATED',
      'APPOINTMENT_UPDATED',
    ],
    async (event?: RealtimeEvent) => {
      const type = event?.type || '';
      if (type.toLowerCase().includes('appointment')) {
        await fetchUpcomingAppointment();
      } else if (type.startsWith('billing') || type.startsWith('credit')) {
        await loadBillingData();
      } else if (type.startsWith('profile') || type.startsWith('doctor:assignment')) {
        await fetchProfileData();
      } else {
        await loadScreeningHistory(true, false);
        // Instant state update for active screening result on doctor review (<5s SLA, Zero-F5)
        if (type === 'doctor:reviewed' || type === 'RESULT_REVIEWED' || type === 'screening:reviewed') {
          const eventData = event?.data;
          if (eventData) {
            setAnalysisResult((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                status: 'REVIEWED',
                isReviewed: true,
                doctorNotes: eventData.doctorNotes || eventData.notes || prev.doctorNotes,
                doctorName: eventData.doctorName || eventData.reviewerName || prev.doctorName,
                digitalSignature: eventData.digitalSignature || prev.digitalSignature,
              };
            });
          }
        }
      }
    },
    { pollIntervalMs: 60000, syncOnFocus: false }
  );

  // Real-time synchronization for Patient consultation view via WebSocket STOMP (FR-10, FR-20, R3/AC-3)
  useEffect(() => {
    if (!user?.id) return;

    stompClient.connect();
    const chatTopic = `/topic/chat.${user.id}`;
    const screeningTopic = `/topic/screening.${user.id}`;
    const notifTopic = `/topic/notifications.${user.id}`;
    const apptTopic = `/topic/appointments.${user.id}`;

    const handleIncomingChatMessage = (msg: any) => {
      if (!msg || !msg.messageText) return;
      // Bỏ qua tin nhắn do chính bệnh nhân vừa gửi (đã optimistic)
      if (msg.senderId === user.id) return;
      // Chỉ nhận tin nhắn từ bác sĩ được phân công
      if (assignedDoctorId && msg.senderId !== assignedDoctorId && msg.receiverId !== assignedDoctorId) return;

      const incoming = {
        id: msg.id || `msg-${Date.now()}`,
        sender: "doctor",
        text: msg.messageText,
        time: msg.createdAt
          ? new Date(msg.createdAt).toLocaleTimeString(isVi ? "vi-VN" : "en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : new Date().toLocaleTimeString(isVi ? "vi-VN" : "en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
      };

      setChatMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });

      if (assignedDoctorId) {
        chatApi.markAsRead(assignedDoctorId).catch(() => {});
      }
    };

    const unsubChat = stompClient.subscribe(chatTopic, handleIncomingChatMessage);
    const unsubScreening = stompClient.subscribe(screeningTopic, (payload) => {
      realtimeBus.handleIncomingPayload(payload, 'websocket');
    });
    const unsubNotif = stompClient.subscribe(notifTopic, (payload) => {
      realtimeBus.handleIncomingPayload(payload, 'websocket');
    });
    const unsubAppt = stompClient.subscribe(apptTopic, (_payload) => {
      fetchUpcomingAppointment();
    });

    if (activeView === "consultation" && assignedDoctorId) {
      chatApi.markAsRead(assignedDoctorId).catch(() => {});
    }

    return () => {
      unsubChat();
      unsubScreening();
      unsubNotif();
      unsubAppt();
    };
  }, [user?.id, assignedDoctorId, activeView, isVi]);

  useEffect(() => {
    if (activeView === "consultation") {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeView]);

  const handleStartAnalysis = async (
    request: FundusAnalysisRequest & {
      eye?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
    },
  ) => {
    // FR-11, FR-12: Kiểm tra hạn mức lượt khám của Bệnh nhân trước khi phân tích
    if (userCredits <= 0) {
      setIsCreditModalOpen(true);
      setAnalysisErrorMsg(
        isVi
          ? "Tài khoản của bạn hiện có 0 lượt khám. Vui lòng nạp thêm gói dịch vụ bằng cách quét mã QR chuyển khoản để bắt đầu phân tích AI."
          : "Your account has 0 screening credits remaining. Please recharge credits via QR transfer to begin AI analysis."
      );
      return;
    }

    startProgress();
    setShowAiNotification(false);
    setAnalysisErrorMsg(null);

    try {
      const res = await screeningApi.create({
        imageUrl: request.imageUrl,
        eyePosition: request.eyePosition || request.eye || "Right_OD",
        eye: request.eye || request.eyePosition || "Right_OD",
        scanType: request.scanType || "Fundus_Macula",
        fileName: request.fileName || request.imageName || "fundus_scan.png",
        fileSize: request.fileSize,
        mimeType: request.mimeType || "image/png",
      });
      if (!res.success || !res.data || res.data.status === "FAILED") {
        throw new Error(
          (res.data?.status === "FAILED" && res.data?.findings)
            ? res.data.findings
            : (res.message || (isVi ? "Dịch vụ AI chưa sẵn sàng. Không tạo kết quả giả." : "AI service is unavailable. No simulated results generated."))
        );
      }

      const result = mapScreeningToAIRiskResult(res.data, request.imageUrl);

      // Hoàn tất tiến trình: vọt lên 100%, giữ 600ms rồi chuyển sang giao diện kết quả
      completeProgress(async () => {
        setAnalysisResult(result);
        // Trừ 1 lượt khám và đồng bộ với database
        setUserCredits((prev) => Math.max(0, prev - 1));
        loadBillingData();

        // Cập nhật lịch sử khám trực tiếp từ PostgreSQL (FR-6) nhưng bảo toàn analysisResult vừa tải lên
        await loadScreeningHistory(true, false);

        // Broadcast to all active portals (Doctor Worklist, Clinic, CDS) in real time
        realtimeBus.emit('screening:new', result);

        // Trigger AI Ready Notification
        setShowAiNotification(true);
        setTimeout(() => setShowAiNotification(false), 7000);

        // Navigate to dedicated AI Result page automatically
        onNavigate("screening-result");
      });
    } catch (err) {
      console.error(err);
      const errMsg =
        err instanceof Error
          ? err.message
          : (isVi ? "Không thể kết nối đến máy chủ phân tích. Vui lòng thử lại." : "Could not connect to analysis server. Please try again.");
      failProgress(errMsg);
      setAnalysisErrorMsg(errMsg);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;
    const textToSend = newChatText.trim();
    setNewChatText("");

    const optimisticMsg = {
      id: `m_${Date.now()}`,
      sender: "patient",
      text: textToSend,
      time: new Date().toLocaleTimeString(isVi ? "vi-VN" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setChatMessages((prev) => [...prev, optimisticMsg]);

    if (!assignedDoctorId) {
      setChatMessages((prev) =>
        prev.filter((message) => message.id !== optimisticMsg.id),
      );
      setAnalysisErrorMsg(
        isVi ? "Chưa có bác sĩ được phân công nên không thể gửi tin nhắn." : "No assigned doctor. Cannot send message."
      );
      return;
    }
    const response = await chatApi.sendMessage(assignedDoctorId, textToSend);
    if (!response.success) {
      setChatMessages((prev) =>
        prev.filter((message) => message.id !== optimisticMsg.id),
      );
      setAnalysisErrorMsg(response.message || (isVi ? "Không thể gửi tin nhắn." : "Could not send message."));
    }
  };

  const renderConditionStatus = (
    val: boolean | null | undefined,
    trueDetail?: string,
  ) => {
    if (val === true) {
      return (
        <span className="font-bold text-rose-600 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
          {isVi ? 'Có' : 'Yes'} {trueDetail ? `(${trueDetail})` : ""}
        </span>
      );
    }
    if (val === false) {
      return (
        <span className="font-semibold text-emerald-600 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
          {isVi ? 'Không' : 'No'}
        </span>
      );
    }
    return (
      <span className="font-medium text-slate-400 italic flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block"></span>
        {isVi ? 'Chưa khai báo' : 'Unspecified'}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification (FR-9) */}
      {showAiNotification && analysisResult && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-white border border-cyan-200 rounded-2xl p-4 shadow-medical-modal animate-slideInRight flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 text-[#3478F6] shrink-0 border border-cyan-100">
            {analysisResult.status === 'REVIEWED' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            ) : (
              <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">
                {analysisResult.status === 'REVIEWED'
                  ? (isVi ? "Kết Quả Đã Được Bác Sĩ Ký Duyệt" : "Specialist Approved")
                  : (isVi ? "Đã Phân Tích - Chờ Bác Sĩ Duyệt" : "Awaiting Doctor Review")}
              </h4>
              <span className={`text-[10px] font-mono-data font-bold px-2 py-0.5 rounded-md ${analysisResult.status === 'REVIEWED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {isVi ? "Vừa xong" : "Just now"}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-snug">
              {analysisResult.status === 'REVIEWED'
                ? (isVi
                    ? `Bác sĩ ${analysisResult.doctorName || formatDoctorName(patient.assignedDoctor) || 'phụ trách'} đã ký duyệt kết quả vi mạch võng mạc.`
                    : `Your assigned specialist has signed your screening report.`)
                : (isVi
                    ? `Ảnh đã được AI phân tích và chuyển đến Bác sĩ ${formatDoctorName(patient.assignedDoctor) ? `(${formatDoctorName(patient.assignedDoctor)})` : 'phụ trách'} thẩm định.`
                    : `Scan analyzed by AI and submitted to physician for clinical review.`)}
            </p>
          </div>
          <button
            onClick={() => setShowAiNotification(false)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {analysisErrorMsg && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-white border border-red-200 rounded-xl p-4 shadow-medical-modal animate-slideInRight flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-50 text-red-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-bold text-slate-900">
              {isVi ? "Không Thể Phân Tích Ảnh" : "Unable to Analyze Scan"}
            </h4>
            <p className="text-xs text-slate-600 leading-snug">
              {analysisErrorMsg}
            </p>
          </div>
          <button
            onClick={() => setAnalysisErrorMsg(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          custom={prefersReducedMotion}
          variants={pageTransitionVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="space-y-6"
        >
          {/* Top Patient Hero Banner - Chỉ hiển thị trên tab Dashboard Tổng quan */}
          {activeView === "dashboard" && (
        <div className="bg-white border border-slate-200/90 shadow-xs rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="flex items-center gap-3.5 z-10">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 border border-brand-100/80 flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  {patient.fullName}
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold font-mono-data border border-slate-200">
                  {patient.mrn || (isVi ? "Chưa có MRN" : "No MRN")}
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-1.5 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-brand-600" />
                  <span>{t('patient.chat.assignedDoctor', isVi ? "Bác sĩ phụ trách" : "Assigned doctor")}:</span>{" "}
                  <strong className="text-slate-800 font-semibold">
                    {assignedDoctorName || (isVi ? "Đang chờ phân công bác sĩ" : "Awaiting doctor assignment")}
                  </strong>
                  {assignedDoctorName && (
                    <span className="text-[11px] text-slate-500 font-normal">
                      • {doctorSpecialty}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-500">{isVi ? "Trạng thái thẩm định:" : "Review status:"}</span>
                  <StatusBadge
                    status={reviewStatus.status}
                    label={reviewStatus.label}
                    variant={reviewStatus.variant}
                    size="sm"
                  />
                </span>
                <span>
                  {isVi ? "Lần khám gần nhất" : "Last exam"}:{" "}
                  <strong className="text-slate-800 font-semibold font-mono-data">
                    {patient.lastExamDate || (isVi ? "Chưa có lần khám" : "No previous exam")}
                  </strong>
                </span>
                <span className="flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {isVi ? "Khám Định Kỳ Võng Mạc" : "Periodic Retinal Screening"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Shortcuts */}
          <div className="z-10 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <CalendarCheck className="w-3.5 h-3.5" /> {isVi ? "Đăng Ký Khám" : "Register Exam"}
            </button>
            <button
              onClick={handleUploadNewScanClick}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl text-xs border border-slate-200 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" /> {t('patient.dashboard.quickActions.uploadScan', isVi ? "Tải Ảnh Khám Mới" : "Upload new scan")}
            </button>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl text-xs border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserCog className="w-3.5 h-3.5" /> {t('navigation.medicalProfile', isVi ? "Hồ Sơ Y Tế" : "Medical Profile")}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: DASHBOARD TỔNG QUAN
      ========================================================================== */}
      {activeView === "dashboard" && (
        <PatientDashboardView
          patient={patient}
          latestResult={analysisResult}
          userCredits={userCredits}
          upcomingAppointment={upcomingAppointment}
          onNavigate={onNavigate}
          onOpenCreditModal={() => setIsCreditModalOpen(true)}
          onOpenChatModal={() => setIsChatModalOpen(true)}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
          scanHistory={scanHistory}
        />
      )}

      {/* =========================================================================
          VIEW 2: UPLOAD SCAN - PHÂN TÍCH ẢNH MỚI WIZARD (P0 REQ)
      ========================================================================== */}
      {activeView === "upload-scan" && (
        <div className="w-full max-w-7xl mx-auto space-y-6">
          <PatientUploadWizard
            activePatient={patient}
            onStartAnalysis={handleStartAnalysis}
            isAnalyzing={isAnalyzing}
            analysisProgress={analysisProgress}
            analysisError={analysisErrorMsg}
            userCredits={userCredits}
            isCreditsLoading={isCreditsLoading}
            onOpenCreditModal={() => setIsCreditModalOpen(true)}
            onRetry={() => {
              setAnalysisErrorMsg(null);
              resetProgress();
            }}
          />
        </div>
      )}

      {/* =========================================================================
          VIEW 3: DEDICATED AI RESULT PAGE (P0 REQ) & CDS VIEWER
      ========================================================================== */}
      {(activeView === "screening-result" || activeView === "cds-viewer") && (
        <div className="w-full max-w-7xl mx-auto space-y-6">
          {analysisResult ? (
            <PatientScreeningResultView
              result={analysisResult}
              selectedEye={
                analysisResult.eyePosition === "Left_OS" || analysisResult.eyePosition === "OS"
                  ? (isVi ? "Mắt Trái (OS)" : "Left Eye (OS)")
                  : (isVi ? "Mắt Phải (OD)" : "Right Eye (OD)")
              }
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onOpenChatModal={() => onNavigate("consultation")}
            />
          ) : (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-4">
                <Eye className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                {isVi ? "Chưa có kết quả phân tích AI" : "No AI Screening Results Available"}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                {isVi
                  ? "Hãy bắt đầu bằng cách tải lên ảnh chụp đáy mắt để AI phân tích 4 nhóm nguy cơ mạch máu võng mạc."
                  : "Start by uploading a fundus scan to screen for cardiovascular and microvascular health risks."}
              </p>
              <button
                onClick={() => onNavigate("upload-scan")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                {isVi ? "Tải Ảnh Sàng Lọc Ngay" : "Start Screening"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 3B: APPOINTMENTS - ĐẶT & QUẢN LÝ LỊCH HẸN (P1 REQ)
      ========================================================================== */}
      {activeView === "appointment" && (
        <div className="w-full max-w-7xl mx-auto space-y-6">
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                  <CalendarCheck className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {isVi ? "Lịch Hẹn Khám Bác Sĩ Chuyên Khoa" : "Specialist Consultations & Appointments"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isVi
                      ? "Quản lý các cuộc hẹn khám chuyên sâu về vi mạch võng mạc, tim mạch và nhãn khoa."
                      : "Manage clinical consultations for retinal microvasculature and cardiovascular health."}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <CalendarCheck className="w-4 h-4" />
              {isVi ? "Đặt Lịch Khám Mới" : "Book New Appointment"}
            </button>
          </div>

          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (8 cols): Upcoming Appointment & History */}
            <div className="lg:col-span-8 space-y-6">
              {upcomingAppointment ? (
                <div className="bg-white p-6 rounded-2xl border border-teal-200/90 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${upcomingAppointment.status === 'CONFIRMED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${upcomingAppointment.status === 'CONFIRMED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {upcomingAppointment.status === 'CONFIRMED'
                          ? (isVi ? "Cuộc hẹn sắp tới (Đã xác nhận)" : "Upcoming Confirmed Appointment")
                          : (isVi ? "Cuộc hẹn khám sắp tới" : "Upcoming Appointment")}
                      </span>
                    </div>
                    {upcomingAppointment.status === 'CONFIRMED' ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                        {isVi ? "Đã xác nhận" : "Confirmed"}
                      </span>
                    ) : upcomingAppointment.status === 'COMPLETED' ? (
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                        {isVi ? "Đã hoàn thành" : "Completed"}
                      </span>
                    ) : upcomingAppointment.status === 'CANCELLED' ? (
                      <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
                        {isVi ? "Đã hủy" : "Cancelled"}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200">
                        {isVi ? "Chờ bác sĩ duyệt" : "Pending Confirmation"}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <span className="text-slate-500 text-xs block font-medium">{isVi ? "Bác sĩ phụ trách" : "Attending Doctor"}</span>
                      <strong className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-teal-600 shrink-0" />
                        {upcomingAppointment.doctorName}
                      </strong>
                      <span className="text-[11px] text-slate-500 block">{doctorSpecialty || (isVi ? "Chuyên khoa Mắt & Mạch Máu" : "Ophthalmology & Vascular")}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <span className="text-slate-500 text-xs block font-medium">{isVi ? "Thời gian hẹn" : "Date & Time"}</span>
                      <strong className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                        {upcomingAppointment.time} - {upcomingAppointment.date}
                      </strong>
                      <span className="text-[11px] text-slate-500 block">{isVi ? "Thời lượng: 30 phút • Phòng khám 402" : "Duration: 30 mins • Room 402"}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <span className="text-slate-500 text-xs block font-medium">{isVi ? "Lý do khám" : "Chief Complaint"}</span>
                      <strong className="text-sm font-bold text-slate-900 line-clamp-1 block">
                        {upcomingAppointment.reason || (isVi ? "Tư vấn nguy cơ võng mạc" : "Retinal risk consultation")}
                      </strong>
                      <span className="text-[11px] text-slate-500 block">{isVi ? "Hình thức: Khám chuyên khoa trực tiếp" : "Mode: In-person Consultation"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{isVi ? "Được bảo hiểm y tế & bảo lãnh viện phí hỗ trợ" : "Supported by medical insurance"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCancelAppointment}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
                      >
                        {isVi ? "Hủy Lịch Hẹn" : "Cancel Appointment"}
                      </button>
                      <button
                        onClick={() => onNavigate("consultation")}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {isVi ? "Nhắn Tin Với Bác Sĩ" : "Message Doctor"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-xs">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-4">
                    <CalendarCheck className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">
                    {isVi ? "Chưa có lịch hẹn khám nào sắp tới" : "No upcoming appointments"}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
                    {isVi
                      ? "Chủ động đặt lịch khám chuyên sâu với bác sĩ chuyên khoa mắt & tim mạch để được tư vấn lộ trình chăm sóc sức khỏe vi mạch võng mạc."
                      : "Schedule an in-depth consultation with retinal and cardiovascular specialists for tailored preventive care."}
                  </p>
                  <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    {isVi ? "Đặt Lịch Khám Ngay" : "Schedule Consultation"}
                  </button>
                </div>
              )}

              {/* Consultation History Table */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-teal-600" />
                    {isVi ? "Lịch Sử Các Lần Khám & Đánh Giá Lâm Sàng" : "Past Consultations & Clinical Assessments"}
                  </h3>
                  <span className="text-xs font-mono-data text-slate-500">
                    {isVi ? "Tổng số: " : "Total: "}
                    <strong className="text-slate-800">{scanHistory.length}</strong> {isVi ? "lần" : "records"}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">{isVi ? "Ngày Khám" : "Date"}</th>
                        <th className="p-3.5">{isVi ? "Bác Sĩ / Đơn Vị" : "Doctor / Clinic"}</th>
                        <th className="p-3.5">{isVi ? "Chuyên Khoa" : "Specialty"}</th>
                        <th className="p-3.5">{isVi ? "Chỉ Số Nguy Cơ" : "Risk Score"}</th>
                        <th className="p-3.5">{isVi ? "Trạng Thái" : "Status"}</th>
                        <th className="p-3.5 text-right">{isVi ? "Thao Tác" : "Actions"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {scanHistory.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">
                            {isVi ? "Chưa có dữ liệu lần khám trước." : "No past examination records found."}
                          </td>
                        </tr>
                      ) : (
                        scanHistory.slice(0, 5).map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80">
                            <td className="p-3.5 font-mono-data text-slate-700">
                              {new Date(item.createdAt).toLocaleDateString(isVi ? "vi-VN" : "en-US")}
                            </td>
                            <td className="p-3.5 font-bold text-slate-900">
                              {item.doctorName || assignedDoctorName || (isVi ? "BS. Chuyên Khoa Võng Mạc" : "Retinal Specialist")}
                            </td>
                            <td className="p-3.5 text-slate-600">
                              {isVi ? "Mắt & Mạch Máu" : "Ophthalmology"}
                            </td>
                            <td className="p-3.5 font-mono-data font-bold">
                              <span className={item.riskScore > 60 ? "text-red-600" : item.riskScore > 35 ? "text-amber-600" : "text-emerald-600"}>
                                {item.riskScore}%
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {isVi ? "Hoàn thành" : "Completed"}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => handleOpenReportFromHistory(item)}
                                className="text-xs text-teal-700 hover:text-teal-800 font-bold hover:underline cursor-pointer"
                              >
                                {isVi ? "Xem Phiếu" : "View Report"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column (4 cols): Specialist Directory & Information */}
            <div className="lg:col-span-4 space-y-6">
              {/* Doctor Directory Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  {isVi ? "Bác Sĩ Phụ Trách & Tư Vấn" : "Specialist Profile"}
                </h3>

                <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-100 flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-teal-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {assignedDoctorName ? assignedDoctorName.charAt(0).toUpperCase() : 'BS'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {assignedDoctorName || (isVi ? "Đang chờ phân công bác sĩ" : "Awaiting Doctor Assignment")}
                    </h4>
                    <p className="text-xs text-teal-700 font-medium mt-0.5">
                      {doctorSpecialty || (isVi ? "Chuyên khoa Mắt & Mạch máu võng mạc" : "Retinal Specialist")}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {isVi ? "Sẵn sàng nhận lịch khám" : "Available for booking"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 pt-1">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">{isVi ? "Thời gian làm việc:" : "Consultation Hours:"}</span>
                    <strong className="text-slate-800 font-mono-data">08:00 - 17:30 (T2 - T7)</strong>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">{isVi ? "Hình thức khám:" : "Consultation Mode:"}</span>
                    <strong className="text-slate-800">{isVi ? "Trực tiếp & Từ xa" : "In-Person & Telemedicine"}</strong>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">{isVi ? "Địa điểm cơ sở:" : "Clinic Location:"}</span>
                    <strong className="text-slate-800">{isVi ? "Phòng khám AURA Clinic" : "AURA Clinical Center"}</strong>
                  </div>
                </div>

                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4" />
                  {isVi ? "Đặt Lịch Với Bác Sĩ Này" : "Book Specialist Appointment"}
                </button>
              </div>

              {/* Patient Guidelines & Hotline */}
              <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  {isVi ? "Lưu Ý Trước Khi Khám" : "Pre-Appointment Guide"}
                </h4>
                <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                    <span>{isVi ? "Mang theo kết quả xét nghiệm HbA1c và hồ sơ đo huyết áp gần nhất." : "Bring recent HbA1c and home blood pressure log."}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                    <span>{isVi ? "Hạn chế lái xe nếu có chỉ định nhỏ thuốc giãn đồng tử chụp đáy mắt." : "Avoid driving if pupil dilation drops are scheduled."}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                    <span>{isVi ? "Tổng đài hỗ trợ y tế khẩn cấp 24/7: 1900 6868" : "Emergency clinical helpline: 1900 6868"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: MEDICAL PROFILE - HỒ SƠ Y TẾ (FR-8)
      ========================================================================== */}
      {activeView === "medical-profile" && (
        <div className="w-full max-w-7xl mx-auto space-y-6">
          {isProfileLoading ? (
            <SkeletonProfile />
          ) : isProfileError ? (
            <div className="bg-white p-8 rounded-2xl border border-red-200 shadow-xs flex flex-col items-center justify-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <p className="text-sm font-bold text-slate-800">
                {isVi ? "Không thể tải hồ sơ y tế từ máy chủ." : "Could not load medical profile from server."}
              </p>
              <button
                onClick={fetchProfileData}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> {t('common.retry', isVi ? "Thử lại" : "Retry")}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Top Bar */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center text-xl font-extrabold shadow-xs shrink-0">
                    {patient.fullName ? patient.fullName.charAt(0).toUpperCase() : 'BN'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl font-bold text-slate-900">
                        {patient.fullName}
                      </h2>
                      <span className="font-mono-data text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-200">
                        {patient.mrn || "MRN-N/A"}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        ({patient.age != null ? `${patient.age} ${isVi ? "tuổi" : "yo"}` : (isVi ? "Chưa rõ tuổi" : "Age N/A")} • {patient.gender === "Female" ? (isVi ? "Nữ" : "Female") : patient.gender === "Male" ? (isVi ? "Nam" : "Male") : (isVi ? "Khác" : "Other")})
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                      <span>
                        {isVi ? "Ngày sinh:" : "DOB:"}{" "}
                        <strong className="text-slate-800 font-mono-data">{patient.dateOfBirth || (isVi ? "Chưa cập nhật" : "Not updated")}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        {isVi ? "Cập nhật lần cuối:" : "Last Updated:"}{" "}
                        <strong className="text-slate-800 font-mono-data">
                          {patient.updatedAt
                            ? new Date(patient.updatedAt).toLocaleDateString(isVi ? "vi-VN" : "en-US")
                            : (isVi ? "Hôm nay" : "Today")}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <UserCog className="w-4 h-4" /> {isVi ? "Chỉnh Sửa Hồ Sơ" : "Edit Profile"}
                </button>
              </div>

              {/* 3-Column Patient Cockpit */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1: Demographics & Contact */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <UserCheck className="w-4 h-4 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      {isVi ? "Thông Tin Hành Chính" : "Demographics & Contact"}
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                      <span className="text-slate-500 block text-[11px] font-medium">{isVi ? "Số điện thoại:" : "Phone Number:"}</span>
                      <strong className="text-slate-900 font-mono-data text-sm mt-0.5 block">{patient.phoneNumber || (isVi ? "Chưa cập nhật" : "Not updated")}</strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                      <span className="text-slate-500 block text-[11px] font-medium">{isVi ? "Địa chỉ cư trú:" : "Residential Address:"}</span>
                      <strong className="text-slate-900 text-xs mt-0.5 block">{patient.address || (isVi ? "Chưa cập nhật địa chỉ" : "Not updated")}</strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                      <span className="text-slate-500 block text-[11px] font-medium">{isVi ? "Nhóm máu & Thể trạng:" : "Blood Group & Physical:"}</span>
                      <strong className="text-slate-900 text-xs mt-0.5 block font-mono-data">
                        {patient.bloodType || (isVi ? "Chưa rõ nhóm máu" : "Unknown")} • {patient.weightKg ? `${patient.weightKg} kg` : ''} {patient.heightCm ? `/ ${patient.heightCm} cm` : ''}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                      <span className="text-slate-500 block text-[11px] font-medium">{isVi ? "Người liên hệ khẩn cấp:" : "Emergency Contact:"}</span>
                      <strong className="text-slate-900 text-xs mt-0.5 block">
                        {patient.emergencyContactName
                          ? `${patient.emergencyContactName} (${patient.emergencyContactPhone || (isVi ? "Chưa có SĐT" : "No phone")})`
                          : (isVi ? "Chưa khai báo" : "None provided")}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Column 2: Clinical Vitals & Biomarkers */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Activity className="w-4 h-4 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      {isVi ? "Chỉ Số Sinh Hiệu Lâm Sàng" : "Vitals & Metabolic Markers"}
                    </h3>
                  </div>

                  <div className="space-y-3.5">
                    {/* Blood Pressure */}
                    <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-semibold">{isVi ? "Huyết áp động mạch" : "Blood Pressure"}</span>
                        {patient.systolicBp != null && patient.diastolicBp != null ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            patient.systolicBp >= 140 ? "bg-red-100 text-red-700" : patient.systolicBp >= 130 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {patient.systolicBp >= 140 ? (isVi ? "Tăng HA" : "Stage 2") : patient.systolicBp >= 130 ? (isVi ? "Tiền tăng HA" : "Stage 1") : (isVi ? "Bình thường" : "Normal")}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            {isVi ? "Chưa đo" : "Not measured"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        {patient.systolicBp != null && patient.diastolicBp != null ? (
                          <>
                            <span className="text-2xl font-extrabold font-mono-data text-slate-900">
                              {patient.systolicBp}/{patient.diastolicBp}
                            </span>
                            <span className="text-xs text-slate-500 font-mono-data">mmHg</span>
                          </>
                        ) : (
                          <span className="text-xl font-bold font-mono-data text-slate-400">
                            {isVi ? "Chưa cập nhật" : "Not updated"}
                          </span>
                        )}
                      </div>
                      {/* Range gauge bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            patient.systolicBp != null && patient.diastolicBp != null
                              ? patient.systolicBp >= 140 ? "bg-red-500" : patient.systolicBp >= 130 ? "bg-amber-500" : "bg-emerald-500"
                              : "bg-slate-300"
                          }`}
                          style={{
                            width: patient.systolicBp != null
                              ? `${Math.min(100, Math.max(10, (patient.systolicBp / 180) * 100))}%`
                              : '0%'
                          }}
                        />
                      </div>
                    </div>

                    {/* HbA1c */}
                    <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-semibold">{isVi ? "Đường huyết HbA1c" : "Glycated Hemoglobin (HbA1c)"}</span>
                        {patient.hba1c != null ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            patient.hba1c >= 6.5 ? "bg-red-100 text-red-700" : patient.hba1c >= 5.7 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {patient.hba1c >= 6.5 ? (isVi ? "Đái tháo đường" : "Diabetic") : patient.hba1c >= 5.7 ? (isVi ? "Tiền ĐTĐ" : "Prediabetic") : (isVi ? "Tối ưu" : "Normal")}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            {isVi ? "Chưa đo" : "Not measured"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        {patient.hba1c != null ? (
                          <>
                            <span className="text-2xl font-extrabold font-mono-data text-slate-900">
                              {patient.hba1c}%
                            </span>
                            <span className="text-xs text-slate-500 font-mono-data">{isVi ? "Mục tiêu: < 6.5%" : "Target: < 6.5%"}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xl font-bold font-mono-data text-slate-400">
                              {isVi ? "Chưa cập nhật" : "Not updated"}
                            </span>
                            <span className="text-xs text-slate-400 font-mono-data">({isVi ? "Mục tiêu: < 6.5%" : "Target: < 6.5%"})</span>
                          </>
                        )}
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            patient.hba1c != null
                              ? patient.hba1c >= 6.5 ? "bg-red-500" : patient.hba1c >= 5.7 ? "bg-amber-500" : "bg-emerald-500"
                              : "bg-slate-300"
                          }`}
                          style={{
                            width: patient.hba1c != null
                              ? `${Math.min(100, Math.max(10, (patient.hba1c / 12) * 100))}%`
                              : '0%'
                          }}
                        />
                      </div>
                    </div>

                    {/* Assigned Doctor Card */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                      <span className="text-slate-500 font-medium block">{isVi ? "Bác sĩ phụ trách lâm sàng:" : "Attending Physician:"}</span>
                      <strong className="text-slate-900 font-bold text-sm block">
                        {assignedDoctorName || (isVi ? "Chưa phân công" : "Unassigned")}
                      </strong>
                      <span className="text-[11px] text-slate-500 block">
                        {assignedDoctorName ? doctorSpecialty : (isVi ? "Cơ sở y tế chỉ định" : "Hospital assigned")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Chronic Conditions & Risk Factors */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Heart className="w-4 h-4 text-red-500" />
                    <h3 className="text-sm font-bold text-slate-900">
                      {isVi ? "Bệnh Mạn Tính & Yếu Tố Nguy Cơ" : "Comorbidities & Risk Factors"}
                    </h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                      <span className="font-medium text-slate-700">{isVi ? "Đái tháo đường:" : "Diabetes:"}</span>
                      {renderConditionStatus(
                        patient.hasDiabetes,
                        patient.diabetesType
                          ? `${patient.diabetesType}${patient.diabetesDurationYears ? ` (${patient.diabetesDurationYears}n)` : ""}`
                          : undefined,
                      )}
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                      <span className="font-medium text-slate-700">{isVi ? "Tăng huyết áp:" : "Hypertension:"}</span>
                      {renderConditionStatus(patient.hasHypertension)}
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                      <span className="font-medium text-slate-700">{isVi ? "Hút thuốc lá:" : "Smoking History:"}</span>
                      {renderConditionStatus(patient.historyOfSmoking)}
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                      <span className="font-medium text-slate-700">{isVi ? "Bệnh tim mạch:" : "Cardiovascular:"}</span>
                      {renderConditionStatus(patient.historyOfHeartDisease)}
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                      <span className="font-medium text-slate-700">{isVi ? "Tiền sử đột quỵ:" : "Stroke History:"}</span>
                      {renderConditionStatus(patient.historyOfStroke)}
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                      <span className="font-medium text-slate-700">{isVi ? "Dị ứng thuốc:" : "Allergies:"}</span>
                      <strong className="text-slate-800 text-right truncate max-w-[140px]">
                        {patient.allergies || (isVi ? "Không ghi nhận" : "None")}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3 bg-teal-50/40 rounded-xl border border-teal-100 text-xs space-y-1">
                    <span className="text-teal-900 font-semibold block">{isVi ? "Thuốc đang sử dụng:" : "Current Medications:"}</span>
                    <p className="text-slate-700">
                      {patient.currentMedications || (isVi ? "Chưa khai báo đơn thuốc hiện tại" : "No current medications reported")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 5: SCAN HISTORY & REPORTS (FR-6, FR-7)
      ========================================================================== */}
      {activeView === "scan-history" && (
        <div className="space-y-6">
          <PatientHistoryView
            screenings={scanHistory}
            loading={isHistoryLoading}
            onSelectScreening={handleSelectScreeningForViewer}
            onOpenReportModal={handleOpenReportFromHistory}
            onRefresh={loadScreeningHistory}
            onDeleteScreening={handleDeleteScreening}
            onBatchDeleteScreenings={handleBatchDeleteScreenings}
          />
        </div>
      )}

      {/* =========================================================================
          VIEW 6: IN-APP CONSULTATION CHAT (FR-10) - TELEMEDICINE COCKPIT
      ========================================================================== */}
      {(activeView === "consultation" || activeView === "consultation-chat") && (
        <div className="w-full max-w-7xl mx-auto space-y-6">
          {!assignedDoctorId && !formatDoctorName(patient.assignedDoctor) ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 sm:p-12 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                <Clock className="w-8 h-8" />
              </div>
              <div className="max-w-xl mx-auto space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  {isVi ? "Đang chờ phân công Bác sĩ chuyên khoa" : "Awaiting Specialist Assignment"}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {isVi ? "Kênh Tư Vấn Trực Tuyến Chưa Kích Hoạt" : "Consultation Channel Not Yet Activated"}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {isVi
                    ? "Hồ sơ của bạn đang chờ cơ sở y tế phân công Bác sĩ chuyên khoa Mắt & Tim mạch. Kênh trao đổi trực tiếp sẽ tự động mở ngay khi Bác sĩ phụ trách tiếp nhận hồ sơ."
                    : "Your medical record is awaiting specialist physician assignment. Direct consultation will activate automatically once a specialist is assigned."}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCog className="w-4 h-4" /> {isVi ? "Xem Hồ Sơ Y Tế" : "View Medical Profile"}
                </button>
                <button
                  onClick={() => onNavigate?.("appointment")}
                  className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-teal-200"
                >
                  <CalendarCheck className="w-4 h-4 text-teal-600" /> {isVi ? "Đặt Lịch Khám Chuyên Khoa" : "Book Specialist Appointment"}
                </button>
                <button
                  onClick={fetchProfileData}
                  disabled={isProfileLoading}
                  className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isProfileLoading ? "animate-spin" : ""}`} /> {isVi ? "Kiểm Tra Lại" : "Check Assignment"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-6 text-left border-t border-slate-100">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    {isVi ? "Bảo Mật Chuẩn HIPAA" : "HIPAA Compliant"}
                  </div>
                  <p className="text-xs text-slate-500">
                    {isVi ? "Mọi tin nhắn và hình ảnh y khoa đều được mã hóa đầu cuối an toàn." : "All messages and medical imagery are securely end-to-end encrypted."}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    {isVi ? "Bác Sĩ Chuyên Khoa" : "Certified Specialists"}
                  </div>
                  <p className="text-xs text-slate-500">
                    {isVi ? "Đội ngũ chuyên gia nhãn khoa và tim mạch trực tiếp giải đáp." : "Expert team of ophthalmologists and cardiologists providing guidance."}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Phone className="w-4 h-4 text-teal-600" />
                    {isVi ? "Hỗ Trợ 24/7" : "24/7 Clinical Support"}
                  </div>
                  <p className="text-xs text-slate-500">
                    {isVi ? "Hotline y tế: 1900-6868 sẵn sàng giải đáp thắc mắc của bạn." : "Clinical hotline 1900-6868 ready to assist patient inquiries."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* CỘT 1 (3 COLS): THÔNG TIN BÁC SĨ & GỢI Ý HỎI BÁC SĨ */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                        {formatDoctorName(patient.assignedDoctor, "BS").charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {formatDoctorName(patient.assignedDoctor) || (isVi ? "Bác sĩ phụ trách" : "Assigned Specialist")}
                      </h3>
                      <p className="text-xs text-blue-600 font-medium truncate">
                        {isVi ? "Khoa Mắt & Vi Mạch Võng Mạc" : "Ophthalmology & Retinal Health"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{isVi ? "Trạng thái:" : "Status:"}</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {isVi ? "Đang trực tuyến" : "Online"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{isVi ? "Thời gian phản hồi:" : "Response time:"}</span>
                      <span className="font-semibold text-slate-700">~15-30 {isVi ? "phút" : "mins"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{isVi ? "Cơ sở y tế:" : "Hospital:"}</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[140px] text-right">
                        {(typeof patient.assignedDoctor === 'object' ? patient.assignedDoctor?.organization : null) || (isVi ? "Bệnh viện AURA Clinic" : "AURA Clinic Hospital")}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate?.("appointment")}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
                    {isVi ? "Đặt lịch hẹn trực tiếp" : "Book In-Person Visit"}
                  </button>
                </div>

                {/* Quick Consultation Suggestions */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {isVi ? "Chủ Đề Thường Gặp" : "Quick Topics"}
                  </h4>
                  <div className="space-y-1.5">
                    {[
                      isVi ? "Bác sĩ xem giúp kết quả nguy cơ tim mạch AI" : "Review my AI cardiovascular risk score",
                      isVi ? "Mắt tôi gần đây có hiện tượng mờ và ruồi bay" : "I have recent blurred vision and floaters",
                      isVi ? "Đơn thuốc huyết áp hiện tại có cần điều chỉnh không?" : "Should I adjust my blood pressure medications?",
                      isVi ? "Khi nào tôi nên thực hiện chụp lại đáy mắt?" : "When should I schedule the next retinal scan?",
                    ].map((topic, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewChatText(topic)}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs transition-colors border border-slate-200/60 leading-snug cursor-pointer"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CỘT 2 (6 COLS): KHUNG CHAT TƯ VẤN TRỰC TUYẾN */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[700px]">
                {/* Chat Header */}
                <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xs">
                        BS
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-slate-900 rounded-full"></span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold truncate">
                        {formatDoctorName(patient.assignedDoctor) || (isVi ? "Bác sĩ chuyên khoa" : "Assigned Specialist")}
                      </h3>
                      <p className="text-[11px] text-blue-200 truncate">
                        {isVi ? "Phòng tư vấn từ xa • Bảo mật HIPAA" : "Telemedicine Room • HIPAA Protected"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] bg-slate-800 px-3 py-1 rounded-full text-slate-300 font-mono-data border border-slate-700">
                      MRN: {patient.mrn || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Chat Messages Feed */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/70">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 p-6 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <h4 className="text-sm font-bold text-slate-700">
                          {isVi ? "Bắt đầu cuộc trò chuyện với Bác sĩ" : "Start Conversation with Doctor"}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {t('patient.chat.emptyChat', isVi ? "Chưa có tin nhắn nào. Chọn chủ đề gợi ý bên trái hoặc nhập tin nhắn bên dưới." : "No messages yet. Send a message to start communicating with your doctor.")}
                        </p>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.sender === "patient" ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                            msg.sender === "patient"
                              ? "bg-[#2563EB] text-white rounded-br-xs"
                              : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono-data mt-1 px-1">
                          {msg.time}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={handleSendChatMessage}
                  className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={newChatText}
                    onChange={(e) => setNewChatText(e.target.value)}
                    placeholder={t('patient.chat.placeholder', isVi ? "Nhập câu hỏi hoặc nội dung cần tư vấn với Bác sĩ..." : "Type a consultation message for the doctor...")}
                    className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newChatText.trim()}
                    className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> {t('patient.chat.sendButton', isVi ? "Gửi" : "Send")}
                  </button>
                </form>
              </div>

              {/* CỘT 3 (3 COLS): BÁO CÁO THẨM ĐỊNH & CHỈ SỐ SINH TỒN ĐỒNG THỜI */}
              <div className="lg:col-span-3 space-y-4">
                {/* Screening Snapshot Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    {isVi ? "Dữ Liệu Sàng Lọc Gần Nhất" : "Latest Screening Record"}
                  </h4>

                  {analysisResult ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{isVi ? "Nguy cơ tim mạch:" : "CVD Risk:"}</span>
                          <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                            {analysisResult.cardiovascularRisk?.level || "Moderate"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{isVi ? "Nguy cơ VM ĐTĐ:" : "DR Risk:"}</span>
                          <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                            {analysisResult.diabeticRetinopathyRisk?.level || "Low"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{isVi ? "Tỷ lệ A/V Ratio:" : "A/V Ratio:"}</span>
                          <span className="font-mono font-bold text-slate-800">
                            {analysisResult.annotatedMap?.arteryVeinRatio || "0.48"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsReportModalOpen(true)}
                        className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {isVi ? "Xem chi tiết chẩn đoán" : "View Full Clinical Report"}
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-center space-y-2">
                      <Eye className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-500">
                        {isVi ? "Chưa có dữ liệu sàng lọc vi mạch đáy mắt gần đây." : "No recent retinal screening records."}
                      </p>
                      <button
                        type="button"
                        onClick={() => onNavigate?.("upload-scan")}
                        className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        {isVi ? "Tải ảnh quét ngay →" : "Upload scan now →"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Patient Vitals Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    {isVi ? "Chỉ Số Thể Trạng" : "Physical Vitals"}
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                      <span className="text-slate-600">{isVi ? "Huyết áp (BP):" : "Blood Pressure:"}</span>
                      <strong className="font-mono text-slate-900">
                        {patient.systolicBp && patient.diastolicBp ? `${patient.systolicBp}/${patient.diastolicBp} mmHg` : (isVi ? "Chưa đo" : "Not measured")}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                      <span className="text-slate-600">{isVi ? "Đường huyết (HbA1c):" : "HbA1c:"}</span>
                      <strong className="font-mono text-slate-900">
                        {patient.hba1c ? `${patient.hba1c}%` : (isVi ? "Chưa đo" : "Not measured")}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                      <span className="text-slate-600">{isVi ? "Chỉ số BMI:" : "BMI:"}</span>
                      <strong className="font-mono text-slate-900">
                        {patient.bmi ? `${patient.bmi}` : (isVi ? "Chưa đo" : "Not measured")}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Emergency Warning */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    {isVi ? "Cảnh báo khẩn cấp" : "Emergency Notice"}
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    {isVi
                      ? "Nếu xuất hiện mất thị lực đột ngột hoặc đau nhức mắt dữ dội, hãy đến cơ sở y tế gần nhất hoặc gọi cấp cứu 115 ngay."
                      : "If experiencing acute loss of vision or severe eye pain, visit the nearest emergency facility or call 115 immediately."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 7: BILLING & CREDITS (FR-11, FR-12) - FULL DESKTOP COCKPIT
      ========================================================================== */}
      {activeView === "billing" && (
        <div className="w-full max-w-7xl mx-auto space-y-6">
          {/* Header Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-teal-50 text-teal-700">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {isVi ? "Gói Cước & Quản Lý Lượt Khám" : "Packages & Screening Quota"}
                </h2>
                <p className="text-xs text-slate-500">
                  {isVi
                    ? "Theo dõi số lượt khám võng mạc AI còn lại, mua gói dịch vụ và xem lịch sử giao dịch."
                    : "Track remaining AI screening credits, manage subscription tiers, and view payment history."}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedCreditPackageId(undefined);
                setIsCreditModalOpen(true);
              }}
              className="px-5 py-2.5 bg-[#0F766E] hover:bg-[#0D655E] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <CreditCard className="w-4 h-4" /> {isVi ? "Mua Thêm Lượt Khám" : "Buy Screening Credits"}
            </button>
          </div>

          {/* 4 KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200/80 shadow-xs">
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                {isVi ? "Lượt Khám Còn Lại" : "Available Credits"}
              </span>
              <div className="mt-2 text-3xl font-extrabold text-teal-700 font-mono-data">
                {userCredits}{" "}
                <span className="text-sm font-semibold text-slate-600">
                  {isVi ? "lượt" : "credits"}
                </span>
              </div>
              <p className="mt-1 text-xs text-teal-800 font-medium">
                {isVi ? "Sẵn sàng phân tích ảnh đáy mắt" : "Ready for fundus scans"}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isVi ? "Gói Đang Hoạt Động" : "Active Packages"}
              </span>
              <div className="mt-2 text-3xl font-extrabold text-slate-800 font-mono-data">
                {subscriptions.filter((s) => s.status === "ACTIVE").length}{" "}
                <span className="text-sm font-semibold text-slate-500">
                  {isVi ? "gói" : "packages"}
                </span>
              </div>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">
                {isVi ? "Tự động cộng dồn khi mua thêm" : "Accumulates automatically"}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isVi ? "Tổng Ca Sàng Lọc" : "Completed Scans"}
              </span>
              <div className="mt-2 text-3xl font-extrabold text-blue-600 font-mono-data">
                {scanHistory.length}{" "}
                <span className="text-sm font-semibold text-slate-500">
                  {isVi ? "lần" : "times"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {isVi ? "Lưu trữ hồ sơ y tế trọn đời" : "Lifetime clinical archive"}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isVi ? "Cổng Thanh Toán" : "Payment Gateways"}
              </span>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg text-xs font-bold border border-teal-200 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-teal-600" />
                  VietQR Napas 24/7
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {isVi ? "Kích hoạt tức thì sau chuyển khoản" : "Instant activation via QR"}
              </p>
            </div>
          </div>

          {/* Recommended Subscription Tiers - Synchronized with Database & CreditPurchaseModal */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              {isVi ? "Các Gói Dịch Vụ Sàng Lọc AURA" : "AURA Screening Packages"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {availablePackages.map((pkg: any) => {
                const pkgId = Number(pkg.id);
                const scansCount = Number(pkg.credits || 1);
                const priceVnd = Number(pkg.price ?? 0);
                const validityDays = Number(pkg.validityDays || 30);
                const isPopular = pkgId === 2 || scansCount === 5;
                const features = getClinicalFeatures(scansCount, isVi);
                const displayTitle = isVi
                  ? pkg.name
                  : scansCount === 1
                  ? "Basic Package (Single Scan)"
                  : scansCount === 5
                  ? "Standard Package (Personal)"
                  : scansCount === 15
                  ? "Family Package (Periodic)"
                  : pkg.name;

                return (
                  <div
                    key={pkgId}
                    className={
                      isPopular
                        ? "bg-white rounded-2xl border-2 border-teal-600 p-5 shadow-sm flex flex-col justify-between space-y-4 relative"
                        : "bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
                    }
                  >
                    {isPopular && (
                      <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-[#0F766E] text-white text-[10px] font-extrabold uppercase tracking-wide">
                        {isVi ? "Phổ Biến Nhất" : "Most Popular"}
                      </span>
                    )}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {displayTitle}
                        </span>
                      </div>
                      <div className="text-2xl font-extrabold text-[#0F766E] font-mono-data">
                        {priceVnd.toLocaleString("vi-VN")}{" "}
                        <span className="text-xs font-semibold text-slate-500">
                          {isVi ? "VNĐ" : "VND"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          +{scansCount} {isVi ? "lượt phân tích" : "scans"}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {validityDays} {isVi ? "ngày" : "days"}
                        </span>
                      </div>
                      <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                        {features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCreditPackageId(pkgId);
                        setIsCreditModalOpen(true);
                      }}
                      className={
                        isPopular
                          ? "w-full py-2.5 bg-[#0F766E] hover:bg-[#0D655E] text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                          : "w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      }
                    >
                      {isVi ? "Chọn gói này" : "Select Package"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Subscriptions Sub-table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-600" /> {isVi ? "Gói Đang Sử Dụng" : "Active Packages"}
            </h3>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">{isVi ? "Tên Gói Dịch Vụ" : "Package Name"}</th>
                    <th className="p-3.5">{isVi ? "Số Lượt Còn Lại" : "Remaining Credits"}</th>
                    <th className="p-3.5">{isVi ? "Hạn Sử Dụng" : "Expiration Date"}</th>
                    <th className="p-3.5">{isVi ? "Trạng Thái" : "Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {isBillingLoading && subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        <Loader2 className="w-5 h-5 text-teal-600 animate-spin mx-auto mb-2" />
                        <span className="text-xs">{isVi ? "Đang tải gói dịch vụ..." : "Loading packages..."}</span>
                      </td>
                    </tr>
                  ) : subscriptions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-6 text-center text-slate-400"
                      >
                        {isVi
                          ? "Chưa có gói dịch vụ nào đang kích hoạt. Hãy bấm Mua Thêm Lượt Khám để nạp thêm."
                          : "No active packages. Click Buy Screening Credits to top up."}
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80">
                        <td className="p-3.5 font-bold text-slate-900">
                          {sub.servicePackageName}
                        </td>
                        <td className="p-3.5 font-mono text-teal-700 font-extrabold text-sm">
                          {sub.remainingCredits} {isVi ? "lượt" : "credits"}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">
                          {sub.expiresAt
                            ? new Date(sub.expiresAt).toLocaleDateString(
                                isVi ? "vi-VN" : "en-US",
                              )
                            : "--"}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {sub.status === "ACTIVE"
                              ? (isVi ? "ĐANG SỬ DỤNG" : "ACTIVE")
                              : sub.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Transactions History */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-700" /> {isVi ? "Lịch Sử Giao Dịch Thanh Toán" : "Payment & Billing History"}
              </h3>
              <button
                onClick={() => loadBillingData(false)}
                disabled={isBillingLoading}
                className="text-xs text-teal-700 hover:underline flex items-center gap-1 font-bold cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isBillingLoading ? "animate-spin text-teal-600" : ""}`} /> {t('common.actions.refresh', isVi ? "Làm mới" : "Refresh")}
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">{isVi ? "Mã Giao Dịch" : "Transaction Ref"}</th>
                    <th className="p-3.5">{isVi ? "Thời Gian" : "Date & Time"}</th>
                    <th className="p-3.5">{isVi ? "Gói Dịch Vụ" : "Service Package"}</th>
                    <th className="p-3.5">{isVi ? "Cổng Thanh Toán" : "Gateway"}</th>
                    <th className="p-3.5">{isVi ? "Số Tiền" : "Amount"}</th>
                    <th className="p-3.5">{isVi ? "Trạng Thái" : "Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {isBillingLoading && paymentHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        <Loader2 className="w-5 h-5 text-teal-600 animate-spin mx-auto mb-2" />
                        <span className="text-xs">{isVi ? "Đang nạp lịch sử giao dịch..." : "Loading transaction history..."}</span>
                      </td>
                    </tr>
                  ) : paymentHistory.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-6 text-center text-slate-400"
                      >
                        {isVi ? "Chưa có lịch sử giao dịch thanh toán nào." : "No payment transaction history yet."}
                      </td>
                    </tr>
                  ) : (
                    paymentHistory.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="p-3.5 font-mono font-bold text-teal-800">
                          {item.providerReference || `TXN-${item.id}`}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString(isVi ? "vi-VN" : "en-US")
                            : "--"}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {item.servicePackageName}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-mono text-[10px] font-bold">
                            {item.provider === "VIETQR" || item.provider === "VNPAY" || !item.provider
                              ? "VietQR Napas 24/7"
                              : item.provider}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-extrabold text-slate-900">
                          {Number(item.amount).toLocaleString(isVi ? "vi-VN" : "en-US")} {isVi ? "đ" : "VND"}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              item.status === "SUCCEEDED"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300"
                            }`}
                          >
                            {item.status === "SUCCEEDED"
                              ? (isVi ? "THÀNH CÔNG" : "SUCCEEDED")
                              : item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 8: NOTIFICATIONS (FE-NAV-1) - CATEGORIZED NOTIFICATION COCKPIT
      ========================================================================== */}
      {(activeView === "notifications" || effectiveActiveView === "notifications") && (
        <div className="w-full max-w-7xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-slate-900">
                    {isVi ? "Trung Tâm Thông Báo Lâm Sàng & Hệ Thống" : "Clinical & System Notifications"}
                  </h2>
                  {unreadNotifCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold font-mono-data">
                      {unreadNotifCount} {isVi ? "chưa đọc" : "unread"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isVi
                    ? "Cập nhật tiến trình phân tích AI, thẩm định từ Bác sĩ chuyên khoa và nhắc nhở y tế"
                    : "Real-time updates on AI analyses, specialist clinical reviews, and health reminders"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadPortalNotifications()}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                title={isVi ? "Làm mới" : "Refresh"}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNotifications ? "animate-spin" : ""}`} />
                <span>{isVi ? "Làm mới" : "Refresh"}</span>
              </button>
              {unreadNotifCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllNotifsAsRead}
                  className="px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl border border-blue-200 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  {isVi ? "Đánh dấu tất cả đã đọc" : "Mark all as read"}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* CỘT TRÁI (8 COLS): DANH SÁCH THÔNG BÁO THEO DANH MỤC */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setNotifFilterTab('ALL')}
                  className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    notifFilterTab === 'ALL'
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {isVi ? "Tất cả" : "All"} ({portalNotifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilterTab('UNREAD')}
                  className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    notifFilterTab === 'UNREAD'
                      ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {isVi ? "Chưa đọc" : "Unread"} ({unreadNotifCount})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilterTab('AI')}
                  className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    notifFilterTab === 'AI'
                      ? 'bg-teal-50 text-teal-700 font-bold border border-teal-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {isVi ? "Kết quả AI" : "AI Results"}
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilterTab('DOCTOR')}
                  className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    notifFilterTab === 'DOCTOR'
                      ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {isVi ? "Bác sĩ thẩm định" : "Doctor Reviews"}
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilterTab('SYSTEM')}
                  className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    notifFilterTab === 'SYSTEM'
                      ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {isVi ? "Hệ thống & Lịch hẹn" : "System & Appts"}
                </button>
              </div>

              {/* Notification List */}
              <div className="divide-y divide-slate-100">
                {isLoadingNotifications ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Loader2 className="w-7 h-7 text-blue-500 animate-spin mx-auto" />
                    <p className="text-xs font-medium">
                      {isVi ? "Đang đồng bộ thông báo từ hệ thống..." : "Synchronizing notifications..."}
                    </p>
                  </div>
                ) : filteredPortalNotifications.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Bell className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {isVi ? "Không có thông báo nào" : "No notifications found"}
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {isVi
                        ? "Bạn sẽ nhận được thông báo tức thời khi kết quả phân tích AI sẵn sàng hoặc bác sĩ chuyên khoa gửi đánh giá."
                        : "You will receive real-time updates when AI analysis completes or clinical reviews are issued."}
                    </p>
                  </div>
                ) : (
                  paginatedPortalNotifications.map((notif) => {
                    const isUnread = !notif.isRead && !notif.read;
                    const notifId = String(notif.id || "");
                    const timeStr = formatRelativeTime(notif.createdAt || notif.timestamp || Date.now(), isVi);
                    const displayTitle = notif.title || (isVi ? "Thông báo hệ thống" : "System Notification");
                    const displayMsg = notif.message || "";

                    const getNotifIcon = (type?: string, severity?: string) => {
                      const tUpper = String(type || '').toUpperCase();
                      const sUpper = String(severity || '').toUpperCase();

                      if (sUpper === 'CRITICAL' || tUpper.includes('ALERT') || tUpper.includes('CRITICAL')) {
                        return (
                          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 border border-rose-200">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                        );
                      }
                      if (tUpper.includes('AI') || tUpper.includes('SCAN') || tUpper.includes('ANALYSIS')) {
                        return (
                          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5 border border-teal-200">
                            <Sparkles className="w-5 h-5" />
                          </div>
                        );
                      }
                      if (tUpper.includes('DOCTOR') || tUpper.includes('REVIEW')) {
                        return (
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                        );
                      }
                      if (tUpper.includes('APPOINTMENT')) {
                        return (
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
                            <CalendarCheck className="w-5 h-5" />
                          </div>
                        );
                      }
                      if (tUpper.includes('CHAT') || tUpper.includes('CONSULT') || tUpper.includes('MESSAGE')) {
                        return (
                          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 mt-0.5 border border-cyan-200">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                        );
                      }
                      if (tUpper.includes('BILLING') || tUpper.includes('CREDIT')) {
                        return (
                          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5 border border-purple-200">
                            <CreditCard className="w-5 h-5" />
                          </div>
                        );
                      }
                      return (
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 border border-blue-200">
                          <Bell className="w-5 h-5" />
                        </div>
                      );
                    };

                    return (
                      <div
                        key={notifId || Math.random()}
                        onClick={() => handleNotifClick(notif)}
                        className={`py-4 first:pt-0 flex flex-col sm:flex-row items-start justify-between gap-4 p-3 rounded-xl transition-all cursor-pointer ${
                          isUnread
                            ? "bg-blue-50/50 hover:bg-blue-50/80 border border-blue-100"
                            : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {getNotifIcon(notif.type, notif.severity)}
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`text-sm ${isUnread ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                                {displayTitle}
                              </h4>
                              {isUnread && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                                  {isVi ? "Mới" : "New"}
                                </span>
                              )}
                              {notif.type && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono-data">
                                  {notif.type}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {displayMsg}
                            </p>
                            <span className="text-[11px] text-slate-400 font-mono-data block">
                              {timeStr}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotifClick(notif);
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isVi ? "Xem chi tiết" : "View"}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          {isUnread ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleMarkNotifAsRead(notifId);
                              }}
                              title={isVi ? "Đánh dấu đã đọc" : "Mark as read"}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleMarkNotifAsUnread(notifId);
                              }}
                              title={isVi ? "Đánh dấu chưa đọc" : "Mark as unread"}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeleteNotif(notifId);
                            }}
                            title={isVi ? "Xóa thông báo" : "Delete notification"}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Notification Pagination */}
              {filteredPortalNotifications.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <Pagination
                    currentPage={notifCurrentPage}
                    totalPages={totalNotifPages}
                    totalItems={filteredPortalNotifications.length}
                    pageSize={notifPageSize}
                    pageSizeOptions={[5, 10, 20, 50]}
                    onPageChange={setNotifCurrentPage}
                    onPageSizeChange={(sz) => {
                      setNotifPageSize(sz);
                      setNotifCurrentPage(1);
                    }}
                    itemLabel={isVi ? "thông báo" : "notifications"}
                  />
                </div>
              )}
            </div>

            {/* CỘT PHẢI (4 COLS): TÙY CHỌN THÔNG BÁO & NHẮC NHỞ ĐỊNH KỲ */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  {isVi ? "Kênh Nhận Thông Báo" : "Notification Channels"}
                </h3>
                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <span>{isVi ? "Thông báo trong ứng dụng" : "In-App Alerts"}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">{isVi ? "BẬT" : "ON"}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <span>{isVi ? "Email kết quả chẩn đoán" : "Email Reports"}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">{isVi ? "BẬT" : "ON"}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <span>{isVi ? "SMS cảnh báo nguy cơ cao" : "Urgent SMS Alerts"}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">{isVi ? "BẬT" : "ON"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <Clock className="w-4 h-4 text-blue-600" />
                  {isVi ? "Nhắc Nhở Khám Định Kỳ" : "Screening Cadence"}
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  {isVi
                    ? "Hiệp hội Tim mạch & Nhãn khoa khuyến nghị người bệnh tăng huyết áp hoặc tiểu đường nên tầm soát vi mạch đáy mắt 3-6 tháng/lần."
                    : "Cardiology and Ophthalmology guidelines recommend screening retinal microvasculature every 3-6 months for patients with hypertension or diabetes."}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate?.("upload-scan")}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {isVi ? "Tầm Soát Ngay" : "Start Screening Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      {analysisResult && (
        <MedicalReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          patient={patient}
          result={analysisResult}
          doctorName={formatDoctorName(patient.assignedDoctor) || undefined}
        />
      )}

      <ConsultationChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        currentUserRole="patient"
        patientName={patient.fullName || "Bệnh nhân"}
        patientMrn={patient.mrn || "Chưa có MRN"}
        doctorName={formatDoctorName(patient.assignedDoctor) || undefined}
        partnerName={formatDoctorName(patient.assignedDoctor) || undefined}
        partnerUserId={assignedDoctorId || undefined}
        currentUserId={user?.id}
      />

      <CreditPurchaseModal
        isOpen={isCreditModalOpen}
        onClose={() => {
          setIsCreditModalOpen(false);
          setSelectedCreditPackageId(undefined);
        }}
        userRole="patient"
        initialPackageId={selectedCreditPackageId}
        currentCredit={userCredits}
        patientMrn={patient.mrn || "AUR9842"}
        onSuccess={(added) => {
          setUserCredits((prev) => prev + added);
          loadBillingData();
          realtimeBus.emit('credit:change', { added });
        }}
        onPurchaseSuccess={(newCredits) => {
          setUserCredits(newCredits);
          loadBillingData();
          realtimeBus.emit('credit:change', { total: newCredits });
        }}
      />

      <MedicalProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        patient={patient}
        onSave={(updated) => {
          if (updated) {
            const safeDoc = formatDoctorName(updated.assignedDoctor, formatDoctorName(patient.assignedDoctor, ''));
            setPatient({
              ...updated,
              assignedDoctor: safeDoc || null,
            });
            if (updated.fullName) {
              updateUser({ name: updated.fullName });
            }
            realtimeBus.emit('profile:update', updated);
          }
        }}
      />

      <AppointmentBookingModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        patient={patient}
        onSuccess={handleAppointmentSuccess}
      />
    </div>
  );
};
