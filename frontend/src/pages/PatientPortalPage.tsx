import React, { useState, useEffect } from "react";
import { UserSession } from "../types/auth";
import { PatientUploader } from "../components/PatientUploader";
import { InteractiveCDSViewer } from "../components/InteractiveCDSViewer";
import { ClinicalRiskSummaryCard } from "../components/ClinicalRiskSummaryCard";
import { PatientDashboardView } from "../features/patient/PatientDashboardView";
import { PatientHistoryView, PatientHistoryItem } from "../features/patient/PatientHistoryView";
import { MedicalReportModal } from "../components/MedicalReportModal";
import { ConsultationChatModal } from "../components/ConsultationChatModal";
import { CreditPurchaseModal } from "../components/CreditPurchaseModal";
import { MedicalProfileModal } from "../components/MedicalProfileModal";
import { useAnalysisProgress } from "../hooks/useAnalysisProgress";
import {
  AIRiskResult,
  FundusAnalysisRequest,
  PatientProfile,
} from "../types/cds";
import { screeningApi, chatApi, billingApi, patientApi } from "../services/api";
import {
  Eye,
  Heart,
  Activity,
  Download,
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
} from "lucide-react";
import { mapScreeningToAIRiskResult, parseIcd10Codes } from "../services/screeningMapper";
import { useLanguage } from "../context/LanguageContext";

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
  const [userCredits, setUserCredits] = useState(0);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  // In-app chat messages for dedicated consultation view
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [assignedDoctorId, setAssignedDoctorId] = useState<string | null>(null);
  const [newChatText, setNewChatText] = useState("");

  // Scan History
  const [scanHistory, setScanHistory] = useState<PatientHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);

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
          assignedDoctor: profileRes.data.assignedDoctor || null,
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
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: PatientHistoryItem[] = res.data.map((item: any) => {
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
        const latest = res.data[0];
        if (latest && latest.status !== "FAILED") {
          setAnalysisResult(mapScreeningToAIRiskResult(latest, latest.imageUrl));
        }
      } else {
        setScanHistory([]);
      }
    } catch (e) {
      console.warn("Could not fetch screenings from DB:", e);
    } finally {
      setIsHistoryLoading(false);
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
    onNavigate("cds-viewer");
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

  // Load real history and chat messages from PostgreSQL on mount
  useEffect(() => {
    const fetchRealData = async () => {
      await loadScreeningHistory();

      // Fetch profile
      await fetchProfileData();

      const subscriptions = await billingApi.mySubscriptions();
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
    };
    fetchRealData();
  }, []);

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

        // Trigger AI Ready Notification
        setShowAiNotification(true);
        setTimeout(() => setShowAiNotification(false), 7000);

        // Navigate to CDS Viewer automatically
        onNavigate("cds-viewer");
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
        <div className="fixed top-20 right-6 z-50 max-w-md bg-white border border-emerald-200 rounded-xl p-4 shadow-medical-modal animate-slideInRight flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">
                {isVi ? "Thông Báo AI Sẵn Sàng (FR-9)" : "AI Analysis Ready (FR-9)"}
              </h4>
              <span className="text-[10px] text-emerald-600 font-mono-data font-semibold">
                {isVi ? "Vừa xong" : "Just now"}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-snug">
              {isVi
                ? `Ảnh võng mạc của bạn đã được phân tích hoàn tất! Điểm rủi ro tổng hợp: `
                : `Your retinal scan analysis is complete! Overall vascular risk score: `}
              <strong className="text-slate-900 font-bold font-mono-data">
                {analysisResult.overallVascularRiskScore}/100
              </strong>
              .
            </p>
          </div>
          <button
            onClick={() => setShowAiNotification(false)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
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

      {/* Top Patient Hero Banner */}
      <div className="bg-white border border-clinical-border shadow-medical-card rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        {/* Subtle Brand Accent Stripe on Top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-600 via-brand-500 to-teal-500" />

        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center font-bold text-xl shadow-medical-xs shrink-0">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-clinical-text">
                {patient.fullName}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-clinical-text-secondary font-semibold font-mono-data border border-clinical-border">
                {patient.mrn || (isVi ? "Chưa có MRN" : "No MRN")}
              </span>
            </div>
            <p className="text-xs text-clinical-text-muted mt-1.5 flex flex-wrap items-center gap-3">
              <span>
                {t('patient.chat.assignedDoctor', isVi ? "Bác sĩ phụ trách" : "Assigned doctor")}:{" "}
                <strong className="text-clinical-text-secondary font-semibold">
                  {patient.assignedDoctor || (isVi ? "Đang chờ phân công bác sĩ" : "Awaiting doctor assignment")}
                </strong>
              </span>
              <span>
                {isVi ? "Lần khám gần nhất" : "Last exam"}:{" "}
                <strong className="text-clinical-text-secondary font-semibold font-mono-data">
                  {patient.lastExamDate || (isVi ? "Chưa có lần khám" : "No previous exam")}
                </strong>
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {isVi ? "Khám Định Kỳ Võng Mạc" : "Periodic Retinal Screening"}
              </span>
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleUploadNewScanClick}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" /> {t('patient.dashboard.quickActions.uploadScan', isVi ? "Tải Ảnh Khám Mới" : "Upload new scan")}
          </button>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="px-4 py-2.5 bg-clinical-surface-subtle hover:bg-slate-100 text-clinical-text-secondary font-bold rounded-xl text-xs border border-clinical-border transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UserCog className="w-4 h-4" /> {t('navigation.medicalProfile', isVi ? "Hồ Sơ Y Tế" : "Medical Profile")}
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: DASHBOARD TỔNG QUAN
      ========================================================================== */}
      {activeView === "dashboard" && (
        <PatientDashboardView
          patient={patient}
          latestResult={analysisResult}
          userCredits={userCredits}
          onNavigate={onNavigate}
          onOpenCreditModal={() => setIsCreditModalOpen(true)}
          onOpenChatModal={() => setIsChatModalOpen(true)}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />
      )}

      {/* =========================================================================
          VIEW 2: UPLOAD SCAN - PHÂN TÍCH ẢNH MỚI (FR-2)
      ========================================================================== */}
      {activeView === "upload-scan" && (
        <div className="max-w-4xl mx-auto space-y-6">
          <PatientUploader
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
          VIEW 3: CDS VIEWER - TRỰC QUAN HÓA & HEATMAP (FR-4)
      ========================================================================== */}
      {activeView === "cds-viewer" && (
        <div className="space-y-6">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#0891B2]" />
                {isVi ? "Bản Đồ Soi Vùng Tổn Thương Võng Mạc" : "Retinal Vascular Lesion Inspection Map"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isVi
                  ? "Kéo thanh trượt để so sánh ảnh chụp gốc với các vùng màu AI phát hiện bất thường."
                  : "Adjust the slider to compare the original fundus scan with AI anomaly heatmap."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-3.5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> {t('patient.history.exportReport', isVi ? "Xuất Báo Cáo" : "Export Report")}
              </button>
            </div>
          </div>

          {analysisResult ? (
            <div className="space-y-6">
              <InteractiveCDSViewer
                analysisResult={analysisResult}
                selectedEye={
                  analysisResult.eyePosition === "Left_OS" || analysisResult.eyePosition === "OS"
                    ? (isVi ? "OS (Mắt Trái)" : "OS (Left Eye)")
                    : (isVi ? "OD (Mắt Phải)" : "OD (Right Eye)")
                }
              />
              <ClinicalRiskSummaryCard
                analysisResult={analysisResult}
                onOpenFullReport={() => setIsReportModalOpen(true)}
                onConsultDoctor={() => {
                  if (assignedDoctorId) {
                    onNavigate("consultation-chat");
                  } else {
                    setIsChatModalOpen(true);
                  }
                }}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              {isVi ? "Chưa có kết quả phân tích thật. Hãy tải ảnh võng mạc để bắt đầu." : "No active screening results. Please upload a retinal scan to begin."}
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
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="text-sm font-bold text-slate-700">
                {isVi ? "Đang tải hồ sơ y tế..." : "Loading medical profile..."}
              </p>
              <p className="text-xs text-slate-400">
                {isVi ? "Vui lòng chờ trong giây lát" : "Please wait a moment"}
              </p>
            </div>
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
                      {isVi ? "Hồ Sơ Y Tế & Tiền Sử Bệnh Cá Nhân" : "Medical Profile & Clinical History"}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>
                        {isVi ? "Mã bệnh nhân" : "Patient ID"}:{" "}
                        <strong className="text-teal-700 font-mono-data">
                          {patient.mrn || (isVi ? "Chưa có MRN" : "No MRN")}
                        </strong>
                      </span>
                      <span className="text-slate-400 font-mono-data">
                        •{" "}
                        {patient.updatedAt
                          ? `${isVi ? "Cập nhật lần cuối" : "Last updated"}: ${new Date(patient.updatedAt).toLocaleString(isVi ? "vi-VN" : "en-US")}`
                          : (isVi ? "Chưa có cập nhật" : "Not updated")}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <UserCog className="w-4 h-4" /> {isVi ? "Chỉnh Sửa Thông Tin" : "Edit Profile"}
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
                  <Activity className="w-4 h-4 text-teal-700" /> {isVi ? "Chỉ Số Sinh Hiệu & Lâm Sàng Gần Nhất" : "Latest Vital Signs & Clinical Biomarkers"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-xl border border-teal-200 shadow-xs">
                    <span className="text-slate-500 block text-xs">
                      {isVi ? "Huyết áp (Systolic/Diastolic)" : "Blood Pressure (Systolic/Diastolic)"}
                    </span>
                    {patient.systolicBp != null &&
                    patient.diastolicBp != null ? (
                      <>
                        <span className="text-2xl font-extrabold font-mono-data text-slate-900">
                          {patient.systolicBp}/{patient.diastolicBp}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {isVi ? "mmHg (Chỉ số đo gần nhất)" : "mmHg (Latest measurement)"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-base font-bold text-slate-400 block mt-1">
                          {isVi ? "Chưa đo" : "Unmeasured"}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {isVi ? "Vui lòng cập nhật khi có kết quả đo" : "Please update when measured"}
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
                          {isVi ? "Đường huyết trung bình 3 tháng" : "3-month average blood glucose"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-base font-bold text-slate-400 block mt-1">
                          {isVi ? "Chưa đo" : "Unmeasured"}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {isVi ? "Chưa có dữ liệu xét nghiệm máu" : "No lab blood test data"}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-teal-200 shadow-xs">
                    <span className="text-slate-500 block text-xs">
                      {t('patient.chat.assignedDoctor', isVi ? "Bác sĩ phụ trách" : "Assigned doctor")}
                    </span>
                    <span className="text-sm font-bold text-slate-800 line-clamp-1 mt-1">
                      {patient.assignedDoctor || (isVi ? "Chưa được phân công" : "Unassigned")}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {isVi ? "Chỉ định bởi bệnh viện" : "Hospital assigned"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Medical Conditions */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" /> {isVi ? "Tiền Sử Bệnh Lý Mạn Tính" : "Chronic Medical Conditions"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span>{isVi ? "Đái tháo đường:" : "Diabetes Mellitus:"}</span>
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
                    <span>{isVi ? "Hút thuốc lá:" : "Tobacco smoking:"}</span>
                    {renderConditionStatus(patient.historyOfSmoking)}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span>{isVi ? "Bệnh tim mạch:" : "Cardiovascular disease:"}</span>
                    {renderConditionStatus(patient.historyOfHeartDisease)}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span>{isVi ? "Tiền sử đột quỵ:" : "History of stroke:"}</span>
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
                    {isVi ? "Thuốc đang điều trị:" : "Current medications:"}
                  </span>
                  <p className="text-slate-800">
                    {patient.currentMedications || (isVi ? "Chưa khai báo" : "Unspecified")}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-semibold block">
                    {isVi ? "Người liên hệ khẩn cấp:" : "Emergency contact:"}
                  </span>
                  <p className="text-slate-800">
                    {patient.emergencyContactName
                      ? `${patient.emergencyContactName} (${patient.emergencyContactPhone || (isVi ? "Chưa cập nhật SĐT" : "No phone")})`
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
          />
        </div>
      )}

      {/* =========================================================================
          VIEW 6: IN-APP CONSULTATION CHAT (FR-10)
      ========================================================================== */}
      {activeView === "consultation" && (
        <div className="max-w-4xl mx-auto space-y-6">
          {!assignedDoctorId && !patient.assignedDoctor ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <Clock className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  {isVi ? "Đang chờ tiếp nhận" : "Awaiting assignment"}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {isVi ? "Chưa Được Chỉ Định Bác Sĩ Phụ Trách" : "No Assigned Specialist Doctor Yet"}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isVi
                    ? "Hồ sơ sức khỏe của bạn hiện đang chờ Ban Quản trị hoặc Phòng khám phân công Bác sĩ chuyên khoa Mắt & Tim mạch phụ trách. Sau khi có Bác sĩ được chỉ định, cổng tư vấn trực tiếp sẽ tự động được kích hoạt tại đây."
                    : "Your clinical profile is awaiting physician assignment by the clinic or system administration. Once assigned, direct consultation will activate here automatically."}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <UserCog className="w-4 h-4" /> {isVi ? "Kiểm Tra Hồ Sơ Y Tế" : "Check Medical Profile"}
                </button>
                <button
                  onClick={fetchProfileData}
                  disabled={isProfileLoading}
                  className="px-4 py-2.5 bg-[#0891B2] hover:bg-[#0E7490] text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isProfileLoading ? "animate-spin" : ""}`} /> {isVi ? "Cập Nhật Trạng Thái" : "Refresh Status"}
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
                      {patient.assignedDoctor || (isVi ? "Bác sĩ phụ trách" : "Assigned doctor")}
                    </h3>
                    <p className="text-[11px] text-cyan-200">
                      {isVi ? "Khoa Mắt & Tim Mạch Lâm Sàng • Trực Tuyến" : "Ophthalmology & Cardiology • Online"}
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
                    <p className="text-xs">{t('patient.chat.emptyChat', isVi ? "Chưa có tin nhắn nào. Hãy gửi tin nhắn để bắt đầu trao đổi với Bác sĩ." : "No messages yet. Send a message to start communicating with your doctor.")}</p>
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
                            ? "bg-[#0891B2] text-white rounded-br-none"
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
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0891B2] outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#0891B2] hover:bg-[#0E7490] text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
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
                    {isVi ? "Quản Lý Gói Dịch Vụ & Lượt Phân Tích (FR-11, FR-12)" : "Service Packages & Credit Management (FR-11, FR-12)"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isVi
                      ? "Theo dõi số lượt phân tích thị giác AI, gói cước kích hoạt và lịch sử thanh toán qua cổng VNPay / MoMo."
                      : "Track AI vision screening quota, active packages and payment history via VNPay / MoMo."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreditModalOpen(true)}
                className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4" /> {isVi ? "Mua Hoặc Gia Hạn Gói" : "Purchase or Renew Package"}
              </button>
            </div>

            {/* Quota Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 border border-teal-200/80">
                <span className="text-xs font-bold text-cyan-900 uppercase tracking-wider">
                  {isVi ? "Tổng Lượt Phân Tích Khả Dụng" : "Total Available Credits"}
                </span>
                <div className="mt-2 text-3xl font-extrabold text-teal-700 font-mono-data">
                  {userCredits}{" "}
                  <span className="text-sm font-semibold text-slate-600">
                    {isVi ? "Lượt" : "Credits"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {isVi ? "Áp dụng cho mọi phân tích ảnh võng mạc OD/OS" : "Applicable for all bilateral OD/OS retinal scans"}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isVi ? "Gói Đang Hoạt Động" : "Active Subscriptions"}
                </span>
                <div className="mt-2 text-2xl font-extrabold text-slate-800 font-mono-data">
                  {subscriptions.filter((s) => s.status === "ACTIVE").length}{" "}
                  <span className="text-sm font-semibold text-slate-500">
                    {isVi ? "Gói" : "Packages"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-emerald-600 font-semibold">
                  {isVi ? "Tự động cộng dồn khi gia hạn" : "Automatically accumulates on renewal"}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isVi ? "Cổng Thanh Toán Hỗ Trợ" : "Supported Payment Gateways"}
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-blue-50 text-[#005BAA] rounded-lg text-xs font-bold border border-blue-200">
                    VNPay QR
                  </span>
                  <span className="px-2.5 py-1 bg-pink-50 text-[#A50064] rounded-lg text-xs font-bold border border-pink-200">
                    Ví MoMo
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  {isVi ? "Tự động kích hoạt ngay sau thanh toán" : "Instantly activated upon payment"}
                </p>
              </div>
            </div>

            {/* Active Subscriptions Sub-table */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> {isVi ? "Danh Sách Gói Thuê Bao Đã Mua" : "Purchased Subscription Packages"}
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
                            ? "Chưa đăng ký gói dịch vụ nào. Hãy nhấn Mua Thêm Gói để nạp lượt phân tích."
                            : "No active subscription packages. Click Purchase Package to recharge screening credits."}
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

            {/* Payment Transactions History (FR-12) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-700" /> {isVi ? "Lịch Sử Thanh Toán & Giao Dịch Hóa Đơn (FR-12)" : "Payment & Billing Transaction History (FR-12)"}
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
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                              {item.provider || "VNPAY"}
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

      {/* Modals */}
      {analysisResult && (
        <MedicalReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          patient={patient}
          result={analysisResult}
          doctorName={patient.assignedDoctor || undefined}
        />
      )}

      <ConsultationChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        currentUserRole="patient"
        patientName={patient.fullName || "Bệnh nhân"}
        patientMrn={patient.mrn || "Chưa có MRN"}
        doctorName={patient.assignedDoctor || undefined}
        partnerName={patient.assignedDoctor || undefined}
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
        }}
        onPurchaseSuccess={(newCredits) => {
          setUserCredits(newCredits);
          loadBillingData();
        }}
      />

      <MedicalProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        patient={patient}
        onSave={(updated) => setPatient(updated)}
      />
    </div>
  );
};
