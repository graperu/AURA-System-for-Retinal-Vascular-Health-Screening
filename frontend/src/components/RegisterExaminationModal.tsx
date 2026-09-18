import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { FormField } from './ui/FormField';
import { ClinicalSelect, ClinicalSelectOption } from './ui/ClinicalSelect';
import { patientApi, DoctorOptionDto, RegisterExaminationPayload } from '../services/api';
import { PatientProfile } from '../types/cds';
import { useLanguage } from '../context/LanguageContext';
import {
  Stethoscope,
  Activity,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Loader2,
  UserCheck,
  Check,
} from 'lucide-react';

export interface RegisterExaminationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  onSuccess: (updatedProfile?: any) => void;
}

export const RegisterExaminationModal: React.FC<RegisterExaminationModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSuccess,
}) => {
  const { t, isVi } = useLanguage();

  const [doctors, setDoctors] = useState<DoctorOptionDto[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState<boolean>(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  const [reason, setReason] = useState<string>(
    isVi
      ? 'Tầm soát định kỳ vi mạch võng mạc & nguy cơ tim mạch'
      : 'Periodic retinal microvascular & cardiovascular screening'
  );
  const [eyePosition, setEyePosition] = useState<'OD' | 'OS' | 'OU'>('OU');
  const [systolicBp, setSystolicBp] = useState<number | ''>(patient.systolicBp || 120);
  const [diastolicBp, setDiastolicBp] = useState<number | ''>(patient.diastolicBp || 80);
  const [hba1c, setHba1c] = useState<number | ''>(patient.hba1c || 5.7);
  const [hasDiabetes, setHasDiabetes] = useState<boolean>(patient.hasDiabetes ?? false);
  const [hasHypertension, setHasHypertension] = useState<boolean>(patient.hasHypertension ?? false);
  const [historyOfSmoking, setHistoryOfSmoking] = useState<boolean>(patient.historyOfSmoking ?? false);
  const [symptomsNotes, setSymptomsNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setSystolicBp(patient.systolicBp || 120);
      setDiastolicBp(patient.diastolicBp || 80);
      setHba1c(patient.hba1c || 5.7);
      setHasDiabetes(patient.hasDiabetes ?? false);
      setHasHypertension(patient.hasHypertension ?? false);
      setHistoryOfSmoking(patient.historyOfSmoking ?? false);

      loadDoctors();
    }
  }, [isOpen, patient]);

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
      console.warn('Could not fetch doctor list:', err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const doctorOptions = useMemo<ClinicalSelectOption<string>[]>(() => {
    const list: ClinicalSelectOption<string>[] = [
      {
        value: '',
        label: isVi
          ? 'Bác sĩ trực ban phân công tự động'
          : 'On-duty Specialist (Auto-assigned)',
        sublabel: isVi
          ? 'Hệ thống tự chuyển ca đến bác sĩ sẵn sàng sớm nhất'
          : 'Fastest available clinical queue',
        badge: (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            {isVi ? '⚡ Nhanh nhất' : '⚡ Fastest'}
          </span>
        ),
      },
    ];
    doctors.forEach((d) => {
      list.push({
        value: d.id,
        label: d.fullName || (isVi ? 'Bác sĩ chuyên khoa' : 'Specialist'),
        sublabel: d.specialty || (isVi ? 'Chuyên khoa Mắt & Tim mạch' : 'Ophthalmology & Cardiology'),
      });
    });
    return list;
  }, [doctors, isVi]);

  const reasonOptions = useMemo<ClinicalSelectOption<string>[]>(() => [
    {
      value: isVi ? 'Tầm soát định kỳ vi mạch võng mạc & nguy cơ tim mạch' : 'Periodic retinal microvascular & cardiovascular screening',
      label: isVi ? 'Tầm soát định kỳ võng mạc & tim mạch' : 'Periodic Retinal & Cardio Screening',
      sublabel: isVi ? 'Kiểm tra mạch máu đáy mắt và nguy cơ vi mạch' : 'Check fundus vessels & vascular health',
    },
    {
      value: isVi ? 'Tầm soát bệnh võng mạc đái tháo đường' : 'Diabetic Retinopathy Screening',
      label: isVi ? 'Tầm soát võng mạc đái tháo đường' : 'Diabetic Retinopathy Screening',
      sublabel: isVi ? 'Đánh giá tổn thương vi phình mạch, xuất huyết' : 'Assess microaneurysms and hemorrhages',
    },
    {
      value: isVi ? 'Đánh giá tổn thương vi mạch do tăng huyết áp' : 'Hypertensive Retinopathy Assessment',
      label: isVi ? 'Tổn thương do tăng huyết áp' : 'Hypertensive Retinopathy Assessment',
      sublabel: isVi ? 'Kiểm tra co thắt & xơ vữa tiểu động mạch' : 'Check arteriolar narrowing & sclerosis',
    },
    {
      value: isVi ? 'Có triệu chứng nhìn mờ, chớp sáng, ruồi bay' : 'Symptoms: blurred vision, flashes, floaters',
      label: isVi ? 'Có triệu chứng mắt bất thường' : 'Abnormal Eye Symptoms',
      sublabel: isVi ? 'Nhìn mờ, chớp sáng, hoặc thấy đốm đen' : 'Blurred vision, flashes, or floaters',
    },
    {
      value: isVi ? 'Tái khám theo dõi điều trị theo chỉ định bác sĩ' : 'Follow-up consultation per doctor instructions',
      label: isVi ? 'Tái khám theo hẹn của bác sĩ' : 'Doctor Follow-up Consultation',
      sublabel: isVi ? 'Theo dõi diễn tiến sau điều trị' : 'Post-treatment progress follow-up',
    },
  ], [isVi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    const payload: RegisterExaminationPayload = {
      doctorId: selectedDoctorId || null,
      examinationReason: reason,
      eyePosition: eyePosition,
      systolicBp: typeof systolicBp === 'number' ? systolicBp : null,
      diastolicBp: typeof diastolicBp === 'number' ? diastolicBp : null,
      hba1c: typeof hba1c === 'number' ? hba1c : null,
      hasDiabetes,
      hasHypertension,
      historyOfSmoking,
      symptomsNotes: symptomsNotes.trim() || undefined,
    };

    try {
      const res = await patientApi.registerExamination(payload);
      if (res.success) {
        setSuccessMessage(
          isVi
            ? 'Đăng ký khám thành công! Hồ sơ đã được chuyển đến Bác sĩ chuyên khoa.'
            : 'Examination registered successfully! Routed to attending doctor.'
        );
        setTimeout(() => {
          onSuccess(res.data);
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.message || (isVi ? 'Đăng ký khám không thành công. Vui lòng thử lại.' : 'Failed to register examination.'));
      }
    } catch (err: any) {
      setErrorMessage(err.message || (isVi ? 'Lỗi hệ thống khi đăng ký khám.' : 'System error during registration.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={isVi ? 'Đăng Ký Khám Sàng Lọc' : 'Register Screening Examination'}
      description={
        isVi
          ? 'Chọn bác sĩ tiếp nhận và điền thông tin để được tiếp nhận khám sớm nhất.'
          : 'Select an attending specialist and provide key details for prompt screening.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* 1. Chọn Bác sĩ chuyên khoa */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#3478F6]" />
              {isVi ? 'Bác sĩ chuyên khoa tiếp nhận' : 'Attending Specialist'}
            </label>
            {loadingDoctors && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3478F6]" />
                {isVi ? 'Đang tải danh sách...' : 'Loading doctors...'}
              </span>
            )}
          </div>

          <ClinicalSelect<string>
            value={selectedDoctorId}
            onChange={(val) => setSelectedDoctorId(val)}
            options={doctorOptions}
            size="md"
          />
        </div>

        {/* 2. Lý do khám & Mắt khám */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <ClinicalSelect<string>
              label={isVi ? 'Lý do khám sàng lọc' : 'Examination Reason'}
              value={reason}
              onChange={(val) => setReason(val)}
              options={reasonOptions}
              size="md"
            />
          </div>

          <FormField label={isVi ? 'Mắt cần kiểm tra' : 'Eye Laterality'} required>
            <div className="grid grid-cols-3 gap-1.5 h-10 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setEyePosition('OD')}
                className={`text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  eyePosition === 'OD'
                    ? 'bg-white text-[#3478F6] shadow-xs border border-blue-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isVi ? 'Mắt Phải' : 'Right Eye'}
              </button>
              <button
                type="button"
                onClick={() => setEyePosition('OS')}
                className={`text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  eyePosition === 'OS'
                    ? 'bg-white text-[#3478F6] shadow-xs border border-blue-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isVi ? 'Mắt Trái' : 'Left Eye'}
              </button>
              <button
                type="button"
                onClick={() => setEyePosition('OU')}
                className={`text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  eyePosition === 'OU'
                    ? 'bg-white text-[#3478F6] shadow-xs border border-blue-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isVi ? 'Cả hai mắt' : 'Both Eyes'}
              </button>
            </div>
          </FormField>
        </div>

        {/* 3. Sinh hiệu & Tiền sử bệnh */}
        <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#3478F6]" />
              {isVi ? 'Chỉ số sức khỏe & Tiền sử' : 'Clinical Vitals & Medical History'}
            </span>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">
              {isVi ? 'Tùy chọn' : 'Optional'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label={isVi ? 'HA Tâm thu' : 'Systolic BP'}>
              <div className="relative">
                <input
                  type="number"
                  min={50}
                  max={300}
                  value={systolicBp}
                  onChange={(e) => setSystolicBp(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                  placeholder="120"
                  className="w-full h-10 pl-3 pr-11 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm font-mono-data focus:outline-none focus:border-[#3478F6] focus:ring-2 focus:ring-[#3478F6]/15 transition-all"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-medium text-slate-400 pointer-events-none">
                  mmHg
                </span>
              </div>
            </FormField>

            <FormField label={isVi ? 'HA Tâm trương' : 'Diastolic BP'}>
              <div className="relative">
                <input
                  type="number"
                  min={30}
                  max={200}
                  value={diastolicBp}
                  onChange={(e) => setDiastolicBp(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                  placeholder="80"
                  className="w-full h-10 pl-3 pr-11 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm font-mono-data focus:outline-none focus:border-[#3478F6] focus:ring-2 focus:ring-[#3478F6]/15 transition-all"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-medium text-slate-400 pointer-events-none">
                  mmHg
                </span>
              </div>
            </FormField>

            <FormField label={isVi ? 'HbA1c' : 'HbA1c'}>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min={3.0}
                  max={20.0}
                  value={hba1c}
                  onChange={(e) => setHba1c(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="5.7"
                  className="w-full h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm font-mono-data focus:outline-none focus:border-[#3478F6] focus:ring-2 focus:ring-[#3478F6]/15 transition-all"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 pointer-events-none">
                  %
                </span>
              </div>
            </FormField>
          </div>

          {/* Tiền sử bệnh: Interactive Toggle Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1.5 border-t border-slate-200/80">
            <button
              type="button"
              onClick={() => setHasDiabetes(!hasDiabetes)}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                hasDiabetes
                  ? 'bg-blue-50 border-blue-300 text-blue-900 ring-1 ring-blue-400/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-xs font-semibold">{isVi ? 'Đái tháo đường' : 'Diabetes'}</span>
              <div
                className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                  hasDiabetes ? 'bg-[#3478F6] text-white' : 'border border-slate-300 bg-white'
                }`}
              >
                {hasDiabetes && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setHasHypertension(!hasHypertension)}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                hasHypertension
                  ? 'bg-blue-50 border-blue-300 text-blue-900 ring-1 ring-blue-400/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-xs font-semibold">{isVi ? 'Tăng huyết áp' : 'Hypertension'}</span>
              <div
                className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                  hasHypertension ? 'bg-[#3478F6] text-white' : 'border border-slate-300 bg-white'
                }`}
              >
                {hasHypertension && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setHistoryOfSmoking(!historyOfSmoking)}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                historyOfSmoking
                  ? 'bg-blue-50 border-blue-300 text-blue-900 ring-1 ring-blue-400/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-xs font-semibold">{isVi ? 'Tiền sử hút thuốc' : 'Smoking history'}</span>
              <div
                className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                  historyOfSmoking ? 'bg-[#3478F6] text-white' : 'border border-slate-300 bg-white'
                }`}
              >
                {historyOfSmoking && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          </div>
        </div>

        {/* 4. Ghi chú triệu chứng */}
        <FormField label={isVi ? 'Triệu chứng hiện tại hoặc ghi chú cho Bác sĩ (tùy chọn)' : 'Current symptoms or notes for doctor (optional)'}>
          <textarea
            rows={2}
            value={symptomsNotes}
            onChange={(e) => setSymptomsNotes(e.target.value)}
            placeholder={
              isVi
                ? 'Ví dụ: Mắt phải mờ khi nhìn gần khoảng 1 tuần nay, thỉnh thoảng thấy chớp sáng...'
                : 'E.g., Blurred vision in right eye for a week, occasional flashes...'
            }
            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#3478F6] focus:ring-2 focus:ring-[#3478F6]/15 transition-all resize-none"
          />
        </FormField>

        {/* Trust badge */}
        <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-600 text-xs flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#3478F6] shrink-0" />
          <span>
            {isVi
              ? 'Hồ sơ sẽ được chuyển trực tiếp đến Bác sĩ chuyên khoa để tiếp nhận và đánh giá kết quả.'
              : 'Your file will be transferred directly to your attending specialist for clinical evaluation.'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl px-5"
          >
            {t('common.cancel', isVi ? 'Hủy' : 'Cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={submitting}
            icon={<Stethoscope className="w-4 h-4" />}
            className="rounded-xl px-6 font-bold shadow-xs bg-[#3478F6] hover:bg-[#2563EB]"
          >
            {isVi ? 'Xác Nhận Đăng Ký' : 'Confirm Registration'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

