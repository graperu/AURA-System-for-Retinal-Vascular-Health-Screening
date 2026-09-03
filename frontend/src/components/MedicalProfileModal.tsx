import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  UserCheck,
  Heart,
  Activity,
  CheckCircle2,
  ShieldCheck,
  Save,
  Stethoscope,
  Pill,
  PhoneCall,
  AlertCircle,
  Loader2,
  Calendar,
} from 'lucide-react';
import { PatientProfile } from '../types/cds';
import { patientApi } from '../services/api';

interface MedicalProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  onSave: (updated: PatientProfile) => void;
}

interface FormState {
  fullName: string;
  dateOfBirth: string;
  age: string;
  gender: 'Male' | 'Female' | 'Other';
  phoneNumber: string;
  address: string;
  bloodType: string;
  systolicBp: string;
  diastolicBp: string;
  hba1c: string;
  hasDiabetes: boolean | null;
  diabetesType: string;
  diabetesDurationYears: string;
  hasHypertension: boolean | null;
  historyOfSmoking: boolean | null;
  historyOfHeartDisease: boolean | null;
  historyOfStroke: boolean | null;
  currentMedications: string;
  allergies: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  assignedDoctor: string | null;
  mrn: string;
  updatedAt?: string | null;
}

export const MedicalProfileModal: React.FC<MedicalProfileModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSave,
}) => {
  const [formState, setFormState] = useState<FormState>({
    fullName: '',
    dateOfBirth: '',
    age: '',
    gender: 'Other',
    phoneNumber: '',
    address: '',
    bloodType: '',
    systolicBp: '',
    diastolicBp: '',
    hba1c: '',
    hasDiabetes: null,
    diabetesType: 'Type2',
    diabetesDurationYears: '',
    hasHypertension: null,
    historyOfSmoking: null,
    historyOfHeartDisease: null,
    historyOfStroke: null,
    currentMedications: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    assignedDoctor: null,
    mrn: '',
    updatedAt: null,
  });

  const [activeTab, setActiveTab] = useState<'personal' | 'vitals' | 'history' | 'meds'>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && patient) {
      setFormState({
        fullName: patient.fullName || '',
        dateOfBirth: patient.dateOfBirth || '',
        age: patient.age != null ? String(patient.age) : '',
        gender: (patient.gender === 'Female' ? 'Female' : patient.gender === 'Male' ? 'Male' : 'Other') as 'Male' | 'Female' | 'Other',
        phoneNumber: patient.phoneNumber || '',
        address: patient.address || '',
        bloodType: patient.bloodType || '',
        systolicBp: patient.systolicBp != null ? String(patient.systolicBp) : '',
        diastolicBp: patient.diastolicBp != null ? String(patient.diastolicBp) : '',
        hba1c: patient.hba1c != null ? String(patient.hba1c) : '',
        hasDiabetes: patient.hasDiabetes !== undefined ? patient.hasDiabetes : null,
        diabetesType: patient.diabetesType || 'Type2',
        diabetesDurationYears: patient.diabetesDurationYears != null ? String(patient.diabetesDurationYears) : '',
        hasHypertension: patient.hasHypertension !== undefined ? patient.hasHypertension : null,
        historyOfSmoking: patient.historyOfSmoking !== undefined ? patient.historyOfSmoking : null,
        historyOfHeartDisease: patient.historyOfHeartDisease !== undefined ? patient.historyOfHeartDisease : null,
        historyOfStroke: patient.historyOfStroke !== undefined ? patient.historyOfStroke : null,
        currentMedications: patient.currentMedications || '',
        allergies: patient.allergies || '',
        emergencyContactName: patient.emergencyContactName || '',
        emergencyContactPhone: patient.emergencyContactPhone || '',
        assignedDoctor: patient.assignedDoctor || null,
        mrn: patient.mrn || '',
        updatedAt: patient.updatedAt || null,
      });
      setErrorMessage(null);
      setIsSavedSuccess(false);
    }
  }, [isOpen, patient]);

  // Calculate age from date of birth
  const calculateAgeFromDob = (dobStr: string): number | null => {
    if (!dobStr) return null;
    const dob = new Date(dobStr);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let calculated = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      calculated--;
    }
    return calculated >= 0 && calculated <= 120 ? calculated : null;
  };

  const handleDateOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const computedAge = calculateAgeFromDob(val);
    setFormState((prev) => ({
      ...prev,
      dateOfBirth: val,
      age: computedAge !== null ? String(computedAge) : prev.age,
    }));
  };

  // Validation calculations
  const bpValidationError = useMemo(() => {
    const sys = formState.systolicBp.trim() !== '' ? Number(formState.systolicBp) : null;
    const dia = formState.diastolicBp.trim() !== '' ? Number(formState.diastolicBp) : null;

    if (sys !== null && (isNaN(sys) || sys < 50 || sys > 250)) {
      return 'Huyết áp tâm thu phải từ 50 đến 250 mmHg';
    }
    if (dia !== null && (isNaN(dia) || dia < 30 || dia > 180)) {
      return 'Huyết áp tâm trương phải từ 30 đến 180 mmHg';
    }
    if (sys !== null && dia !== null && sys <= dia) {
      return 'Huyết áp tâm thu phải lớn hơn huyết áp tâm trương.';
    }
    return null;
  }, [formState.systolicBp, formState.diastolicBp]);

  const hba1cValidationError = useMemo(() => {
    if (formState.hba1c.trim() === '') return null;
    const val = Number(formState.hba1c);
    if (isNaN(val) || val < 2.0 || val > 20.0) {
      return 'Chỉ số HbA1c phải từ 2.0% đến 20.0% (để trống nếu chưa đo)';
    }
    return null;
  }, [formState.hba1c]);

  const ageValidationError = useMemo(() => {
    if (formState.age.trim() === '') return null;
    const val = Number(formState.age);
    if (isNaN(val) || val < 1 || val > 120) {
      return 'Tuổi phải từ 1 đến 120';
    }
    return null;
  }, [formState.age]);

  const isFormValid = !bpValidationError && !hba1cValidationError && !ageValidationError && formState.fullName.trim().length > 0;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        fullName: formState.fullName.trim(),
        dateOfBirth: formState.dateOfBirth ? formState.dateOfBirth : null,
        age: formState.age.trim() !== '' ? Number(formState.age) : null,
        gender: formState.gender,
        phoneNumber: formState.phoneNumber.trim() || null,
        address: formState.address.trim() || null,
        bloodType: formState.bloodType ? formState.bloodType : null,
        systolicBp: formState.systolicBp.trim() !== '' ? Number(formState.systolicBp) : null,
        diastolicBp: formState.diastolicBp.trim() !== '' ? Number(formState.diastolicBp) : null,
        hba1c: formState.hba1c.trim() !== '' ? Number(formState.hba1c) : null,
        hasDiabetes: formState.hasDiabetes,
        diabetesType: formState.hasDiabetes === true ? (formState.diabetesType || 'Type2') : null,
        diabetesDurationYears: formState.hasDiabetes === true && formState.diabetesDurationYears.trim() !== ''
          ? Number(formState.diabetesDurationYears)
          : null,
        hasHypertension: formState.hasHypertension,
        historyOfSmoking: formState.historyOfSmoking,
        historyOfHeartDisease: formState.historyOfHeartDisease,
        historyOfStroke: formState.historyOfStroke,
        currentMedications: formState.currentMedications.trim() || null,
        allergies: formState.allergies.trim() || null,
        emergencyContactName: formState.emergencyContactName.trim() || null,
        emergencyContactPhone: formState.emergencyContactPhone.trim() || null,
      };

      const res = await patientApi.updateProfile(payload);
      if (res.success && res.data) {
        onSave(res.data);
        setIsSavedSuccess(true);
        setTimeout(() => {
          setIsSavedSuccess(false);
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.message || 'Cập nhật hồ sơ y tế không thành công');
      }
    } catch (err: any) {
      console.error('Error updating patient profile:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Lỗi kết nối máy chủ. Vui lòng thử lại sau.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderTriStateButtons = (
    label: string,
    description: string,
    value: boolean | null,
    onChange: (val: boolean | null) => void
  ) => (
    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-slate-800">{label}</p>
          <p className="text-[10px] text-slate-500">{description}</p>
        </div>
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onChange(null)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
              value === null
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Chưa khai báo
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
              value === false
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Không
          </button>
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
              value === true
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Có
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-teal-100 max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Hồ Sơ Y Tế & Tiền Sử Bệnh Cá Nhân
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono-data">
                <span>Mã hồ sơ: <strong className="text-teal-700">{formState.mrn || 'Chưa có MRN'}</strong></span>
                {formState.updatedAt && (
                  <span className="text-slate-400">
                    • Cập nhật: {new Date(formState.updatedAt).toLocaleString('vi-VN')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'personal'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> 1. Thông Tin Cá Nhân
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vitals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'vitals'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> 2. Chỉ Số Sinh Hiệu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Heart className="w-3.5 h-3.5" /> 3. Tiền Sử Bệnh Lý
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('meds')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'meds'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Pill className="w-3.5 h-3.5" /> 4. Thuốc & Liên Hệ
          </button>
        </div>

        {/* Global Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSavedSuccess ? (
          <div className="py-8 text-center space-y-2 animate-fadeIn">
            <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-slate-800">Đã cập nhật hồ sơ y tế thành công!</h3>
            <p className="text-xs text-slate-500">Dữ liệu đã được lưu trữ an toàn trong cơ sở dữ liệu bệnh viện.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* TAB 1: THÔNG TIN CÁ NHÂN */}
            {activeTab === 'personal' && (
              <div className="space-y-3 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên bệnh nhân *</label>
                    <input
                      type="text"
                      value={formState.fullName}
                      onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" /> Ngày sinh
                    </label>
                    <input
                      type="date"
                      value={formState.dateOfBirth}
                      onChange={handleDateOfBirthChange}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white font-mono-data"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tuổi {formState.dateOfBirth ? '(Tự động tính từ ngày sinh)' : ''}
                    </label>
                    <input
                      type="number"
                      value={formState.age}
                      onChange={(e) => setFormState({ ...formState, age: e.target.value })}
                      readOnly={Boolean(formState.dateOfBirth)}
                      className={`w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none ${
                        formState.dateOfBirth ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-teal-500'
                      }`}
                      placeholder="Chưa cập nhật"
                      min={1}
                      max={120}
                    />
                    {ageValidationError && <p className="text-[11px] text-red-600 font-medium mt-1">{ageValidationError}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính</label>
                    <select
                      value={formState.gender}
                      onChange={(e) => setFormState({ ...formState, gender: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                    >
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                      <option value="Other">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                    <input
                      type="text"
                      value={formState.phoneNumber}
                      onChange={(e) => setFormState({ ...formState, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono-data"
                      placeholder="Chưa cập nhật"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nhóm máu</label>
                    <select
                      value={formState.bloodType}
                      onChange={(e) => setFormState({ ...formState, bloodType: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                    >
                      <option value="">-- Chưa cập nhật --</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ cư trú</label>
                    <input
                      type="text"
                      value={formState.address}
                      onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                      placeholder="Chưa cập nhật"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CHỈ SỐ SINH HIỆU */}
            {activeTab === 'vitals' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 animate-fadeIn">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-600" /> Chỉ Số Sinh Hiệu & Lâm Sàng Gần Nhất
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Huyết áp tâm thu (mmHg)</label>
                    <input
                      type="number"
                      value={formState.systolicBp}
                      onChange={(e) => setFormState({ ...formState, systolicBp: e.target.value })}
                      className={`w-full px-3 py-2 text-xs border rounded-lg font-mono-data outline-none bg-white ${
                        bpValidationError ? 'border-red-400 focus:ring-2 focus:ring-red-400' : 'border-slate-300 focus:ring-2 focus:ring-teal-500'
                      }`}
                      placeholder="Chưa đo (90 - 129)"
                      min={50}
                      max={250}
                    />
                    <span className="text-[10px] text-slate-400">Chuẩn: 90 - 129 mmHg</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Huyết áp tâm trương (mmHg)</label>
                    <input
                      type="number"
                      value={formState.diastolicBp}
                      onChange={(e) => setFormState({ ...formState, diastolicBp: e.target.value })}
                      className={`w-full px-3 py-2 text-xs border rounded-lg font-mono-data outline-none bg-white ${
                        bpValidationError ? 'border-red-400 focus:ring-2 focus:ring-red-400' : 'border-slate-300 focus:ring-2 focus:ring-teal-500'
                      }`}
                      placeholder="Chưa đo (60 - 84)"
                      min={30}
                      max={180}
                    />
                    <span className="text-[10px] text-slate-400">Chuẩn: 60 - 84 mmHg</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Chỉ số HbA1c (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formState.hba1c}
                      onChange={(e) => setFormState({ ...formState, hba1c: e.target.value })}
                      className={`w-full px-3 py-2 text-xs border rounded-lg font-mono-data outline-none bg-white ${
                        hba1cValidationError ? 'border-red-400 focus:ring-2 focus:ring-red-400' : 'border-slate-300 focus:ring-2 focus:ring-teal-500'
                      }`}
                      placeholder="Chưa đo (< 5.7%)"
                      min={2}
                      max={20}
                    />
                    <span className="text-[10px] text-slate-400">Chuẩn: &lt; 5.7%</span>
                  </div>
                </div>

                {bpValidationError && (
                  <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {bpValidationError}
                  </p>
                )}
                {hba1cValidationError && (
                  <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {hba1cValidationError}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bác sĩ chuyên khoa phụ trách</label>
                  <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-teal-600" />
                      {formState.assignedDoctor || 'Chưa được phân công'}
                    </span>
                    <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Chỉ định bởi bệnh viện
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TIỀN SỬ BỆNH LÝ (TRI-STATE SEGMENTED CONTROL) */}
            {activeTab === 'history' && (
              <div className="space-y-3 animate-fadeIn">
                {renderTriStateButtons(
                  'Đái tháo đường (Tiểu đường)',
                  'Tiền sử đường huyết cao hoặc điều trị insulin định kỳ',
                  formState.hasDiabetes,
                  (val) => setFormState({ ...formState, hasDiabetes: val })
                )}

                {/* Sub-form when Diabetes is explicitly set to YES (true) */}
                {formState.hasDiabetes === true && (
                  <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn ml-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Loại Đái Tháo Đường</label>
                      <select
                        value={formState.diabetesType}
                        onChange={(e) => setFormState({ ...formState, diabetesType: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="Type1">Type 1 (Phụ thuộc Insulin)</option>
                        <option value="Type2">Type 2 (Không phụ thuộc Insulin)</option>
                        <option value="Gestational">Đái tháo đường thai kỳ</option>
                        <option value="Other">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Số năm mắc bệnh</label>
                      <input
                        type="number"
                        value={formState.diabetesDurationYears}
                        onChange={(e) => setFormState({ ...formState, diabetesDurationYears: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-teal-500"
                        placeholder="Số năm (ví dụ: 5)"
                        min={0}
                        max={80}
                      />
                    </div>
                  </div>
                )}

                {renderTriStateButtons(
                  'Tăng huyết áp',
                  'Đang dùng thuốc hạ áp hoặc đo định kỳ > 130 mmHg',
                  formState.hasHypertension,
                  (val) => setFormState({ ...formState, hasHypertension: val })
                )}

                {renderTriStateButtons(
                  'Tiền sử hút thuốc lá',
                  'Đang hút hoặc đã từng hút thuốc lá thường xuyên',
                  formState.historyOfSmoking,
                  (val) => setFormState({ ...formState, historyOfSmoking: val })
                )}

                {renderTriStateButtons(
                  'Bệnh lý tim mạch',
                  'Bệnh mạch vành, nhồi máu cơ tim, suy tim',
                  formState.historyOfHeartDisease,
                  (val) => setFormState({ ...formState, historyOfHeartDisease: val })
                )}

                {renderTriStateButtons(
                  'Tiền sử đột quỵ / Tai biến mạch máu não',
                  'Đã từng có cơn thiếu máu não thoáng qua (TIA) hoặc đột quỵ',
                  formState.historyOfStroke,
                  (val) => setFormState({ ...formState, historyOfStroke: val })
                )}
              </div>
            )}

            {/* TAB 4: THUỐC, DỊ ỨNG & LIÊN HỆ KHẨN CẤP */}
            {activeTab === 'meds' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-teal-600" /> Danh Mục Thuốc Đang Sử Dụng Hằng Ngày
                  </label>
                  <textarea
                    rows={2}
                    value={formState.currentMedications}
                    onChange={(e) => setFormState({ ...formState, currentMedications: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Ví dụ: Metformin 500mg (1 viên/ngày), Amlodipine 5mg (1 viên/sáng)..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Tiền Sử Dị Ứng (Thuốc / Thức ăn / Dị nguyên)
                  </label>
                  <input
                    type="text"
                    value={formState.allergies}
                    onChange={(e) => setFormState({ ...formState, allergies: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Ví dụ: Penicillin, Aspirin hoặc Không có dị ứng..."
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-red-500" /> Thông Tin Người Thân Liên Hệ Khẩn Cấp
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Họ tên người liên hệ</label>
                      <input
                        type="text"
                        value={formState.emergencyContactName}
                        onChange={(e) => setFormState({ ...formState, emergencyContactName: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                        placeholder="Chưa khai báo"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Số điện thoại khẩn cấp</label>
                      <input
                        type="text"
                        value={formState.emergencyContactPhone}
                        onChange={(e) => setFormState({ ...formState, emergencyContactPhone: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white font-mono-data"
                        placeholder="Chưa khai báo"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Dữ liệu y tế được bảo vệ và chỉ sử dụng cho mục đích chăm sóc sức khỏe.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                  disabled={isLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Lưu Thay Đổi
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
