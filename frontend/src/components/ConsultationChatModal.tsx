import React, { useState, useEffect } from 'react';
import { Send, User, Stethoscope, MessageSquare, AlertCircle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { chatApi } from '../services/api';
import { stompClient } from '../services/websocketService';
import { useLanguage } from '../context/LanguageContext';

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
  partnerName?: string;
  partnerUserId?: string;
  currentUserId?: string;
}

export const ConsultationChatModal: React.FC<ConsultationChatModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  patientName,
  patientMrn,
  doctorName,
  partnerName,
  partnerUserId,
  currentUserId,
}) => {
  const { t, isVi } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  const resolvedDoctorName = React.useMemo(
    () => partnerName || doctorName || (isVi ? 'Bác sĩ chuyên khoa' : 'Specialist Doctor'),
    [partnerName, doctorName, isVi]
  );

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
            senderName: item.senderId === currentUserId ? (currentUserRole === 'doctor' ? resolvedDoctorName : patientName) : (currentUserRole === 'doctor' ? patientName : resolvedDoctorName),
            text: item.messageText,
            timestamp: item.createdAt ? new Date(item.createdAt).toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '',
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
            senderName: currentUserRole === 'doctor' ? patientName : resolvedDoctorName,
            text: msg.messageText,
            timestamp: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
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
  }, [isOpen, partnerUserId, currentUserId, currentUserRole, resolvedDoctorName, patientName, isVi]);

  const partnerTitle =
    currentUserRole === 'doctor'
      ? `${isVi ? 'Bệnh nhân' : 'Patient'}: ${patientName} (${patientMrn})`
      : partnerUserId
        ? `${resolvedDoctorName} (${isVi ? 'Bác sĩ chuyên khoa' : 'Specialist Doctor'})`
        : (isVi ? 'Tư Vấn Chuyên Môn Trực Tuyến' : 'Online Clinical Consultation');

  const partnerRoleDesc =
    currentUserRole === 'doctor'
      ? (partnerUserId ? (isVi ? 'Hồ sơ khám đáy mắt định kỳ' : 'Periodic fundus examination file') : (isVi ? 'Chưa liên kết tài khoản trực tuyến' : 'No online account linked'))
      : partnerUserId
        ? (isVi ? 'Bác sĩ phụ trách lâm sàng' : 'Assigned clinical physician')
        : (isVi ? 'Chờ phân công Bác sĩ chuyên khoa phụ trách' : 'Awaiting specialist physician assignment');

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !partnerUserId) return;

    const textToSend = inputMessage.trim();
    setInputMessage('');

    const optimisticMsg: ChatMessage = {
      id: `tmp-${Date.now()}`,
      sender: currentUserRole === 'doctor' ? 'doctor' : 'patient',
      senderName: currentUserRole === 'doctor' ? resolvedDoctorName : patientName,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
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
    isVi ? 'Kết quả chẩn đoán đã được ký duyệt.' : 'Diagnostic results have been clinically approved.',
    isVi ? 'Bác nhớ đo huyết áp mỗi sáng và uống thuốc đều đặn.' : 'Please monitor blood pressure daily and take medications regularly.',
    isVi ? 'Hình ảnh đáy mắt cho thấy vi tuần hoàn ổn định sau điều trị.' : 'Fundus imaging indicates stable microcirculation post-treatment.',
  ];

  const quickRepliesPatient = [
    isVi ? 'Dạ bác sĩ cho tôi hỏi lịch tái khám cụ thể ạ.' : 'Doctor, could you advise on my follow-up schedule?',
    isVi ? 'Tôi đã tải được báo cáo kết quả PDF rồi ạ.' : 'I have successfully downloaded the PDF report.',
    isVi ? 'Cảm ơn bác sĩ đã tư vấn chi tiết.' : 'Thank you doctor for the detailed consultation.',
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
          <span>{isVi ? 'Kênh trao đổi chuyên môn y khoa thời gian thực. Không sử dụng cho các trường hợp cấp cứu khẩn cấp.' : 'Real-time clinical consultation channel. Not intended for acute medical emergencies.'}</span>
        </div>

        {!partnerUserId ? (
          <div className="py-8 px-6 text-center space-y-4 bg-slate-50/70 rounded-xl border border-clinical-border">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h4 className="text-sm font-bold text-slate-900">
                {currentUserRole === 'doctor'
                  ? (isVi ? 'Bệnh nhân chưa liên kết tài khoản trực tuyến' : 'Patient has not linked online account')
                  : (isVi ? 'Chưa có Bác sĩ chuyên khoa phụ trách' : 'No assigned specialist physician')}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentUserRole === 'doctor'
                  ? (isVi
                      ? `Hồ sơ bệnh nhân ${patientName} (${patientMrn}) chưa có tài khoản trực tuyến liên kết trong hệ thống AURA, do đó kênh trao đổi tư vấn thời gian thực chưa khả dụng. Bác sĩ vui lòng trao đổi trực tiếp qua số điện thoại hoặc ghi chú kết luận lâm sàng trên bàn chẩn đoán CDS.`
                      : `Patient record ${patientName} (${patientMrn}) does not have an active online account linked in AURA. Real-time consultation is currently unavailable. Please contact via phone or leave clinical notes on the CDS dashboard.`)
                  : (isVi
                      ? 'Hồ sơ sàng lọc đáy mắt của bạn đang trong danh sách chờ tiếp nhận. Cơ sở y tế hoặc Quản trị viên đang tiến hành phân công Bác sĩ chuyên khoa phụ trách thẩm định kết quả và tư vấn lâm sàng cho bạn.'
                      : 'Your retinal screening record is pending review. The clinic or system administrator is assigning a specialist physician to evaluate your results and provide clinical guidance.')}
              </p>
              {currentUserRole !== 'doctor' && (
                <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 leading-relaxed text-left space-y-1">
                  <p className="font-semibold">{isVi ? 'Hướng dẫn dành cho người bệnh:' : 'Instructions for patients:'}</p>
                  <ul className="list-disc list-inside space-y-0.5 text-blue-800">
                    <li>{isVi ? 'Sau khi Bác sĩ tiếp nhận hồ sơ, cửa sổ tư vấn 1-1 sẽ tự động kích hoạt.' : 'Once a physician accepts the case, the 1-on-1 consultation window will activate automatically.'}</li>
                    <li>{isVi ? 'Bạn có thể xem trước bản đồ nhiệt XAI và báo cáo sơ bộ tại cổng bệnh nhân.' : 'You can review preliminary XAI heatmaps and reports in the patient portal in the meantime.'}</li>
                    <li>{isVi ? 'Nếu có dấu hiệu giảm thị lực đột ngột hoặc đau nhức mắt, hãy đến ngay cơ sở y tế gần nhất.' : 'If experiencing sudden vision loss or severe ocular pain, visit the nearest emergency room immediately.'}</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                {isVi ? 'Đã hiểu & Đóng' : 'Understood & Close'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Message Thread */}
            <div className="space-y-3 max-h-[360px] min-h-[220px] overflow-y-auto p-2 bg-slate-50/50 rounded-xl border border-clinical-border">
              {messages.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  {t('patient.chat.emptyChat', isVi ? 'Chưa có tin nhắn nào trong cuộc hội thoại này. Hãy gửi tin nhắn đầu tiên.' : 'No messages in this conversation yet. Send the first message.')}
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
              <span className="text-[11px] font-semibold text-clinical-text-muted">{isVi ? 'Gợi ý nhanh:' : 'Quick replies:'}</span>
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
                placeholder={t('patient.chat.placeholder', isVi ? 'Nhập nội dung tư vấn chuyên môn...' : 'Enter your question or symptoms for the doctor...')}
                className="flex-1 h-10 px-3.5 text-xs rounded-lg border border-clinical-border bg-white text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!inputMessage.trim()}
                icon={<Send className="w-4 h-4" />}
              >
                {t('patient.chat.sendButton', isVi ? 'Gửi' : 'Send')}
              </Button>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
};
