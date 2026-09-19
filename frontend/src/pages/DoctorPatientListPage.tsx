import React, { useState, useEffect, useMemo } from 'react';
import { DoctorWorklistView } from '../features/doctor/DoctorWorklistView';
import { PatientProfile } from '../types/cds';
import { doctorPatientApi } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { ClinicalSelect, ClinicalSelectOption } from '../components/ui/ClinicalSelect';
import { useLanguage } from '../context/LanguageContext';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { realtimeBus } from '../services/realtimeService';
import { AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';

export interface DoctorPatientListPageProps {
  onSelectPatientForCDS?: (patient: PatientProfile) => void;
  onStartConsultation?: (patient: PatientProfile) => void;
  onNavigate?: (section: string) => void;
}

export const DoctorPatientListPage: React.FC<DoctorPatientListPageProps> = ({
  onSelectPatientForCDS,
  onStartConsultation,
  onNavigate,
}) => {
  const { t, isVi } = useLanguage();
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const genderOptions = useMemo<ClinicalSelectOption<string>[]>(
    () => [
      { value: 'Male', label: t('common.gender.male', 'Nam') },
      { value: 'Female', label: t('common.gender.female', 'Nữ') },
      { value: 'Other', label: t('common.gender.other', 'Khác') },
    ],
    [t]
  );

  const [form, setForm] = useState({
    fullName: '',
    mrn: `MRN-${Date.now().toString().slice(-4)}`,
    age: 50,
    gender: 'Male',
    phone: '',
    systolicBp: 130,
    diastolicBp: 80,
    hba1c: 6.0,
    hasDiabetes: false,
    hasHypertension: false,
  });

  const loadPatients = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await doctorPatientApi.getPatients();
      if (res && res.success && res.data) {
        if (Array.isArray(res.data)) {
          setPatients(res.data);
        } else if (Array.isArray((res.data as any).items)) {
          setPatients((res.data as any).items);
        } else if (Array.isArray((res.data as any).content)) {
          setPatients((res.data as any).content);
        }
      }
    } catch (e) {
      console.error('Error loading patients for doctor:', e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // Universal Real-time State Synchronization for Doctor Patient Worklist
  useRealtimeSync(
    [
      'screening:new',
      'screening:reviewed',
      'screening:deleted',
      'screening:update',
      'profile:update',
      'doctor:assignment',
    ],
    async () => {
      await loadPatients(true);
    },
    { pollIntervalMs: 60000, syncOnFocus: false }
  );

  const handleOpenNewPatientModal = () => {
    setModalError(null);
    setModalSuccess(null);
    setForm({
      fullName: '',
      mrn: `MRN-${Date.now().toString().slice(-4)}`,
      age: 50,
      gender: 'Male',
      phone: '',
      systolicBp: 130,
      diastolicBp: 80,
      hba1c: 6.0,
      hasDiabetes: false,
      hasHypertension: false,
    });
    setIsNewPatientModalOpen(true);
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);

    if (!form.fullName.trim()) {
      setModalError(isVi ? 'Vui lòng nhập họ và tên bệnh nhân' : 'Please enter patient full name');
      return;
    }

    try {
      setSubmitting(true);
      const res = await doctorPatientApi.create({
        fullName: form.fullName.trim(),
        mrn: form.mrn.trim(),
        age: Number(form.age),
        gender: form.gender,
        phone: form.phone.trim(),
        phoneNumber: form.phone.trim(),
        systolicBp: Number(form.systolicBp),
        diastolicBp: Number(form.diastolicBp),
        hba1c: Number(form.hba1c),
        hasDiabetes: form.hasDiabetes,
        hasHypertension: form.hasHypertension,
      });

      if (res && res.success !== false) {
        setModalSuccess(isVi ? 'Thêm bệnh nhân mới thành công!' : 'Patient added successfully!');
        if (res.data) {
          const newPatient = res.data;
          setPatients((prev) => [newPatient, ...prev.filter((p) => p.id !== newPatient.id && p.mrn !== newPatient.mrn)]);
          realtimeBus.emit('profile:update', newPatient);
        }
        setTimeout(async () => {
          setIsNewPatientModalOpen(false);
          await loadPatients();
        }, 800);
      } else {
        setModalError(res?.message || (isVi ? 'Không thể tạo hồ sơ bệnh nhân. Vui lòng thử lại.' : 'Failed to create patient profile.'));
      }
    } catch (e: any) {
      console.error('Error creating patient:', e);
      setModalError(e?.message || (isVi ? 'Lỗi kết nối khi thêm bệnh nhân' : 'Connection error adding patient'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePatient = async (patient: PatientProfile) => {
    const id = patient.id || patient.userId;
    if (!id) return;
    const res = await doctorPatientApi.delete(id);
    if (res && res.success === false) {
      throw new Error(res.message || (isVi ? 'Không thể xóa bệnh nhân' : 'Failed to delete patient'));
    }
    setPatients((prev) => prev.filter((p) => p.id !== id && p.userId !== id));
    realtimeBus.emit('doctor:assignment', { deletedId: id });
    await loadPatients();
  };

  const handleBatchDeletePatients = async (patientIds: string[]) => {
    if (!patientIds || patientIds.length === 0) return;
    const res = await doctorPatientApi.batchDelete(patientIds);
    if (res && res.success === false) {
      throw new Error(res.message || (isVi ? 'Không thể xóa các bệnh nhân đã chọn' : 'Failed to delete selected patients'));
    }
    const idSet = new Set(patientIds);
    setPatients((prev) => prev.filter((p) => !idSet.has(p.id || '') && !idSet.has(p.userId || '')));
    realtimeBus.emit('doctor:assignment', { deletedIds: patientIds });
    await loadPatients();
  };

  return (
    <div className="space-y-6">
      <DoctorWorklistView
        patients={patients}
        loading={loading}
        onRefresh={loadPatients}
        onSelectPatient={(p) => {
          onSelectPatientForCDS?.(p);
          onNavigate?.('cds-viewer');
        }}
        onStartConsultation={onStartConsultation}
        onNewPatientClick={handleOpenNewPatientModal}
        onDeletePatient={handleDeletePatient}
        onBatchDeletePatients={handleBatchDeletePatients}
      />

      {/* New Patient Registration Modal */}
      <Modal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        maxWidth="xl"
        title={t('doctor.newPatientModal.title', 'Tiếp Nhận Bệnh Nhân Mới')}
        description={t('doctor.newPatientModal.description', 'Nhập thông tin hành chính và sinh hiệu cơ bản')}
      >
        <form onSubmit={handleCreatePatient} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{modalError}</span>
            </div>
          )}

          {modalSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">{modalSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label={t('doctor.newPatientModal.fullName', 'Họ và tên')} required>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#3478F6] focus:ring-2 focus:ring-[#3478F6]/15 transition-all"
              />
            </FormField>

            <FormField label={t('doctor.newPatientModal.mrn', 'Mã hồ sơ MRN')} required>
              <input
                type="text"
                required
                value={form.mrn}
                onChange={(e) => setForm({ ...form, mrn: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono-data text-sm focus:outline-none focus:border-[#3478F6] focus:ring-2 focus:ring-[#3478F6]/15 transition-all"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <FormField label={t('doctor.newPatientModal.age', 'Tuổi')}>
              <input
                type="number"
                min={1}
                max={130}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#3478F6] focus:ring-2 focus:ring-[#3478F6]/15 transition-all"
              />
            </FormField>

            <div>
              <ClinicalSelect<string>
                label={t('doctor.newPatientModal.gender', 'Giới tính')}
                value={form.gender}
                onChange={(val) => setForm({ ...form, gender: val })}
                options={genderOptions}
                size="md"
              />
            </div>

            <FormField label={t('doctor.newPatientModal.phone', 'Số điện thoại')}>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0987654321"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#3478F6] focus:ring-2 focus:ring-[#3478F6]/15 transition-all"
              />
            </FormField>
          </div>

          {/* Vitals */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-slate-700 block">
              {isVi ? 'Sinh hiệu & Chỉ số ban đầu' : 'Initial Clinical Vitals'}
            </span>
            <div className="grid grid-cols-3 gap-3">
              <FormField label={t('doctor.newPatientModal.systolicBp', 'HA Tâm thu (mmHg)')}>
                <input
                  type="number"
                  min={50}
                  max={300}
                  value={form.systolicBp}
                  onChange={(e) => setForm({ ...form, systolicBp: parseInt(e.target.value) || 0 })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono-data text-xs focus:outline-none focus:border-[#3478F6]"
                />
              </FormField>
              <FormField label={t('doctor.newPatientModal.diastolicBp', 'HA Tâm trương (mmHg)')}>
                <input
                  type="number"
                  min={30}
                  max={200}
                  value={form.diastolicBp}
                  onChange={(e) => setForm({ ...form, diastolicBp: parseInt(e.target.value) || 0 })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono-data text-xs focus:outline-none focus:border-[#3478F6]"
                />
              </FormField>
              <FormField label={t('doctor.newPatientModal.hba1c', 'HbA1c (%)')}>
                <input
                  type="number"
                  step="0.1"
                  min={3.0}
                  max={20.0}
                  value={form.hba1c}
                  onChange={(e) => setForm({ ...form, hba1c: parseFloat(e.target.value) || 0 })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono-data text-xs focus:outline-none focus:border-[#3478F6]"
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsNewPatientModalOpen(false)}
              disabled={submitting}
              className="rounded-xl px-4"
            >
              {t('doctor.newPatientModal.cancel', 'Hủy')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              icon={<UserPlus className="w-4 h-4" />}
              className="rounded-xl px-5 font-bold shadow-xs bg-[#3478F6] hover:bg-[#2563EB]"
            >
              {t('doctor.newPatientModal.save', 'Lưu Hồ Sơ')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

