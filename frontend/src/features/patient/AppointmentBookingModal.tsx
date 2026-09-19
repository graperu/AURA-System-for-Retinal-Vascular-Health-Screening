import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CalendarCheck,
  Building2,
  Check,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ClinicalSelect, ClinicalSelectOption } from '../../components/ui/ClinicalSelect';
import { patientApi, appointmentApi, DoctorOptionDto, RegisterExaminationPayload } from '../../services/api';
import { PatientProfile } from '../../types/cds';
import { useLanguage } from '../../context/LanguageContext';

export interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  onSuccess: (appointmentDetails: {
    doctorName: string;
    doctorId: string;
    date: string;
    time: string;
    reason: string;
  }) => void;
}

const TIME_SLOTS_MORNING = [
  '08:00',
  '08:45',
  '09:30',
  '10:15',
  '11:00',
];

const TIME_SLOTS_AFTERNOON = [
  '13:30',
  '14:15',
  '15:00',
  '15:45',
  '16:30',
];

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSuccess,
}) => {
  const { t, isVi } = useLanguage();

  // 4-Step Flow: 1. Chọn Bác sĩ -> 2. Chọn Ngày -> 3. Chọn Giờ -> 4. Xác nhận
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const [doctors, setDoctors] = useState<DoctorOptionDto[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState<boolean>(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  // Date selection (default to tomorrow or nearest weekday)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });

  // Time slot selection
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('09:30');

  // Reason & Notes
  const [reason, setReason] = useState<string>(
    isVi
      ? 'Tầm soát định kỳ vi mạch võng mạc & nguy cơ tim mạch'
      : 'Periodic retinal microvascular & cardiovascular screening'
  );
  const [symptomsNotes, setSymptomsNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setErrorMessage(null);
      setIsSuccess(false);
      setToastMessage(null);
      loadDoctors();
    }
  }, [isOpen]);

  const loadDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const res = await patientApi.getDoctors();
      if (res.success && Array.isArray(res.data)) {
        setDoctors(res.data);
        if (res.data.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(res.data[0].id);
        }
      }
    } catch (err) {
      console.warn('Could not fetch doctors:', err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const selectedDoctor = useMemo(() => {
    if (!selectedDoctorId) return null;
    return doctors.find((d) => d.id === selectedDoctorId) || null;
  }, [doctors, selectedDoctorId]);

  const reasonOptions = useMemo<ClinicalSelectOption<string>[]>(() => [
    {
      value: isVi ? 'Tầm soát định kỳ vi mạch võng mạc & nguy cơ tim mạch' : 'Periodic retinal microvascular & cardiovascular screening',
      label: isVi ? 'Tầm soát định kỳ võng mạc & tim mạch' : 'Periodic Retinal & Cardio Screening',
      sublabel: isVi ? 'Kiểm tra mạch máu đáy mắt và nguy cơ tim mạch' : 'Fundus vessel & vascular screening',
    },
    {
      value: isVi ? 'Tầm soát bệnh võng mạc đái tháo đường' : 'Diabetic Retinopathy Screening',
      label: isVi ? 'Tầm soát võng mạc đái tháo đường' : 'Diabetic Retinopathy Screening',
      sublabel: isVi ? 'Đánh giá vi phình mạch và xuất huyết võng mạc' : 'Assess microaneurysms and hemorrhages',
    },
    {
      value: isVi ? 'Tổn thương vi mạch do tăng huyết áp' : 'Hypertensive Retinopathy Assessment',
      label: isVi ? 'Tổn thương do tăng huyết áp' : 'Hypertensive Retinopathy Assessment',
      sublabel: isVi ? 'Kiểm tra co thắt & xơ vữa tiểu động mạch' : 'Check arteriolar narrowing & sclerosis',
    },
    {
      value: isVi ? 'Mắt nhìn mờ, thấy đốm đen hoặc chớp sáng' : 'Blurred vision, flashes or floaters',
      label: isVi ? 'Có triệu chứng nhìn mờ / chớp sáng' : 'Blurred Vision or Floaters',
      sublabel: isVi ? 'Cần bác sĩ thăm khám chuyên sâu' : 'Requires clinical ophthalmology examination',
    },
  ], [isVi]);

  // Generate 7 upcoming dates
  const availableDates = useMemo(() => {
    const list: { dateStr: string; label: string; weekday: string }[] = [];
    const now = new Date();
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const weekday = d.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { weekday: 'short' });
      const label = d.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit' });
      list.push({ dateStr, label, weekday });
    }
    return list;
  }, [isVi]);

  const handleSubmitBooking = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    // Validation
    let effectiveDoctorId = selectedDoctorId;
    if (!effectiveDoctorId && doctors.length > 0) {
      effectiveDoctorId = doctors[0].id;
    }

    if (!effectiveDoctorId) {
      setErrorMessage(isVi ? 'Vui lòng chọn bác sĩ phụ trách khám.' : 'Please select an attending specialist.');
      setSubmitting(false);
      return;
    }

    if (!selectedDate) {
      setErrorMessage(isVi ? 'Vui lòng chọn ngày khám.' : 'Please select an appointment date.');
      setSubmitting(false);
      return;
    }

    if (!selectedTimeSlot) {
      setErrorMessage(isVi ? 'Vui lòng chọn khung giờ khám.' : 'Please select an appointment time slot.');
      setSubmitting(false);
      return;
    }

    const docName =
      selectedDoctor?.fullName ||
      doctors.find((d) => d.id === effectiveDoctorId)?.fullName ||
      (selectedDoctorId === 'doc_1' ? 'BS. CKII Nguyễn Thị Thanh' : '') ||
      (selectedDoctorId === 'doc_2' ? 'ThS. BS Trần Đình Trọng' : '') ||
      (selectedDoctorId === 'doc_3' ? 'TS. BS Lê Hoàng Mai' : '') ||
      (isVi ? 'BS. CKII Nguyễn Thị Thanh' : 'Dr. Nguyen Thi Thanh');

    const appointmentData = {
      doctorId: effectiveDoctorId,
      appointmentDate: selectedDate,
      timeSlot: selectedTimeSlot,
      reason: reason || (isVi ? 'Tầm soát định kỳ vi mạch võng mạc & nguy cơ tim mạch' : 'Periodic retinal microvascular & cardiovascular screening'),
      notes: symptomsNotes?.trim() || undefined,
    };

    try {
      const res = await appointmentApi.create(appointmentData);
      if (res && res.success) {
        setIsSuccess(true);
        setToastMessage(isVi ? 'Đặt lịch hẹn khám thành công!' : 'Appointment booked successfully!');
        
        const apt = res.data;
        onSuccess({
          doctorName: apt?.doctorName || docName,
          doctorId: apt?.doctorId || effectiveDoctorId,
          date: apt?.appointmentDate || selectedDate,
          time: apt?.timeSlot || selectedTimeSlot,
          reason: apt?.reason || reason,
        });

        setTimeout(() => {
          setIsSuccess(false);
          setToastMessage(null);
          onClose();
          setSubmitting(false);
        }, 1200);
        return;
      } else {
        setErrorMessage(res?.message || (isVi ? 'Không thể đặt lịch khám. Vui lòng thử lại.' : 'Failed to book appointment.'));
        setSubmitting(false);
      }
    } catch (err: any) {
      console.error('Lưu lịch hẹn qua API gặp lỗi:', err);
      setErrorMessage(err?.message || (isVi ? 'Lỗi kết nối máy chủ khi đặt lịch khám.' : 'Server connection error during appointment booking.'));
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isVi ? 'Đặt Lịch Khám & Tư Vấn Bác Sĩ Chuyên Khoa' : 'Book Specialist Appointment'}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 sm:gap-3 text-xs">
            <span
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                currentStep === 1
                  ? 'bg-teal-600 text-white'
                  : currentStep > 1
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
              <span className="hidden sm:inline">{isVi ? 'Chọn Bác sĩ' : 'Doctor'}</span>
            </span>

            <span className="text-slate-300">→</span>

            <span
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                currentStep === 2
                  ? 'bg-teal-600 text-white'
                  : currentStep > 2
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
              <span className="hidden sm:inline">{isVi ? 'Chọn Ngày' : 'Date'}</span>
            </span>

            <span className="text-slate-300">→</span>

            <span
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                currentStep === 3
                  ? 'bg-teal-600 text-white'
                  : currentStep > 3
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {currentStep > 3 ? <Check className="w-3.5 h-3.5" /> : '3'}
              <span className="hidden sm:inline">{isVi ? 'Chọn Giờ' : 'Time'}</span>
            </span>

            <span className="text-slate-300">→</span>

            <span
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                currentStep === 4
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              4<span className="hidden sm:inline">{isVi ? 'Xác nhận' : 'Confirm'}</span>
            </span>
          </div>
        </div>

        {toastMessage && (
          <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-slate-900">
              {isVi ? 'Đặt Lịch Khám Thành Công!' : 'Appointment Booked Successfully!'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {isVi
                ? `Lịch hẹn đã được chuyển tới Bác sĩ ${selectedDoctor?.fullName || ''} vào ngày ${selectedDate} lúc ${selectedTimeSlot}.`
                : `Your appointment request has been scheduled with ${selectedDoctor?.fullName || 'the physician'}.`}
            </p>
          </div>
        ) : (
          <div>
            {/* ===============================================================
                BƯỚC 1: CHỌN BÁC SĨ
            ================================================================ */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    {isVi ? '1. Chọn Bác Sĩ Chuyên Khoa Phụ Trách' : '1. Select Attending Specialist'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isVi
                      ? 'Chọn bác sĩ mắt hoặc tim mạch để được thẩm định ca khám đáy mắt.'
                      : 'Choose an ophthalmology or cardiology specialist for retinal assessment.'}
                  </p>
                </div>

                {loadingDoctors ? (
                  <div className="py-8 text-center space-y-2">
                    <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
                    <p className="text-xs text-slate-500">{isVi ? 'Đang nạp danh sách bác sĩ...' : 'Loading doctors...'}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {/* Option: Auto Assigned */}
                    <div
                      onClick={() => setSelectedDoctorId('')}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        selectedDoctorId === ''
                          ? 'border-teal-600 bg-teal-50/40 ring-1 ring-teal-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-sm shrink-0">
                          ⚡
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">
                              {isVi ? 'Bác sĩ trực ban phân công tự động' : 'On-duty Doctor (Auto-assigned)'}
                            </h4>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                              {isVi ? 'Nhanh nhất' : 'Fastest'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {isVi ? 'Hệ thống điều phối đến bác sĩ sẵn sàng sớm nhất' : 'Dispatched to the earliest available specialist'}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedDoctorId === ''
                            ? 'border-teal-600 bg-teal-600 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {selectedDoctorId === '' && <Check className="w-3 h-3" />}
                      </div>
                    </div>

                    {/* Doctors List */}
                    {doctors.map((doc) => {
                      const isSelected = selectedDoctorId === doc.id;
                      return (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedDoctorId(doc.id)}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-teal-600 bg-teal-50/40 ring-1 ring-teal-500'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-xs shrink-0">
                              BS
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {doc.fullName}
                              </h4>
                              <p className="text-[11px] text-teal-700 mt-0.5 truncate">
                                {doc.specialty || (isVi ? 'Chuyên khoa Mắt & Vi mạch' : 'Ophthalmology & Vascular')}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-teal-600 bg-teal-600 text-white'
                                : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setCurrentStep(2)}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isVi ? 'Tiếp tục: Chọn ngày' : 'Continue: Date'}
                  </Button>
                </div>
              </div>
            )}

            {/* ===============================================================
                BƯỚC 2: CHỌN NGÀY KHÁM
            ================================================================ */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    {isVi ? '2. Chọn Ngày Khám Trong Tuần' : '2. Select Examination Date'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isVi
                      ? 'Chọn ngày thuận tiện để tiến hành chụp mắt và nhận tư vấn.'
                      : 'Pick a convenient date for your retinal examination.'}
                  </p>
                </div>

                {/* Quick Date Selector Chips */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {availableDates.map((item) => {
                    const isSelected = selectedDate === item.dateStr;
                    return (
                      <button
                        key={item.dateStr}
                        type="button"
                        onClick={() => setSelectedDate(item.dateStr)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold block opacity-80">
                          {item.weekday}
                        </span>
                        <span className="text-sm font-extrabold font-mono-data block mt-0.5">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Date Input */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    {isVi ? 'Hoặc chọn ngày cụ thể từ lịch:' : 'Or choose specific date:'}
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none w-full max-w-xs font-mono-data"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setCurrentStep(1)}
                    icon={<ArrowLeft className="w-4 h-4" />}
                  >
                    {isVi ? 'Quay lại' : 'Back'}
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setCurrentStep(3)}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isVi ? 'Tiếp tục: Chọn giờ' : 'Continue: Time'}
                  </Button>
                </div>
              </div>
            )}

            {/* ===============================================================
                BƯỚC 3: CHỌN KHUNG GIỜ
            ================================================================ */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    {isVi ? '3. Chọn Khung Giờ Khám Thuận Tiện' : '3. Select Preferred Time Slot'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isVi ? `Ngày khám đã chọn: ${selectedDate}` : `Selected date: ${selectedDate}`}
                  </p>
                </div>

                {/* Morning Slots */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    ☀️ {isVi ? 'Buổi Sáng (08:00 - 11:30)' : 'Morning Slots'}
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {TIME_SLOTS_MORNING.map((slot) => {
                      const isSelected = selectedTimeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold font-mono-data transition-all ${
                            isSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-teal-400'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Afternoon Slots */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    🌤️ {isVi ? 'Buổi Chiều (13:30 - 17:00)' : 'Afternoon Slots'}
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {TIME_SLOTS_AFTERNOON.map((slot) => {
                      const isSelected = selectedTimeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold font-mono-data transition-all ${
                            isSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-teal-400'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setCurrentStep(2)}
                    icon={<ArrowLeft className="w-4 h-4" />}
                  >
                    {isVi ? 'Quay lại' : 'Back'}
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setCurrentStep(4)}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isVi ? 'Tiếp tục: Xác nhận' : 'Continue: Confirm'}
                  </Button>
                </div>
              </div>
            )}

            {/* ===============================================================
                BƯỚC 4: XÁC NHẬN & ĐẶT HẸN
            ================================================================ */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    {isVi ? '4. Xác Nhận Thông Tin Lịch Hẹn' : '4. Confirm Appointment Details'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isVi
                      ? 'Vui lòng kiểm tra lại thông tin và xác nhận để hoàn tất đặt lịch.'
                      : 'Review details before finalizing your clinical appointment.'}
                  </p>
                </div>

                {/* Appointment Summary Box */}
                <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200 space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 block mb-0.5">{isVi ? 'Bệnh nhân' : 'Patient'}:</span>
                      <strong className="text-slate-900 text-sm">{patient.fullName}</strong>
                      <span className="text-[11px] text-slate-500 block font-mono-data">
                        MRN: {patient.mrn || 'Chưa có'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-0.5">{isVi ? 'Bác sĩ phụ trách' : 'Doctor'}:</span>
                      <strong className="text-teal-900 text-sm">
                        {selectedDoctor?.fullName || (isVi ? 'Bác sĩ trực ban tự động' : 'On-duty Doctor')}
                      </strong>
                      <span className="text-[11px] text-slate-500 block">
                        {selectedDoctor?.specialty || (isVi ? 'Khoa Mắt & Tim Mạch' : 'Specialist')}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-0.5">{isVi ? 'Thời gian hẹn' : 'Scheduled Time'}:</span>
                      <div className="flex items-center gap-1.5 text-sm font-bold text-teal-800">
                        <Calendar className="w-4 h-4 text-teal-600" />
                        <span>{selectedDate}</span>
                        <Clock className="w-4 h-4 text-teal-600 ml-2" />
                        <span>{selectedTimeSlot}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-0.5">{isVi ? 'Huyết áp đo gần nhất' : 'Last BP'}:</span>
                      <strong className="text-slate-800 font-mono-data">
                        {patient.systolicBp && patient.diastolicBp
                          ? `${patient.systolicBp}/${patient.diastolicBp} mmHg`
                          : (isVi ? '120/80 mmHg (Tiêu chuẩn)' : '120/80 mmHg')}
                      </strong>
                    </div>
                  </div>

                  {/* Reason selector */}
                  <div className="pt-2 border-t border-teal-200/60 space-y-1.5">
                    <label className="font-bold text-slate-800 block">
                      {isVi ? 'Lý do khám bệnh:' : 'Reason for consultation:'}
                    </label>
                    <ClinicalSelect
                      options={reasonOptions}
                      value={reason}
                      onChange={(val) => setReason(val as string)}
                    />
                  </div>

                  {/* Optional symptoms note */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 block">
                      {isVi ? 'Ghi chú thêm triệu chứng (nếu có):' : 'Additional notes:'}
                    </label>
                    <input
                      type="text"
                      value={symptomsNotes}
                      onChange={(e) => setSymptomsNotes(e.target.value)}
                      placeholder={isVi ? 'VD: Mắt mờ nhiều về chiều, thỉnh thoảng thấy đốm đen...' : 'e.g. blurred vision, headaches...'}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="md"
                    disabled={submitting}
                    onClick={() => setCurrentStep(3)}
                    icon={<ArrowLeft className="w-4 h-4" />}
                  >
                    {isVi ? 'Quay lại' : 'Back'}
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    disabled={submitting}
                    onClick={handleSubmitBooking}
                    icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
                  >
                    {submitting
                      ? (isVi ? 'Đang xác nhận...' : 'Confirming...')
                      : (isVi ? 'Xác Nhận & Đặt Lịch Hẹn' : 'Confirm Appointment')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
