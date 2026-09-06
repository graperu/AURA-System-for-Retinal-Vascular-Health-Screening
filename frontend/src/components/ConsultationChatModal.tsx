import React, { useState } from 'react';
import { X, Send, User, Stethoscope, Image, CheckCheck, Paperclip, MessageSquare } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'doctor' | 'patient';
  senderName: string;
  text: string;
  timestamp: string;
  attachment?: string;
}

interface ConsultationChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: 'patient' | 'doctor' | 'clinic' | 'admin';
  patientName: string;
  patientMrn: string;
  doctorName?: string;
}

export const ConsultationChatModal: React.FC<ConsultationChatModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  patientName,
  patientMrn,
  doctorName = 'BS. CKII Nguyễn Thị Thanh',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'patient',
      senderName: patientName,
      text: `Kính chào Bác sĩ! Tôi vừa nhận kết quả phân tích ảnh võng mạc mã ${patientMrn}, thấy chỉ số nguy cơ tim mạch 74% và tỷ lệ A/V 0.52. Bác sĩ tư vấn giúp tôi có nguy hiểm không ạ?`,
      timestamp: '14:20',
    },
    {
      id: '2',
      sender: 'doctor',
      senderName: doctorName,
      text: `Chào bác ${patientName}, tôi đã thẩm định lại ảnh chụp đáy mắt và bản đồ nhiệt AI của bác. Tỷ lệ A/V 0.52 cho thấy động mạch nhỏ võng mạc hơi co thắt do huyết áp 138/88 mmHg. Chưa có tổn thương nặng nhưng cần theo dõi chặt chẽ.`,
      timestamp: '14:25',
    },
    {
      id: '3',
      sender: 'doctor',
      senderName: doctorName,
      text: 'Tôi đã ký xác nhận kết quả và gửi kèm hướng dẫn chế độ ăn giảm muối. Bác có thể tải bản Báo cáo PDF chính thức trên hệ thống nhé.',
      timestamp: '14:26',
    },
    {
      id: '4',
      sender: 'patient',
      senderName: patientName,
      text: 'Dạ cảm ơn Bác sĩ rất nhiều! Tôi sẽ uống thuốc đúng giờ và tái khám sau 6 tháng như dặn ạ.',
      timestamp: '14:28',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');

  if (!isOpen) return null;

  const partnerTitle =
    currentUserRole === 'doctor'
      ? `Bệnh nhân: ${patientName} (${patientMrn})`
      : `${doctorName} (Bác sĩ chuyên khoa)`;

  const partnerRoleDesc =
    currentUserRole === 'doctor'
      ? 'Hồ sơ khám đáy mắt định kỳ • HA: 138/88 mmHg'
      : 'Bác sĩ phụ trách lâm sàng • Đang trực tuyến';

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender: currentUserRole === 'doctor' ? 'doctor' : 'patient',
      senderName: currentUserRole === 'doctor' ? doctorName : patientName,
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
  };

  const quickRepliesDoctor = [
    'Kết quả chẩn đoán đã được ký duyệt.',
    'Bác nhớ đo huyết áp mỗi sáng và uống thuốc đều đặn.',
    'Hình ảnh đáy mắt cho thấy vi tuần hoàn ổn định sau điều trị.',
  ];

  const quickRepliesPatient = [
    'Dạ bác sĩ cho tôi hỏi lịch tái khám cụ thể ạ.',
    'Tôi đã tải được báo cáo kết quả PDF rồi ạ.',
    'Cảm ơn bác sĩ đã tư vấn chi tiết.',
  ];

  const quickReplies = currentUserRole === 'doctor' ? quickRepliesDoctor : quickRepliesPatient;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative flex h-[620px] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#F0FDFA] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-700 text-white shadow-sm">
              {currentUserRole === 'doctor' ? <User className="h-6 w-6" /> : <Stethoscope className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#134E4A]">{partnerTitle}</h2>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
              </div>
              <p className="text-[11px] text-slate-500">{partnerRoleDesc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          <div className="text-center">
            <span className="rounded-full bg-slate-200/80 px-3 py-1 text-[10px] font-semibold text-slate-600 font-mono-data">
              Hội thoại tư vấn mã hóa bảo mật HIPAA • Hôm nay
            </span>
          </div>

          {messages.map((msg) => {
            const isMe =
              (currentUserRole === 'doctor' && msg.sender === 'doctor') ||
              (currentUserRole !== 'doctor' && msg.sender === 'patient');

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-end gap-2 max-w-[82%]">
                  {!isMe && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-xs font-bold">
                      {msg.sender === 'doctor' ? <Stethoscope className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-cyan-700 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    <p className="font-medium">{msg.text}</p>
                    <div
                      className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                        isMe ? 'text-cyan-200' : 'text-slate-400'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {isMe && <CheckCheck className="h-3 w-3" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Suggestions */}
        <div className="border-t border-slate-100 bg-white px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Mẫu nhanh:</span>
          {quickReplies.map((reply, i) => (
            <button
              key={i}
              onClick={() => setInputMessage(reply)}
              className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-800 transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-4 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Nhập tin nhắn trao đổi với ${currentUserRole === 'doctor' ? 'bệnh nhân' : 'bác sĩ'}...`}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-cyan-600 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-700 text-white shadow-sm hover:bg-cyan-800 disabled:opacity-40 transition-all active:scale-95"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
