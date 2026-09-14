import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  User,
  Stethoscope,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { chatApi } from '../../services/api';
import { stompClient } from '../../services/websocketService';
import { DoctorPatientSummary } from '../../pages/CDSDashboardPage';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface ChatMessage {
  id: string;
  sender: 'doctor' | 'patient';
  senderName: string;
  text: string;
  timestamp: string;
}

interface DoctorConsultationViewProps {
  assignedPatients: DoctorPatientSummary[];
  initialSelectedPatientId?: string | null;
  currentUserId?: string;
  doctorName?: string;
  onSelectPatientForCDS: (patientId: string) => void;
}

export const DoctorConsultationView: React.FC<DoctorConsultationViewProps> = ({
  assignedPatients,
  initialSelectedPatientId,
  currentUserId,
  doctorName,
  onSelectPatientForCDS,
}) => {
  const { user } = useAuth();
  const { t, isVi } = useLanguage();
  const currentDoctorName = doctorName || user?.name || (isVi ? 'Bác sĩ chuyên khoa' : 'Attending Specialist');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    initialSelectedPatientId || (assignedPatients.length > 0 ? assignedPatients[0].patientId : null)
  );
  const [searchPatient, setSearchPatient] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Tìm bệnh nhân đang được chọn
  const activePatient = useMemo(() => {
    return assignedPatients.find((p) => p.patientId === selectedPatientId) || assignedPatients[0] || null;
  }, [assignedPatients, selectedPatientId]);

  // Cập nhật selectedPatientId nếu activePatient thay đổi
  useEffect(() => {
    if (initialSelectedPatientId) {
      setSelectedPatientId(initialSelectedPatientId);
    } else if (!selectedPatientId && assignedPatients.length > 0) {
      setSelectedPatientId(assignedPatients[0].patientId);
    }
  }, [initialSelectedPatientId, assignedPatients, selectedPatientId]);

  // Danh sách bệnh nhân sau khi lọc theo từ khóa tìm kiếm
  const filteredPatients = useMemo(() => {
    if (!searchPatient.trim()) return assignedPatients;
    const q = searchPatient.toLowerCase();
    return assignedPatients.filter(
      (p) =>
        (p.fullName || '').toLowerCase().includes(q) ||
        (p.mrn || '').toLowerCase().includes(q) ||
        (p.phoneNumber || '').includes(q)
    );
  }, [assignedPatients, searchPatient]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Tải lịch sử tin nhắn & Kết nối WebSocket STOMP
  useEffect(() => {
    if (!selectedPatientId) return;

    let isMounted = true;
    setLoadingHistory(true);

    // 1. Tải lịch sử chat từ cơ sở dữ liệu thật
    chatApi
      .getConversation(selectedPatientId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && Array.isArray(res.data)) {
          const patientDisplayName = activePatient?.fullName || (isVi ? 'Bệnh nhân' : 'Patient');
          const mapped: ChatMessage[] = res.data.map((item: any) => {
            const isDoctor = item.senderId === currentUserId;
            return {
              id: item.id || `msg-${Math.random()}`,
              sender: isDoctor ? 'doctor' : 'patient',
              senderName: isDoctor ? currentDoctorName : patientDisplayName,
              text: item.messageText,
              timestamp: item.createdAt
                ? new Date(item.createdAt).toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '',
            };
          });
          setMessages(mapped);
        } else {
          setMessages([]);
        }
      })
      .catch((err) => {
        console.warn('Error loading conversation:', err);
        if (isMounted) setMessages([]);
      })
      .finally(() => {
        if (isMounted) setLoadingHistory(false);
      });

    // 2. Đánh dấu các tin nhắn của bệnh nhân này là đã đọc
    chatApi.markAsRead(selectedPatientId).catch(() => {});

    // 3. Kết nối WebSocket STOMP và lắng nghe tin nhắn đến
    stompClient.connect();

    // Subscribe cả topic của bệnh nhân và topic của bác sĩ
    const patientTopic = `/topic/chat.${selectedPatientId}`;
    const doctorTopic = currentUserId ? `/topic/chat.${currentUserId}` : null;

    const handleIncomingMessage = (msg: any) => {
      if (!isMounted || !msg || !msg.messageText) return;
      // Bỏ qua tin nhắn do chính bác sĩ vừa gửi qua websocket (đã optimistic UI)
      if (currentUserId && msg.senderId === currentUserId) return;

      const patientDisplayName = activePatient?.fullName || (isVi ? 'Bệnh nhân' : 'Patient');
      const incoming: ChatMessage = {
        id: msg.id || String(Date.now()),
        sender: 'patient',
        senderName: patientDisplayName,
        text: msg.messageText,
        timestamp: msg.createdAt
          ? new Date(msg.createdAt).toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : new Date().toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
    };

    stompClient.subscribe(patientTopic, handleIncomingMessage);
    if (doctorTopic && doctorTopic !== patientTopic) {
      stompClient.subscribe(doctorTopic, handleIncomingMessage);
    }

    return () => {
      isMounted = false;
      stompClient.unsubscribe(patientTopic);
      if (doctorTopic) {
        stompClient.unsubscribe(doctorTopic);
      }
    };
  }, [selectedPatientId, currentUserId, activePatient, currentDoctorName, isVi]);

  // Gửi tin nhắn
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !selectedPatientId || isSending) return;

    const textToSend = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    const tempId = `tmp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      sender: 'doctor',
      senderName: currentDoctorName,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await chatApi.sendMessage(selectedPatientId, textToSend);
      if (!res.success) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch (err) {
      console.warn('Error sending message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  // Câu trả lời nhanh lâm sàng cho Bác sĩ (Quick Clinical Replies)
  const quickReplies = useMemo(
    () =>
      isVi
        ? [
            'Kết quả phân tích vi mạch võng mạc của bác đã được bác sĩ ký duyệt.',
            'Chỉ số A/V Ratio ổn định, bác tiếp tục duy trì phác đồ điều trị và đo huyết áp mỗi sáng.',
            'Đáy mắt có biểu hiện xơ cứng tiểu động mạch nhẹ, bác chú ý kiêng mặn và tái khám sau 3 tháng.',
            'Bác sĩ đã xuất phiếu kết quả chẩn đoán, bác có thể tải về từ hồ sơ bệnh nhân.',
          ]
        : [
            'Your retinal microvascular analysis has been reviewed and signed off.',
            'Arteriovenous ratio is stable; maintain current regimen and check morning BP.',
            'Mild retinal arteriolar sclerosis detected; reduce sodium intake and follow up in 3 months.',
            'Clinical report has been issued and is available for download in your patient portal.',
          ],
    [isVi]
  );

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-5 shadow-medical-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#0891B2]" />
            <h1 className="text-lg font-bold text-[#134E4A]">
              {t('doctor.consultation.title', 'Kênh Tư Vấn & Trao Đổi Trực Tuyến Với Bệnh Nhân')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('doctor.consultation.subtitle', 'FR-20: Trao đổi chuyên môn lâm sàng hai chiều thời gian thực qua giao thức WebSocket STOMP.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('doctor.consultation.stompActive', 'STOMP Realtime Active')}
          </span>
        </div>
      </div>

      {/* Main Full-Screen Layout: Left Patient List (4 cols) & Right Chat Box (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-250px)] min-h-[580px]">
        {/* Left Column: Assigned Patients List (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-medical-sm flex flex-col overflow-hidden">
          {/* Patient Search Header */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#0891B2]" />
                {t('doctor.consultation.assignedPatients', 'Bệnh Nhân Phụ Trách')} ({assignedPatients.length})
              </span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchPatient}
                onChange={(e) => setSearchPatient(e.target.value)}
                placeholder={t('doctor.consultation.searchPlaceholder', 'Tìm theo tên, MRN, SĐT...')}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0891B2] transition-all"
              />
            </div>
          </div>

          {/* Patients Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {filteredPatients.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {t('doctor.consultation.noPatients', 'Không tìm thấy bệnh nhân nào.')}
              </div>
            ) : (
              filteredPatients.map((p) => {
                const isSelected = p.patientId === selectedPatientId;
                return (
                  <button
                    key={p.patientId}
                    type="button"
                    onClick={() => setSelectedPatientId(p.patientId)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#F0FDFA] border-l-4 border-l-[#0891B2] shadow-xs'
                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center shrink-0 text-xs border ${
                        isSelected
                          ? 'bg-[#0891B2] text-white border-[#0E7490]'
                          : 'bg-teal-50 text-[#0891B2] border-[#CCFBF1]'
                      }`}
                    >
                      {p.fullName
                        ? p.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                        : (isVi ? 'BN' : 'PT')}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#134E4A]' : 'text-slate-900'}`}>
                          {p.fullName || (isVi ? 'Bệnh nhân' : 'Patient')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono-data shrink-0">
                          {p.screeningCount ? `${p.screeningCount} ${isVi ? 'ca' : 'scans'}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-500 font-mono-data truncate">
                          {p.mrn || 'N/A'} • {p.age ? `${p.age}${isVi ? 't' : 'y'}` : ''} {p.gender === 'Female' ? (isVi ? 'Nữ' : 'Female') : (isVi ? 'Nam' : 'Male')}
                        </span>
                        {p.latestRiskLevel && (
                          <RiskBadge level={p.latestRiskLevel} size="sm" showIcon={false} />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Workspace (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-medical-sm flex flex-col overflow-hidden">
          {activePatient ? (
            <>
              {/* Active Conversation Header */}
              <div className="p-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] text-[#0891B2] border border-[#CCFBF1] flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {activePatient.fullName || (isVi ? 'Bệnh nhân' : 'Patient')}
                      </h3>
                      <span className="text-[11px] font-mono-data px-2 py-0.5 rounded-md bg-cyan-50 text-[#0891B2] font-semibold border border-cyan-200">
                        {activePatient.mrn || (isVi ? 'Chưa có MRN' : 'No MRN')}
                      </span>
                      {activePatient.latestRiskLevel && (
                        <RiskBadge level={activePatient.latestRiskLevel} size="sm" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                      <span>{isVi ? 'HA:' : 'BP:'} <strong className="text-slate-700 font-mono-data">{activePatient.systolicBp && activePatient.diastolicBp ? `${activePatient.systolicBp}/${activePatient.diastolicBp}` : '--'}</strong></span>
                      <span>HbA1c: <strong className="text-slate-700 font-mono-data">{activePatient.hba1c ? `${activePatient.hba1c}%` : '--'}</strong></span>
                      <span className="hidden sm:inline text-teal-700 font-semibold">• {t('doctor.consultation.attendingDoctor', 'Bác sĩ phụ trách')}: {currentDoctorName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onSelectPatientForCDS(activePatient.patientId)}
                    icon={<Stethoscope className="w-3.5 h-3.5" />}
                    title={t('doctor.consultation.openCdsTitle', 'Mở ảnh đáy mắt của bệnh nhân này trên bàn chẩn đoán CDS')}
                  >
                    <span className="hidden sm:inline">{t('doctor.consultation.openCds', 'Mở CDS')}</span>
                  </Button>
                </div>
              </div>

              {/* Medical Safety Banner */}
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>{t('doctor.consultation.safetyWarningTitle', 'Cảnh báo an toàn y khoa:')}</strong>{' '}
                  {t('doctor.consultation.safetyWarningText', 'Kênh trao đổi chuyên môn y khoa thời gian thực (WebSocket). Không sử dụng cho các trường hợp cấp cứu khẩn cấp.')}
                </span>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
                {loadingHistory ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    {t('doctor.consultation.loadingHistory', 'Đang nạp lịch sử hội thoại...')}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-[#0891B2] flex items-center justify-center mx-auto">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-700">
                      {t('doctor.consultation.noMessagesTitle', 'Chưa có tin nhắn nào')}
                    </h4>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      {isVi
                        ? `Bắt đầu cuộc trò chuyện tư vấn với bệnh nhân ${activePatient.fullName || 'bệnh nhân'} bằng cách nhập tin nhắn hoặc chọn gợi ý lâm sàng bên dưới.`
                        : `Start a consultation with patient ${activePatient.fullName || 'patient'} by typing a message or selecting a quick clinical reply below.`}
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isDoctor = msg.sender === 'doctor';
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 max-w-[85%] ${
                          isDoctor ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                            isDoctor
                              ? 'bg-gradient-to-r from-[#0891B2] to-[#0E7490] text-white'
                              : 'bg-teal-700 text-white'
                          }`}
                        >
                          {isDoctor ? <Stethoscope className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>

                        <div
                          className={`p-3 rounded-2xl text-xs space-y-1 shadow-xs ${
                            isDoctor
                              ? 'bg-gradient-to-r from-[#0891B2] to-[#0E7490] text-white rounded-tr-none'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                          }`}
                        >
                          <div
                            className={`flex items-center justify-between gap-3 text-[10px] ${
                              isDoctor ? 'text-teal-100' : 'text-slate-400'
                            }`}
                          >
                            <span className="font-semibold">{msg.senderName}</span>
                            <span>{msg.timestamp}</span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Clinical Replies */}
              <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center gap-1.5 flex-wrap shrink-0">
                <span className="text-[11px] font-bold text-slate-500 shrink-0">
                  {t('doctor.consultation.quickRepliesLabel', 'Gợi ý nhanh:')}
                </span>
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputMessage(reply)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-[#CCFBF1] hover:text-[#0891B2] text-slate-700 transition-colors border border-slate-200 cursor-pointer"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    isVi
                      ? `Gửi hướng dẫn lâm sàng cho ${activePatient.fullName || 'bệnh nhân'}...`
                      : `Send clinical guidance to ${activePatient.fullName || 'patient'}...`
                  }
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0891B2] focus:bg-white transition-all text-slate-800"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!inputMessage.trim() || isSending}
                  loading={isSending}
                  icon={<Send className="w-4 h-4" />}
                >
                  {t('doctor.consultation.sendButton', 'Gửi')}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 text-slate-400">
              <UserCheck className="w-12 h-12 text-slate-300" />
              <p className="text-xs font-medium">
                {t('doctor.consultation.selectPatientPrompt', 'Vui lòng chọn một bệnh nhân ở cột bên trái để bắt đầu cuộc tư vấn.')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
