import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  User,
  Stethoscope,
  AlertCircle,
  UserCheck,
  FileText,
  Tag,
  ShieldCheck,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { chatApi } from '../../services/api';
import { stompClient } from '../../services/websocketService';
import { realtimeBus } from '../../services/realtimeService';
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

export interface DoctorConsultationViewProps {
  assignedPatients: DoctorPatientSummary[];
  initialSelectedPatientId?: string | null;
  patientId?: string | null;
  currentUserId?: string;
  doctorName?: string;
  onSelectPatientForCDS: (patientId: string, directPatient?: DoctorPatientSummary | any) => void;
}

export const DoctorConsultationView: React.FC<DoctorConsultationViewProps> = ({
  assignedPatients = [],
  initialSelectedPatientId,
  patientId,
  currentUserId,
  doctorName,
  onSelectPatientForCDS = () => {},
}) => {
  const { user } = useAuth();
  const { t, isVi } = useLanguage();
  const currentDoctorName = doctorName || user?.name || (isVi ? 'Bác sĩ chuyên khoa' : 'Attending Specialist');
  const effectivePatientId = patientId || initialSelectedPatientId;
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    effectivePatientId || (assignedPatients.length > 0 ? (assignedPatients[0].patientId || (assignedPatients[0] as any).userId || (assignedPatients[0] as any).id) : null)
  );
  const prevInitialPatientIdRef = useRef(effectivePatientId);
  const selectedPatientIdRef = useRef(selectedPatientId);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [searchPatient, setSearchPatient] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [showMedicalNotesPanel, setShowMedicalNotesPanel] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    selectedPatientIdRef.current = selectedPatientId;
  }, [selectedPatientId]);

  // Tìm bệnh nhân đang được chọn
  const activePatient = useMemo(() => {
    if (!selectedPatientId) return assignedPatients[0] || null;
    const found = assignedPatients.find(
      (p) =>
        String(p.patientId) === String(selectedPatientId) ||
        String((p as any).id) === String(selectedPatientId) ||
        String((p as any).userId) === String(selectedPatientId)
    );
    if (found) return found;
    return {
      patientId: selectedPatientId,
      id: selectedPatientId,
      mrn: selectedPatientId,
      fullName: isVi ? `Bệnh nhân (${selectedPatientId})` : `Patient (${selectedPatientId})`,
      screeningCount: 0,
      assignedAt: new Date().toISOString(),
      assignmentStatus: 'ASSIGNED',
    } as DoctorPatientSummary;
  }, [assignedPatients, selectedPatientId, isVi]);

  // Cập nhật selectedPatientId khi initialSelectedPatientId/patientId từ component cha thay đổi hoặc khi danh sách nạp lần đầu
  useEffect(() => {
    const targetId = patientId || initialSelectedPatientId;
    if (targetId && targetId !== prevInitialPatientIdRef.current) {
      setSelectedPatientId(targetId);
      prevInitialPatientIdRef.current = targetId;
    } else if (!selectedPatientId && assignedPatients.length > 0) {
      setSelectedPatientId(assignedPatients[0].patientId || (assignedPatients[0] as any).userId || (assignedPatients[0] as any).id);
    }
  }, [patientId, initialSelectedPatientId, assignedPatients, selectedPatientId]);

  // Danh sách bệnh nhân sau khi lọc theo từ khóa tìm kiếm
  const filteredPatients = useMemo(() => {
    let baseList = assignedPatients;
    if (activePatient && !assignedPatients.some((p) => String(p.patientId) === String(activePatient.patientId) || String((p as any).id) === String(activePatient.patientId))) {
      baseList = [activePatient, ...assignedPatients];
    }
    if (!searchPatient.trim()) return baseList;
    const q = searchPatient.toLowerCase();
    return baseList.filter(
      (p) =>
        (p.fullName || '').toLowerCase().includes(q) ||
        (p.mrn || '').toLowerCase().includes(q) ||
        (p.phoneNumber || '').includes(q)
    );
  }, [assignedPatients, activePatient, searchPatient]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const activePatientRef = useRef(activePatient);
  useEffect(() => {
    activePatientRef.current = activePatient;
  }, [activePatient]);

  // Persistent STOMP WebSocket push subscription for doctor's consultation channel (FR-10, FR-20)
  useEffect(() => {
    if (!currentUserId) return;
    let isMounted = true;
    stompClient.connect();
    const doctorTopic = `/topic/chat.${currentUserId}`;

    const handleIncomingMessage = (msg: any) => {
      if (!isMounted || !msg || !msg.messageText) return;
      // Bỏ qua tin nhắn do chính bác sĩ gửi
      if (msg.senderId === currentUserId) return;

      const currentSelected = selectedPatientIdRef.current;
      const isFromActive =
        currentSelected &&
        (msg.senderId === currentSelected || msg.receiverId === currentSelected);

      if (isFromActive) {
        const patientDisplayName =
          activePatientRef.current?.fullName || (isVi ? 'Bệnh nhân' : 'Patient');
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

        chatApi.markAsRead(currentSelected).catch(() => {});
        realtimeBus.emit('chat:read', { senderId: currentSelected });
      } else {
        // Tin nhắn đến từ bệnh nhân KHÁC: tăng badge bệnh nhân đó và phát sự kiện toàn hệ thống
        const senderId = msg.senderId;
        if (senderId) {
          setUnreadMap((prev) => ({
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1,
          }));
          realtimeBus.emit('chat:new', msg);
        }
      }
    };

    const unsub = stompClient.subscribe(doctorTopic, handleIncomingMessage);
    return () => {
      isMounted = false;
      unsub();
    };
  }, [currentUserId, isVi]);

  // Tải lịch sử tin nhắn khi chuyển đổi bệnh nhân được chọn
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

    // 2. Đánh dấu đã đọc và xóa unread badge của bệnh nhân này
    chatApi.markAsRead(selectedPatientId).catch(() => {});
    realtimeBus.emit('chat:read', { senderId: selectedPatientId });
    setUnreadMap((prev) => {
      const next = { ...prev };
      delete next[selectedPatientId];
      return next;
    });

    return () => {
      isMounted = false;
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
            'Kết quả phân tích vi mạch võng mạc của bác đã được bác sĩ chuyên khoa thẩm định và ký duyệt.',
            'Chỉ số A/V Ratio ổn định, bác tiếp tục duy trì phác đồ điều trị và đo huyết áp mỗi sáng.',
            'Đáy mắt có biểu hiện xơ vữa tiểu động mạch nhẹ (KWB độ 2), bác cần chú ý ăn giảm mặn và tái khám sau 3 tháng.',
            'Mục tiêu kiểm soát huyết áp < 130/80 mmHg theo ESC/AHA, duy trì chỉ số HbA1c < 7.0%.',
            'Bác sĩ đề nghị chụp thêm OCT hoàng điểm và đo nhãn áp kế Goldmann để kiểm tra chi tiết.',
            'Bác sĩ đã xuất phiếu kết quả chẩn đoán kèm mã ICD-10, bác có thể tải về từ hồ sơ bệnh nhân.',
          ]
        : [
            'Your retinal microvascular analysis has been reviewed and signed off by the attending specialist.',
            'Arteriovenous ratio is stable; maintain current regimen and check morning BP.',
            'Mild retinal arteriolar sclerosis detected (KWB Grade II); reduce sodium intake and follow up in 3 months.',
            'Maintain strict BP target < 130/80 mmHg (ESC/AHA) and HbA1c < 7.0%.',
            'Goldmann tonometry and macular OCT are recommended for comprehensive assessment.',
            'Clinical report with ICD-10 coding has been issued and is available for download in your patient portal.',
          ],
    [isVi]
  );

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="bg-white border border-[#C7D7FE] rounded-2xl p-5 shadow-medical-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#3478F6]" />
            <h1 className="text-lg font-bold text-[#111827]">
              {t('doctor.consultation.title', isVi ? 'Tư Vấn Bệnh Nhân Trực Tuyến' : 'Online Patient Consultation')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('doctor.consultation.subtitle', isVi ? 'Trao đổi chuyên môn lâm sàng hai chiều thời gian thực qua WebSocket.' : 'Real-time two-way clinical consultation via WebSocket.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('doctor.consultation.stompActive', 'STOMP Realtime')}
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
                <UserCheck className="w-4 h-4 text-[#3478F6]" />
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
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3478F6] transition-all"
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
              filteredPatients
                .slice()
                .sort((a, b) => {
                  const aId = a.patientId || (a as any).userId || (a as any).id;
                  const bId = b.patientId || (b as any).userId || (b as any).id;
                  const aUnread = (aId && unreadMap[aId]) || 0;
                  const bUnread = (bId && unreadMap[bId]) || 0;
                  if (aUnread !== bUnread) return bUnread - aUnread;
                  return 0;
                })
                .map((p, idx) => {
                  const pId = p.patientId || (p as any).id || (p as any).userId;
                  const isSelected = pId === selectedPatientId;
                  const patientUnread = pId ? (unreadMap[pId] || 0) : 0;
                  return (
                    <button
                      key={pId || `pat-${idx}`}
                      type="button"
                      onClick={() => {
                        if (pId) {
                          setSelectedPatientId(pId);
                          setUnreadMap((prev) => {
                            const next = { ...prev };
                            delete next[pId];
                            return next;
                          });
                          chatApi.markAsRead(pId).catch(() => {});
                          realtimeBus.emit('chat:read', { senderId: pId });
                        }
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#EEF5FF] border-l-4 border-l-[#3478F6] shadow-xs'
                          : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center shrink-0 text-xs border relative ${
                          isSelected
                            ? 'bg-[#3478F6] text-white border-[#2563EB]'
                            : 'bg-teal-50 text-[#3478F6] border-[#C7D7FE]'
                        }`}
                      >
                        {p.fullName
                          ? p.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                          : (isVi ? 'BN' : 'PT')}
                        {patientUnread > 0 && !isSelected && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#111827]' : 'text-slate-900'}`}>
                            {p.fullName || (isVi ? 'Bệnh nhân' : 'Patient')}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {patientUnread > 0 && (
                              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-rose-500 text-white rounded-full animate-pulse shadow-2xs">
                                {patientUnread > 99 ? '99+' : patientUnread}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono-data">
                              {p.screeningCount ? `${p.screeningCount} ${isVi ? 'ca' : 'scans'}` : ''}
                            </span>
                          </div>
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
                  <div className="w-10 h-10 rounded-xl bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE] flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {activePatient.fullName || (isVi ? 'Bệnh nhân' : 'Patient')}
                      </h3>
                      <span className="text-[11px] font-mono-data px-2 py-0.5 rounded-md bg-cyan-50 text-[#3478F6] font-semibold border border-cyan-200">
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
                    variant={showMedicalNotesPanel ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setShowMedicalNotesPanel(!showMedicalNotesPanel)}
                    icon={<FileText className="w-3.5 h-3.5" />}
                    title={isVi ? 'Xem ghi chú y tế, chẩn đoán & khuyến nghị' : 'View medical notes & recommendations'}
                  >
                    <span className="hidden sm:inline">{isVi ? 'Ghi chú & Khuyến nghị' : 'Clinical Notes'}</span>
                    {showMedicalNotesPanel ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const pid = activePatient.patientId || (activePatient as any).userId || (activePatient as any).id;
                      if (pid) {
                        onSelectPatientForCDS(pid, activePatient);
                      }
                    }}
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
                  <strong>{t('doctor.consultation.safetyWarningTitle', isVi ? 'Lưu ý y khoa:' : 'Clinical note:')}</strong>{' '}
                  {t('doctor.consultation.safetyWarningText', isVi ? 'Kênh tư vấn trực tuyến. Không sử dụng cho cấp cứu khẩn cấp.' : 'Online consultation channel. Not for emergency cases.')}
                </span>
              </div>

              {/* Expandable Medical Notes, Diagnosis & Recommendations Panel (FR-15 / FR-16) */}
              {showMedicalNotesPanel && (
                <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-3 text-xs space-y-2 animate-in fade-in shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                      <FileText className="w-3.5 h-3.5 text-[#3478F6]" />
                      {isVi ? 'Hồ sơ Chẩn đoán & Khuyến nghị Lâm sàng' : 'Clinical Diagnosis & Recommendations'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono-data">
                      MRN: {activePatient.mrn || 'N/A'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {/* Chẩn đoán & ICD-10 */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                        <Tag className="w-3 h-3 text-[#3478F6]" />
                        {isVi ? 'Chẩn đoán & ICD-10:' : 'Diagnosis & ICD-10:'}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE] font-mono font-bold text-[10.5px]">
                          H35.0
                        </span>
                        {activePatient.hasHypertension && (
                          <span className="px-1.5 py-0.5 rounded bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE] font-mono font-bold text-[10.5px]">
                            I10
                          </span>
                        )}
                        {activePatient.hasDiabetes && (
                          <span className="px-1.5 py-0.5 rounded bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE] font-mono font-bold text-[10.5px]">
                            E11.3
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">
                        {activePatient.hasHypertension && activePatient.hasDiabetes
                          ? (isVi ? 'Biến đổi vi mạch võng mạc (Tăng HA & ĐTĐ)' : 'Hypertensive & Diabetic Retinopathy')
                          : activePatient.hasHypertension
                          ? (isVi ? 'Biến đổi vi mạch võng mạc do Tăng HA' : 'Hypertensive Retinopathy')
                          : activePatient.hasDiabetes
                          ? (isVi ? 'Bệnh võng mạc đái tháo đường' : 'Diabetic Retinopathy')
                          : (isVi ? 'Tầm soát vi mạch võng mạc định kỳ' : 'Routine Retinal Vascular Screening')}
                      </p>
                    </div>

                    {/* Ghi chú Y tế Lâm sàng */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                        <ShieldCheck className="w-3 h-3 text-[#3478F6]" />
                        {isVi ? 'Ghi chú Y tế Bác sĩ:' : 'Doctor Clinical Notes:'}
                      </span>
                      <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                        {activePatient.latestRiskLevel === 'HIGH' || activePatient.latestRiskLevel === 'CRITICAL'
                          ? (isVi ? 'Co hẹp tiểu động mạch cục bộ, hiện tượng bắt chéo Đ-TM (Salus sign). Cần can thiệp hạ áp an toàn.' : 'Focal arteriolar narrowing with A/V nicking. Strict BP management needed.')
                          : (isVi ? 'Hệ vi mạch võng mạc tương đối đồng nhất, chưa có tổn thương xuất huyết hay xuất tiết khu trú.' : 'Retinal vascular architecture relatively stable, no acute focal lesions.')}
                      </p>
                    </div>

                    {/* Khuyến nghị & Thao tác nhanh */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 shadow-2xs flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          {isVi ? 'Khuyến nghị & Kế hoạch:' : 'Care Plan & Advice:'}
                        </span>
                        <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                          {isVi
                            ? 'Kiểm soát huyết áp < 130/80 mmHg, duy trì HbA1c < 7.0%. Tái khám đáy mắt định kỳ sau 3-6 tháng.'
                            : 'Target BP < 130/80 mmHg, HbA1c < 7.0%. Fundus follow-up in 3-6 months.'}
                        </p>
                      </div>
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const advice = isVi
                              ? 'Khuyến nghị y tế: Đo huyết áp tại nhà 2 lần/ngày, mục tiêu < 130/80 mmHg (ESC/AHA). Duy trì HbA1c < 7.0%, ăn giảm mặn và tái khám sau 3 tháng.'
                              : 'Clinical Recommendation: Monitor BP BID, target < 130/80 mmHg. Maintain HbA1c < 7.0%, reduce sodium and follow-up in 3 months.';
                            setInputMessage(advice);
                          }}
                          className="text-[10px] font-bold text-[#3478F6] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>{isVi ? 'Chèn khuyến nghị vào ô chat' : 'Insert into chat'}</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
                {loadingHistory ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    {t('doctor.consultation.loadingHistory', 'Đang nạp lịch sử hội thoại...')}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-[#3478F6] flex items-center justify-center mx-auto">
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
                              ? 'bg-gradient-to-r from-[#3478F6] to-[#2563EB] text-white'
                              : 'bg-teal-700 text-white'
                          }`}
                        >
                          {isDoctor ? <Stethoscope className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>

                        <div
                          className={`p-3 rounded-2xl text-xs space-y-1 shadow-xs ${
                            isDoctor
                              ? 'bg-gradient-to-r from-[#3478F6] to-[#2563EB] text-white rounded-tr-none'
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
                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-[#C7D7FE] hover:text-[#3478F6] text-slate-700 transition-colors border border-slate-200 cursor-pointer"
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
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3478F6] focus:bg-white transition-all text-slate-800"
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
