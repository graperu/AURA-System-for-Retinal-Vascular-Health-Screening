import React, { useState, useEffect } from 'react';
import { Send, User, Stethoscope, MessageSquare, AlertCircle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { chatApi } from '../services/api';
import { stompClient } from '../services/websocketService';

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
  partnerUserId?: string;
  currentUserId?: string;
}

export const ConsultationChatModal: React.FC<ConsultationChatModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  patientName,
  patientMrn,
  doctorName = 'BS. CKII Nguyễn Thị Thanh',
  partnerUserId,
  currentUserId,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  // 1. Fetch real chat history from DB on open
  useEffect(() => {
    if (!isOpen || !partnerUserId) return;

    const loadHistory = async () => {
      try {
        const res = await chatApi.getConversation(partnerUserId);
        if (res.success && Array.isArray(res.data)) {
          const mapped: ChatMessage[] = res.data.map((item: any) => ({
            id: item.id,
            sender: item.senderId === currentUserId ? (currentUserRole === 'doctor' ? 'doctor' : 'patient') : (currentUserRole === 'doctor' ? 'patient' : 'doctor'),
            senderName: item.senderId === currentUserId ? (currentUserRole === 'doctor' ? doctorName : patientName) : (currentUserRole === 'doctor' ? patientName : doctorName),
            text: item.messageText,
            timestamp: item.createdAt ? new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
          }));
          setMessages(mapped);
        }
      } catch (err) {
        console.warn('Could not load chat history:', err);
      }
    };

    loadHistory();

    // 2. Connect WebSocket / STOMP for Realtime updates
    if (currentUserId) {
      stompClient.connect();
      const topic = `/topic/chat.${currentUserId}`;
      stompClient.subscribe(topic, (msg: any) => {
        if (msg && msg.messageText) {
          // Bỏ qua tin nhắn do chính mình gửi qua websocket vì đã được cập nhật qua optimistic UI
          if (msg.senderId === currentUserId) return;

          const incoming: ChatMessage = {
            id: msg.id || String(Date.now()),
            sender: currentUserRole === 'doctor' ? 'patient' : 'doctor',
            senderName: currentUserRole === 'doctor' ? patientName : doctorName,
            text: msg.messageText,
            timestamp: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        }
      });

      return () => {
        stompClient.unsubscribe(topic);
      };
    }
  }, [isOpen, partnerUserId, currentUserId, currentUserRole, doctorName, patientName]);

  const partnerTitle =
    currentUserRole === 'doctor'
      ? `Bệnh nhân: ${patientName} (${patientMrn})`
      : `${doctorName} (Bác sĩ chuyên khoa)`;

  const partnerRoleDesc =
    currentUserRole === 'doctor'
      ? 'Hồ sơ khám đáy mắt định kỳ'
      : 'Bác sĩ phụ trách lâm sàng';

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !partnerUserId) return;

    const textToSend = inputMessage.trim();
    setInputMessage('');

    const optimisticMsg: ChatMessage = {
      id: `tmp-${Date.now()}`,
      sender: currentUserRole === 'doctor' ? 'doctor' : 'patient',
      senderName: currentUserRole === 'doctor' ? doctorName : patientName,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await chatApi.sendMessage(partnerUserId, textToSend);
      if (!res.success) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    }
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

  const activeQuickReplies = currentUserRole === 'doctor' ? quickRepliesDoctor : quickRepliesPatient;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-600" />
          <span>{partnerTitle}</span>
        </div>
      }
      description={partnerRoleDesc}
    >
      <div className="space-y-4">
        {/* Medical Safety Disclaimer */}
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Kênh trao đổi chuyên môn y khoa thời gian thực (WebSocket). Không sử dụng cho các trường hợp cấp cứu khẩn cấp.</span>
        </div>

        {/* Message Thread */}
        <div className="space-y-3 max-h-[360px] min-h-[220px] overflow-y-auto p-2 bg-slate-50/50 rounded-xl border border-clinical-border">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              Chưa có tin nhắn nào trong cuộc hội thoại này. Hãy gửi tin nhắn đầu tiên.
            </div>
          ) : (
            messages.map((msg) => {
              const isMe =
                (currentUserRole === 'doctor' && msg.sender === 'doctor') ||
                (currentUserRole === 'patient' && msg.sender === 'patient');

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      msg.sender === 'doctor'
                        ? 'bg-brand-600 text-white'
                        : 'bg-teal-700 text-white'
                    }`}
                  >
                    {msg.sender === 'doctor' ? <Stethoscope className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div
                    className={`p-3 rounded-2xl text-xs space-y-1 ${
                      isMe
                        ? 'bg-brand-600 text-white rounded-tr-none'
                        : 'bg-white text-clinical-text border border-clinical-border rounded-tl-none shadow-xs'
                    }`}
                  >
                    <div className={`flex items-center justify-between gap-3 text-[10px] ${isMe ? 'text-brand-100' : 'text-slate-400'}`}>
                      <span className="font-semibold">{msg.senderName}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Responses */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-clinical-text-muted">Gợi ý nhanh:</span>
          {activeQuickReplies.map((reply, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputMessage(reply)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-clinical-border"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="flex gap-2 pt-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Nhập nội dung tư vấn chuyên môn..."
            className="flex-1 h-10 px-3.5 text-xs rounded-lg border border-clinical-border bg-white text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!inputMessage.trim()}
            icon={<Send className="w-4 h-4" />}
          >
            Gửi
          </Button>
        </form>
      </div>
    </Modal>
  );
};
