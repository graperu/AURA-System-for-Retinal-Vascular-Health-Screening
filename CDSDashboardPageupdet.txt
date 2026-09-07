import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PatientProfile, FundusAnalysisRequest, AIRiskResult, DoctorFeedback } from '../types/cds';
import { MOCK_PATIENTS, MOCK_SAMPLE_RESULT, MockAIService } from '../services/mockAiEngine';
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
  CheckCircle2,
  Eye,
  Activity,
  Users,
  FileSpreadsheet,
  FileText,
  Send,
  Search,
  CheckCheck,
  Clock,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { UserSession } from '../types/auth';
import { screeningApi, feedbackApi, chatApi } from '../services/api';

interface CDSDashboardPageProps {
  activeView?: string;
  onNavigate?: (viewId: string) => void;
  currentUser?: UserSession;
}

const DEFAULT_PATIENT_ID = '11111111-1111-1111-1111-111111111111';

export const CDSDashboardPage: React.FC<CDSDashboardPageProps> = ({
  activeView = 'cds-viewer',
  onNavigate = () => undefined,
  currentUser,
}) => {
  const [activePatient, setActivePatient] = useState<PatientProfile>(MOCK_PATIENTS[0]);
  const [analysisResult, setAnalysisResult] = useState<AIRiskResult>(MOCK_SAMPLE_RESULT);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ status: string; percent: number }>({
    status: '',
    percent: 0,
  });

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [feedbackSuccessToast, setFeedbackSuccessToast] = useState(false);

  // List of screenings from Database
  const [dbScreenings, setDbScreenings] = useState<any[]>([]);

  // Doctor in-app consultation chat state (FR-10)
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChatUserId, setSelectedChatUserId] = useState<string>(DEFAULT_PATIENT_ID);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [doctorChatInput, setDoctorChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const doctorChatBottomRef = useRef<HTMLDivElement>(null);

  // Doctor Report view filter
  const [reportStatusFilter, setReportStatusFilter] = useState<'ALL' | 'REVIEWED' | 'PENDING'>('ALL');

  // Load database screenings on mount
  const fetchDbScreenings = useCallback(async () => {
    try {
      const res = await screeningApi.getAll();
      if (res.success && Array.isArray(res.data)) {
        setDbScreenings(res.data);
      }
    } catch (err) {
      console.warn('Error fetching DB screenings for doctor:', err);
    }
  }, []);

  // Fetch conversations list for doctor
  const fetchConversations = useCallback(async () => {
    try {
      const res = await chatApi.getConversations();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setConversations(res.data);
      } else {
        // Fallback default patient contact
        setConversations([
          {
            otherUserId: DEFAULT_PATIENT_ID,
            otherUserName: 'Bệnh nhân Nguyễn Trọng Nam',
            otherUserEmail: 'patient@aura.com',
            otherUserRole: 'PATIENT',
            lastMessageText: 'Kính chào Bác sĩ! Tôi cần tư vấn kết quả khám võng mạc.',
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0,
          },
        ]);
      }
    } catch (err) {
      console.warn('Error fetching doctor conversations:', err);
    }
  }, []);

  // Fetch active conversation messages
  const fetchActiveChatMessages = useCallback(async () => {
    if (!selectedChatUserId) return;
    try {
      const res = await chatApi.getConversation(selectedChatUserId);
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map((m: any) => ({
          id: m.id,
          sender: m.senderId === selectedChatUserId ? 'patient' : 'doctor',
          senderName: m.senderId === selectedChatUserId ? 'Bệnh nhân' : 'BS. CKII Nguyễn Thị Thanh',
          text: m.messageText || m.content || '',
          time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong',
        }));
        setChatMessages(mapped);
      }
      void chatApi.markAsRead(selectedChatUserId);
    } catch (err) {
      console.warn('Error fetching messages for patient:', selectedChatUserId, err);
    }
  }, [selectedChatUserId]);

  useEffect(() => {
    void fetchDbScreenings();
    void fetchConversations();
  }, [fetchDbScreenings, fetchConversations]);

  useEffect(() => {
    void fetchActiveChatMessages();
  }, [fetchActiveChatMessages]);

  // Polling for chat when in consultation tab
  useEffect(() => {
    if (activeView !== 'consultation') return;
    const interval = setInterval(() => {
      void fetchActiveChatMessages();
      void fetchConversations();
    }, 3000);
    return () => clearInterval(interval);
  }, [activeView, fetchActiveChatMessages, fetchConversations]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (activeView === 'consultation') {
      doctorChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeView]);

  const handleStartAnalysis = async (request: FundusAnalysisRequest) => {
    setIsAnalyzing(true);
    setAnalysisProgress({ status: 'Khởi tạo kết nối AI Microservice...', percent: 5 });

    try {
      const result = await MockAIService.runFundusAnalysis(request, (status, percent) => {
        setAnalysisProgress({ status, percent });
      });
      setAnalysisResult(result);
      void fetchDbScreenings();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveFeedback = async (feedback: DoctorFeedback) => {
    try {
      await feedbackApi.submit({
        screeningId: feedback.analysisId || '84099cb3-562f-49ca-b0a4-fc4093e505cf',
        clinicalDecision: feedback.decision || 'APPROVED',
        doctorNotes: feedback.clinicalNotes || 'Bác sĩ đã xác nhận kết quả chẩn đoán',
        correctRiskLevel: feedback.adjustedCardioRisk || 'HIGH',
        eligibleForRetraining: true,
      });
      setFeedbackSuccessToast(true);
      setTimeout(() => setFeedbackSuccessToast(false), 5000);
      void fetchDbScreenings();
    } catch (err) {
      console.warn('Feedback submission error:', err);
    }
  };

  const handleDoctorSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorChatInput.trim() || isSendingChat) return;

    const textToSend = doctorChatInput.trim();
    setDoctorChatInput('');
    setIsSendingChat(true);

    const optimistic = {
      id: `m_${Date.now()}`,
      sender: 'doctor',
      senderName: 'BS. CKII Nguyễn Thị Thanh',
      text: textToSend,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, optimistic]);

    try {
      await chatApi.sendMessage(selectedChatUserId, textToSend);
      void fetchActiveChatMessages();
      void fetchConversations();
    } catch (err) {
      console.warn('Failed to send doctor reply:', err);
    } finally {
      setIsSendingChat(false);
    }
  };

  const selectedConversation = conversations.find((c) => c.otherUserId === selectedChatUserId) || {
    otherUserId: selectedChatUserId,
    otherUserName: activePatient.fullName,
    otherUserEmail: 'patient@aura.com',
  };

  const filteredPatients = MOCK_PATIENTS.filter(
    (p) =>
      p.fullName.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
      p.mrn.toLowerCase().includes(patientSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {feedbackSuccessToast && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl animate-slideInRight flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900">Thẩm Định & Ký Số Thành Công (FR-15, FR-16)</h4>
            <p className="text-xs text-slate-600">
              Kết luận lâm sàng đã được lưu vào hệ thống và kích hoạt trạng thái báo cáo chính thức.
            </p>
          </div>
        </div>
      )}

      {/* Doctor Header & Patient Selection Bar */}
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-5 shadow-medical-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#F0FDFA] text-[#0891B2] border border-[#CCFBF1] flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#134E4A]">{activePatient.fullName}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 text-[#0891B2] font-bold font-mono-data">
                {activePatient.mrn}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({activePatient.age} tuổi • {activePatient.gender === 'Male' ? 'Nam' : 'Nữ'})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Huyết áp: <strong className="text-slate-800 font-mono-data">{activePatient.systolicBp}/{activePatient.diastolicBp} mmHg</strong> | HbA1c: <strong className="text-slate-800 font-mono-data">{activePatient.hba1c}%</strong> | Tiền sử: {activePatient.hasDiabetes ? 'Đái tháo đường T2' : 'Bình thường'}
            </p>
          </div>
        </div>

        {/* Action Controls & Patient Switcher */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => onNavigate('consultation')}
            className="px-3.5 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-cyan-200 shadow-xs"
          >
            <MessageSquare className="w-4 h-4 text-cyan-700" />
            <span>Phòng Tư Vấn (FR-10)</span>
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-emerald-200 shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Xuất Báo Cáo PDF/CSV (FR-7)</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold hidden xl:block">Chọn BN:</span>
            <select
              value={activePatient.id}
              onChange={(e) => {
                const p = MOCK_PATIENTS.find((item) => item.id === e.target.value);
                if (p) setActivePatient(p);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#0891B2]"
            >
              {MOCK_PATIENTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.mrn}) — {p.age}t
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: CDS VIEWER - CHẨN ĐOÁN ẢNH AI & CDS (FR-3, FR-4, FR-14, FR-15, FR-16)
      ========================================================================== */}
      {(activeView === 'cds-viewer' || activeView === 'dashboard') && (
        <div className="space-y-6">
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

            {/* Right Column: Interactive Side-by-Side CDS Viewer & XAI Panel (8 cols) */}
            <div className="xl:col-span-8 space-y-6">
              <InteractiveCDSViewer analysisResult={analysisResult} selectedEye="OD (Mắt Phải)" />
            </div>
          </div>

          {/* Full-Width Risk Assessment & Biomarkers Panel */}
          <RiskAssessmentPanel result={analysisResult} />

          {/* Doctor Audit Validation Bar & Sign-Off */}
          <ClinicalValidationBar
            analysisId={analysisResult.analysisId}
            onSaveFeedback={handleSaveFeedback}
          />
        </div>
      )}

      {/* =========================================================================
          VIEW 2: PATIENT LIST - DANH SÁCH BỆNH NHÂN ĐƯỢC PHÂN CÔNG (FR-13)
      ========================================================================== */}
      {activeView === 'patient-list' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-50 text-cyan-700">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Danh Sách Bệnh Nhân Phụ Trách (FR-13)</h2>
                  <p className="text-xs text-slate-500">Quản lý hồ sơ bệnh nhân tiếp nhận, theo dõi lịch sử và trao đổi lâm sàng.</p>
                </div>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên hoặc MRN..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0891B2]"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Bệnh Nhân</th>
                    <th className="p-3.5">Mã MRN</th>
                    <th className="p-3.5">Tuổi / Giới Tính</th>
                    <th className="p-3.5">Huyết Áp</th>
                    <th className="p-3.5">HbA1c</th>
                    <th className="p-3.5">Lần Khám Cuối</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{p.fullName}</td>
                      <td className="p-3.5 font-mono-data text-cyan-800 font-semibold">{p.mrn}</td>
                      <td className="p-3.5 text-slate-700">{p.age}t • {p.gender === 'Male' ? 'Nam' : 'Nữ'}</td>
                      <td className="p-3.5 font-mono-data font-semibold text-slate-800">{p.systolicBp}/{p.diastolicBp} mmHg</td>
                      <td className="p-3.5 font-mono-data font-semibold text-amber-700">{p.hba1c}%</td>
                      <td className="p-3.5 text-slate-500 font-mono-data">{p.lastExamDate}</td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setActivePatient(p);
                            setSelectedChatUserId(DEFAULT_PATIENT_ID);
                            onNavigate('consultation');
                          }}
                          className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 font-bold rounded-lg text-xs shadow-xs transition-colors inline-flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-cyan-700" /> Nhắn Tin
                        </button>
                        <button
                          onClick={() => {
                            setActivePatient(p);
                            onNavigate('cds-viewer');
                          }}
                          className="px-3 py-1.5 bg-[#0891B2] hover:bg-[#0E7490] text-white font-bold rounded-lg text-xs shadow-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Chẩn Đoán CDS
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
          VIEW 3: REPORTS - BÁO CÁO Y KHOA & KÝ DUYỆT (FR-7, FR-15, FR-16)
      ========================================================================== */}
      {activeView === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Trung Tâm Báo Cáo Chẩn Đoán & Ký Duyệt (FR-7)</h2>
                  <p className="text-xs text-slate-500">Quản lý các ca sàng lọc, kiểm tra kết quả AI, ký số và xuất báo cáo PDF/CSV chuẩn y tế.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-4 py-2 bg-[#0891B2] hover:bg-[#0E7490] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-4 h-4" /> Xuất Báo Cáo BN Đang Chọn (PDF/CSV)
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                onClick={() => setReportStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  reportStatusFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ca khám ({dbScreenings.length || 2})
              </button>
              <button
                onClick={() => setReportStatusFilter('REVIEWED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  reportStatusFilter === 'REVIEWED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Đã ký duyệt lâm sàng
              </button>
              <button
                onClick={() => setReportStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  reportStatusFilter === 'PENDING'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Chờ bác sĩ thẩm định
              </button>
            </div>

            {/* Screening Reports Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Mã Ca Khám</th>
                    <th className="p-3.5">Bệnh Nhân</th>
                    <th className="p-3.5">Mức Nguy Cơ AI</th>
                    <th className="p-3.5">Độ Tin Cậy</th>
                    <th className="p-3.5">Trạng Thái Thẩm Định</th>
                    <th className="p-3.5">Ghi Chú Bác Sĩ</th>
                    <th className="p-3.5 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dbScreenings.length > 0 ? (
                    dbScreenings.map((sc) => (
                      <tr key={sc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono-data font-bold text-cyan-800">
                          {sc.id ? `SCN-${sc.id.substring(0, 8).toUpperCase()}` : 'SCN-2026-0941'}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">{activePatient.fullName}</td>
                        <td className="p-3.5 font-mono-data">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              sc.riskLevel === 'CRITICAL' || sc.riskLevel === 'HIGH'
                                ? 'bg-red-100 text-red-700 border border-red-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {sc.riskLevel || 'HIGH'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono-data font-semibold text-slate-700">
                          {sc.confidence ? `${Math.round(sc.confidence * 100)}%` : '92%'}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              sc.status === 'REVIEWED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                            }`}
                          >
                            {sc.status === 'REVIEWED' ? 'Đã duyệt lâm sàng' : 'Chờ thẩm định'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 max-w-xs truncate">
                          {sc.doctorNotes || 'Chưa có ghi chú lâm sàng'}
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => {
                              setAnalysisResult((prev) => ({
                                ...prev,
                                analysisId: `ANALYSIS-${sc.id ? sc.id.substring(0, 8).toUpperCase() : '2026'}`,
                              }));
                              setIsReportModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-xs shadow-xs transition-colors inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-700" /> Xem/Xuất PDF-CSV
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono-data font-bold text-cyan-800">SCN-7741-2026</td>
                      <td className="p-3.5 font-bold text-slate-900">{activePatient.fullName}</td>
                      <td className="p-3.5 font-mono-data">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-300">
                          HIGH
                        </span>
                      </td>
                      <td className="p-3.5 font-mono-data font-semibold text-slate-700">92%</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Đã duyệt lâm sàng
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">
                        Co thắt vi mạch võng mạc, HA 138/88 mmHg. Tái khám sau 6 tháng.
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => setIsReportModalOpen(true)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-xs shadow-xs transition-colors inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-700" /> Xem/Xuất PDF-CSV
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: CONSULTATION - PHÒNG TƯ VẤN TRỰC TUYẾN CHUYÊN DỤNG (FR-10, FR-20)
      ========================================================================== */}
      {activeView === 'consultation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
          {/* Left Column: Conversations List (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#0891B2]" />
                <h3 className="text-sm font-bold text-slate-900">Danh Sách Bệnh Nhân (FR-10)</h3>
              </div>
              <span className="text-[11px] font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">
                {conversations.length} Hội thoại
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {conversations.map((conv) => {
                const isSelected = conv.otherUserId === selectedChatUserId;
                return (
                  <button
                    key={conv.otherUserId}
                    onClick={() => setSelectedChatUserId(conv.otherUserId)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                      isSelected ? 'bg-cyan-50/80 border-l-4 border-[#0891B2]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                      BN
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{conv.otherUserName}</h4>
                        {conv.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {conv.lastMessageText || 'Bấm để bắt đầu hội thoại tư vấn'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Chat Room Area (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-cyan-700 flex items-center justify-center font-bold text-sm text-white shadow-sm">
                    BN
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">{selectedConversation.otherUserName}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Trực tuyến
                    </span>
                  </div>
                  <p className="text-[11px] text-cyan-200">
                    Bệnh nhân sàng lọc • Hội thoại mã hóa HIPAA (FR-10, FR-20)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" /> Xem Báo Cáo
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/80">
              <div className="text-center">
                <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-bold text-teal-800 border border-teal-200 font-mono-data">
                  Kênh tư vấn lâm sàng trực tuyến • Đồng bộ dữ liệu PostgreSQL realtime (3s)
                </span>
              </div>

              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'doctor' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      msg.sender === 'doctor'
                        ? 'bg-[#0891B2] text-white rounded-br-none font-medium'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none font-medium'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono-data mt-1 px-1">{msg.time}</span>
                </div>
              ))}
              <div ref={doctorChatBottomRef} />
            </div>

            {/* Doctor Quick Clinical Reply Chips */}
            <div className="border-t border-slate-100 bg-white px-4 py-2 flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Mẫu tư vấn:</span>
              {[
                'Kết quả chẩn đoán đã được bác sĩ ký duyệt chính thức.',
                'Bác nhớ đo huyết áp mỗi sáng và duy trì uống thuốc đều đặn.',
                'Hình ảnh đáy mắt cho thấy vi tuần hoàn tương đối ổn định sau điều trị.',
                'Đề nghị tái khám chuyên khoa sau 6 tháng.',
              ].map((txt, idx) => (
                <button
                  key={idx}
                  onClick={() => setDoctorChatInput(txt)}
                  className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-800 transition-colors"
                >
                  {txt}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleDoctorSendMessage} className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                value={doctorChatInput}
                onChange={(e) => setDoctorChatInput(e.target.value)}
                placeholder="Nhập kết luận hoặc hướng dẫn y khoa cho bệnh nhân..."
                className="flex-1 px-4 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0891B2] focus:bg-white outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!doctorChatInput.trim() || isSendingChat}
                className="px-4 py-2.5 bg-[#0891B2] hover:bg-[#0E7490] text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 disabled:opacity-40 transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5" /> Gửi Phản Hồi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 5: RISK ANALYTICS - THỐNG KÊ & XU HƯỚNG (FR-17, FR-21)
      ========================================================================== */}
      {activeView === 'risk-analytics' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-teal-50 text-teal-700">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Thống Kê Lâm Sàng & Xu Hướng Vi Mạch (FR-17, FR-21)</h2>
                  <p className="text-xs text-slate-500">Độ tương đồng chẩn đoán AI-Bác sĩ và phân bố nguy cơ tim mạch tổng thể.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border border-teal-200">
                <span className="text-xs font-bold text-teal-900 uppercase">Tổng ca thẩm định</span>
                <div className="text-3xl font-extrabold font-mono-data text-teal-700 mt-2">142 Ca</div>
                <p className="text-[11px] text-slate-600 mt-1">Đã ký duyệt lâm sàng chính thức</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
                <span className="text-xs font-bold text-emerald-900 uppercase">Độ tương đồng AI - Bác sĩ</span>
                <div className="text-3xl font-extrabold font-mono-data text-emerald-700 mt-2">94.2%</div>
                <p className="text-[11px] text-slate-600 mt-1">Inter-observer Agreement Cohen's Kappa = 0.89</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl border border-rose-200">
                <span className="text-xs font-bold text-rose-900 uppercase">Ca nguy cơ cao phát hiện sớm</span>
                <div className="text-3xl font-extrabold font-mono-data text-rose-700 mt-2">38 Ca</div>
                <p className="text-[11px] text-slate-600 mt-1">Đã can thiệp điều trị dự phòng</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <MedicalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        patient={activePatient}
        result={analysisResult}
        doctorName="BS. CKII Nguyễn Thị Thanh"
      />

      <ConsultationChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        currentUserRole="doctor"
        patientName={activePatient.fullName}
        patientMrn={activePatient.mrn}
      />
    </div>
  );
};
