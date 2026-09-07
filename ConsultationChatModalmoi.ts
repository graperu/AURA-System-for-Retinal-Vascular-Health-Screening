import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  User,
  Stethoscope,
  CheckCheck,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Paperclip,
  Image,
  Calendar,
  Clock,
  Check,
  FileText,
  ChevronDown,
  PhoneCall,
  Video,
  Eye,
} from 'lucide-react';
import { chatApi } from '../services/api';

interface ScreeningAttachment {
  screeningId: string;
  eye: string;
  riskScore: number;
  riskLevel: string;
  cvdScore: string;
  imageUrl?: string;
  heatmapUrl?: string;
}

interface ChatMessage {
  id: string;
  sender: 'doctor' | 'patient';
  senderName: string;
  text: string;
  timestamp: string;
  attachment?: ScreeningAttachment;
  screeningId?: string;
}

export interface DoctorProfile {
  id: string;
  name: string;
  title: string;
  specialty: string;
  hospital: string;
  experience: string;
  status: 'ONLINE' | 'BUSY' | 'OFFLINE';
  statusText: string;
  responseTime: string;
}

export const DOCTORS_LIST: DoctorProfile[] = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'BS. CKII Nguyễn Thị Thanh',
    title: 'Bác sĩ chuyên khoa II',
    specialty: 'Chuyên khoa Vi Mạch Võng Mạc & Tim Mạch Lâm Sàng',
    hospital: 'Bệnh Viện Mắt Kỹ Thuật Cao AURA',
    experience: '15 năm kinh nghiệm',
    status: 'ONLINE',
    statusText: 'Đang trực tuyến',
    responseTime: 'Phản hồi trong 5-10 phút',
  },
  {
    id: '22222222-2222-2222-2222-222222222223',
    name: 'TS. BS Trần Quốc Hưng',
    title: 'Tiến sĩ - Bác sĩ',
    specialty: 'Chuyên khoa Nội Tim Mạch & Nguy Cơ Đột Quỵ',
    hospital: 'Viện Tim Mạch Quốc Gia',
    experience: '18 năm kinh nghiệm',
    status: 'BUSY',
    statusText: 'Đang hội chẩn',
    responseTime: 'Dự kiến phản hồi sau 30 phút',
  },
  {
    id: '22222222-2222-2222-2222-222222222224',
    name: 'ThS. BS Lê Hoàng Anh',
    title: 'Thạc sĩ - Bác sĩ',
    specialty: 'Chuyên khoa Nhãn Khoa & Võng Mạc Đái Tháo Đường',
    hospital: 'Khoa Mắt Kỹ Thuật Cao',
    experience: '10 năm kinh nghiệm',
    status: 'OFFLINE',
    statusText: 'Ngoại tuyến',
    responseTime: 'Trực vào 08:00 sáng mai',
  },
];

interface ConsultationChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: 'patient' | 'doctor' | 'clinic' | 'admin';
  patientName: string;
  patientMrn: string;
  doctorName?: string;
  targetUserId?: string;
  screeningId?: string;
  onOpenReportModal?: (scanId: string) => void;
}

