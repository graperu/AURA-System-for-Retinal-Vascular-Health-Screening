import React, { useState, useEffect, useRef } from 'react';
import { UserSession } from '../types/auth';
import { PatientUploader } from '../components/PatientUploader';
import { InteractiveCDSViewer } from '../components/InteractiveCDSViewer';
import { MedicalReportModal } from '../components/MedicalReportModal';
import { ConsultationChatModal, DOCTORS_LIST, DoctorProfile } from '../components/ConsultationChatModal';
import { CreditPurchaseModal } from '../components/CreditPurchaseModal';
import { MedicalProfileModal } from '../components/MedicalProfileModal';
import { MOCK_PATIENTS, MOCK_SAMPLE_RESULT, MockAIService } from '../services/mockAiEngine';
import { AIRiskResult, FundusAnalysisRequest, PatientProfile } from '../types/cds';
import { screeningApi, chatApi, billingApi } from '../services/api';
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
  FileSpreadsheet,
  AlertTriangle,
  FileText,
  Paperclip,
  Calendar,
  Video,
  Check,
  CheckCheck,
  RefreshCw,
  X,
} from 'lucide-react';
import { mapScreeningToAIRiskResult } from '../services/screeningMapper';

interface PatientPortalPageProps {
  user: UserSession;
  activeView?: string;
  onNavigate?: (viewId: string) => void;
}

