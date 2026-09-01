import React, { useState } from 'react';
import { UserSession } from '../types/auth';
import { PatientUploader } from '../components/PatientUploader';
import { InteractiveCDSViewer } from '../components/InteractiveCDSViewer';
import { MedicalReportModal } from '../components/MedicalReportModal';
import { ConsultationChatModal } from '../components/ConsultationChatModal';
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
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Printer,
} from 'lucide-react';

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
  const [resultOD, setResultOD] = useState<AIRiskResult>(MOCK_SAMPLE_RESULT);
  const [resultOS, setResultOS] = useState<AIRiskResult>({
    ...MOCK_SAMPLE_RESULT,
    analysisId: 'ANALYSIS-2026-7742',
    imageUrl: '/assets/images/fundus_original.png',
    overallVascularRiskScore: 68,
    cardiovascularRisk: {
      ...MOCK_SAMPLE_RESULT.cardiovascularRisk,
      score: 65,
      level: 'Moderate',
      hypertensionStage: 'Giai đoạn I (Tăng huyết áp Nhẹ)',
      threeYearStrokeRiskPercent: 12.0,
    },
    diabeticRetinopathyRisk: {
      ...MOCK_SAMPLE_RESULT.diabeticRetinopathyRisk,
      score: 48,
      level: 'Low',
    },
  });
  const [activeEyeTab, setActiveEyeTab] = useState<'OD' | 'OS'>('OD');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ status: string; percent: number }>({
    status: '',
    percent: 0,
  });

  // Realtime AI Ready Notification
  const [showAiNotification, setShowAiNotification] = useState<boolean>(false);

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

  // History Search & Filter State (FR-6)
  const [historySearch, setHistorySearch] = useState('');
  const [historyEyeFilter, setHistoryEyeFilter] = useState<'ALL' | 'OD' | 'OS'>('ALL');
  const [historyRiskFilter, setHistoryRiskFilter] = useState<'ALL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');
  const [selectedHistoryResult, setSelectedHistoryResult] = useState<AIRiskResult | null>(null);

  // Default rich history records
  const DEFAULT_HISTORY = [
    {
      id: 'ANALYSIS-2026-9821',
      date: '01/09/2026 17:08',
      eye: 'Cả 2 Mắt (OD + OS)',
      scanType: 'Fundus Cực Sau (2 Mắt)',
      overallScore: 60,
      riskLevel: 'Nguy cơ trung bình',
      cvdRisk: '60%',
      avRatio: 0.63,
      vesselDensity: '15.6%',
      doctor: 'BS. CKII Nguyễn Thị Thanh',
      status: 'Đã phân tích AI',
    },
    {
      id: 'ANALYSIS-2026-7741',
      date: '31/08/2026 18:30',
      eye: 'Mắt Phải (OD)',
      scanType: 'Fundus Cực Sau Hoàng Điểm',
      overallScore: 78,
      riskLevel: 'Nguy cơ cao',
      cvdRisk: '82%',
      avRatio: 0.52,
      vesselDensity: '14.8%',
      doctor: 'BS. CKII Nguyễn Thị Thanh',
      status: 'Đã duyệt lâm sàng',
    },
    {
      id: 'ANALYSIS-2026-5512',
      date: '14/07/2026 09:15',
      eye: 'Mắt Trái (OS)',
      scanType: 'Fundus Đĩa Thị',
      overallScore: 71,
      riskLevel: 'Nguy cơ trung bình',
      cvdRisk: '68%',
      avRatio: 0.58,
      vesselDensity: '15.2%',
      doctor: 'BS. CKII Nguyễn Thị Thanh',
      status: 'Đã duyệt lâm sàng',
    },
    {
      id: 'ANALYSIS-2026-3109',
      date: '02/05/2026 14:20',
      eye: 'Mắt Phải (OD)',
      scanType: 'OCT Cắt Lớp Quang Học',
      overallScore: 65,
      riskLevel: 'Nguy cơ trung bình',
      cvdRisk: '62%',
      avRatio: 0.61,
      vesselDensity: '15.9%',
      doctor: 'BS. CKII Nguyễn Thị Thanh',
      status: 'Đã duyệt lâm sàng',
    },
  ];

  // Scan History with LocalStorage Persistence (FR-6)
  const [scanHistory, setScanHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('aura_scan_history_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_HISTORY;
  });

  // Load real history and chat messages from PostgreSQL on mount
  React.useEffect(() => {
    const fetchRealData = async () => {
      try {
        const res = await screeningApi.getAll();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          // Merge unique records from DB without destroying existing rich history
          setScanHistory((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const newDbItems = res.data
              .filter((item: any) => !existingIds.has(`ANALYSIS-${item.id.slice(0, 8).toUpperCase()}`))
              .map((item: any) => ({
                id: `ANALYSIS-${item.id.slice(0, 8).toUpperCase()}`,
                date: item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '01/09/2026',
                eye: 'Cả 2 Mắt (OD + OS)',
                scanType: 'Fundus Cực Sau (2 Mắt)',
                overallScore: item.riskLevel === 'CRITICAL' ? 85 : item.riskLevel === 'HIGH' ? 78 : item.riskLevel === 'MODERATE' ? 60 : 35,
                riskLevel: item.riskLevel === 'CRITICAL' || item.riskLevel === 'HIGH' ? 'Nguy cơ cao' : 'Nguy cơ trung bình',
                cvdRisk: `${Math.round((item.confidence || 0.85) * 100)}%`,
                avRatio: 0.58,
                vesselDensity: '15.2%',
                doctor: item.doctorId ? 'BS. CKII Nguyễn Thị Thanh' : 'Chờ bác sĩ duyệt',
                status: item.status === 'REVIEWED' ? 'Đã duyệt lâm sàng' : 'Đã phân tích AI',
              }));
            const merged = [...newDbItems, ...prev];
            localStorage.setItem('aura_scan_history_v2', JSON.stringify(merged));
            return merged;
          });
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
    };
    fetchRealData();
  }, []);

  const handleStartAnalysis = async (request: FundusAnalysisRequest) => {
    setIsAnalyzing(true);
    setShowAiNotification(false);
    setAnalysisProgress({ status: 'Mã hóa HIPAA & Khởi chạy mô hình AI đa luồng...', percent: 15 });

    try {
      if (request.isBatch && request.batchItems && request.batchItems.length > 0) {
        const total = request.batchItems.length;
        const newHistoryItems: any[] = [];
        let firstResult: any = null;
        let odRes: any = null;
        let osRes: any = null;

        for (let i = 0; i < total; i++) {
          const item = request.batchItems[i];
          const isItemOD = item.eye === 'Right_OD';
          const percentStart = Math.round((i / total) * 100);
          const percentEnd = Math.round(((i + 1) / total) * 100);

          const itemReq: FundusAnalysisRequest = {
            ...request,
            imageName: item.name,
            imageUrl: item.previewUrl,
            file: item.file,
            eyePosition: item.eye,
            scanType: item.scanType,
          };

          const res = await MockAIService.runFundusAnalysis(itemReq, (status, p) => {
            const overallP = Math.round(percentStart + (p / 100) * (percentEnd - percentStart));
            setAnalysisProgress({
              status: `[Ảnh ${i + 1}/${total} - ${isItemOD ? 'OD' : 'OS'}] ${status}`,
              percent: Math.min(100, overallP),
            });
          });

          if (!firstResult) firstResult = res;
          if (isItemOD && !odRes) odRes = res;
          if (!isItemOD && !osRes) osRes = res;

          try {
            await screeningApi.create(res.imageUrl || item.previewUrl);
          } catch (err) {
            console.warn('Failed to save batch screening item to DB:', err);
          }

          newHistoryItems.push({
            id: res.analysisId,
            date: new Date().toLocaleString('vi-VN'),
            eye: isItemOD ? 'Mắt Phải (OD)' : 'Mắt Trái (OS)',
            scanType: item.scanType === 'Fundus_Macula' ? 'Fundus Cực Sau Hoàng Điểm' : (item.scanType === 'OCT_Scan' ? 'Cắt Lớp OCT' : 'Fundus Đĩa Thị'),
            overallScore: res.overallVascularRiskScore,
            riskLevel: res.overallVascularRiskScore >= 75 ? 'Nguy cơ cao' : (res.overallVascularRiskScore >= 45 ? 'Nguy cơ trung bình' : 'Nguy cơ thấp'),
            cvdRisk: `${res.cardiovascularRisk.score}%`,
            doctor: 'BS. CKII Nguyễn Thị Thanh',
            status: 'Vừa phân tích xong',
          });
        }

        if (odRes) setResultOD(odRes);
        if (osRes) setResultOS(osRes);
        if (firstResult) setAnalysisResult(firstResult);
        setActiveEyeTab(odRes ? 'OD' : 'OS');
        setScanHistory((prev) => [...newHistoryItems, ...prev]);
      } else if (request.isDualEye) {
        // 1. Run OD Analysis
        const odRequest: FundusAnalysisRequest = {
          ...request,
          eyePosition: 'Right_OD',
          imageUrl: request.odImageUrl || request.imageUrl,
          file: request.odFile || request.file,
          imageName: request.odImageName || 'fundus_scan_OD_2026.png',
        };
        const odRes = await MockAIService.runFundusAnalysis(odRequest, (status, percent) => {
          setAnalysisProgress({ status: `[Mắt Phải OD] ${status}`, percent: Math.round(percent / 2) });
        });
        setResultOD(odRes);

        // 2. Run OS Analysis
        const osRequest: FundusAnalysisRequest = {
          ...request,
          eyePosition: 'Left_OS',
          imageUrl: request.osImageUrl || request.imageUrl,
          file: request.osFile || request.file,
          imageName: request.osImageName || 'fundus_scan_OS_2026.png',
        };
        const osRes = await MockAIService.runFundusAnalysis(osRequest, (status, percent) => {
          setAnalysisProgress({ status: `[Mắt Trái OS] ${status}`, percent: 50 + Math.round(percent / 2) });
        });
        setResultOS(osRes);

        setAnalysisResult(odRes);
        setActiveEyeTab('OD');

        // Save screening to PostgreSQL (1 unified screening session)
        try {
          await screeningApi.create(odRes.imageUrl || request.odImageUrl || request.imageUrl);
        } catch (err) {
          console.warn('Failed to save screening to DB:', err);
        }

        // Create EXACTLY 1 unified record for the dual-eye examination session
        const highestScore = Math.max(odRes.overallVascularRiskScore, osRes.overallVascularRiskScore);
        const highestCvdScore = Math.max(odRes.cardiovascularRisk.score, osRes.cardiovascularRisk.score);
        const avgAvRatio = Number(((odRes.annotatedMap.arteryVeinRatio + osRes.annotatedMap.arteryVeinRatio) / 2).toFixed(2));
        const avgDensity = `${((odRes.annotatedMap.vesselDensityPercentage + osRes.annotatedMap.vesselDensityPercentage) / 2).toFixed(1)}%`;

        const newDualScan = {
          id: odRes.analysisId,
          date: new Date().toLocaleString('vi-VN'),
          eye: 'Cả 2 Mắt (OD + OS)',
          scanType: request.scanType === 'Fundus_Macula' ? 'Fundus Cực Sau (2 Mắt)' : (request.scanType === 'OCT_Scan' ? 'Cắt Lớp OCT (2 Mắt)' : 'Fundus Đĩa Thị (2 Mắt)'),
          overallScore: highestScore,
          riskLevel: highestScore >= 75 ? 'Nguy cơ cao' : (highestScore >= 45 ? 'Nguy cơ trung bình' : 'Nguy cơ thấp'),
          cvdRisk: `${highestCvdScore}%`,
          avRatio: avgAvRatio,
          vesselDensity: avgDensity,
          doctor: 'BS. CKII Nguyễn Thị Thanh',
          status: 'Vừa phân tích xong',
          odResult: odRes,
          osResult: osRes,
        };
        setScanHistory((prev) => {
          const updated = [newDualScan, ...prev];
          try {
            localStorage.setItem('aura_scan_history_v2', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      } else {
        const isOD = request.eyePosition === 'Right_OD';
        const result = await MockAIService.runFundusAnalysis(request, (status, percent) => {
          setAnalysisProgress({ status, percent });
        });
        if (isOD) {
          setResultOD(result);
          setActiveEyeTab('OD');
        } else {
          setResultOS(result);
          setActiveEyeTab('OS');
        }
        setAnalysisResult(result);

        try {
          await screeningApi.create(result.imageUrl || request.imageUrl);
        } catch (err) {
          console.warn('Failed to save screening to DB:', err);
        }

        // Create EXACTLY 1 record for single eye examination
        const newScan = {
          id: result.analysisId,
          date: new Date().toLocaleString('vi-VN'),
          eye: isOD ? 'Mắt Phải (OD)' : 'Mắt Trái (OS)',
          scanType: request.scanType === 'Fundus_Macula' ? 'Fundus Cực Sau' : (request.scanType === 'OCT_Scan' ? 'Cắt Lớp OCT' : 'Fundus Đĩa Thị'),
          overallScore: result.overallVascularRiskScore,
          riskLevel: result.overallVascularRiskScore >= 75 ? 'Nguy cơ cao' : (result.overallVascularRiskScore >= 45 ? 'Nguy cơ trung bình' : 'Nguy cơ thấp'),
          cvdRisk: `${result.cardiovascularRisk.score}%`,
          avRatio: result.annotatedMap.arteryVeinRatio,
          vesselDensity: `${result.annotatedMap.vesselDensityPercentage}%`,
          doctor: 'BS. CKII Nguyễn Thị Thanh',
          status: 'Vừa phân tích xong',
          odResult: isOD ? result : undefined,
          osResult: !isOD ? result : undefined,
        };
        setScanHistory((prev) => {
          const updated = [newScan, ...prev];
          try {
            localStorage.setItem('aura_scan_history_v2', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }

      setShowAiNotification(true);
      setTimeout(() => setShowAiNotification(false), 7000);
      onNavigate('cds-viewer');
    } catch (err) {
      console.error(err);
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
                {patient.mrn}
              </span>
            </div>
            <p className="text-xs text-cyan-100/80 mt-1 flex flex-wrap items-center gap-3">
              <span>Bác sĩ phụ trách: <strong className="text-white">{patient.assignedDoctor}</strong></span>
              <span>Lần khám gần nhất: <strong className="text-white">{patient.lastExamDate}</strong></span>
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
            <UploadCloud className="w-4 h-4" />
            Tải Ảnh Khám Mới
          </button>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3.5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Download className="w-4 h-4" />
            Xuất Báo Cáo PDF/CSV
          </button>
          <button
            onClick={() => onNavigate('consultation')}
            className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 border border-slate-600 active:scale-95"
          >
            <MessageSquare className="w-4 h-4 text-cyan-300" />
            Tư Vấn Bác Sĩ
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: DASHBOARD - TỔNG QUAN SỨC KHỎE
      ========================================================================== */}
      {(activeView === 'dashboard' || activeView === 'default') && (
        <div className="space-y-6">
          {/* 4 Health Risk KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall Risk */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 relative overflow-hidden hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Rủi Ro Mạch Máu</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300">
                  {analysisResult.overallVascularRiskScore >= 75 ? 'Nguy cơ cao' : 'Trung bình'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono-data text-[#DC2626]">
                  {analysisResult.overallVascularRiskScore}
                </span>
                <span className="text-xs text-slate-500 font-semibold">/ 100 điểm</span>
              </div>
              <p className="text-[11px] text-slate-500">Dựa trên mô hình học sâu vi mạch võng mạc AURA.</p>
            </div>

            {/* Cardio Risk */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 relative overflow-hidden hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-red-500" /> Bệnh Tim Mạch
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300">
                  3 Năm
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono-data text-red-600">
                  {analysisResult.cardiovascularRisk.score}%
                </span>
                <span className="text-xs text-slate-500 font-semibold">Xác suất rủi ro</span>
              </div>
              <p className="text-[11px] text-slate-500">Co hẹp động mạch nhỏ liên quan tăng huyết áp.</p>
            </div>

            {/* Stroke Risk */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 relative overflow-hidden hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-amber-500" /> Đột Quỵ
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  3 Năm
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono-data text-amber-700">
                  {analysisResult.cardiovascularRisk.threeYearStrokeRiskPercent}%
                </span>
                <span className="text-xs text-slate-500 font-semibold">Xác suất rủi ro</span>
              </div>
              <p className="text-[11px] text-slate-500">Dòng vi tuần hoàn và phân nhánh mao mạch.</p>
            </div>

            {/* Diabetic Retinopathy */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 relative overflow-hidden hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-[#0891B2]" /> Võng Mạc ĐTĐ
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                  ETDRS 43
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono-data text-[#0891B2]">
                  {analysisResult.diabeticRetinopathyRisk.score}%
                </span>
                <span className="text-xs text-slate-500 font-semibold">Vi phình mạch</span>
              </div>
              <p className="text-[11px] text-slate-500">Xuất hiện đốm nông cực sau hoàng điểm.</p>
            </div>
          </div>

          {/* Quick Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Visual CDS Studio */}
            <div
              onClick={() => onNavigate('cds-viewer')}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-[#0891B2] hover:shadow-lg transition-all cursor-pointer group space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0891B2] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0891B2] transition-colors flex items-center justify-between">
                  Trực Quan Ảnh & Grad-CAM Heatmap
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Soi trực tiếp ảnh võng mạc, kéo thanh trượt bản đồ nhiệt và đo các chỉ số A/V Ratio, Tortuosity.
                </p>
              </div>
            </div>

            {/* Card 2: Upload New Scan */}
            <div
              onClick={() => onNavigate('upload-scan')}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-[#0891B2] hover:shadow-lg transition-all cursor-pointer group space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0891B2] transition-colors flex items-center justify-between">
                  Phân Tích Ảnh Võng Mạc Mới
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Tải lên ảnh chụp đáy mắt (Fundus hoặc OCT) để nhận kết quả phân tích nơ-ron AI chỉ trong 2-3 giây.
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
                  Trao đổi trực tiếp với {patient.assignedDoctor}, nhận tư vấn chuyên môn và phác đồ điều trị.
                </p>
              </div>
            </div>
          </div>

          {/* Doctor Recommendations Box (FR-5) */}
          <div className="bg-white p-6 rounded-2xl border border-teal-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Khuyến Nghị Sức Khỏe Tự Động & Lời Khuyên Y Khoa (FR-5)
              </div>
              <button
                onClick={() => onNavigate('consultation')}
                className="text-xs font-bold text-[#0891B2] hover:underline flex items-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Trao đổi với bác sĩ
              </button>
            </div>
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <p className="text-xs text-slate-800 leading-relaxed italic">
                "Dựa trên phân tích hình ảnh đáy mắt cực sau hoàng điểm (OD), vi mạch có dấu hiệu co hẹp động mạch nhỏ tương ứng với huyết áp dao động. Khuyến cáo kiểm soát huyết áp tâm thu dưới 130 mmHg, duy trì HbA1c dưới 7.0% và tái khám sau 6 tháng."
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600 font-semibold border-t border-emerald-200/60 pt-2">
                <span>Chỉ định bởi: {patient.assignedDoctor}</span>
                <span>Tiêu chuẩn: AHA/ACC Guidelines 2026</span>
              </div>
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

            <div className="flex items-center gap-3 flex-wrap">
              {/* Eye Switcher Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setActiveEyeTab('OD'); setAnalysisResult(resultOD); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeEyeTab === 'OD'
                      ? 'bg-[#0891B2] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Mắt Phải (OD)
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono-data ${activeEyeTab === 'OD' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {resultOD.overallVascularRiskScore}%
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveEyeTab('OS'); setAnalysisResult(resultOS); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeEyeTab === 'OS'
                      ? 'bg-[#0D9488] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Mắt Trái (OS)
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono-data ${activeEyeTab === 'OS' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {resultOS.overallVascularRiskScore}%
                  </span>
                </button>
              </div>

              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Xuất Báo Cáo PDF/CSV
              </button>
            </div>
          </div>

          <InteractiveCDSViewer
            analysisResult={activeEyeTab === 'OD' ? resultOD : resultOS}
            selectedEye={activeEyeTab === 'OD' ? 'Mắt Phải (Right - OD)' : 'Mắt Trái (Left - OS)'}
          />
        </div>
      )}

      {/* =========================================================================
          VIEW 4: MEDICAL PROFILE - HỒ SƠ Y TẾ (FR-8)
      ========================================================================== */}
      {activeView === 'medical-profile' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-teal-50 text-teal-700">
                  <UserCog className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Hồ Sơ Y Tế & Tiền Sử Bệnh Cá Nhân (FR-8)</h2>
                  <p className="text-xs text-slate-500">Mã bệnh nhân: <strong className="text-slate-800 font-mono-data">{patient.mrn}</strong></p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="px-4 py-2 bg-[#0891B2] hover:bg-[#0E7490] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <UserCog className="w-4 h-4" /> Chỉnh Sửa Thông Tin
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1">Họ và tên:</span>
                <strong className="text-slate-900 text-sm">{patient.fullName}</strong>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1">Tuổi & Giới tính:</span>
                <strong className="text-slate-900 text-sm">{patient.age} tuổi • {patient.gender === 'Male' ? 'Nam' : 'Nữ'}</strong>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1">Bác sĩ phụ trách:</span>
                <strong className="text-slate-900 text-sm">{patient.assignedDoctor}</strong>
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
                  <span className="text-2xl font-extrabold font-mono-data text-slate-900">{patient.systolicBp}/{patient.diastolicBp}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">mmHg (Chỉ số đo gần nhất)</span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-teal-200 shadow-xs">
                  <span className="text-slate-500 block text-xs">Chỉ số HbA1c</span>
                  <span className="text-2xl font-extrabold font-mono-data text-amber-700">{patient.hba1c}%</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Đường huyết trung bình 3 tháng</span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-teal-200 shadow-xs">
                  <span className="text-slate-500 block text-xs">Lần khám gần nhất</span>
                  <span className="text-xl font-bold font-mono-data text-slate-800">{patient.lastExamDate}</span>
                  <span className="text-[11px] text-emerald-600 block mt-0.5">Định kỳ 6 tháng/lần</span>
                </div>
              </div>
            </div>

            {/* Medical Conditions */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" /> Tiền Sử Bệnh Lý
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <span>Đái tháo đường:</span>
                  <strong className={patient.hasDiabetes ? 'text-red-600' : 'text-emerald-600'}>
                    {patient.hasDiabetes ? 'Có (Type 2)' : 'Không'}
                  </strong>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <span>Tăng huyết áp:</span>
                  <strong className={patient.hasHypertension ? 'text-red-600' : 'text-emerald-600'}>
                    {patient.hasHypertension ? 'Có' : 'Không'}
                  </strong>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <span>Hút thuốc lá:</span>
                  <strong className={patient.historyOfSmoking ? 'text-amber-600' : 'text-emerald-600'}>
                    {patient.historyOfSmoking ? 'Có tiền sử' : 'Không'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 5: SCAN HISTORY & REPORTS (FR-6, FR-7)
      ========================================================================== */}
      {activeView === 'scan-history' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-50 text-[#0891B2] border border-cyan-100">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Lịch Sử Phân Tích Cá Nhân & Báo Cáo Y Khoa (FR-6, FR-7)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tra cứu toàn bộ hồ sơ khám võng mạc định kỳ, đối soát chỉ số Biomarkers và theo dõi tiến trình hồi phục.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedHistoryResult(null);
                  setIsReportModalOpen(true);
                }}
                className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" /> Xuất Báo Cáo Tổng Hợp (PDF/CSV)
              </button>
            </div>
          </div>

          {/* 4 Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-50 text-[#0891B2]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Tổng lượt khám lưu trữ</span>
                <span className="text-xl font-bold font-mono-data text-slate-900">{scanHistory.length} ca</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Lần khám gần nhất</span>
                <span className="text-sm font-bold font-mono-data text-slate-900">{scanHistory[0]?.date || 'Hôm nay'}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Nguy cơ tim mạch hiện tại</span>
                <span className="text-xl font-bold font-mono-data text-amber-700">{scanHistory[0]?.cvdRisk || '60%'}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Bác sĩ phụ trách</span>
                <span className="text-xs font-bold text-slate-800">BS. CKII Nguyễn Thị Thanh</span>
              </div>
            </div>
          </div>

          {/* Longitudinal Trend Chart (Biểu đồ tiến triển sức khỏe vi mạch theo thời gian - FR-6) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#0891B2]" />
                  Biểu Đồ Xu Hướng Sức Khỏe Mạch Máu Võng Mạc Qua Các Mốc Khám (Longitudinal Trend)
                </h3>
                <p className="text-xs text-slate-500">
                  Theo dõi sự thay đổi của Chỉ số Động/Tĩnh mạch (A/V Ratio) và Điểm Rủi ro Tim mạch qua thời gian.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> Xu hướng: Nguy cơ giảm 18% (Tiến triển tốt)
              </span>
            </div>

            {/* Timeline Milestones Visual Chart */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              {scanHistory.slice(0, 4).reverse().map((item, index) => (
                <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono-data text-slate-500 font-bold">Lần {index + 1}</span>
                    <span className="text-[10px] font-mono-data text-slate-400">{item.date.split(' ')[0]}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-600">Rủi ro tim mạch:</span>
                    <span className="text-base font-extrabold font-mono-data text-slate-900">{item.cvdRisk}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Tỷ lệ A/V:</span>
                    <span className="font-bold font-mono-data text-[#0891B2]">{item.avRatio || 0.58}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.overallScore >= 75 ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${item.overallScore}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Tìm theo Mã phân tích, Ngày khám, Bác sĩ..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#0891B2] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Eye Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 px-1 text-[11px] font-medium flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Mắt:
                </span>
                <button
                  type="button"
                  onClick={() => setHistoryEyeFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    historyEyeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryEyeFilter('BOTH')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    historyEyeFilter === 'BOTH' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cả 2 Mắt
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryEyeFilter('OD')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    historyEyeFilter === 'OD' ? 'bg-[#0891B2] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mắt Phải (OD)
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryEyeFilter('OS')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    historyEyeFilter === 'OS' ? 'bg-[#0D9488] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mắt Trái (OS)
                </button>
              </div>

              {/* Risk Filter */}
              <select
                value={historyRiskFilter}
                onChange={(e) => setHistoryRiskFilter(e.target.value as any)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#0891B2] outline-none"
              >
                <option value="ALL">Mọi mức nguy cơ</option>
                <option value="HIGH">Nguy cơ cao (≥75%)</option>
                <option value="MODERATE">Nguy cơ trung bình (45 - 74%)</option>
                <option value="LOW">Nguy cơ thấp (&lt;45%)</option>
              </select>

              {(historySearch || historyEyeFilter !== 'ALL' || historyRiskFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setHistorySearch('');
                    setHistoryEyeFilter('ALL');
                    setHistoryRiskFilter('ALL');
                  }}
                  className="text-xs text-red-600 hover:underline px-1 font-medium"
                >
                  Đặt lại lọc
                </button>
              )}
            </div>
          </div>

          {/* Historical Scans Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Mã Phân Tích</th>
                    <th className="p-3.5">Ngày Giờ Khám</th>
                    <th className="p-3.5">Vị Trí & Loại Ảnh</th>
                    <th className="p-3.5">A/V Ratio</th>
                    <th className="p-3.5">Mật Độ Vi Mạch</th>
                    <th className="p-3.5">Rủi Ro Tim Mạch</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scanHistory
                    .filter((item) => {
                      const matchSearch =
                        historySearch.trim() === '' ||
                        item.id.toLowerCase().includes(historySearch.toLowerCase()) ||
                        item.date.toLowerCase().includes(historySearch.toLowerCase()) ||
                        item.doctor.toLowerCase().includes(historySearch.toLowerCase()) ||
                        item.scanType.toLowerCase().includes(historySearch.toLowerCase());

                      const matchEye =
                        historyEyeFilter === 'ALL' ||
                        (historyEyeFilter === 'BOTH' && (item.eye.includes('2 Mắt') || item.eye.includes('Cả 2'))) ||
                        (historyEyeFilter === 'OD' && item.eye.includes('OD') && !item.eye.includes('2 Mắt')) ||
                        (historyEyeFilter === 'OS' && item.eye.includes('OS') && !item.eye.includes('2 Mắt'));

                      const matchRisk =
                        historyRiskFilter === 'ALL' ||
                        (historyRiskFilter === 'HIGH' && item.overallScore >= 75) ||
                        (historyRiskFilter === 'MODERATE' && item.overallScore >= 45 && item.overallScore < 75) ||
                        (historyRiskFilter === 'LOW' && item.overallScore < 45);

                      return matchSearch && matchEye && matchRisk;
                    })
                    .map((scan) => (
                      <tr key={scan.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono-data font-bold text-[#0891B2]">
                          {scan.id}
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono-data">{scan.date}</td>
                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                scan.eye.includes('2 Mắt') || scan.eye.includes('Cả 2')
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : scan.eye.includes('OD')
                                  ? 'bg-cyan-100 text-cyan-800'
                                  : 'bg-teal-100 text-teal-800'
                              }`}
                            >
                              {scan.eye}
                            </span>
                            <div className="text-[11px] text-slate-600">{scan.scanType}</div>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono-data font-bold text-slate-800">
                          {scan.avRatio || 0.58}
                        </td>
                        <td className="p-3.5 font-mono-data text-slate-600">
                          {scan.vesselDensity || '15.2%'}
                        </td>
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono-data inline-block ${
                                scan.overallScore >= 75
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {scan.cvdRisk}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> {scan.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (scan.odResult) setResultOD(scan.odResult);
                                if (scan.osResult) setResultOS(scan.osResult);
                                if (scan.odResult) {
                                  setAnalysisResult(scan.odResult);
                                  setActiveEyeTab('OD');
                                } else if (scan.osResult) {
                                  setAnalysisResult(scan.osResult);
                                  setActiveEyeTab('OS');
                                }
                                onNavigate('cds-viewer');
                              }}
                              className="px-2.5 py-1.5 bg-[#0891B2] hover:bg-[#0E7490] text-white font-bold rounded-lg text-xs shadow-xs flex items-center gap-1 transition-colors"
                              title="Soi ảnh và Heatmap trên Bàn chẩn đoán CDS"
                            >
                              <Eye className="w-3.5 h-3.5" /> Soi Heatmap
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const customResult: AIRiskResult = {
                                  analysisId: scan.id,
                                  imageUrl: '/assets/images/fundus_original.png',
                                  status: 'COMPLETED',
                                  executionTimeMs: 2400,
                                  overallVascularRiskScore: scan.overallScore,
                                  cardiovascularRisk: {
                                    level: scan.overallScore >= 75 ? 'High' : (scan.overallScore >= 45 ? 'Moderate' : 'Low'),
                                    score: parseInt(scan.cvdRisk) || 68,
                                    hypertensionStage: scan.overallScore >= 75 ? 'Giai đoạn II (Tăng huyết áp Trung bình - Cao)' : 'Giai đoạn I (Tăng huyết áp Nhẹ)',
                                    threeYearStrokeRiskPercent: Number(((parseInt(scan.cvdRisk) || 68) * 0.22).toFixed(1)),
                                  },
                                  diabeticRetinopathyRisk: {
                                    level: scan.overallScore >= 70 ? 'Moderate' : 'Low',
                                    score: Math.max(20, scan.overallScore - 15),
                                    etdrsGrade: scan.overallScore >= 70 ? 'Mức 35-43 (NPDR nhẹ - trung bình)' : 'Mức 10-20 (Không có tổn thương vi mạch)',
                                    macularEdemaPresent: scan.overallScore >= 75,
                                  },
                                  glaucomaRisk: {
                                    level: 'Low',
                                    score: 22,
                                  },
                                  annotatedMap: {
                                    heatmapUrl: '/assets/images/fundus_heatmap.png',
                                    arteryVeinRatio: scan.avRatio || 0.58,
                                    vesselDensityPercentage: parseFloat(scan.vesselDensity) || 15.2,
                                    tortuosityIndex: 1.28,
                                    opticCupToDiscRatio: 0.35,
                                    detectedAnomalies: [
                                      {
                                        id: 'ANO-H1',
                                        type: 'AV_Nipping',
                                        coordinates: { x: 38, y: 42, width: 8, height: 8 },
                                        confidence: 0.92,
                                        description: `Dấu hiệu bắt chéo vi mạch chỉ số A/V ${scan.avRatio || 0.58}`,
                                      },
                                    ],
                                  },
                                  xaiExplainability: [
                                    {
                                      title: `Chỉ số A/V Ratio ca khám: ${scan.avRatio || 0.58}`,
                                      impact: (scan.avRatio || 0.58) < 0.58 ? 'High' : 'Medium',
                                      clinicalRationale: `Kết quả khám lưu trữ ngày ${scan.date}. Bác sĩ ${scan.doctor} đã ghi nhận hồ sơ y bạ.`,
                                    },
                                  ],
                                };
                                setSelectedHistoryResult(customResult);
                                setIsReportModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                              title="Xem phiếu khám y tế chi tiết"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-600" /> Báo Cáo
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const rows = [
                                  ['Thong so', 'Gia tri'],
                                  ['Ma phan tich', scan.id],
                                  ['Ngay kham', scan.date],
                                  ['Ho ten benh nhan', patient.fullName],
                                  ['Ma benh nhan (MRN)', patient.mrn],
                                  ['Vi tri mat', scan.eye],
                                  ['Loai anh', scan.scanType],
                                  ['Diem nguy co tong the', `${scan.overallScore}/100`],
                                  ['Nguy co tim mach (CVD)', scan.cvdRisk],
                                  ['Ty le A/V Ratio', (scan.avRatio || 0.58).toString()],
                                  ['Mat do vi mach', scan.vesselDensity || '15.2%'],
                                  ['Bac si phu trach', scan.doctor],
                                  ['Trang thai', scan.status],
                                ];
                                const csvStr = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
                                const encodedUri = encodeURI(csvStr);
                                const link = document.createElement('a');
                                link.setAttribute('href', encodedUri);
                                link.setAttribute('download', `AURA_Report_${patient.mrn}_${scan.id}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg text-xs transition-colors"
                              title="Tải tệp CSV ca khám này"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
                  <h3 className="text-sm font-bold">{patient.assignedDoctor}</h3>
                  <p className="text-[11px] text-cyan-200">Khoa Mắt & Tim Mạch Lâm Sàng • Trực Tuyến</p>
                </div>
              </div>
              <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300 font-mono-data">
                Hồ sơ: {patient.mrn}
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
        onClose={() => {
          setIsReportModalOpen(false);
          setSelectedHistoryResult(null);
        }}
        patient={patient}
        result={selectedHistoryResult || analysisResult}
        resultOD={resultOD}
        resultOS={resultOS}
        isDualEye={Boolean(resultOD && resultOS)}
        doctorName={patient.assignedDoctor}
      />

      <ConsultationChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        currentUserRole="patient"
        patientName={patient.fullName}
        patientMrn={patient.mrn}
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
