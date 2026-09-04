import React, { useState } from 'react';
import { X, UserCheck, Heart, Activity, CheckCircle2, ShieldCheck, Save, Stethoscope } from 'lucide-react';
import { PatientProfile } from '../types/cds';

interface MedicalProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  onSave: (updated: PatientProfile) => void;
}

export const MedicalProfileModal: React.FC<MedicalProfileModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSave,
}) => {
  const [formData, setFormData] = useState<PatientProfile>({ ...patient });
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-teal-100 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Hồ Sơ Y Tế & Tiền Sử Bệnh Cá Nhân (FR-8)
              </h2>
              <p className="text-xs text-slate-500 font-mono-data">Mã hồ sơ: {formData.mrn}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSavedSuccess ? (
          <div className="p-6 text-center space-y-3 bg-emerald-50 rounded-xl border border-emerald-200 animate-fadeIn">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-emerald-900">Đã cập nhật hồ sơ y tế thành công!</h3>
            <p className="text-xs text-emerald-700">Dữ liệu được mã hóa an toàn theo tiêu chuẩn HIPAA y khoa.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên bệnh nhân</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tuổi</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Vitals */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-600" /> Chỉ Số Sinh Hiệu & Lâm Sàng Gần Nhất
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Huyết áp tâm thu (mmHg)</label>
                  <input
                    type="number"
                    value={formData.systolicBp}
                    onChange={(e) => setFormData({ ...formData, systolicBp: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono-data focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Huyết áp tâm trương (mmHg)</label>
                  <input
                    type="number"
                    value={formData.diastolicBp}
                    onChange={(e) => setFormData({ ...formData, diastolicBp: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono-data focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="80"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Chỉ số HbA1c (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.hba1c}
                    onChange={(e) => setFormData({ ...formData, hba1c: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono-data focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="6.5"
                  />
                </div>
              </div>
            </div>

            {/* Medical History Toggles */}
            <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 space-y-2.5">
              <h3 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-500" /> Tiền Sử Bệnh Lý Cá Nhân
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-teal-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasDiabetes}
                    onChange={(e) => setFormData({ ...formData, hasDiabetes: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span className="text-xs font-medium text-slate-800">Đái tháo đường</span>
                </label>

                <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-teal-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasHypertension}
                    onChange={(e) => setFormData({ ...formData, hasHypertension: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span className="text-xs font-medium text-slate-800">Tăng huyết áp</span>
                </label>

                <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-teal-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.historyOfSmoking}
                    onChange={(e) => setFormData({ ...formData, historyOfSmoking: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span className="text-xs font-medium text-slate-800">Hút thuốc lá</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Chuẩn bảo mật HIPAA PHI
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-3.5 h-3.5" /> Lưu Thay Đổi
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