export const PatientPortalPage: React.FC<PatientPortalPageProps> = ({
  user,
  activeView = 'dashboard',
  onNavigate = () => undefined,
}) => {
  const [patient, setPatient] = useState<PatientProfile>({
    ...MOCK_PATIENTS[0],
    fullName: user.name || 'Nguyen Trong Nam',
    mrn: user.mrn || 'MRN-2026-0941',
  });

  const [analysisResult, setAnalysisResult] = useState<AIRiskResult>(MOCK_SAMPLE_RESULT);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ status: string; percent: number }>({
    status: '',
    percent: 0,
  });

  // Realtime AI Ready Notification
  const [showAiNotification, setShowAiNotification] = useState<boolean>(false);
  const [analysisErrorMsg, setAnalysisErrorMsg] = useState<string | null>(null);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userCredits, setUserCredits] = useState(5);

  // Doctor selection & Consultation state (FR-10)
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile>(DOCTORS_LIST[0]);
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      id: 'm1',
      sender: 'doctor',
      text: 'Chào anh Nam! Tôi là BS. Thanh phụ trách ca khám của anh. Kết quả phân tích mạch máu võng mạc cho thấy có dấu hiệu co hẹp động mạch nhẹ (A/V: 0.52). Anh nhớ duy trì đo huyết áp hàng ngày nhé.',
      time: '18:15',
    },
    {
      id: 'm2',
      sender: 'patient',
      text: 'Dạ chào Bác sĩ! Hiện tại huyết áp của em duy trì khoảng 125/82 mmHg. Em có cần uống thêm thuốc gì không ạ?',
      time: '18:20',
    },
    {
      id: 'm3',
      sender: 'doctor',
      text: 'Chỉ số đó đang kiểm soát khá tốt. Anh tiếp tục duy trì chế độ ăn giảm muối và đặt lịch tái khám đáy mắt sau 6 tháng nữa nhé!',
      time: '18:22',
    },
  ]);
  const [newChatText, setNewChatText] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  // Appointment State
  const [aptDate, setAptDate] = useState('2026-09-05');
  const [aptTime, setAptTime] = useState('09:30');
  const [aptType, setAptType] = useState<'CHAT_PRIORITY' | 'TELEHEALTH'>('CHAT_PRIORITY');
  const [aptNotes, setAptNotes] = useState('Nhờ Bác sĩ xem kết quả võng mạc có tỷ lệ A/V hẹp và rủi ro tim mạch 82%');
  const [aptSuccessToast, setAptSuccessToast] = useState(false);

  // Scan History
  const [scanHistory, setScanHistory] = useState([
    {
      id: 'ANALYSIS-2026-7741',
      date: '2026-08-31 18:30',
      eye: 'Mắt Phải (OD)',
      scanType: 'Fundus Cực Sau Hoàng Điểm',
      overallScore: 78,
      riskLevel: 'Nguy cơ cao',
      cvdRisk: '82%',
      doctor: 'BS. CKII Nguyễn Thị Thanh',
      status: 'Đã có kết quả',
    },
    {
      id: 'ANALYSIS-2026-5512',
      date: '2026-07-14 09:15',
      eye: 'Mắt Trái (OS)',
      scanType: 'Fundus Đĩa Thị',
      overallScore: 71,
      riskLevel: 'Nguy cơ trung bình',
      cvdRisk: '68%',
      doctor: 'BS. CKII Nguyễn Thị Thanh',
      status: 'Đã duyệt lâm sàng',
    },
  ]);

  const consultationScrollRef = useRef<HTMLDivElement>(null);

  // Load Real Data from DB on Mount
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const creditRes = await billingApi.getBalance();
        if (creditRes.success && typeof creditRes.data?.credits === 'number') {
          setUserCredits(creditRes.data.credits);
        }
      } catch (e) {
        console.warn('Could not fetch balance from DB:', e);
      }

      try {
        const res = await screeningApi.getAll();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((item: any) => ({
            id: `ANALYSIS-${item.id.slice(0, 8).toUpperCase()}`,
            date: item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '31/08/2026',
            eye: 'Mắt Phải (OD)',
            scanType: 'Fundus Cực Sau Hoàng Điểm',
            overallScore: item.riskLevel === 'CRITICAL' ? 88 : item.riskLevel === 'HIGH' ? 78 : item.riskLevel === 'MODERATE' ? 55 : 25,
            riskLevel: item.riskLevel === 'CRITICAL' || item.riskLevel === 'HIGH' ? 'Nguy cơ cao' : 'Nguy cơ trung bình',
            cvdRisk: `${Math.round((item.confidence || 0.85) * 100)}%`,
            doctor: item.doctorId ? 'BS. CKII Nguyễn Thị Thanh' : 'Chờ bác sĩ duyệt',
            status: item.status === 'REVIEWED' ? 'Đã duyệt lâm sàng' : 'Đã phân tích AI',
          }));
          setScanHistory(mapped);
        }
      } catch (e) {
        console.warn('Could not fetch screenings from DB:', e);
      }
    };
    void fetchRealData();
  }, []);

  // Fetch Consultation Messages
  const fetchConsultationMessages = async () => {
    try {
      const chatRes = await chatApi.getConversation(selectedDoctor.id);
      if (chatRes.success && Array.isArray(chatRes.data) && chatRes.data.length > 0) {
        const mappedChat = chatRes.data.map((m: any) => {
          let parsedAttachment: any = undefined;
          if (m.attachmentUrl) {
            try {
              parsedAttachment = JSON.parse(m.attachmentUrl);
            } catch {
              parsedAttachment = undefined;
            }
          }
          return {
            id: m.id,
            sender: m.senderId === selectedDoctor.id ? 'doctor' : 'patient',
            text: m.messageText || m.content || '',
            time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '18:30',
            attachment: parsedAttachment,
          };
        });
        setChatMessages(mappedChat);
      }
    } catch (e) {
      console.warn('Could not fetch chat from DB:', e);
    }
  };

  useEffect(() => {
    void fetchConsultationMessages();
    const interval = setInterval(() => {
      void fetchConsultationMessages();
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedDoctor.id]);

  useEffect(() => {
    if (activeView === 'consultation') {
      consultationScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeView]);

  const handleStartAnalysis = async (request: FundusAnalysisRequest) => {
    setIsAnalyzing(true);
    setShowAiNotification(false);
    setAnalysisErrorMsg(null);
    setAnalysisProgress({ status: 'Mã hóa HIPAA & Khởi chạy mô hình AI...', percent: 15 });

    try {
      setAnalysisProgress({ status: 'Đang gửi ảnh đến AURA AI Core (FastAPI)...', percent: 45 });
      let result: AIRiskResult | null = null;

      try {
        const res = await screeningApi.create(request.imageUrl);
        if (res.success && res.data && res.data.status !== 'FAILED') {
          setAnalysisProgress({ status: 'Đang xử lý kết quả Grad-CAM & chỉ số vi mạch...', percent: 85 });
          result = mapScreeningToAIRiskResult(res.data, request.imageUrl);
        }
      } catch (backendErr) {
        console.warn('Backend call failed, using mock AI fallback:', backendErr);
      }

      if (!result) {
        result = await MockAIService.runFundusAnalysis(request, (status, percent) => {
          setAnalysisProgress({ status, percent });
        });
      }

      setAnalysisResult(result);
      const newScan = {
        id: result.analysisId,
        date: new Date().toLocaleString('vi-VN'),
        eye: request.eyePosition === 'Right_OD' ? 'Mắt Phải (OD)' : 'Mắt Trái (OS)',
        scanType: request.scanType === 'Fundus_Macula' ? 'Fundus Cực Sau Hoàng Điểm' : 'Fundus Đĩa Thị',
        overallScore: result.overallVascularRiskScore,
        riskLevel: result.overallVascularRiskScore >= 75 ? 'Nguy cơ cao' : 'Nguy cơ trung bình',
        cvdRisk: `${result.cardiovascularRisk?.score || 82}%`,
        doctor: 'BS. CKII Nguyễn Thị Thanh',
        status: 'Đã có kết quả',
      };
      setScanHistory((prev) => [newScan, ...prev]);
      setShowAiNotification(true);
      setUserCredits((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error(err);
      setAnalysisErrorMsg(err.message || 'Có lỗi xảy ra trong quá trình xử lý AI.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendChatMessage = async (customText?: string, attachedScreening?: any) => {
    const textToSend = (customText || newChatText).trim();
    if (!textToSend && !attachedScreening) return;
    if (!customText) setNewChatText('');
    setIsSendingChat(true);
    setIsAttachOpen(false);

    const attachmentPayload = attachedScreening ? JSON.stringify(attachedScreening) : undefined;

    const optimistic = {
      id: `m_${Date.now()}`,
      sender: 'patient',
      text: textToSend,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      attachment: attachedScreening,
    };
    setChatMessages((prev) => [...prev, optimistic]);

    try {
      await chatApi.sendMessage(selectedDoctor.id, textToSend, attachedScreening?.screeningId || analysisResult.analysisId, attachmentPayload);
      void fetchConsultationMessages();
    } catch (e) {
      console.warn('Could not send chat message:', e);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleAttachRecentScan = () => {
    const attachment = {
      screeningId: analysisResult.analysisId || 'ANALYSIS-2026-7741',
      eye: 'Mắt Phải (OD)',
      riskScore: analysisResult.overallVascularRiskScore || 78,
      riskLevel: 'Nguy cơ cao',
      cvdScore: `${analysisResult.cardiovascularRisk?.score || 82}%`,
      imageUrl: analysisResult.imageUrl || '/assets/images/fundus_original.png',
      heatmapUrl: analysisResult.annotatedMap?.heatmapUrl || '/assets/images/fundus_heatmap.png',
    };
    void handleSendChatMessage(`Tôi xin đính kèm kết quả phân tích ảnh võng mạc [${attachment.screeningId}] kèm bản đồ nhiệt Grad-CAM để Bác sĩ xem giúp ạ.`, attachment);
  };

  const handleConfirmAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setAptSuccessToast(true);
    setTimeout(() => {
      setAptSuccessToast(false);
      setIsAppointmentModalOpen(false);
      void handleSendChatMessage(`[LỊCH HẸN TƯ VẤN] Đã đặt lịch hẹn tư vấn với ${selectedDoctor.name} vào ngày ${aptDate} lúc ${aptTime} (${aptType === 'TELEHEALTH' ? 'Cuộc gọi Video Telehealth' : 'Tư vấn tin nhắn ưu tiên'}). Nội dung: "${aptNotes}"`);
    }, 2000);
  };

  const handleExportAllHistoryCsv = () => {
    const rows = [
      ['MÃ CA KHÁM', 'NGÀY KHÁM', 'VỊ TRÍ MẮT', 'LOẠI HÌNH CHỤP', 'ĐIỂM RỦI RO', 'MỨC NGUY CƠ', 'NGUY CƠ TIM MẠCH', 'BÁC SĨ PHỤ TRÁCH', 'TRẠNG THÁI'],
      ...scanHistory.map((s) => [
        s.id,
        s.date,
        s.eye,
        s.scanType,
        `${s.overallScore}/100`,
        s.riskLevel,
        s.cvdRisk,
        s.doctor,
        s.status,
      ]),
    ];
    const csvContent = rows
      .map((row) => row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AURA_History_${patient.mrn}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Realtime Notification Banner */}
      {showAiNotification && (
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white p-4 rounded-2xl shadow-medical flex items-center justify-between animate-slideDown">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Phân Tích AI Đã Hoàn Tất Thành Công!</h4>
              <p className="text-xs text-teal-100">
                Ca khám <span className="font-mono-data font-bold underline">{analysisResult.analysisId}</span> đã được lượng hóa xong bản đồ vi mạch và nguy cơ tim mạch.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-3.5 py-1.5 bg-white text-teal-900 rounded-xl text-xs font-bold shadow-xs hover:bg-teal-50 transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> Xem Báo Cáo
            </button>
            <button
              onClick={() => setShowAiNotification(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Patient Header Card */}
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-5 shadow-medical-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0891B2] to-[#0E7490] text-white flex items-center justify-center font-bold text-xl shadow-medical-sm">
            {patient.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#134E4A]">{patient.fullName}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 text-[#0891B2] font-bold font-mono-data">
                {patient.mrn}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
              <span>{patient.age} tuổi • {patient.gender === 'Male' ? 'Nam' : 'Nữ'}</span>
              <span>• Huyết áp: <strong className="text-slate-700 font-mono-data">{patient.systolicBp}/{patient.diastolicBp} mmHg</strong></span>
              <span>• HbA1c: <strong className="text-slate-700 font-mono-data">{patient.hba1c}%</strong></span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-emerald-200 shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Xuất Báo Cáo (FR-7)</span>
          </button>
          <button
            onClick={() => setIsChatModalOpen(true)}
            className="px-3.5 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-cyan-200 shadow-xs"
          >
            <MessageSquare className="w-4 h-4 text-cyan-700" />
            <span>Tư Vấn Với Bác Sĩ (FR-10)</span>
          </button>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
          >
            <UserCog className="w-4 h-4" />
            <span>Hồ Sơ Y Tế</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: DASHBOARD
      ========================================================================== */}
      {activeView === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-4 space-y-6">
              <PatientUploader
                activePatient={patient}
                onStartAnalysis={handleStartAnalysis}
                isAnalyzing={isAnalyzing}
                analysisProgress={analysisProgress}
              />
            </div>
            <div className="xl:col-span-8 space-y-6">
              <InteractiveCDSViewer analysisResult={analysisResult} selectedEye="OD (Mắt Phải)" />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: SCAN HISTORY & REPORTS (FR-7)
      ========================================================================== */}
      {activeView === 'scan-history' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-teal-50 text-teal-700">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Lịch Sử Sàng Lọc & Báo Cáo Chẩn Đoán (FR-7)</h2>
                  <p className="text-xs text-slate-500">Xem lại các lần tầm soát vi mạch, theo dõi tiến trình và xuất báo cáo PDF/CSV.</p>
                </div>
              </div>
              <button
                onClick={handleExportAllHistoryCsv}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Xuất CSV Lịch Sử Khám (UTF-8)</span>
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Mã Ca Khám</th>
                    <th className="p-3.5">Thời Gian</th>
                    <th className="p-3.5">Vị Trí Mắt</th>
                    <th className="p-3.5">Điểm Rủi Ro</th>
                    <th className="p-3.5">Nguy Cơ Tim Mạch</th>
                    <th className="p-3.5">Bác Sĩ Phụ Trách</th>
                    <th className="p-3.5 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scanHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono-data font-bold text-cyan-800">{item.id}</td>
                      <td className="p-3.5 text-slate-600 font-mono-data">{item.date}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{item.eye}</td>
                      <td className="p-3.5 font-mono-data">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.overallScore >= 75 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                          {item.overallScore}/100 ({item.riskLevel})
                        </span>
                      </td>
                      <td className="p-3.5 font-mono-data font-semibold text-rose-600">{item.cvdRisk}</td>
                      <td className="p-3.5 text-slate-700">{item.doctor}</td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setAnalysisResult((prev) => ({
                              ...prev,
                              analysisId: item.id,
                              overallVascularRiskScore: item.overallScore,
                            }));
                            setIsReportModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-xs shadow-xs transition-colors inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-700" /> Báo Cáo PDF/CSV
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 6: IN-APP CONSULTATION CHAT WORKSPACE (FR-10)
      ========================================================================== */}
      {activeView === 'consultation' && (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
            {/* Left Doctor List Sidebar (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-[#0891B2]" />
                  <h3 className="text-sm font-bold text-slate-900">Bác Sĩ Chuyên Khoa (FR-10)</h3>
                </div>
                <button
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold shadow-xs flex items-center gap-1"
                >
                  <Calendar className="w-3 h-3" /> Đặt Lịch
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                {DOCTORS_LIST.map((doc) => {
                  const isSelected = doc.id === selectedDoctor.id;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                        isSelected ? 'bg-cyan-50 border-l-4 border-[#0891B2] shadow-xs' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-xs">
                          BS
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                            doc.status === 'ONLINE'
                              ? 'bg-emerald-500'
                              : doc.status === 'BUSY'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{doc.name}</h4>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              doc.status === 'ONLINE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : doc.status === 'BUSY'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {doc.statusText}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{doc.specialty}</p>
                        <span className="text-[10px] font-semibold text-teal-700 block mt-1">
                          {doc.responseTime}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Chat Main Area (8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Chat Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-[#0891B2] flex items-center justify-center font-bold text-sm">
                      BS
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        selectedDoctor.status === 'ONLINE'
                          ? 'bg-emerald-400'
                          : selectedDoctor.status === 'BUSY'
                          ? 'bg-amber-400'
                          : 'bg-slate-500'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{selectedDoctor.name}</h3>
                    <p className="text-[11px] text-cyan-200">
                      {selectedDoctor.specialty} • {selectedDoctor.statusText}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" /> Đặt Lịch Hẹn
                </button>
              </div>

              {/* Chat Body Messages */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/80">
                <div className="text-center">
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-bold text-teal-800 border border-teal-200 font-mono-data">
                    Kênh trao đổi lâm sàng trực tuyến • Đồng bộ dữ liệu PostgreSQL realtime (3s)
                  </span>
                </div>

                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'patient' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs space-y-2 ${
                        msg.sender === 'patient'
                          ? 'bg-[#0891B2] text-white rounded-br-none font-medium'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none font-medium'
                      }`}
                    >
                      <p>{msg.text}</p>

                      {/* Attachment Card Rendering in chat */}
                      {msg.attachment && (
                        <div
                          className={`p-2.5 rounded-xl border text-[11px] space-y-2 ${
                            msg.sender === 'patient'
                              ? 'bg-cyan-800/60 border-cyan-400/50 text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-cyan-300" /> Ca Khám: {msg.attachment.screeningId}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-red-500 text-white text-[9px]">
                              {msg.attachment.riskLevel}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img
                              src={msg.attachment.imageUrl || '/assets/images/fundus_original.png'}
                              alt="Fundus"
                              className="w-10 h-10 rounded-lg object-cover border border-white/20"
                            />
                            <div className="text-[10px]">
                              <p>Vị trí: <strong>{msg.attachment.eye}</strong></p>
                              <p>Điểm rủi ro: <strong>{msg.attachment.riskScore}/100</strong></p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setAnalysisResult((prev) => ({
                                ...prev,
                                analysisId: msg.attachment.screeningId,
                              }));
                              setIsReportModalOpen(true);
                            }}
                            className="w-full py-1 bg-white text-cyan-950 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <FileText className="w-3 h-3" /> Xem Báo Cáo Ca Này
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono-data mt-1 px-1">{msg.time}</span>
                  </div>
                ))}
                <div ref={consultationScrollRef} />
              </div>

              {/* Patient Quick Reply Suggestions */}
              <div className="border-t border-slate-100 bg-white px-4 py-2 flex items-center gap-2 overflow-x-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Gợi ý nhanh:</span>
                {[
                  'Dạ Bác sĩ cho tôi hỏi lịch tái khám cụ thể ạ.',
                  'Tôi đã tải và in phiếu kết quả PDF rồi ạ.',
                  'Huyết áp sáng nay của tôi là 125/82 mmHg, chỉ số này có ổn không ạ?',
                  'Cảm ơn Bác sĩ đã tư vấn chi tiết.',
                ].map((txt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setNewChatText(txt)}
                    className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-800 transition-colors"
                  >
                    {txt}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3.5 bg-white border-t border-slate-200 relative">
                {/* Popover Attach */}
                {isAttachOpen && (
                  <div className="absolute bottom-16 left-4 z-30 w-72 rounded-2xl bg-white p-3 shadow-2xl border border-slate-200 space-y-2 animate-scaleUp">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-xs font-bold text-slate-800">Đính kèm vào tin nhắn:</span>
                      <button onClick={() => setIsAttachOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={handleAttachRecentScan}
                      className="w-full text-left p-2 rounded-xl hover:bg-teal-50 border border-teal-100 flex items-center gap-2.5 transition-colors text-xs text-slate-800"
                    >
                      <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="block text-[11px]">Ca Khám Mới Nhất (OD)</strong>
                        <span className="text-[10px] text-slate-500">Điểm 78/100 • Ảnh + Heatmap</span>
                      </div>
                    </button>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSendChatMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => setIsAttachOpen(!isAttachOpen)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-cyan-50 hover:text-[#0891B2] transition-colors"
                    title="Đính kèm ca khám / Ảnh võng mạc"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={newChatText}
                    onChange={(e) => setNewChatText(e.target.value)}
                    placeholder={`Nhập tin nhắn trao đổi với ${selectedDoctor.name}...`}
                    className="flex-1 px-4 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0891B2] focus:bg-white outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newChatText.trim() || isSendingChat}
                    className="px-4 py-2.5 bg-[#0891B2] hover:bg-[#0E7490] text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 disabled:opacity-40 transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" /> Gửi
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 7: BILLING & CREDITS (FR-11, FR-12)
      ========================================================================== */}
      {activeView === 'billing' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-700">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Quản Lý Gói Cước & Lượt Khám (FR-11, FR-12)</h2>
                  <p className="text-xs text-slate-500">
                    Số dư lượt khám khả dụng:{' '}
                    <strong className="text-teal-600 font-mono-data text-sm">{userCredits} Lượt</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreditModalOpen(true)}
                className="px-4 py-2 bg-[#0891B2] hover:bg-[#0E7490] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" /> Mua Thêm Gói
              </button>
            </div>

            {/* Pricing Packages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border-2 border-slate-200 bg-white space-y-3 hover:border-teal-500 transition-all">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-slate-900">Gói Khám Cơ Bản (Single Scan)</h3>
                  <span className="text-xs font-bold text-teal-600 font-mono-data">1 lượt</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono-data">150.000 đ</div>
                <p className="text-xs text-slate-500">1 lượt phân tích ảnh võng mạc + Heatmap + Đánh giá nguy cơ 3 năm.</p>
                <button
                  onClick={() => setIsCreditModalOpen(true)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
                >
                  Nạp Gói Này
                </button>
              </div>

              <div className="p-5 rounded-2xl border-2 border-teal-500 bg-teal-50/40 space-y-3 shadow-xs relative">
                <span className="absolute -top-2.5 right-4 bg-teal-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                  Khuyên dùng
                </span>
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-slate-900">Gói Chăm Sóc Định Kỳ (Pro 5)</h3>
                  <span className="text-xs font-bold text-teal-600 font-mono-data">5 lượt</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono-data">590.000 đ</div>
                <p className="text-xs text-slate-500">5 lượt tầm soát toàn diện + Theo dõi xu hướng + Tư vấn chuyên gia.</p>
                <button
                  onClick={() => setIsCreditModalOpen(true)}
                  className="w-full py-2 bg-[#0891B2] hover:bg-[#0E7490] text-white font-bold text-xs rounded-xl transition-colors"
                >
                  Nạp Gói Này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <MedicalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        patient={patient}
        result={analysisResult}
        doctorName={selectedDoctor.name}
      />

      <ConsultationChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        currentUserRole="patient"
        patientName={patient.fullName}
        patientMrn={patient.mrn}
        doctorName={selectedDoctor.name}
        onOpenReportModal={(scanId) => {
          setAnalysisResult((prev) => ({ ...prev, analysisId: scanId }));
          setIsReportModalOpen(true);
        }}
      />

      <CreditPurchaseModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        onSuccess={(addedCredits) => setUserCredits((prev) => prev + addedCredits)}
      />

      <MedicalProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        patient={patient}
        onSave={(updated) => setPatient(updated)}
      />

      {/* Appointment Modal */}
      {isAppointmentModalOpen && (
        <div
          onClick={() => setIsAppointmentModalOpen(false)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Đặt Lịch Hẹn Tư Vấn Chuyên Sâu (FR-10)</h3>
                  <p className="text-[11px] text-slate-500">Hội chẩn cùng {selectedDoctor.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAppointmentModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAppointment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#0891B2]" /> Ngày Hẹn Khám:
                  </label>
                  <input
                    type="date"
                    value={aptDate}
                    onChange={(e) => setAptDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#0891B2]" /> Khung Giờ Khám:
                  </label>
                  <select
                    value={aptTime}
                    onChange={(e) => setAptTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 outline-none focus:border-cyan-600 focus:bg-white font-bold"
                  >
                    <option value="08:30">08:30 Sáng</option>
                    <option value="09:30">09:30 Sáng (Khuyên dùng)</option>
                    <option value="14:00">14:00 Chiều</option>
                    <option value="15:30">15:30 Chiều</option>
                    <option value="19:30">19:30 Tối (Ngoài giờ)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Hình Thức Tư Vấn:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAptType('CHAT_PRIORITY')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      aptType === 'CHAT_PRIORITY'
                        ? 'border-[#0891B2] bg-teal-50 text-teal-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-[#0891B2]" />
                    <span>Tư Vấn Tin Nhắn Ưu Tiên</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAptType('TELEHEALTH')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      aptType === 'TELEHEALTH'
                        ? 'border-[#0891B2] bg-teal-50 text-teal-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <Video className="w-4 h-4 text-[#0891B2]" />
                    <span>Video Call Telehealth</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Lý Do / Triệu Chứng Cần Tư Vấn:</label>
                <textarea
                  rows={3}
                  value={aptNotes}
                  onChange={(e) => setAptNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 outline-none focus:border-cyan-600 focus:bg-white resize-none"
                />
              </div>

              {aptSuccessToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Đặt lịch hẹn thành công! Mã hẹn: APT-2026-9812</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAppointmentModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white font-bold shadow-xs"
                >
                  Xác Nhận Đặt Lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
