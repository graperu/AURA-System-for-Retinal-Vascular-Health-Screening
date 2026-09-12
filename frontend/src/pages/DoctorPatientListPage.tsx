import React, { useState, useEffect } from 'react';
import { DoctorWorklistView } from '../features/doctor/DoctorWorklistView';
import { PatientProfile } from '../types/cds';
import { doctorPatientApi, screeningApi } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';

interface DoctorPatientListPageProps {
  onSelectPatientForCDS?: (patient: PatientProfile) => void;
  onNavigate?: (section: string) => void;
}

export const DoctorPatientListPage: React.FC<DoctorPatientListPageProps> = ({
  onSelectPatientForCDS,
  onNavigate,
}) => {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const loadPatients = async () => {
    setLoading(true);
    try {
      const res = await doctorPatientApi.getPatients({ size: 100 });
      if (res.success && res.data && Array.isArray(res.data.items)) {
        setPatients(res.data.items);
      } else {
        setPatients([]);
      }
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) return;
    setSubmitting(true);
    try {
      await doctorPatientApi.create({
        fullName: form.fullName.trim(),
        mrn: form.mrn.trim(),
        age: form.age,
        gender: form.gender,
        phone: form.phone,
        systolicBp: form.systolicBp,
        diastolicBp: form.diastolicBp,
        hba1c: form.hba1c,
        hasDiabetes: form.hasDiabetes,
        hasHypertension: form.hasHypertension,
      });
      setIsNewPatientModalOpen(false);
      loadPatients();
    } catch (e) {
      console.error('Error creating patient:', e);
    } finally {
      setSubmitting(false);
    }
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
        onNewPatientClick={() => setIsNewPatientModalOpen(true)}
      />

      {/* New Patient Registration Modal */}
      <Modal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        maxWidth="lg"
        title="Tiếp Nhận Bệnh Nhân Mới"
        description="Nhập thông tin hành chính và sinh hiệu cơ bản"
      >
        <form onSubmit={handleCreatePatient} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Họ và tên" required>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0891B2]"
              />
            </FormField>

            <FormField label="Mã hồ sơ MRN" required>
              <input
                type="text"
                required
                value={form.mrn}
                onChange={(e) => setForm({ ...form, mrn: e.target.value })}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono-data focus:outline-none focus:border-[#0891B2]"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <FormField label="Tuổi">
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0891B2]"
              />
            </FormField>

            <FormField label="Giới tính">
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#0891B2]"
              >
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
              </select>
            </FormField>

            <FormField label="Số điện thoại">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0987654321"
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0891B2]"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <FormField label="HA Tâm thu">
              <input
                type="number"
                value={form.systolicBp}
                onChange={(e) => setForm({ ...form, systolicBp: parseInt(e.target.value) || 0 })}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono-data"
              />
            </FormField>
            <FormField label="HA Tâm trương">
              <input
                type="number"
                value={form.diastolicBp}
                onChange={(e) => setForm({ ...form, diastolicBp: parseInt(e.target.value) || 0 })}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono-data"
              />
            </FormField>
            <FormField label="HbA1c (%)">
              <input
                type="number"
                step="0.1"
                value={form.hba1c}
                onChange={(e) => setForm({ ...form, hba1c: parseFloat(e.target.value) || 0 })}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono-data"
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewPatientModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
            >
              Lưu Hồ Sơ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
