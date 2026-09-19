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
import { CreditPurchaseModal } from "../components/CreditPurchaseModal";
import { MedicalProfileModal } from "../components/MedicalProfileModal";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAnalysisProgress } from "../hooks/useAnalysisProgress";
import {
  AIRiskResult,
  FundusAnalysisRequest,
  PatientProfile,
} from "../types/cds";
import { screeningApi, chatApi, billingApi, patientApi, notificationApi } from "../services/api";
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
} from "lucide-react";
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
  onNavigate?: (viewId: string) => void;
}

export const PatientPortalPage: React.FC<PatientPortalPageProps> = ({
  user,
  activeView = "dashboard",
  onNavigate = () => undefined,
}) => {
  const { t, isVi } = useLanguage();
  const { updateUser } = useAuth();
  const prefersReducedMotion = useAuraReducedMotion();
  const [patient, setPatient] = useState<PatientProfile>({
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

  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(true);
  const [isProfileError, setIsProfileError] = useState<boolean>(false);

  const [analysisResult, setAnalysisResult] = useState<AIRiskResult | null>(
    null,
  );
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
  const [userCredits, setUserCredits] = useState(0);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [upcomingAppointment, setUpcomingAppointment] = useState<{
    doctorName: string;
    doctorId?: string;
    date: string;
    time: string;
    reason?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem("aura_patient_upcoming_appointment");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleAppointmentSuccess = async (details: {
    doctorName: string;
    doctorId: string;
    date: string;
    time: string;
    reason: string;
  }) => {
    setUpcomingAppointment(details);
    try {
      localStorage.setItem("aura_patient_upcoming_appointment", JSON.stringify(details));
    } catch (e) {
      console.warn("Could not save appointment:", e);
    }
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

  const loadBillingData = async () => {
    try {
      const [subRes, payRes] = await Promise.all([
        billingApi.mySubscriptions(),
        billingApi.myPayments(),
      ]);
      if (subRes.success && Array.isArray(subRes.data)) {
        setSubscriptions(subRes.data);
        const total = subRes.data
          .filter((s: any) => s.status === "ACTIVE")
          .reduce((sum: number, s: any) => sum + (s.remainingCredits || 0), 0);
        setUserCredits(total);
      }
      if (payRes.success && Array.isArray(payRes.data)) {
        setPaymentHistory(payRes.data);
      }
    } catch (e) {
      console.warn("Could not load billing data:", e);
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
  const loadScreeningHistory = async () => {
    try {
      setIsHistoryLoading(true);
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
            doctorReviewed: item.status === "REVIEWED",
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

        // Tự động load kết quả sàng lọc mới nhất lên Viewer
        const latest = rawList[0];
        if (latest && latest.status !== "FAILED") {
          setAnalysisResult(mapScreeningToAIRiskResult(latest, latest.imageUrl));
        } else if (!latest) {
          setAnalysisResult(null);
        }
      } else {
        setScanHistory([]);
        setAnalysisResult(null);
      }
    } catch (e) {
      console.warn("Could not fetch screenings from DB:", e);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleDeleteScreening = async (id: string) => {
    setScanHistory((prev) => prev.filter((s) => s.id !== id && s.rawId !== id));
    try {
      const res = await screeningApi.delete(id);
      if (res && res.success === false && res.code !== "NOT_FOUND") {
        console.warn("Screening delete API response:", res.message);
        throw new Error(res.message || (isVi ? "Không thể xóa ca khám" : "Failed to delete screening"));
      }
      realtimeBus.emit('screening:deleted', { id });
    } catch (err) {
      console.warn("Screening delete error:", err);
      throw err;
    }
  };

  const handleBatchDeleteScreenings = async (ids: string[]) => {
    const idSet = new Set(ids);
    setScanHistory((prev) => prev.filter((s) => !idSet.has(s.id) && !idSet.has(s.rawId || "")));
    try {
      const res = await screeningApi.batchDelete(ids);
      if (res && res.success === false) {
        console.warn("Screening batch delete API response:", res.message);
        throw new Error(res.message || (isVi ? "Không thể xóa các ca khám đã chọn" : "Failed to delete selected screenings"));
      }
      realtimeBus.emit('screening:deleted', { ids });
    } catch (err) {
      console.warn("Screening batch delete error:", err);
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

  // Load real history and chat messages from PostgreSQL on mount in parallel
  useEffect(() => {
    const fetchRealData = async () => {
      await Promise.allSettled([
        loadScreeningHistory(),
        fetchProfileData(),
        billingApi.mySubscriptions().then((subscriptions) => {
          if (subscriptions.success && Array.isArray(subscriptions.data)) {
            setUserCredits(
              subscriptions.data.reduce(
                (total: number, item: any) =>
                  total +
                  (item.status === "ACTIVE"
                    ? Number(item.remainingCredits || 0)
                    : 0),
                0,
              ),
            );
          }
        }),
      ]);
    };
    fetchRealData();
  }, []);

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
    ],
    async (event?: RealtimeEvent) => {
      const type = event?.type || '';
      if (type.startsWith('billing') || type.startsWith('credit')) {
        await loadBillingData();
      } else if (type.startsWith('profile') || type.startsWith('doctor:assignment')) {
        await fetchProfileData();
      } else {
        await loadScreeningHistory();
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
    { pollIntervalMs: 12000, syncOnFocus: true }
  );

  // Real-time synchronization for Patient consultation view via WebSocket STOMP (FR-10, FR-20)
  useEffect(() => {
    if (!user?.id) return;

    stompClient.connect();
    const chatTopic = `/topic/chat.${user.id}`;
    const screeningTopic = `/topic/screening.${user.id}`;
    const notifTopic = `/topic/notifications.${user.id}`;

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

    if (activeView === "consultation" && assignedDoctorId) {
      chatApi.markAsRead(assignedDoctorId).catch(() => {});
    }

    return () => {
      unsubChat();
      unsubScreening();
      unsubNotif();
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

        // Cập nhật lịch sử khám trực tiếp từ PostgreSQL (FR-6)
        await loadScreeningHistory();

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
        <div className="max-w-4xl mx-auto space-y-6">
          <PatientUploadWizard
            activePatient={patient}
            onStartAnalysis={handleStartAnalysis}
            isAnalyzing={isAnalyzing}
            analysisProgress={analysisProgress}
            analysisError={analysisErrorMsg}
            userCredits={userCredits}
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
        <div className="space-y-6">
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
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
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
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-teal-600" />
                {isVi ? "Lịch Hẹn Khám Bác Sĩ Chuyên Khoa" : "Specialist Appointments"}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isVi
                  ? "Đặt lịch và theo dõi cuộc hẹn khám chuyên sâu với bác sĩ mắt & tim mạch."
                  : "Schedule and track consultations with ophthalmologists & cardiologists."}
              </p>
            </div>
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              {isVi ? "Đặt Lịch Khám Mới" : "Book New Appointment"}
            </button>
          </div>

          {upcomingAppointment ? (
            <div className="bg-white p-6 rounded-2xl border border-teal-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    {isVi ? "Cuộc hẹn sắp tới (Đã xác nhận)" : "Upcoming Confirmed Appointment"}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200">
                  {isVi ? "Đã lên lịch" : "Scheduled"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs block">{isVi ? "Bác sĩ phụ trách" : "Doctor"}</span>
                  <strong className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    {upcomingAppointment.doctorName}
                  </strong>
                  <span className="text-[11px] text-slate-400 block">{isVi ? "Chuyên khoa Mắt & Mạch Máu" : "Ophthalmology & Vascular"}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs block">{isVi ? "Thời gian hẹn" : "Date & Time"}</span>
                  <strong className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-teal-600" />
                    {upcomingAppointment.time} - {upcomingAppointment.date}
                  </strong>
                  <span className="text-[11px] text-slate-400 block">{isVi ? "Thời lượng dự kiến: 30 phút" : "Est. duration: 30 mins"}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs block">{isVi ? "Lý do khám" : "Chief Complaint"}</span>
                  <strong className="text-sm font-bold text-slate-900 line-clamp-1">
                    {upcomingAppointment.reason || (isVi ? "Tư vấn nguy cơ võng mạc" : "Retinal risk consultation")}
                  </strong>
                  <span className="text-[11px] text-slate-400 block">{isVi ? "Hình thức: Khám chuyên khoa" : "In-person clinic"}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setUpcomingAppointment(null);
                    localStorage.removeItem("aura_patient_upcoming_appointment");
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
                >
                  {isVi ? "Hủy Lịch Hẹn" : "Cancel"}
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
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-4">
                <CalendarCheck className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                {isVi ? "Chưa có lịch hẹn khám nào" : "No appointments scheduled"}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                {isVi
                  ? "Bạn có thể chủ động đặt lịch khám chuyên sâu với bác sĩ phụ trách để được tư vấn chi tiết về kết quả mạch máu võng mạc."
                  : "Book a consultation with a specialist doctor to evaluate your retinal vascular screening results."}
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
        </div>
      )}

      {/* =========================================================================
          VIEW 4: MEDICAL PROFILE - HỒ SƠ Y TẾ (FR-8)
      ========================================================================== */}
      {activeView === "medical-profile" && (
        <div className="max-w-4xl mx-auto space-y-6">
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
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-teal-50 text-teal-700">
                    <UserCog className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {isVi ? "Hồ Sơ Y Tế Cá Nhân" : "Medical Profile"}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>
                        {isVi ? "Mã BN" : "MRN"}:{" "}
                        <strong className="text-teal-700 font-mono-data">
                          {patient.mrn || (isVi ? "Chưa có" : "None")}
                        </strong>
                      </span>
                      <span className="text-slate-400 font-mono-data">
                        •{" "}
                        {patient.updatedAt
                          ? `${isVi ? "Cập nhật" : "Updated"}: ${new Date(patient.updatedAt).toLocaleDateString(isVi ? "vi-VN" : "en-US")}`
                          : (isVi ? "Chưa cập nhật" : "Not updated")}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <UserCog className="w-4 h-4" /> {isVi ? "Chỉnh Sửa" : "Edit Profile"}
                </button>
              </div>

              {/* Profile Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">{isVi ? "Họ và tên:" : "Full Name:"}</span>
                  <strong className="text-slate-900 text-sm">
                    {patient.fullName}
                  </strong>
                  <span className="text-[11px] text-slate-500 block mt-0.5 font-mono-data">
                    {patient.dateOfBirth
                      ? `${isVi ? "NS" : "DOB"}: ${patient.dateOfBirth}`
                      : (isVi ? "Chưa cập nhật ngày sinh" : "DOB not updated")}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">
                    {isVi ? "Tuổi & Giới tính:" : "Age & Gender:"}
                  </span>
                  <strong className="text-slate-900 text-sm">
                    {patient.age != null
                      ? `${patient.age} ${isVi ? "tuổi" : "yrs"}`
                      : (isVi ? "Chưa cập nhật" : "Not updated")}{" "}
                    •{" "}
                    {patient.gender === "Male"
                      ? (isVi ? "Nam" : "Male")
                      : patient.gender === "Female"
                        ? (isVi ? "Nữ" : "Female")
                        : (isVi ? "Khác" : "Other")}
                  </strong>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">
                    {isVi ? "Nhóm máu & SĐT:" : "Blood Type & Phone:"}
                  </span>
                  <strong className="text-slate-900 text-sm">
                    {patient.bloodType || (isVi ? "Chưa cập nhật" : "Not updated")} •{" "}
                    {patient.phoneNumber || (isVi ? "Chưa cập nhật" : "Not updated")}
                  </strong>
                  <span
                    className="text-[11px] text-slate-500 block mt-0.5 truncate"
                    title={patient.address || (isVi ? "Chưa cập nhật" : "Not updated")}
                  >
                    {isVi ? "Đ/C" : "Addr"}: {patient.address || (isVi ? "Chưa cập nhật" : "Not updated")}
                  </span>
                </div>
              </div>

              {/* Clinical Vitals */}
              <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-4">
                <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-700" /> {isVi ? "Chỉ Số Sinh Hiệu Lâm Sàng" : "Vital Signs & Biomarkers"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-xl border border-teal-200 shadow-xs">
                    <span className="text-slate-500 block text-xs">
                      {isVi ? "Huyết áp" : "Blood Pressure"}
                    </span>
                    {patient.systolicBp != null &&
                    patient.diastolicBp != null ? (
                      <>
                        <span className="text-2xl font-extrabold font-mono-data text-slate-900">
                          {patient.systolicBp}/{patient.diastolicBp}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          mmHg
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-base font-bold text-slate-400 block mt-1">
                          {isVi ? "Chưa đo" : "Unmeasured"}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {isVi ? "Cập nhật khi đo" : "Update when measured"}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-teal-200 shadow-xs">
                    <span className="text-slate-500 block text-xs">
                      {isVi ? "Chỉ số HbA1c" : "HbA1c Index"}
                    </span>
                    {patient.hba1c != null ? (
                      <>
                        <span className="text-2xl font-extrabold font-mono-data text-amber-700">
                          {patient.hba1c}%
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {isVi ? "Đường huyết 3 tháng" : "3-month glucose"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-base font-bold text-slate-400 block mt-1">
                          {isVi ? "Chưa xét nghiệm" : "Not tested"}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {isVi ? "Chưa có kết quả" : "No test data"}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-teal-200 shadow-xs">
                    <span className="text-slate-500 block text-xs">
                      {t('patient.chat.assignedDoctor', isVi ? "Bác sĩ phụ trách" : "Assigned doctor")}
                    </span>
                    <span className="text-sm font-bold text-slate-800 line-clamp-1 mt-1">
                      {assignedDoctorName || (isVi ? "Chưa phân công" : "Unassigned")}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {assignedDoctorName ? doctorSpecialty : (isVi ? "Bệnh viện chỉ định" : "Hospital assigned")}
                    </span>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">{isVi ? "Trạng thái:" : "Status:"}</span>
                      <StatusBadge
                        status={reviewStatus.status}
                        label={reviewStatus.label}
                        variant={reviewStatus.variant}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Conditions */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" /> {isVi ? "Tiền Sử Bệnh Mạn Tính" : "Chronic Conditions"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span>{isVi ? "Đái tháo đường:" : "Diabetes:"}</span>
                    {renderConditionStatus(
                      patient.hasDiabetes,
                      patient.diabetesType
                        ? `${patient.diabetesType}${patient.diabetesDurationYears ? ` - ${patient.diabetesDurationYears} ${isVi ? "năm" : "yrs"}` : ""}`
                        : undefined,
                    )}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span>{isVi ? "Tăng huyết áp:" : "Hypertension:"}</span>
                    {renderConditionStatus(patient.hasHypertension)}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span>{isVi ? "Hút thuốc lá:" : "Smoking:"}</span>
                    {renderConditionStatus(patient.historyOfSmoking)}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span>{isVi ? "Bệnh tim mạch:" : "Cardiovascular:"}</span>
                    {renderConditionStatus(patient.historyOfHeartDisease)}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span>{isVi ? "Tiền sử đột quỵ:" : "Stroke history:"}</span>
                    {renderConditionStatus(patient.historyOfStroke)}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span>{isVi ? "Dị ứng:" : "Allergies:"}</span>
                    <strong
                      className="text-slate-800 truncate max-w-[120px]"
                      title={patient.allergies || (isVi ? "Chưa khai báo" : "Unspecified")}
                    >
                      {patient.allergies || (isVi ? "Chưa khai báo" : "Unspecified")}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Medications & Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-semibold block">
                    {isVi ? "Thuốc đang dùng:" : "Medications:"}
                  </span>
                  <p className="text-slate-800">
                    {patient.currentMedications || (isVi ? "Chưa khai báo" : "Unspecified")}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-semibold block">
                    {isVi ? "Liên hệ khẩn cấp:" : "Emergency contact:"}
                  </span>
                  <p className="text-slate-800">
                    {patient.emergencyContactName
                      ? `${patient.emergencyContactName} (${patient.emergencyContactPhone || (isVi ? "Chưa có SĐT" : "No phone")})`
                      : (isVi ? "Chưa khai báo" : "Unspecified")}
                  </p>
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
          VIEW 6: IN-APP CONSULTATION CHAT (FR-10)
      ========================================================================== */}
      {(activeView === "consultation" || activeView === "consultation-chat") && (
        <div className="max-w-4xl mx-auto space-y-6">
          {!assignedDoctorId && !formatDoctorName(patient.assignedDoctor) ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <Clock className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  {isVi ? "Đang chờ phân công" : "Awaiting assignment"}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {isVi ? "Chưa Có Bác Sĩ Phụ Trách" : "No Assigned Doctor"}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isVi
                    ? "Hồ sơ của bạn đang chờ cơ sở y tế phân công Bác sĩ chuyên khoa. Kênh tư vấn sẽ tự động kích hoạt khi có Bác sĩ phụ trách."
                    : "Your profile is awaiting physician assignment. Direct consultation will activate automatically once assigned."}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCog className="w-4 h-4" /> {isVi ? "Xem Hồ Sơ" : "View Profile"}
                </button>
                <button
                  onClick={fetchProfileData}
                  disabled={isProfileLoading}
                  className="px-4 py-2 bg-[#3478F6] hover:bg-[#2563EB] text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isProfileLoading ? "animate-spin" : ""}`} /> {isVi ? "Làm Mới" : "Refresh"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[650px]">
              {/* Chat Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">
                      BS
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">
                      {formatDoctorName(patient.assignedDoctor) || (isVi ? "Bác sĩ phụ trách" : "Assigned doctor")}
                    </h3>
                    <p className="text-[11px] text-cyan-200">
                      {isVi ? "Khoa Mắt & Tim Mạch • Trực Tuyến" : "Ophthalmology & Cardiology • Online"}
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300 font-mono-data">
                  {isVi ? "Hồ sơ" : "MRN"}: {patient.mrn || (isVi ? "Chưa có MRN" : "No MRN")}
                </span>
              </div>

              {/* Chat Body Messages */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-300" />
                    <p className="text-xs">{t('patient.chat.emptyChat', isVi ? "Chưa có tin nhắn nào. Nhập tin nhắn bên dưới để trao đổi với Bác sĩ." : "No messages yet. Send a message to start communicating with your doctor.")}</p>
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
                            ? "bg-[#3478F6] text-white rounded-br-none"
                            : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
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
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={newChatText}
                  onChange={(e) => setNewChatText(e.target.value)}
                  placeholder={t('patient.chat.placeholder', isVi ? "Nhập tin nhắn trao đổi với Bác sĩ..." : "Type a consultation message for the doctor...")}
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3478F6] outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#3478F6] hover:bg-[#2563EB] text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> {t('patient.chat.sendButton', isVi ? "Gửi" : "Send")}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 7: BILLING & CREDITS (FR-11, FR-12)
      ========================================================================== */}
      {activeView === "billing" && (
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-3.5 rounded-2xl bg-cyan-50 text-cyan-700">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {isVi ? "Gói Cước & Lượt Khám" : "Packages & Credits"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isVi
                      ? "Xem số lượt khám còn lại và lịch sử mua gói."
                      : "View remaining credits and purchase history."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreditModalOpen(true)}
                className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4" /> {isVi ? "Mua Thêm Lượt" : "Buy Credits"}
              </button>
            </div>

            {/* Quota Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 border border-teal-200/80">
                <span className="text-xs font-bold text-cyan-900 uppercase tracking-wider">
                  {isVi ? "Lượt Còn Lại" : "Available Credits"}
                </span>
                <div className="mt-2 text-3xl font-extrabold text-teal-700 font-mono-data">
                  {userCredits}{" "}
                  <span className="text-sm font-semibold text-slate-600">
                    {isVi ? "Lượt" : "Credits"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {isVi ? "Áp dụng cho mọi ảnh chụp mắt" : "Applicable for all eye scans"}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isVi ? "Gói Đang Dùng" : "Active Packages"}
                </span>
                <div className="mt-2 text-2xl font-extrabold text-slate-800 font-mono-data">
                  {subscriptions.filter((s) => s.status === "ACTIVE").length}{" "}
                  <span className="text-sm font-semibold text-slate-500">
                    {isVi ? "Gói" : "Packages"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-emerald-600 font-semibold">
                  {isVi ? "Cộng dồn khi mua thêm" : "Accumulates on purchase"}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isVi ? "Cổng Thanh Toán" : "Payment Gateways"}
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg text-xs font-bold border border-teal-200 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-teal-600" />
                    VietQR Napas 24/7
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  {isVi ? "Kích hoạt tức thì sau chuyển khoản" : "Instantly activated"}
                </p>
              </div>
            </div>

            {/* Active Subscriptions Sub-table */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> {isVi ? "Gói Đang Sử Dụng" : "Active Packages"}
              </h3>
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">{isVi ? "Tên Gói" : "Package Name"}</th>
                      <th className="p-3.5">{isVi ? "Số Lượt Còn Lại" : "Remaining Credits"}</th>
                      <th className="p-3.5">{isVi ? "Hạn Sử Dụng" : "Expiration Date"}</th>
                      <th className="p-3.5">{isVi ? "Trạng Thái" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {subscriptions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-6 text-center text-slate-400"
                        >
                          {isVi
                            ? "Chưa có gói dịch vụ nào. Hãy bấm Mua Thêm Lượt để nạp thêm."
                            : "No active packages. Click Buy Credits to top up."}
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
                                ? (isVi ? "ĐANG DÙNG" : "ACTIVE")
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
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-700" /> {isVi ? "Lịch Sử Nạp Tiền" : "Payment History"}
                </h3>
                <button
                  onClick={loadBillingData}
                  className="text-xs text-cyan-700 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> {t('common.actions.refresh', isVi ? "Làm mới" : "Refresh")}
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">{isVi ? "Mã Giao Dịch" : "Transaction Ref"}</th>
                      <th className="p-3.5">{isVi ? "Thời Gian" : "Date & Time"}</th>
                      <th className="p-3.5">{isVi ? "Gói Dịch Vụ" : "Service Package"}</th>
                      <th className="p-3.5">{isVi ? "Cổng" : "Gateway"}</th>
                      <th className="p-3.5">{isVi ? "Số Tiền" : "Amount"}</th>
                      <th className="p-3.5">{isVi ? "Trạng Thái" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {paymentHistory.length === 0 ? (
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
                          <td className="p-3.5 font-mono font-bold text-cyan-800">
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
        </div>
      )}

      {/* =========================================================================
          VIEW 8: NOTIFICATIONS (FE-NAV-1)
      ========================================================================== */}
      {activeView === "notifications" && (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {isVi ? "Trung Tâm Thông Báo" : "Notification Center"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isVi
                      ? "Cập nhật tiến trình phân tích AI, kết quả thẩm định và nhắc nhở y tế"
                      : "Real-time updates on AI analysis, clinical reviews, and health reminders"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void notificationApi.markAllAsRead().then(() => {
                      realtimeBus.emit('NOTIFICATION_CLEARED', { remainingUnread: 0 });
                    });
                  }}
                  className="px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl border border-blue-200 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isVi ? "Đánh dấu tất cả đã đọc" : "Mark all as read"}
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {isVi ? "Sàng lọc võng mạc vi mạch AI" : "AI Retinal Vascular Screening"}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {isVi
                        ? "Hệ thống AI sẵn sàng phân tích ảnh chụp đáy mắt và tính toán nguy cơ tim mạch - đột quỵ."
                        : "AI system is ready to analyze fundus images and compute cardiovascular/stroke risk."}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {isVi ? "Hệ thống AURA" : "AURA System"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate?.("upload-scan")}
                  className="px-3.5 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg shrink-0 cursor-pointer"
                >
                  {isVi ? "Tải ảnh mới" : "Upload Scan"}
                </button>
              </div>

              <div className="py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {isVi ? "Lịch sử & Kết quả sàng lọc" : "Screening Results & History"}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {isVi
                        ? "Theo dõi tiến trình đánh giá của bác sĩ chuyên khoa và tải báo cáo y tế định dạng PDF."
                        : "Track specialist clinical review progress and download official PDF medical reports."}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {isVi ? "Hồ sơ y bạ điện tử" : "Electronic Medical Records"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate?.("scan-history")}
                  className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg shrink-0 cursor-pointer"
                >
                  {isVi ? "Xem kết quả" : "View Results"}
                </button>
              </div>

              <div className="py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {isVi ? "Lịch hẹn tư vấn chuyên khoa" : "Specialist Teleconsultation"}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {isVi
                        ? "Đăng ký lịch trao đổi trực tuyến với bác sĩ chuyên khoa mắt và tim mạch."
                        : "Schedule an online consultation with ophthalmology and cardiovascular specialists."}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {isVi ? "Tư vấn từ xa" : "Teleconsultation"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate?.("appointment")}
                  className="px-3.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg shrink-0 cursor-pointer"
                >
                  {isVi ? "Đặt lịch hẹn" : "Book Appointment"}
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
        onClose={() => setIsCreditModalOpen(false)}
        userRole="patient"
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