export const ConsultationChatModal: React.FC<ConsultationChatModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  patientName,
  patientMrn,
  doctorName = 'BS. CKII Nguyễn Thị Thanh',
  targetUserId,
  screeningId,
  onOpenReportModal,
}) => {
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile>(DOCTORS_LIST[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  // Appointment Form State
  const [aptDate, setAptDate] = useState('2026-09-05');
  const [aptTime, setAptTime] = useState('09:30');
  const [aptType, setAptType] = useState<'CHAT_PRIORITY' | 'TELEHEALTH'>('CHAT_PRIORITY');
  const [aptNotes, setAptNotes] = useState('Nhờ Bác sĩ xem kết quả võng mạc có tỷ lệ A/V hẹp và rủi ro tim mạch 82%');
  const [aptSuccessToast, setAptSuccessToast] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activePartnerId = targetUserId || (currentUserRole === 'doctor' ? '11111111-1111-1111-1111-111111111111' : selectedDoctor.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const res = await chatApi.getConversation(activePartnerId);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((m: any) => {
          let parsedAttachment: ScreeningAttachment | undefined;
          if (m.attachmentUrl) {
            try {
              parsedAttachment = JSON.parse(m.attachmentUrl);
            } catch {
              parsedAttachment = undefined;
            }
          }
          return {
            id: m.id || String(Math.random()),
            sender: m.senderId === activePartnerId ? (currentUserRole === 'doctor' ? 'patient' : 'doctor') : (currentUserRole === 'doctor' ? 'doctor' : 'patient'),
            senderName: m.senderId === activePartnerId ? (currentUserRole === 'doctor' ? patientName : selectedDoctor.name) : (currentUserRole === 'doctor' ? doctorName : patientName),
            text: m.messageText || m.content || '',
            timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong',
            attachment: parsedAttachment,
            screeningId: m.screeningId,
          };
        });
        setMessages(mapped);
      } else if (messages.length === 0) {
        setMessages([
          {
            id: 'init_1',
            sender: currentUserRole === 'doctor' ? 'doctor' : 'patient',
            senderName: currentUserRole === 'doctor' ? selectedDoctor.name : patientName,
            text: currentUserRole === 'doctor'
              ? `Chào bác ${patientName}, tôi là ${selectedDoctor.name} phụ trách ca khám võng mạc của bác. Bác có thắc mắc gì về kết quả chẩn đoán không?`
              : `Kính chào Bác sĩ! Tôi vừa nhận kết quả phân tích ảnh võng mạc mã ${patientMrn}, nhờ Bác sĩ tư vấn giúp tôi ạ.`,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            attachment: {
              screeningId: screeningId || 'ANALYSIS-2026-7741',
              eye: 'Mắt Phải (OD)',
              riskScore: 78,
              riskLevel: 'Nguy cơ cao',
              cvdScore: '82%',
              imageUrl: '/assets/images/fundus_original.png',
              heatmapUrl: '/assets/images/fundus_heatmap.png',
            },
          },
        ]);
      }
      void chatApi.markAsRead(activePartnerId);
    } catch (err) {
      console.warn('Could not fetch consultation messages:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    void fetchMessages();
    const interval = setInterval(() => {
      void fetchMessages();
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, activePartnerId]);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (customText?: string, attachedScreening?: ScreeningAttachment) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend && !attachedScreening) return;
    if (!customText) setInputMessage('');
    setIsSending(true);
    setIsAttachMenuOpen(false);

    const attachmentPayload = attachedScreening ? JSON.stringify(attachedScreening) : undefined;

    const optimisticMsg: ChatMessage = {
      id: `local_${Date.now()}`,
      sender: currentUserRole === 'doctor' ? 'doctor' : 'patient',
      senderName: currentUserRole === 'doctor' ? selectedDoctor.name : patientName,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      attachment: attachedScreening,
      screeningId: attachedScreening?.screeningId || screeningId,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await chatApi.sendMessage(activePartnerId, textToSend, attachedScreening?.screeningId || screeningId, attachmentPayload);
      void fetchMessages();
    } catch (err) {
      console.warn('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachScreening = () => {
    const sampleAttachment: ScreeningAttachment = {
      screeningId: screeningId || 'ANALYSIS-2026-7741',
      eye: 'Mắt Phải (OD)',
      riskScore: 78,
      riskLevel: 'Nguy cơ cao',
      cvdScore: '82%',
      imageUrl: '/assets/images/fundus_original.png',
      heatmapUrl: '/assets/images/fundus_heatmap.png',
    };
    void handleSendMessage(`Tôi xin đính kèm kết quả phân tích ảnh võng mạc mã [${sampleAttachment.screeningId}] kèm bản đồ nhiệt Grad-CAM để Bác sĩ xem giúp ạ.`, sampleAttachment);
  };

  const handleConfirmAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setAptSuccessToast(true);
    setTimeout(() => {
      setAptSuccessToast(false);
      setIsAppointmentModalOpen(false);
      void handleSendMessage(`[LỊCH HẸN TƯ VẤN] Đã đặt lịch hẹn tư vấn với ${selectedDoctor.name} vào ngày ${aptDate} lúc ${aptTime} (${aptType === 'TELEHEALTH' ? 'Cuộc gọi Video Telehealth' : 'Tư vấn tin nhắn ưu tiên'}). Nội dung: "${aptNotes}"`);
    }, 2000);
  };

  const quickRepliesDoctor = [
    'Kết quả chẩn đoán đã được ký duyệt lâm sàng.',
    'Bác nhớ đo huyết áp mỗi sáng và duy trì uống thuốc đều đặn.',
    'Hình ảnh đáy mắt cho thấy vi tuần hoàn tương đối ổn định sau điều trị.',
    'Đề nghị tái khám chuyên khoa sau 6 tháng.',
  ];

  const quickRepliesPatient = [
    'Dạ Bác sĩ cho tôi hỏi lịch tái khám cụ thể ạ.',
    'Tôi đã tải và in phiếu kết quả PDF rồi ạ.',
    'Huyết áp sáng nay của tôi là 125/82 mmHg, chỉ số này có ổn không ạ?',
    'Cảm ơn Bác sĩ đã tư vấn chi tiết.',
  ];

  const quickReplies = currentUserRole === 'doctor' ? quickRepliesDoctor : quickRepliesPatient;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-2 sm:p-4 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-[680px] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Top Header with Doctor Selection & Status Bar */}
        <div className="flex-shrink-0 border-b border-slate-200 bg-[#F0FDFA] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0891B2] text-white shadow-sm font-bold text-lg">
                {currentUserRole === 'doctor' ? <User className="h-6 w-6" /> : <Stethoscope className="h-6 w-6" />}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  selectedDoctor.status === 'ONLINE'
                    ? 'bg-emerald-500'
                    : selectedDoctor.status === 'BUSY'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
                title={selectedDoctor.statusText}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                {currentUserRole === 'doctor' ? (
                  <h2 className="text-sm font-bold text-[#134E4A]">Bệnh nhân: {patientName} ({patientMrn})</h2>
                ) : (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedDoctor.id}
                      onChange={(e) => {
                        const d = DOCTORS_LIST.find((doc) => doc.id === e.target.value);
                        if (d) setSelectedDoctor(d);
                      }}
                      className="text-sm font-bold text-[#134E4A] bg-transparent border-b border-dashed border-teal-600 outline-none cursor-pointer pr-1"
                    >
                      {DOCTORS_LIST.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} ({doc.status === 'ONLINE' ? '🟢 Online' : doc.status === 'BUSY' ? '🟡 Bận' : '⚪ Offline'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    selectedDoctor.status === 'ONLINE'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : selectedDoctor.status === 'BUSY'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  {selectedDoctor.statusText}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {selectedDoctor.specialty} • <strong className="text-teal-700">{selectedDoctor.responseTime}</strong>
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {currentUserRole === 'patient' && (
              <button
                onClick={() => setIsAppointmentModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Đặt Lịch Tư Vấn</span>
              </button>
            )}
            <button
              onClick={async () => {
                setIsRefreshing(true);
                await fetchMessages();
                setIsRefreshing(false);
              }}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 transition-colors"
              title="Làm mới tin nhắn"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#0891B2]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Đóng cửa sổ"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50/80">
          <div className="text-center">
            <span className="rounded-full bg-teal-50 px-3.5 py-1 text-[10px] font-bold text-teal-800 border border-teal-200 font-mono-data">
              Hội thoại tư vấn mã hóa bảo mật HIPAA • Kết nối chuyên gia {selectedDoctor.name}
            </span>
          </div>

          {messages.map((msg) => {
            const isMe =
              (currentUserRole === 'doctor' && msg.sender === 'doctor') ||
              (currentUserRole !== 'doctor' && msg.sender === 'patient');

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-end gap-2 max-w-[90%] sm:max-w-[80%]">
                  {!isMe && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white text-xs font-bold shadow-xs">
                      {msg.sender === 'doctor' ? <Stethoscope className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs space-y-2.5 ${
                      isMe
                        ? 'bg-[#0891B2] text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    <p className="font-medium whitespace-pre-wrap">{msg.text}</p>

                    {/* Screening Attachment Card (FR-10 Requirement) */}
                    {msg.attachment && (
                      <div
                        className={`rounded-xl p-3 border space-y-2 transition-all ${
                          isMe
                            ? 'bg-cyan-800/60 border-cyan-400/50 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-white/20 pb-1.5 text-[11px] font-bold">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-cyan-300" /> Ca Khám: {msg.attachment.screeningId}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-red-500 text-white text-[9px] font-extrabold">
                            {msg.attachment.riskLevel}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex gap-1 shrink-0">
                            <img
                              src={msg.attachment.imageUrl || '/assets/images/fundus_original.png'}
                              alt="Fundus"
                              className="w-12 h-12 rounded-lg object-cover border border-white/30"
                            />
                            <img
                              src={msg.attachment.heatmapUrl || '/assets/images/fundus_heatmap.png'}
                              alt="Heatmap"
                              className="w-12 h-12 rounded-lg object-cover border border-cyan-400"
                            />
                          </div>
                          <div className="text-[10px] space-y-0.5 leading-tight">
                            <p>Vị trí: <strong>{msg.attachment.eye}</strong></p>
                            <p>Điểm rủi ro: <strong>{msg.attachment.riskScore}/100</strong></p>
                            <p>Nguy cơ tim mạch: <strong>{msg.attachment.cvdScore}</strong></p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (onOpenReportModal) onOpenReportModal(msg.attachment!.screeningId);
                          }}
                          className={`w-full py-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors ${
                            isMe
                              ? 'bg-white text-cyan-900 hover:bg-cyan-50'
                              : 'bg-[#0891B2] text-white hover:bg-[#0E7490]'
                          }`}
                        >
                          <FileText className="w-3 h-3" /> Xem Toàn Bộ Báo Cáo Y Khoa
                        </button>
                      </div>
                    )}

                    <div
                      className={`flex items-center justify-end gap-1 text-[10px] ${
                        isMe ? 'text-cyan-100' : 'text-slate-400'
                      }`}
                    >
                      <span className="font-mono-data">{msg.timestamp}</span>
                      {isMe && <CheckCheck className="h-3 w-3 text-emerald-300" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="border-t border-slate-100 bg-white px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Mẫu nhanh:</span>
          {quickReplies.map((reply, i) => (
            <button
              key={i}
              onClick={() => setInputMessage(reply)}
              className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-800 transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Chat Input Bar with Attachment Trigger */}
        <div className="border-t border-slate-200 bg-white p-3.5 relative">
          {/* Attachment Selector Popover */}
          {isAttachMenuOpen && (
            <div className="absolute bottom-16 left-4 z-30 w-72 rounded-2xl bg-white p-3 shadow-2xl border border-slate-200 space-y-2 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-xs font-bold text-slate-800">Đính kèm vào tin nhắn:</span>
                <button onClick={() => setIsAttachMenuOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={handleAttachScreening}
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
              void handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-cyan-50 hover:text-[#0891B2] hover:border-cyan-300 transition-colors"
              title="Đính kèm ca khám / Ảnh đáy mắt (FR-10)"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Nhập tin nhắn trao đổi với ${currentUserRole === 'doctor' ? 'bệnh nhân' : selectedDoctor.name}...`}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-cyan-600 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-sm disabled:opacity-40 transition-all active:scale-95"
              title="Gửi tin nhắn"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* =========================================================================
          APPOINTMENT SCHEDULING MODAL (FR-10 Requirement)
      ========================================================================== */}
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
