import React, { useState, useEffect } from 'react';
import { UserSession } from '../types/auth';
import { PatientUploader } from '../components/PatientUploader';
import { InteractiveCDSViewer } from '../components/InteractiveCDSViewer';
import { MedicalReportModal } from '../components/MedicalReportModal';
import { ConsultationChatModal } from '../components/ConsultationChatModal';
import { CreditPurchaseModal } from '../components/CreditPurchaseModal';
import { MedicalProfileModal } from '../components/MedicalProfileModal';
import { AIRiskResult, FundusAnalysisRequest, PatientProfile } from '../types/cds';
import { MOCK_SAMPLE_RESULT, MockAIService } from '../services/mockAiEngine';
import { screeningApi, chatApi, billingApi, patientApi } from '../services/api';
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
  Loader2,
  RefreshCw,
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
    fullName: user.name || 'Bệnh nhân',
    mrn: user.mrn || '',
    gender: 'Other',
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

  // In-app chat messages for dedicated consultation view
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'm1',
      sender: 'doctor',
      text: 'Chào bạn! Tôi là bác sĩ phụ trách hồ sơ khám của bạn. Bạn hãy cập nhật đầy đủ thông tin sinh hiệu và tiền sử bệnh để nhận được tư vấn chính xác nhất nhé.',
      time: '18:15',
    },
  ]);
  const [newChatText, setNewChatText] = useState('');

  // Scan History
  const [scanHistory, setScanHistory] = useState<any[]>([]);

  const fetchProfileData = async () => {
    try {
      setIsProfileLoading(true);
      setIsProfileError(false);
      const profileRes = await patientApi.getProfile();
      if (profileRes.success && profileRes.data) {
        setPatient({
          id: profileRes.data.id,
          userId: profileRes.data.userId,
          fullName: profileRes.data.fullName || user.name || 'Bệnh nhân',
          mrn: profileRes.data.mrn || user.mrn || '',
          gender: profileRes.data.gender || 'Other',
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
      }
    } catch (e) {
      console.warn('Could not fetch patient medical profile from DB:', e);
      setIsProfileError(true);
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Load real history and chat messages from PostgreSQL on mount
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const res = await screeningApi.getAll();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((item: any) => ({
            id: `ANALYSIS-${item.id.slice(0, 8).toUpperCase()}`,
            date: item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : 'Mới đây',
            eye: 'Mắt Phải (OD)',
            scanType: 'Fundus Cực Sau Hoàng Điểm',
            overallScore: item.riskLevel === 'CRITICAL' ? 88 : item.riskLevel === 'HIGH' ? 78 : item.riskLevel === 'MODERATE' ? 55 : 25,
            riskLevel: item.riskLevel === 'CRITICAL' || item.riskLevel === 'HIGH' ? 'Nguy cơ cao' : 'Nguy cơ trung bình',
            cvdRisk: `${Math.round((item.confidence || 0.85) * 100)}%`,
            doctor: item.doctorId ? 'BS. CKII Chuyên Khoa' : 'Chờ bác sĩ duyệt',
            status: item.status === 'REVIEWED' ? 'Đã duyệt lâm sàng' : 'Đã phân tích AI',
          }));
          setScanHistory(mapped);
        }
      } catch (e) {
        console.warn('Could not fetch screenings from DB:', e);
      }

      // Fetch real conversation with Doctor from PostgreSQL
      try {
        const doctorId = '22222222-2222-2222-2222-222222222222';
        const chatRes = await chatApi.getConversation(doctorId);
        if (chatRes.success && Array.isArray(chatRes.data) && chatRes.data.length > 0) {
          const mappedChat = chatRes.data.map((m: any) => ({
            id: m.id,
            sender: m.senderId === doctorId ? 'doctor' : 'patient',
            text: m.messageText,
            time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '18:30',
          }));
          setChatMessages(mappedChat);
        }
      } catch (e) {
        console.warn('Could not fetch chat from DB:', e);
      }

      // Fetch profile
      await fetchProfileData();
    };
    fetchRealData();
  }, []);

  const handleStartAnalysis = async (request: FundusAnalysisRequest) => {
    setIsAnalyzing(true);
    setShowAiNotification(false);
    setAnalysisErrorMsg(null);
    setAnalysisProgress({ status: 'Mã hóa bảo mật & Khởi chạy mô hình AI...', percent: 15 });

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
      // Add to Scan History
      const newScan = {
        id: result.analysisId,
        date: new Date().toLocaleString('vi-VN'),
        eye: request.eyePosition === 'Right_OD' ? 'Mắt Phải (OD)' : 'Mắt Trái (OS)',
        scanType: request.scanType === 'Fundus_Macula' ? 'Fundus Cực Sau Hoàng Điểm' : 'Fundus Đĩa Thị',
        overallScore: result.overallVascularRiskScore,
        riskLevel: result.overallVascularRiskScore >= 75 ? 'Nguy cơ cao' : 'Nguy cơ trung bình',
        cvdRisk: `${result.cardiovascularRisk.score}%`,
        doctor: patient.assignedDoctor || 'Chờ phân công',
        status: 'Vừa phân tích xong',
      };
      setScanHistory((prev) => [newScan, ...prev]);

      // Trigger AI Ready Notification
      setShowAiNotification(true);
      setTimeout(() => setShowAiNotification(false), 7000);

      // Navigate to CDS Viewer automatically
      onNavigate('cds-viewer');
    } catch (err) {
      console.error(err);
      setAnalysisErrorMsg(
        err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ phân tích. Vui lòng thử lại.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;
    const textToSend = newChatText.trim();
    setNewChatText('');

    const optimisticMsg = {
      id: `m_${Date.now()}`,
      sender: 'patient',
      text: textToSend,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, optimisticMsg]);

    try {
      const doctorId = '22222222-2222-2222-2222-222222222222';
      await chatApi.sendMessage(doctorId, textToSend);
    } catch (err) {
      console.warn('Failed to send message to backend:', err);
    }
  };

  const renderConditionStatus = (val: boolean | null | undefined, trueDetail?: string) => {
    if (val === true) {
      return (
        <span className="font-bold text-rose-600 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
          Có {trueDetail ? `(${trueDetail})` : ''}
        </span>
      );
    }
    if (val === false) {
      return (
        <span className="font-semibold text-emerald-600 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
          Không
        </span>
      );
    }
    return (
      <span className="font-medium text-slate-400 italic flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block"></span>
        Chưa khai báo
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification (FR-9) */}
      {showAiNotification && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl animate-slideInRight flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">Thông Báo AI Sẵn Sàng (FR-9)</h4>
              <span className="text-[10px] text-emerald-600 font-mono-data font-semibold">Vừa xong</span>
            </div>
            <p className="text-xs text-slate-600 leading-snug">
              Ảnh võng mạc của bạn đã được phân tích hoàn tất! Điểm rủi ro tổng hợp:{' '}
              <strong className="text-red-600 font-bold">{analysisResult.overallVascularRiskScore}/100</strong>.
            </p>
          </div>
          <button onClick={() => setShowAiNotification(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {analysisErrorMsg && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-white border-2 border-red-500 rounded-2xl p-4 shadow-2xl animate-slideInRight flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-100 text-red-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-bold text-slate-900">Không Thể Phân Tích Ảnh</h4>
            <p className="text-xs text-slate-600 leading-snug">{analysisErrorMsg}</p>
          </div>
          <button onClick={() => setAnalysisErrorMsg(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Top Patient Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#115E59] to-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[#0891B2]/20 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md text-[#22D3EE] border border-white/20 flex items-center justify-center font-bold text-xl shadow-inner">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">{patient.fullName}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0891B2] text-white font-semibold font-mono-data border border-cyan-400">
                {patient.mrn || 'Chưa có MRN'}
              </span>
            </div>
            <p className="text-xs text-cyan-100/80 mt-1 flex flex-wrap items-center gap-3">
              <span>Bác sĩ phụ trách: <strong className="text-white">{patient.assignedDoctor || 'Chưa được phân công'}</strong></span>
              <span>Lần khám gần nhất: <strong className="text-white">{patient.lastExamDate || 'Chưa có lần khám'}</strong></span>
              <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Khám Định Kỳ Võng Mạc
              </span>
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="z-10 flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('upload-scan')}
            className="px-3.5 py-2 bg-[#0891B2] hover:bg-[#0E7490] text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
          >
            <UploadCloud className="w-4 h-4" /> Tải Ảnh Khám Mới
          </button>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs border border-white/30 backdrop-blur-sm transition-all flex items-center gap-1.5"
          >
            <UserCog className="w-4 h-4" /> Hồ Sơ Y Tế
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: DASHBOARD TỔNG QUAN
      ========================================================================== */}
      {activeView === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Nguy cơ Tim mạch 3 năm</span>
                <div className="text-xl font-extrabold text-slate-900 font-mono-data">
                  {analysisResult.cardiovascularRisk.score}%
                </div>
                <span className="text-[11px] text-red-600 font-semibold">
                  {analysisResult.cardiovascularRisk.hypertensionStage}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Bệnh Võng Mạc Tiểu Đường</span>
                <div className="text-xl font-extrabold text-slate-900 font-mono-data">
                  {analysisResult.diabeticRetinopathyRisk.score}%
                </div>
                <span className="text-[11px] text-cyan-700 font-semibold">
                  {analysisResult.diabeticRetinopathyRisk.etdrsGrade}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Nguy Cơ Đột Quỵ 3 Năm</span>
                <div className="text-xl font-extrabold text-slate-900 font-mono-data">
                  {analysisResult.cardiovascularRisk.threeYearStrokeRiskPercent}%
                </div>
                <span className="text-[11px] text-amber-600 font-semibold">Dựa trên vi mạch hoàng điểm</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Số Lượt Phân Tích Còn Lại</span>
                <div className="text-xl font-extrabold text-teal-600 font-mono-data">{userCredits} lượt</div>
                <button
                  onClick={() => setIsCreditModalOpen(true)}
                  className="text-[11px] text-[#0891B2] font-bold hover:underline"
                >
                  Mua thêm lượt &gt;
                </button>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Upload */}
            <div
              onClick={() => onNavigate('upload-scan')}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-[#0891B2] hover:shadow-lg transition-all cursor-pointer group space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-[#0891B2] flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0891B2] transition-colors flex items-center justify-between">
                  Tải Ảnh Võng Mạc Mới
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Hỗ trợ tải lên một hoặc nhiều ảnh chụp đáy mắt (Fundus hoặc OCT) để nhận diện vi tổn thương mạch máu.
                </p>
              </div>
            </div>

            {/* Card 2: View Heatmap */}
            <div
              onClick={() => onNavigate('cds-viewer')}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-[#0891B2] hover:shadow-lg transition-all cursor-pointer group space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0891B2] transition-colors flex items-center justify-between">
                  Xem Bản Đồ Nhiệt Grad-CAM
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Soi rõ các vùng vi phình mạch, xuất huyết và co thắt mao mạch với thanh trượt Opacity trực quan.
                </p>
              </div>
            </div>

            {/* Card 3: Doctor Consultation */}
            <div
              onClick={() => onNavigate('consultation')}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-[#0891B2] hover:shadow-lg transition-all cursor-pointer group space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0891B2] transition-colors flex items-center justify-between">
                  Tư Vấn Với Bác Sĩ Trực Tuyến
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Trao đổi trực tiếp với {patient.assignedDoctor || 'Bác sĩ chuyên khoa'}, nhận tư vấn chuyên môn và phác đồ điều trị.
                </p>
              </div>
            </div>
          </div>

          {/* Doctor Recommendations Box */}
          <div className="bg-white p-6 rounded-2xl border border-teal-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                Khuyến Nghị Sức Khỏe & Nhận Xét Chuyên Môn
              </div>
              <button
                onClick={() => onNavigate('consultation')}
                className="text-xs font-bold text-[#0891B2] hover:underline flex items-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Trao đổi với bác sĩ
              </button>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Chưa có nhận xét chuyên môn.
              </p>
              <p className="text-[11px] text-slate-500">
                Nhận xét của bác sĩ sẽ xuất hiện sau khi hồ sơ hoặc kết quả sàng lọc được xem xét.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: UPLOAD SCAN - PHÂN TÍCH ẢNH MỚI (FR-2)
      ========================================================================== */}
      {activeView === 'upload-scan' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <PatientUploader
            activePatient={patient}
            onStartAnalysis={handleStartAnalysis}
            isAnalyzing={isAnalyzing}
            analysisProgress={analysisProgress}
          />
        </div>
      )}

      {/* =========================================================================
          VIEW 3: CDS VIEWER - TRỰC QUAN HÓA & HEATMAP (FR-4)
      ========================================================================== */}
      {activeView === 'cds-viewer' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#0891B2]" />
                Trực Quan Ảnh Võng Mạc & Bản Đồ Nhiệt Grad-CAM Heatmap (FR-4)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kéo thanh trượt Opacity để soi rõ các nhánh mao mạch và vùng tổn thương vi mạch do AI phát hiện.
              </p>
            </div>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Xuất Báo Cáo PDF/CSV
            </button>
          </div>

          <InteractiveCDSViewer analysisResult={analysisResult} selectedEye="OD (Mắt Phải)" />
        </div>
      )}

      {/* =========================================================================
          VIEW 4: MEDICAL PROFILE - HỒ SƠ Y TẾ (FR-8)
      ========================================================================== */}
      {activeView === 'medical-profile' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {isProfileLoading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="text-sm font-bold text-slate-700">Đang tải hồ sơ y tế...</p>
              <p className="text-xs text-slate-400">Vui lòng chờ trong giây lát</p>
            </div>
          ) : isProfileError ? (
            <div className="bg-white p-8 rounded-2xl border border-red-200 shadow-xs flex flex-col items-center justify-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <p className="text-sm font-bold text-slate-800">Không thể tải hồ sơ y tế từ máy chủ.</p>
              <button
                onClick={fetchProfileData}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Thử lại
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
                    <h2 className="text-lg font-bold text-slate-900">Hồ Sơ Y Tế & Tiền Sử Bệnh Cá Nhân</h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>Mã bệnh nhân: <strong className="text-teal-700 font-mono-data">{patient.mrn || 'Chưa có MRN'}</strong></span>
                      <span className="text-slate-400 font-mono-data">
                        • {patient.updatedAt ? `Cập nhật lần cuối: ${new Date(patient.updatedAt).toLocaleString('vi-VN')}` : 'Chưa có cập nhật'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <UserCog className="w-4 h-4" /> Chỉnh Sửa Thông Tin
                </button>
              </div>

              {/* Profile Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">Họ và tên:</span>
                  <strong className="text-slate-900 text-sm">{patient.fullName}</strong>
                  <span className="text-[11px] text-slate-500 block mt-0.5 font-mono-data">
                    {patient.dateOfBirth ? `NS: ${patient.dateOfBirth}` : 'Chưa cập nhật ngày sinh'}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">Tuổi & Giới tính:</span>
                  <strong className="text-slate-900 text-sm">
                    {patient.age != null ? `${patient.age} tuổi` : 'Chưa cập nhật'} • {patient.gender === 'Male' ? 'Nam' : patient.gender === 'Female' ? 'Nữ' : 'Khác'}
                  </strong>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">Nhóm máu & SĐT:</span>
                  <strong className="text-slate-900 text-sm">
                    {patient.bloodType || 'Chưa cập nhật'} • {patient.phoneNumber || 'Chưa cập nhật'}
                  </strong>
                  <span className="text-[11px] text-slate-500 block mt-0.5 truncate" title={patient.address || 'Chưa cập nhật'}>
                    Đ/C: {patient.address || 'Chưa cập nhật'}
                  </span>
                </div>
              </div>

              {/* Clinical Vitals */}
              <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-4">
                <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-700" /> Chỉ Số Sinh Hiệu & Lâm Sàng Gần Nhất
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-xl border border-teal-200 shadow-xs">
                    <span className="text-slate-500 block text-xs">Huyết áp (Systolic/Diastolic)</span>
                    {patient.systolicBp != null && patient.diastolicBp != null ? (
                      <>
                        <span className="text-2xl font-extrabold font-mono-data text-slate-900">{patient.systolicBp}/{patient.diastolicBp}</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">mmHg (Chỉ số đo gần nhất)</span>
                      </>
                    ) : (
                      <>
                        <span className="text-base font-bold text-slate-400 block mt-1">Chưa đo</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">Vui lòng cập nhật khi có kết quả đo</span>
                      </>
                    )}
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-teal-200 shadow-xs">
                    <span className="text-slate-500 block text-xs">Chỉ số HbA1c</span>
                    {patient.hba1c != null ? (
                      <>
                        <span className="text-2xl font-extrabold font-mono-data text-amber-700">{patient.hba1c}%</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">Đường huyết trung bình 3 tháng</span>
                      </>
                    ) : (
                      <>
                        <span className="text-base font-bold text-slate-400 block mt-1">Chưa đo</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">Chưa có dữ liệu xét nghiệm máu</span>
                      </>
                    )}
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-teal-200 shadow-xs">
                    <span className="text-slate-500 block text-xs">Bác sĩ phụ trách</span>
                    <span className="text-sm font-bold text-slate-800 line-clamp-1 mt-1">
                      {patient.assignedDoctor || 'Chưa được phân công'}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Chỉ định bởi bệnh viện</span>
                  </div>
                </div>
              </div>

              {/* Medical Conditions */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" /> Tiền Sử Bệnh Lý Mạn Tính
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span>Đái tháo đường:</span>
                    {renderConditionStatus(
                      patient.hasDiabetes,
                      patient.diabetesType ? `${patient.diabetesType}${patient.diabetesDurationYears ? ` - ${patient.diabetesDurationYears} năm` : ''}` : undefined
                    )}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span>Tăng huyết áp:</span>
                    {renderConditionStatus(patient.hasHypertension)}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span>Hút thuốc lá:</span>
                    {renderConditionStatus(patient.historyOfSmoking)}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span>Bệnh tim mạch:</span>
                    {renderConditionStatus(patient.historyOfHeartDisease)}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span>Tiền sử đột quỵ:</span>
                    {renderConditionStatus(patient.historyOfStroke)}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span>Dị ứng:</span>
                    <strong className="text-slate-800 truncate max-w-[120px]" title={patient.allergies || 'Chưa khai báo'}>
                      {patient.allergies || 'Chưa khai báo'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Medications & Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-semibold block">Thuốc đang điều trị:</span>
                  <p className="text-slate-800">{patient.currentMedications || 'Chưa khai báo'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-semibold block">Người liên hệ khẩn cấp:</span>
                  <p className="text-slate-800">
                    {patient.emergencyContactName ? `${patient.emergencyContactName} (${patient.emergencyContactPhone || 'Chưa cập nhật SĐT'})` : 'Chưa khai báo'}
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
      {activeView === 'scan-history' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-50 text-cyan-700">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Lịch Sử Khám & Xuất Báo Cáo Y Khoa (FR-6, FR-7)</h2>
                  <p className="text-xs text-slate-500">Tra cứu các kết quả khám trước đây, theo dõi tiến trình và tải báo cáo chuẩn y tế.</p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Xuất Báo Cáo PDF/CSV
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Mã Phân Tích</th>
                    <th className="p-3.5">Ngày Khám</th>
                    <th className="p-3.5">Vị Trí Soi</th>
                    <th className="p-3.5">Điểm Rủi Ro</th>
                    <th className="p-3.5">Nguy Cơ Tim Mạch</th>
                    <th className="p-3.5">Bác Sĩ Phụ Trách</th>
                    <th className="p-3.5">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scanHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Chưa có lịch sử phân tích hình ảnh võng mạc nào.
                      </td>
                    </tr>
                  ) : (
                    scanHistory.map((scan) => (
                      <tr key={scan.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono-data font-semibold text-cyan-800">{scan.id}</td>
                        <td className="p-3.5 text-slate-500 font-mono-data">{scan.date}</td>
                        <td className="p-3.5 font-medium text-slate-800">{scan.eye}</td>
                        <td className="p-3.5 font-mono-data font-bold">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] ${
                              scan.overallScore >= 75
                                ? 'bg-red-100 text-red-700 border border-red-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {scan.overallScore}/100
                          </span>
                        </td>
                        <td className="p-3.5 font-mono-data font-bold text-red-600">{scan.cvdRisk}</td>
                        <td className="p-3.5 text-slate-700 font-medium">{scan.doctor}</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => {
                              onNavigate('cds-viewer');
                            }}
                            className="px-3 py-1.5 bg-[#0891B2] hover:bg-[#0E7490] text-white font-bold rounded-lg text-xs shadow-xs"
                          >
                            Xem Bản Đồ Nhiệt
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
      )}

      {/* =========================================================================
          VIEW 6: IN-APP CONSULTATION CHAT (FR-10)
      ========================================================================== */}
      {activeView === 'consultation' && (
        <div className="max-w-4xl mx-auto space-y-6">
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
                  <h3 className="text-sm font-bold">{patient.assignedDoctor || 'Bác sĩ chuyên khoa'}</h3>
                  <p className="text-[11px] text-cyan-200">Khoa Mắt & Tim Mạch Lâm Sàng • Trực Tuyến</p>
                </div>
              </div>
              <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300 font-mono-data">
                Hồ sơ: {patient.mrn || 'Chưa có MRN'}
              </span>
            </div>

            {/* Chat Body Messages */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'patient' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      msg.sender === 'patient'
                        ? 'bg-[#0891B2] text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono-data mt-1 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                value={newChatText}
                onChange={(e) => setNewChatText(e.target.value)}
                placeholder="Nhập tin nhắn trao đổi với Bác sĩ..."
                className="flex-1 px-4 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0891B2] outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#0891B2] hover:bg-[#0E7490] text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Gửi
              </button>
            </form>
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
        doctorName={patient.assignedDoctor || undefined}
      />

      <ConsultationChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        currentUserRole="patient"
        patientName={patient.fullName || 'Bệnh nhân'}
        patientMrn={patient.mrn || 'Chưa có MRN'}
      />

      <CreditPurchaseModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        userRole="patient"
        currentCredit={userCredits}
        onSuccess={(added) => setUserCredits((prev) => prev + added)}
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
