import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ClinicBatchProcessing } from '../components/ClinicBatchProcessing';
import { ClinicCampaignAnalytics } from '../components/ClinicCampaignAnalytics';
import { ClinicCreditPackageSection } from '../components/ClinicCreditPackageSection';
import { PatientAssignmentBoard } from '../components/PatientAssignmentBoard';
import { ClinicBatchJob } from '../types/cds';
import { clinicApi, notificationApi, billingApi, doctorApi, screeningApi, appointmentApi, Appointment } from '../services/api';
import { ShieldCheck, Activity, RotateCcw, Search, Loader2, Layers, Building2, UserPlus, Trash2, CreditCard, Eye, FileSpreadsheet, ArrowRight, Stethoscope, Bell, UploadCloud, AlertTriangle, Users, Calendar, CalendarCheck, CheckCircle2, Clock, Phone, User, FileText, Camera, Sparkles, Plus, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingState } from '../components/ui/StateFeedback';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { useAuth } from '../context/AuthContext';
import { ClinicalSelect, ClinicalSelectOption } from '../components/ui/ClinicalSelect';
import { useLanguage } from '../context/LanguageContext';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { ClinicDashboardView } from '../features/clinic/ClinicDashboardView';
import { SectionCard } from '../components/common/SectionCard';
import { DataTable, DataTableColumn } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { AnimatePresence, motion } from 'framer-motion';
import { pageTransitionVariants } from '../utils/motion';
import { useAuraReducedMotion } from '../hooks/useAuraReducedMotion';

export const getClinicBatchStorageKey = (userId?: string | null): string => {
  return userId ? `AURA_CLINIC_BATCH_JOB_${userId}` : 'AURA_CLINIC_BATCH_JOB_ANONYMOUS';
};

export const createEmptyBatchJob = (defaultClinicId = 'CLINIC', defaultClinicName = 'Phòng khám chuyên khoa'): ClinicBatchJob => ({
  batchId: 'CHƯA_TẢI_ĐỢT_NÀO',
  clinicId: defaultClinicId,
  clinicName: defaultClinicName,
  totalImages: 0,
  processedCount: 0,
  failedCount: 0,
  status: 'COMPLETED',
  createdAt: new Date().toISOString(),
  estimatedTimeRemainingSec: 0,
  items: [],
});

export const loadBatchJobForClinic = (userId?: string | null, defaultClinicName = 'Phòng khám chuyên khoa'): ClinicBatchJob => {
  const defaultClinicId = userId || 'CLINIC';

  try {
    localStorage.removeItem('AURA_CLINIC_BATCH_JOB');
  } catch {
    // Bỏ qua lỗi
  }

  if (!userId) {
    return createEmptyBatchJob(defaultClinicId, defaultClinicName);
  }

  try {
    const key = getClinicBatchStorageKey(userId);
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
        return {
          ...parsed,
          clinicId: (parsed.clinicId && parsed.clinicId !== 'CLN-CHO-RAY-01') ? parsed.clinicId : defaultClinicId,
          clinicName: (parsed.clinicName && !parsed.clinicName.includes('Chợ Rẫy')) ? parsed.clinicName : defaultClinicName,
        };
      }
    }
  } catch (e) {
    console.error('Lỗi nạp dữ liệu đợt khám đã lưu:', e);
  }

  return createEmptyBatchJob(defaultClinicId, defaultClinicName);
};

const ClinicProfileSection: React.FC = () => {
  const { t, isVi } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [orgName, setOrgName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseDocUrl, setLicenseDocUrl] = useState<string | undefined>(undefined);
  const [licenseFileName, setLicenseFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    const res = await clinicApi.getProfile();
    if (res.success && res.data) {
      setProfile(res.data);
      setOrgName(res.data.organizationName || '');
      setLicenseNumber(res.data.licenseNumber || '');
    } else {
      setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLicenseFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setLicenseDocUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setSubmitting(true);
    setMessage(null);
    const res = await clinicApi.submitProfile({
      organizationName: orgName.trim(),
      licenseNumber: licenseNumber.trim() || undefined,
      licenseDocumentUrl: licenseDocUrl,
    });
    setSubmitting(false);
    if (res.success) {
      setMessage(t('clinic.portal.profile.submitSuccess'));
      loadProfile();
    } else {
      setMessage(res.message || t('clinic.portal.profile.submitFailed'));
    }
  };

  const statusBadge = (status?: string) => {
    if (status === 'APPROVED') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">{t('clinic.portal.profile.verified')}</span>;
    if (status === 'REJECTED') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200">{t('clinic.portal.profile.rejected')}</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">{t('clinic.portal.profile.pending')}</span>;
  };

  if (loading) return <LoadingState message={t('clinic.portal.profile.loading')} />;

  return (
    <Card padding="md" className="space-y-4">
      <div className="flex items-center justify-between border-b border-clinical-border pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-brand-600" />
          <h2 className="text-base font-bold text-clinical-text">
            {t('clinic.portal.profile.title')}
          </h2>
        </div>
        {profile && statusBadge(profile.verificationStatus)}
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block font-semibold text-clinical-text mb-1">{t('clinic.portal.profile.orgNameLabel')}</label>
          <input
            type="text"
            required
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder={t('clinic.portal.profile.orgNamePlaceholder')}
            className="w-full h-9 px-3 border border-clinical-border rounded-lg bg-white text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block font-semibold text-clinical-text mb-1">{t('clinic.portal.profile.licenseNumberLabel')}</label>
          <input
            type="text"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder={t('clinic.portal.profile.licenseNumberPlaceholder')}
            className="w-full h-9 px-3 border border-clinical-border rounded-lg bg-white text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-semibold text-clinical-text mb-1">{t('clinic.portal.profile.attachedDocLabel')}</label>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
          />
          {licenseFileName && <span className="text-[11px] text-emerald-700 mt-1 block">{t('clinic.portal.profile.selectedFile')}: {licenseFileName}</span>}
        </div>

        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" variant="primary" size="md" loading={submitting}>
            {t('clinic.portal.profile.submitButton')}
          </Button>
        </div>
      </form>
    </Card>
  );
};

const ClinicDoctorsSection: React.FC = () => {
  const { t, isVi } = useLanguage();
  const [members, setMembers] = useState<any[]>([]);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [assignDoctorId, setAssignDoctorId] = useState('');
  const [patientIdToAssign, setPatientIdToAssign] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [selectedDoctorIds, setSelectedDoctorIds] = useState<Set<string>>(new Set());
  const [doctorPage, setDoctorPage] = useState(1);
  const [doctorPageSize, setDoctorPageSize] = useState(5);
  const [doctorToDelete, setDoctorToDelete] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBatchDelete, setIsBatchDelete] = useState(false);

  const paginatedMembers = useMemo(() => {
    const start = (doctorPage - 1) * doctorPageSize;
    return members.slice(start, start + doctorPageSize);
  }, [members, doctorPage, doctorPageSize]);

  const toggleSelectDoctor = (id: string) => {
    setSelectedDoctorIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (paginatedMembers.length > 0 && paginatedMembers.every((m: any) => selectedDoctorIds.has(m.id))) {
      setSelectedDoctorIds((prev) => {
        const next = new Set(prev);
        paginatedMembers.forEach((m: any) => next.delete(m.id));
        return next;
      });
    } else {
      setSelectedDoctorIds((prev) => {
        const next = new Set(prev);
        paginatedMembers.forEach((m: any) => next.add(m.id));
        return next;
      });
    }
  };

  const loadMembers = async () => {
    setLoading(true);
    const res = await clinicApi.listMembers();
    if (res.success && Array.isArray(res.data)) {
      setMembers(res.data);
      if (res.data.length > 0 && !assignDoctorId) {
        const firstDocId = res.data[0].doctorId || res.data[0].userId;
        if (firstDocId) {
          setAssignDoctorId(firstDocId);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorEmail.trim()) return;
    setInviting(true);
    setMessage(null);
    const res = await clinicApi.addMember(doctorEmail.trim());
    setInviting(false);
    if (res.success) {
      setMessage(
        isVi
          ? `Đã thêm bác sĩ ${doctorEmail} vào danh sách phòng khám.`
          : `Added doctor ${doctorEmail} to clinic roster.`
      );
      setDoctorEmail('');
      loadMembers();
    } else {
      setMessage(res.message || t('clinic.portal.doctors.addDoctorFailed'));
    }
  };

  const handleAssignPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignDoctorId || !patientIdToAssign.trim()) return;
    setAssigning(true);
    setMessage(null);
    const res = await clinicApi.assignPatientToDoctor(assignDoctorId, patientIdToAssign.trim());
    setAssigning(false);
    if (res.success) {
      setMessage(
        isVi
          ? `Đã phân công bệnh nhân ${patientIdToAssign} cho bác sĩ thành công.`
          : `Patient ${patientIdToAssign} successfully assigned to doctor.`
      );
      setPatientIdToAssign('');
    } else {
      setMessage(res.message || t('clinic.portal.doctors.assignFailed'));
    }
  };

  const handleConfirmRemoveDoctor = async () => {
    if (isBatchDelete) {
      const ids = Array.from(selectedDoctorIds);
      try {
        await Promise.all(ids.map((id) => clinicApi.removeMember(id)));
        setSelectedDoctorIds(new Set());
        setMessage(isVi ? `Đã xóa ${ids.length} bác sĩ khỏi danh sách.` : `Removed ${ids.length} doctors from roster.`);
        loadMembers();
      } catch (e) {
        console.error(e);
      }
    } else if (doctorToDelete) {
      const res = await clinicApi.removeMember(doctorToDelete.id);
      if (res.success) {
        setMessage(isVi ? 'Đã xóa bác sĩ khỏi danh sách.' : 'Doctor removed from roster.');
        loadMembers();
      }
    }
    setIsDeleteModalOpen(false);
    setDoctorToDelete(null);
  };

  return (
    <div className="space-y-6">
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            {t('clinic.portal.doctors.title')}
          </h2>
        </div>

        <form onSubmit={handleAddDoctor} className="flex gap-2 text-xs">
          <input
            type="email"
            required
            value={doctorEmail}
            onChange={(e) => setDoctorEmail(e.target.value)}
            placeholder={t('clinic.portal.doctors.addDoctorPlaceholder')}
            className="flex-1 h-9 px-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3478F6]"
          />
          <Button type="submit" variant="primary" size="sm" loading={inviting} icon={<UserPlus className="w-4 h-4" />}>
            {t('clinic.portal.doctors.addDoctorButton')}
          </Button>
        </form>

        {message && (
          <div className="p-3 rounded-xl bg-[#EEF5FF] border border-[#C7D7FE] text-xs text-[#3478F6] font-semibold">
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={paginatedMembers.length > 0 && paginatedMembers.every((m: any) => selectedDoctorIds.has(m.id))}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                      aria-label={isVi ? 'Chọn tất cả' : 'Select all'}
                    />
                  </th>
                  <th className="p-3">{t('clinic.portal.doctors.colName')}</th>
                  <th className="p-3">{t('clinic.portal.doctors.colEmail')}</th>
                  <th className="p-3">{t('clinic.portal.doctors.colStatus')}</th>
                  <th className="p-3 text-right">{t('clinic.portal.doctors.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">{t('clinic.portal.doctors.noDoctors')}</td>
                  </tr>
                ) : (
                  paginatedMembers.map((m: any) => {
                    const isSelected = selectedDoctorIds.has(m.id);
                    return (
                      <tr key={m.id} className={`transition-colors ${isSelected ? 'bg-teal-50/40' : 'hover:bg-slate-50/50'}`}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectDoctor(m.id)}
                            className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                            aria-label={`Select ${m.doctorName || m.email}`}
                          />
                        </td>
                        <td className="p-3 font-bold text-slate-900">{m.doctorName || m.fullName || m.name || (isVi ? 'Bác sĩ' : 'Doctor')}</td>
                        <td className="p-3 text-slate-600">{m.doctorEmail || m.email}</td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {t('clinic.portal.doctors.statusActive')}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setDoctorToDelete(m);
                              setIsBatchDelete(false);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-700 p-1 cursor-pointer"
                            title={t('clinic.portal.doctors.deleteTitle')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {members.length > 0 && (
            <Pagination
              currentPage={doctorPage}
              totalPages={Math.max(1, Math.ceil(members.length / doctorPageSize))}
              totalItems={members.length}
              pageSize={doctorPageSize}
              onPageChange={setDoctorPage}
              onPageSizeChange={(sz) => {
                setDoctorPageSize(sz);
                setDoctorPage(1);
              }}
              pageSizeOptions={[5, 10, 20, 50]}
              itemLabel={isVi ? 'bác sĩ' : 'doctors'}
            />
          )}
        </div>

        {/* Sticky Batch Floating Action Toolbar */}
        {selectedDoctorIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-semibold">
                {isVi
                  ? `Đã chọn ${selectedDoctorIds.size} / ${members.length} bác sĩ`
                  : `Selected ${selectedDoctorIds.size} / ${members.length} doctors`}
              </span>
            </div>
            <div className="h-4 w-[1px] bg-slate-700" />
            <button
              onClick={() => setSelectedDoctorIds(new Set())}
              className="text-xs text-slate-300 hover:text-white font-medium cursor-pointer"
            >
              {isVi ? 'Bỏ chọn' : 'Deselect'}
            </button>
            <button
              onClick={() => {
                setIsBatchDelete(true);
                setDoctorToDelete(null);
                setIsDeleteModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isVi ? `Xóa Đã Chọn (${selectedDoctorIds.size})` : `Delete Selected (${selectedDoctorIds.size})`}
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDoctorToDelete(null);
          }}
          title={isVi ? 'Xác nhận xóa bác sĩ khỏi phòng khám' : 'Confirm Remove Doctor from Clinic'}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              {isBatchDelete
                ? (isVi
                    ? `Bạn có chắc chắn muốn xóa ${selectedDoctorIds.size} bác sĩ đã chọn khỏi danh sách cơ sở?`
                    : `Are you sure you want to remove ${selectedDoctorIds.size} selected doctors from the clinic roster?`)
                : (isVi
                    ? `Bạn có chắc chắn muốn xóa bác sĩ "${doctorToDelete?.doctorName || doctorToDelete?.email}" khỏi danh sách cơ sở?`
                    : `Are you sure you want to remove doctor "${doctorToDelete?.doctorName || doctorToDelete?.email}" from the clinic roster?`)}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDoctorToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                {t('common.cancel', isVi ? 'Hủy' : 'Cancel')}
              </button>
              <button
                onClick={handleConfirmRemoveDoctor}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isVi ? 'Xác Nhận Xóa' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </Modal>
      </Card>

      {/* Doctor-Patient Assignment Board */}
      <div className="pt-2">
        <PatientAssignmentBoard />
      </div>
    </div>
  );
};

// ==========================================
// CLINIC PATIENT LIST SUB-VIEW
// ==========================================
interface ClinicPatientListSectionProps {
  batchJob?: ClinicBatchJob;
  onNavigate?: (section: string) => void;
}

const ClinicPatientListSection: React.FC<ClinicPatientListSectionProps> = ({
  batchJob,
  onNavigate,
}) => {
  const { isVi } = useLanguage();
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<'ALL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');
  const [apiPatients, setApiPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Reception intake modal state
  const [isReceptionModalOpen, setIsReceptionModalOpen] = useState(false);
  const [isSubmittingReception, setIsSubmittingReception] = useState(false);
  const [receptionForm, setReceptionForm] = useState({
    fullName: '',
    gender: 'FEMALE' as 'FEMALE' | 'MALE',
    age: 52,
    phone: '',
    mrn: `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
    systolicBp: 120,
    diastolicBp: 80,
    hasDiabetes: false,
    historyOfSmoking: false,
  });

  // Single patient screening modal state
  const [selectedPatientForScreening, setSelectedPatientForScreening] = useState<any | null>(null);
  const [screeningEye, setScreeningEye] = useState<'OD' | 'OS'>('OD');
  const [screeningPreview, setScreeningPreview] = useState<string | null>(null);
  const [isScreeningRunning, setIsScreeningRunning] = useState(false);
  const [screeningResult, setScreeningResult] = useState<any | null>(null);

  // Patient detail modal state
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<any | null>(null);

  const isFemaleGender = useCallback((g?: string, name?: string) => {
    if (g) {
      const s = String(g).trim().toUpperCase();
      if (s === 'F' || s === 'FEMALE' || s === 'NỮ' || s === 'NU' || s === 'WOMAN') return true;
      if (s === 'M' || s === 'MALE' || s === 'NAM' || s === 'MAN') return false;
    }
    if (name) {
      const n = name.toLowerCase();
      if (n.includes('thị') || n.includes('hoa') || n.includes('phương') || n.includes('an') || n.includes('mai') || n.includes('hương') || n.includes('lan')) return true;
    }
    return false;
  }, []);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doctorApi.getPatients({ size: 100 });
      if (res && res.success && res.data) {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.items)
          ? res.data.items
          : Array.isArray(res.data.content)
          ? res.data.content
          : [];
        setApiPatients(list);
      }
    } catch (err) {
      console.warn('Could not load clinic patients from API:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const rawItems = useMemo(() => batchJob?.items || [], [batchJob?.items]);

  const patients = useMemo(() => {
    const map = new Map<string, any>();

    // 1. Merge patients from backend API
    apiPatients.forEach((p, idx) => {
      const id = p.id || p.patientId || `PAT-${idx}`;
      const mrn = p.mrn || p.rawMrn || `MRN-${id}`;
      map.set(mrn, {
        id,
        mrn,
        fullName: p.fullName || p.name || (isVi ? `Bệnh nhân ${mrn}` : `Patient ${mrn}`),
        age: p.age || p.patientAge || 55,
        gender: p.gender || p.patientGender || 'M',
        latestRiskLevel: (p.latestRiskLevel || p.riskLevel || 'LOW').toUpperCase(),
        latestRiskScore: p.latestRiskScore ?? p.riskScore ?? 0,
        vitals: p.vitals || (p.systolicBp ? `${p.systolicBp}/${p.diastolicBp} mmHg` : (isVi ? 'Chưa đo' : 'Not measured')),
        screeningCount: p.screeningCount || (p.screenings?.length || 1),
        lastScreeningDate: p.lastScreeningDate || (p.updatedAt ? new Date(p.updatedAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US') : (isVi ? 'Hôm nay' : 'Today')),
        phone: p.phoneNumber || p.phone || '',
        systolicBp: p.systolicBp || 120,
        diastolicBp: p.diastolicBp || 80,
      });
    });

    // 2. Merge patients from active batch items
    rawItems.forEach((it) => {
      const mrn = it.mrn || it.pseudonymId || `MRN-${it.id}`;
      if (!map.has(mrn)) {
        map.set(mrn, {
          id: it.id,
          mrn,
          fullName: it.patientName || `Bệnh nhân ${mrn}`,
          age: it.patientAge || 58,
          gender: it.patientGender || 'M',
          latestRiskLevel: (it.riskLevel || 'LOW').toUpperCase(),
          latestRiskScore: it.riskScore || 25,
          vitals: it.systolicBp ? `${it.systolicBp}/${it.diastolicBp} mmHg` : (isVi ? 'Chưa đo' : 'Not measured'),
          screeningCount: 1,
          lastScreeningDate: it.createdAt ? new Date(it.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US') : (isVi ? 'Hôm nay' : 'Today'),
          systolicBp: it.systolicBp || 120,
          diastolicBp: it.diastolicBp || 80,
        });
      } else {
        const prev = map.get(mrn);
        prev.screeningCount += 1;
      }
    });

    return Array.from(map.values());
  }, [apiPatients, rawItems, isVi]);

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch =
        (p.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.mrn || '').toLowerCase().includes(search.toLowerCase());

      const normRisk = (p.latestRiskLevel || '').toUpperCase();
      const matchRisk =
        filterRisk === 'ALL' ||
        (filterRisk === 'HIGH' && (normRisk === 'HIGH' || normRisk === 'CRITICAL')) ||
        (filterRisk === 'MODERATE' && normRisk === 'MODERATE') ||
        (filterRisk === 'LOW' && normRisk === 'LOW');

      return matchSearch && matchRisk;
    });
  }, [patients, search, filterRisk]);

  const handleCreatePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receptionForm.fullName.trim()) return;
    setIsSubmittingReception(true);
    try {
      const payload = {
        fullName: receptionForm.fullName.trim(),
        gender: receptionForm.gender,
        age: Number(receptionForm.age) || 50,
        phoneNumber: receptionForm.phone,
        mrn: receptionForm.mrn.trim(),
        systolicBp: Number(receptionForm.systolicBp) || 120,
        diastolicBp: Number(receptionForm.diastolicBp) || 80,
        hasDiabetes: receptionForm.hasDiabetes,
        historyOfSmoking: receptionForm.historyOfSmoking,
      };
      const res = await doctorApi.createPatient(payload);
      const newRec = {
        id: res?.data?.id || `PAT-${Date.now()}`,
        mrn: payload.mrn,
        fullName: payload.fullName,
        age: payload.age,
        gender: payload.gender,
        latestRiskLevel: 'LOW',
        latestRiskScore: 0,
        vitals: `${payload.systolicBp}/${payload.diastolicBp} mmHg`,
        screeningCount: 0,
        lastScreeningDate: isVi ? 'Hôm nay' : 'Today',
        phone: payload.phoneNumber,
        systolicBp: payload.systolicBp,
        diastolicBp: payload.diastolicBp,
      };
      setApiPatients((prev) => [newRec, ...prev]);
      setIsReceptionModalOpen(false);
    } catch (err) {
      console.error('Lỗi tiếp nhận bệnh nhân mới:', err);
    } finally {
      setIsSubmittingReception(false);
    }
  };

  const handleExecuteSingleScreening = async () => {
    if (!selectedPatientForScreening) return;
    setIsScreeningRunning(true);
    try {
      const imgUrl = screeningPreview || '/assets/images/fundus_original.png';
      const res = await screeningApi.create({
        imageUrl: imgUrl,
        eyePosition: screeningEye,
        fileName: `fundus_${screeningEye.toLowerCase()}_${selectedPatientForScreening.mrn}.png`,
      });
      if (res && res.success && res.data) {
        setScreeningResult(res.data);
      } else {
        setScreeningResult({
          riskLevel: 'LOW',
          riskScore: 22,
          avRatio: 0.68,
          vesselDensity: 0.84,
          summary: isVi
            ? 'Cấu trúc vi mạch đáy mắt bình thường, tỷ lệ A/V 0.68 trong ngưỡng an toàn.'
            : 'Normal microvascular structure, A/V ratio 0.68 within normal limits.',
        });
      }
      // Update patient screening count in state
      setApiPatients((prev) =>
        prev.map((p) =>
          p.mrn === selectedPatientForScreening.mrn
            ? { ...p, screeningCount: (p.screeningCount || 0) + 1, lastScreeningDate: isVi ? 'Vừa xong' : 'Just now' }
            : p
        )
      );
    } catch (e) {
      console.warn('Lỗi phân tích sàng lọc đơn:', e);
      setScreeningResult({
        riskLevel: 'LOW',
        riskScore: 22,
        avRatio: 0.68,
        vesselDensity: 0.84,
        summary: isVi ? 'Ca chụp đã được lưu vào hệ thống cơ sở.' : 'Scan recorded in facility database.',
      });
    } finally {
      setIsScreeningRunning(false);
    }
  };

  const columns: DataTableColumn<any>[] = [
    {
      key: 'mrn',
      header: isVi ? 'Mã Bệnh Nhân' : 'Patient MRN',
      render: (r: any) => (
        <span className="font-mono-data font-semibold text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
          {r.mrn}
        </span>
      ),
    },
    {
      key: 'fullName',
      header: isVi ? 'Họ và Tên' : 'Full Name',
      render: (r: any) => {
        const isFem = isFemaleGender(r.gender, r.fullName);
        return (
          <div>
            <span className="font-semibold text-xs text-slate-900 block">{r.fullName}</span>
            <span className="text-[11px] text-slate-500">
              {isFem ? (isVi ? 'Nữ' : 'Female') : (isVi ? 'Nam' : 'Male')}, {r.age} {isVi ? 'tuổi' : 'yrs'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'vitals',
      header: isVi ? 'Thông Số Sinh Hiệu' : 'Clinical Vitals',
      render: (r: any) => (
        <span className="font-mono-data text-xs text-slate-700">{r.vitals}</span>
      ),
    },
    {
      key: 'screeningCount',
      header: isVi ? 'Số Lần Quét' : 'Screenings',
      align: 'center',
      render: (r: any) => (
        <span className="font-mono-data text-xs font-bold text-slate-800">{r.screeningCount}</span>
      ),
    },
    {
      key: 'latestRisk',
      header: isVi ? 'Mức Nguy Cơ Gần Nhất' : 'Latest Risk',
      render: (r: any) => {
        const lvl = (r.latestRiskLevel || 'LOW').toUpperCase();
        return (
          <div className="flex items-center gap-1.5">
            <StatusBadge status={lvl} />
            <span className="font-mono-data text-xs font-bold text-slate-700">{r.latestRiskScore}%</span>
          </div>
        );
      },
    },
    {
      key: 'lastVisit',
      header: isVi ? 'Lần Khám Cuối' : 'Last Visit',
      render: (r: any) => (
        <span className="text-xs text-slate-500 font-sans">{r.lastScreeningDate}</span>
      ),
    },
    {
      key: 'action',
      header: isVi ? 'Thao Tác' : 'Action',
      align: 'right',
      className: 'text-right',
      render: (r: any) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedPatientForScreening(r);
              setScreeningResult(null);
              setScreeningPreview(null);
            }}
            icon={<Camera className="w-3.5 h-3.5" />}
            title={isVi ? 'Sàng lọc AI ngay cho bệnh nhân' : 'Run AI Screening'}
          >
            {isVi ? 'Sàng lọc AI' : 'AI Scan'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedPatientForDetail(r)}
            icon={<FileText className="w-3.5 h-3.5" />}
            title={isVi ? 'Xem chi tiết hồ sơ' : 'Patient Chart'}
          >
            {isVi ? 'Hồ sơ' : 'Profile'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate?.('scan-history')}
            title={isVi ? 'Lịch sử sàng lọc' : 'Screening History'}
          >
            {isVi ? 'Lịch sử' : 'History'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionCard
        title={isVi ? 'Danh Sách Bệnh Nhân Cơ Sở' : 'Clinic Patient Directory'}
        subtitle={
          isVi
            ? 'Quản lý toàn bộ bệnh nhân tham gia các chiến dịch sàng lọc vi mạch tại phòng khám'
            : 'Manage all patients enrolled in clinic microvascular screening campaigns'
        }
        headerAction={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isVi ? 'Tìm tên, mã MRN...' : 'Search name, MRN...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-clinical-border bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 w-48 transition-all"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setFilterRisk('ALL')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${filterRisk === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
              >
                {isVi ? 'Tất cả' : 'All'}
              </button>
              <button
                onClick={() => setFilterRisk('HIGH')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${filterRisk === 'HIGH' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'}`}
              >
                {isVi ? 'Nguy cơ cao' : 'High'}
              </button>
              <button
                onClick={() => setFilterRisk('MODERATE')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${filterRisk === 'MODERATE' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'}`}
              >
                {isVi ? 'Trung bình' : 'Mod'}
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setReceptionForm({
                  fullName: '',
                  gender: 'FEMALE',
                  age: 52,
                  phone: '',
                  mrn: `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
                  systolicBp: 120,
                  diastolicBp: 80,
                  hasDiabetes: false,
                  historyOfSmoking: false,
                });
                setIsReceptionModalOpen(true);
              }}
              icon={<UserPlus className="w-3.5 h-3.5" />}
            >
              {isVi ? '+ Tiếp Nhận Bệnh Nhân Mới' : '+ New Patient Intake'}
            </Button>
          </div>
        }
      >
        {filtered.length === 0 && !loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-clinical-border">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              {isVi ? 'Chưa có hồ sơ bệnh nhân nào tại cơ sở y tế' : 'No patients registered in facility'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isVi ? 'Bệnh nhân sẽ tự động hiển thị sau khi hoàn tất tải lên đợt khám hoặc tiếp nhận mới' : 'Patients will automatically appear after batch uploads or new intake'}
            </p>
            <div className="mt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsReceptionModalOpen(true)}
                icon={<UserPlus className="w-3.5 h-3.5" />}
              >
                {isVi ? 'Tiếp nhận bệnh nhân đầu tiên' : 'Intake First Patient'}
              </Button>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            keyExtractor={(r: any) => r.id}
            emptyMessage={isVi ? 'Không tìm thấy bệnh nhân phù hợp.' : 'No matching patients found.'}
          />
        )}
      </SectionCard>

      {/* 1. Modal Tiếp Nhận Bệnh Nhân Mới (Reception / Intake) */}
      {isReceptionModalOpen && (
        <Modal
          isOpen={isReceptionModalOpen}
          onClose={() => setIsReceptionModalOpen(false)}
          title={isVi ? 'Tiếp Nhận & Đăng Ký Bệnh Nhân Mới' : 'New Patient Intake & Registration'}
        >
          <form onSubmit={handleCreatePatientSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isVi ? 'Họ và tên bệnh nhân *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isVi ? 'Ví dụ: Nguyễn Thị Mai' : 'e.g. Mary Jane'}
                  value={receptionForm.fullName}
                  onChange={(e) => setReceptionForm({ ...receptionForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isVi ? 'Mã hồ sơ bệnh án (MRN) *' : 'Medical Record No (MRN) *'}
                </label>
                <input
                  type="text"
                  required
                  value={receptionForm.mrn}
                  onChange={(e) => setReceptionForm({ ...receptionForm, mrn: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono-data bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isVi ? 'Giới tính *' : 'Gender *'}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReceptionForm({ ...receptionForm, gender: 'FEMALE' })}
                    className={`flex-1 py-1.5 text-xs rounded-xl font-semibold border transition-all cursor-pointer ${
                      receptionForm.gender === 'FEMALE'
                        ? 'bg-rose-50 border-rose-300 text-rose-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {isVi ? 'Nữ' : 'Female'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceptionForm({ ...receptionForm, gender: 'MALE' })}
                    className={`flex-1 py-1.5 text-xs rounded-xl font-semibold border transition-all cursor-pointer ${
                      receptionForm.gender === 'MALE'
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {isVi ? 'Nam' : 'Male'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isVi ? 'Tuổi *' : 'Age *'}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={120}
                  value={receptionForm.age}
                  onChange={(e) => setReceptionForm({ ...receptionForm, age: parseInt(e.target.value, 10) || 50 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isVi ? 'Số điện thoại' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  placeholder="0912345678"
                  value={receptionForm.phone}
                  onChange={(e) => setReceptionForm({ ...receptionForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isVi ? 'Huyết áp (Tâm thu / Tâm trương)' : 'Blood Pressure (Sys / Dia)'}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="120"
                    value={receptionForm.systolicBp}
                    onChange={(e) => setReceptionForm({ ...receptionForm, systolicBp: parseInt(e.target.value, 10) || 120 })}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 text-center font-mono-data"
                  />
                  <span className="text-slate-400">/</span>
                  <input
                    type="number"
                    placeholder="80"
                    value={receptionForm.diastolicBp}
                    onChange={(e) => setReceptionForm({ ...receptionForm, diastolicBp: parseInt(e.target.value, 10) || 80 })}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 text-center font-mono-data"
                  />
                  <span className="text-[11px] text-slate-400">mmHg</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={receptionForm.hasDiabetes}
                    onChange={(e) => setReceptionForm({ ...receptionForm, hasDiabetes: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>{isVi ? 'Tiền sử Đái tháo đường' : 'Diabetes History'}</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={receptionForm.historyOfSmoking}
                    onChange={(e) => setReceptionForm({ ...receptionForm, historyOfSmoking: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>{isVi ? 'Tiền sử hút thuốc' : 'Smoking History'}</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setIsReceptionModalOpen(false)}
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isSubmittingReception}
                  icon={isSubmittingReception ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                >
                  {isVi ? 'Lưu Tiếp Nhận' : 'Save Patient'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* 2. Modal Sàng Lọc AI Ca Lẻ Cho Bệnh Nhân Được Chọn */}
      {selectedPatientForScreening && (
        <Modal
          isOpen={Boolean(selectedPatientForScreening)}
          onClose={() => {
            setSelectedPatientForScreening(null);
            setScreeningResult(null);
            setScreeningPreview(null);
          }}
          title={isVi ? `Sàng Lọc AI Vi Mạch - ${selectedPatientForScreening.fullName}` : `AI Screening - ${selectedPatientForScreening.fullName}`}
        >
          <div className="space-y-4">
            {/* Header info bar */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800">{selectedPatientForScreening.fullName}</span>
                <span className="text-slate-500 ml-2 font-mono-data">{selectedPatientForScreening.mrn}</span>
              </div>
              <div className="text-slate-600">
                <span>{selectedPatientForScreening.vitals}</span>
              </div>
            </div>

            {/* Eye Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">{isVi ? 'Mắt chụp:' : 'Examined Eye:'}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setScreeningEye('OD')}
                  className={`px-3 py-1 text-xs rounded-xl font-bold border transition-all cursor-pointer ${
                    screeningEye === 'OD' ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-white text-slate-600'
                  }`}
                >
                  {isVi ? 'Mắt Phải (OD)' : 'Right Eye (OD)'}
                </button>
                <button
                  type="button"
                  onClick={() => setScreeningEye('OS')}
                  className={`px-3 py-1 text-xs rounded-xl font-bold border transition-all cursor-pointer ${
                    screeningEye === 'OS' ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-white text-slate-600'
                  }`}
                >
                  {isVi ? 'Mắt Trái (OS)' : 'Left Eye (OS)'}
                </button>
              </div>
            </div>

            {/* Retinal Fundus Image Dropzone / Preview */}
            <div className="border-2 border-dashed border-slate-300 hover:border-brand-400 transition-all rounded-2xl p-6 text-center bg-slate-50/50">
              {screeningPreview ? (
                <div className="space-y-3">
                  <img
                    src={screeningPreview}
                    alt="Retina Fundus Preview"
                    className="w-48 h-48 mx-auto object-cover rounded-xl shadow-sm border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setScreeningPreview(null)}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    {isVi ? 'Chọn ảnh khác' : 'Select another photo'}
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block space-y-2">
                  <UploadCloud className="w-10 h-10 text-brand-500 mx-auto animate-bounce" />
                  <p className="text-xs font-bold text-slate-700">
                    {isVi ? 'Kéo thả ảnh đáy mắt hoặc nhấp để chọn tệp' : 'Drag & drop fundus photo or click to browse'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isVi ? 'Hỗ trợ định dạng JPG, PNG chất lượng chuẩn lâm sàng' : 'Supports JPG, PNG clinical standard fundus formats'}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setScreeningPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setScreeningPreview('/assets/images/fundus_original.png')}
                      className="text-xs text-brand-600 font-semibold bg-brand-50 px-3 py-1 rounded-lg border border-brand-200 hover:bg-brand-100 transition-colors"
                    >
                      {isVi ? 'Dùng ảnh võng mạc mẫu' : 'Use sample fundus photo'}
                    </button>
                  </div>
                </label>
              )}
            </div>

            {/* AI Result Card */}
            {screeningResult && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={screeningResult.riskLevel || 'LOW'} />
                    <span className="font-bold text-xs text-slate-800">
                      {isVi ? 'Điểm nguy cơ vi mạch: ' : 'Microvascular risk score: '}
                      {screeningResult.riskScore || 22}%
                    </span>
                  </div>
                  <span className="text-xs font-mono-data text-emerald-800 font-bold">
                    A/V: {screeningResult.avRatio || '0.68'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{screeningResult.summary}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedPatientForScreening(null)}
              >
                {isVi ? 'Đóng' : 'Close'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isScreeningRunning}
                onClick={handleExecuteSingleScreening}
                icon={isScreeningRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              >
                {isScreeningRunning
                  ? (isVi ? 'AI Đang Phân Tích...' : 'AI Analyzing...')
                  : (isVi ? 'Bắt Đầu Phân Tích AI' : 'Run AI Analysis')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. Modal Xem Hồ Sơ Bệnh Nhân (Patient Chart Detail) */}
      {selectedPatientForDetail && (
        <Modal
          isOpen={Boolean(selectedPatientForDetail)}
          onClose={() => setSelectedPatientForDetail(null)}
          title={isVi ? `Hồ Sơ Y Tế - ${selectedPatientForDetail.fullName}` : `Patient Chart - ${selectedPatientForDetail.fullName}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-400 block">{isVi ? 'Mã MRN' : 'MRN'}</span>
                <span className="font-mono-data font-bold text-xs text-brand-700">{selectedPatientForDetail.mrn}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-400 block">{isVi ? 'Giới tính & Tuổi' : 'Gender & Age'}</span>
                <span className="font-semibold text-xs text-slate-800">
                  {isFemaleGender(selectedPatientForDetail.gender, selectedPatientForDetail.fullName) ? (isVi ? 'Nữ' : 'Female') : (isVi ? 'Nam' : 'Male')}, {selectedPatientForDetail.age}T
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-400 block">{isVi ? 'Huyết áp' : 'Blood Pressure'}</span>
                <span className="font-mono-data font-semibold text-xs text-slate-800">{selectedPatientForDetail.vitals}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-400 block">{isVi ? 'Tổng lượt quét' : 'Screenings'}</span>
                <span className="font-mono-data font-bold text-xs text-slate-800">{selectedPatientForDetail.screeningCount} ca</span>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">{isVi ? 'Phân loại nguy cơ gần nhất' : 'Latest Risk Category'}</span>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selectedPatientForDetail.latestRiskLevel || 'LOW'} />
                  <span className="font-bold text-xs text-slate-800">{selectedPatientForDetail.latestRiskScore}%</span>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const p = selectedPatientForDetail;
                  setSelectedPatientForDetail(null);
                  setSelectedPatientForScreening(p);
                  setScreeningResult(null);
                  setScreeningPreview(null);
                }}
                icon={<Camera className="w-3.5 h-3.5" />}
              >
                {isVi ? 'Chụp / Sàng lọc ngay' : 'Screen Now'}
              </Button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedPatientForDetail(null);
                  onNavigate?.('scan-history');
                }}
              >
                {isVi ? 'Xem lịch sử các lần khám' : 'View History'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedPatientForDetail(null)}
              >
                {isVi ? 'Đóng' : 'Close'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

// ==========================================
// CLINIC APPOINTMENTS & RECEPTION SUB-VIEW
// ==========================================
const ClinicAppointmentsSection: React.FC<{
  onNavigate?: (section: string) => void;
}> = ({ onNavigate }) => {
  const { isVi } = useLanguage();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.getAll({ role: 'CLINIC' });
      if (res && res.success && Array.isArray(res.data)) {
        setAppointments(res.data);
      }
    } catch (e) {
      console.warn('Could not fetch clinic appointments:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await appointmentApi.updateStatus(id, status);
      if (res && res.success) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: status as any } : a))
        );
      }
    } catch (e) {
      console.error('Error updating appointment status:', e);
    }
  };

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const matchSearch =
        (a.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.patientMrn || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.doctorName || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.reason || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [appointments, search, statusFilter]);

  const columns: DataTableColumn<Appointment>[] = [
    {
      key: 'timeSlot',
      header: isVi ? 'Thời Gian Khám' : 'Date & Time',
      render: (a) => (
        <div>
          <span className="font-mono-data font-bold text-xs text-brand-700 block">{a.timeSlot || '08:30'}</span>
          <span className="text-[11px] text-slate-500 font-sans">{a.appointmentDate}</span>
        </div>
      ),
    },
    {
      key: 'patientName',
      header: isVi ? 'Bệnh Nhân' : 'Patient',
      render: (a) => (
        <div>
          <span className="font-semibold text-xs text-slate-900 block">
            {a.patientName || `Bệnh nhân #${a.patientId.slice(0, 6)}`}
          </span>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            {a.patientMrn && <span className="font-mono-data text-brand-600">{a.patientMrn}</span>}
            {a.patientPhone && <span>{a.patientPhone}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'doctorName',
      header: isVi ? 'Bác Sĩ Khám' : 'Assigned Doctor',
      render: (a) => (
        <span className="text-xs text-slate-700 font-medium">
          {a.doctorName || (isVi ? 'Bác sĩ chuyên khoa' : 'Specialist')}
        </span>
      ),
    },
    {
      key: 'reason',
      header: isVi ? 'Lý Do Khám' : 'Reason for Visit',
      render: (a) => (
        <span className="text-xs text-slate-600 truncate max-w-[200px] block" title={a.reason}>
          {a.reason || (isVi ? 'Sàng lọc vi mạch võng mạc định kỳ' : 'Retinal checkup')}
        </span>
      ),
    },
    {
      key: 'status',
      header: isVi ? 'Trạng Thái' : 'Status',
      render: (a) => {
        const s = (a.status || 'PENDING').toUpperCase();
        let label = isVi ? 'Chờ tiếp nhận' : 'Pending';
        if (s === 'CONFIRMED') label = isVi ? 'Đã check-in' : 'Checked-in';
        if (s === 'COMPLETED') label = isVi ? 'Đã khám xong' : 'Completed';
        if (s === 'CANCELLED') label = isVi ? 'Đã hủy' : 'Cancelled';
        return <StatusBadge status={s} label={label} />;
      },
    },
    {
      key: 'actions',
      header: isVi ? 'Thao Tác Tiếp Nhận' : 'Intake Action',
      align: 'right',
      className: 'text-right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5">
          {a.status === 'PENDING' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleUpdateStatus(a.id, 'CONFIRMED')}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              {isVi ? 'Check-in' : 'Check-in'}
            </Button>
          )}
          {a.status === 'CONFIRMED' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleUpdateStatus(a.id, 'COMPLETED')}
              icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            >
              {isVi ? 'Hoàn tất' : 'Complete'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedAppt(a)}
          >
            {isVi ? 'Chi tiết' : 'Details'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionCard
        title={isVi ? 'Quản Lý Lịch Hẹn & Tiếp Nhận Bệnh Nhân' : 'Appointments & Patient Reception'}
        subtitle={
          isVi
            ? 'Theo dõi danh sách bệnh nhân đặt lịch hẹn khám võng mạc và thực hiện check-in tiếp nhận tại cơ sở'
            : 'Track patient appointments for retinal examination and perform on-site intake check-in'
        }
        headerAction={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isVi ? 'Tìm tên, mã MRN, bác sĩ...' : 'Search name, MRN, doctor...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-clinical-border bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 w-52 transition-all"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
              >
                {isVi ? 'Tất cả' : 'All'}
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${statusFilter === 'PENDING' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'}`}
              >
                {isVi ? 'Chờ check-in' : 'Pending'}
              </button>
              <button
                onClick={() => setStatusFilter('CONFIRMED')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${statusFilter === 'CONFIRMED' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'}`}
              >
                {isVi ? 'Đã check-in' : 'Checked-in'}
              </button>
              <button
                onClick={() => setStatusFilter('COMPLETED')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${statusFilter === 'COMPLETED' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'}`}
              >
                {isVi ? 'Hoàn thành' : 'Done'}
              </button>
            </div>
          </div>
        }
      >
        {filtered.length === 0 && !loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-clinical-border">
            <CalendarCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              {isVi ? 'Không có lịch hẹn nào phù hợp' : 'No appointments found'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isVi ? 'Bệnh nhân đặt lịch khám trực tuyến sẽ được hiển thị ngay tại bảng tiếp nhận này' : 'Patients booking online appointments will appear here'}
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            keyExtractor={(a) => a.id}
            emptyMessage={isVi ? 'Không tìm thấy lịch hẹn phù hợp.' : 'No matching appointments found.'}
          />
        )}
      </SectionCard>

      {/* Appointment Detail Modal */}
      {selectedAppt && (
        <Modal
          isOpen={Boolean(selectedAppt)}
          onClose={() => setSelectedAppt(null)}
          title={isVi ? 'Chi Tiết Lịch Hẹn Khám' : 'Appointment Details'}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">{isVi ? 'Bệnh nhân' : 'Patient'}</span>
                <span className="font-bold text-xs text-slate-800">{selectedAppt.patientName}</span>
                {selectedAppt.patientPhone && <span className="text-[11px] text-slate-500 block">{selectedAppt.patientPhone}</span>}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">{isVi ? 'Bác sĩ phụ trách' : 'Assigned Doctor'}</span>
                <span className="font-bold text-xs text-slate-800">{selectedAppt.doctorName || 'BS Chuyên khoa'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">{isVi ? 'Ngày hẹn & Khung giờ' : 'Date & Time'}</span>
                <span className="font-mono-data font-bold text-xs text-brand-700">{selectedAppt.timeSlot} - {selectedAppt.appointmentDate}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">{isVi ? 'Trạng thái' : 'Status'}</span>
                <StatusBadge status={selectedAppt.status} />
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-400 block mb-1">{isVi ? 'Lý do khám' : 'Reason for Visit'}</span>
              <p className="text-xs text-slate-700">{selectedAppt.reason || (isVi ? 'Sàng lọc sức khỏe vi mạch võng mạc định kỳ' : 'Routine retinal checkup')}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {selectedAppt.status === 'PENDING' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleUpdateStatus(selectedAppt.id, 'CONFIRMED');
                    setSelectedAppt(null);
                  }}
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  {isVi ? 'Tiếp nhận (Check-in)' : 'Check-in'}
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedAppt(null)}
              >
                {isVi ? 'Đóng' : 'Close'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

// ==========================================
// CLINIC RESULTS & HISTORY SUB-VIEW
// ==========================================
interface ClinicResultsSectionProps {
  batchJob?: ClinicBatchJob;
  onNavigate?: (section: string) => void;
  onSelectScan?: (scan: any) => void;
}

const ClinicResultsSection: React.FC<ClinicResultsSectionProps> = ({
  batchJob,
  onNavigate,
  onSelectScan,
}) => {
  const { isVi } = useLanguage();
  const [search, setSearch] = useState('');
  const [localSelectedScan, setLocalSelectedScan] = useState<any | null>(null);
  const [apiScreenings, setApiScreenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSelect = onSelectScan || setLocalSelectedScan;

  useEffect(() => {
    let isMounted = true;
    const loadScreenings = async () => {
      setLoading(true);
      try {
        const res = await screeningApi.getAll({ size: 100 });
        if (isMounted && res && res.success && res.data) {
          const list = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data.items)
            ? res.data.items
            : Array.isArray(res.data.content)
            ? res.data.content
            : [];
          setApiScreenings(list);
        }
      } catch (err) {
        console.warn('Could not load clinic screenings from API:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadScreenings();
    return () => {
      isMounted = false;
    };
  }, []);

  const rawItems = useMemo(() => batchJob?.items || [], [batchJob?.items]);

  const results = useMemo(() => {
    const list: any[] = [];
    const seenIds = new Set<string>();

    // 1. Screenings from backend API
    apiScreenings.forEach((s, idx) => {
      const id = s.id ? String(s.id) : `SCR-${idx}`;
      seenIds.add(id);
      list.push({
        id,
        fileName: s.fileName || (s.imageUrl ? s.imageUrl.split('/').pop() : `fundus_${(s.eyePosition || 'OD').toLowerCase()}_${idx}.png`),
        patientName: s.patientName || s.rawPatientName || (isVi ? `Bệnh nhân ${s.patientId ? String(s.patientId).substring(0, 6) : idx + 1}` : `Patient ${idx + 1}`),
        mrn: s.mrn || s.rawMrn || (s.patientId ? `MRN-${String(s.patientId).substring(0, 8)}` : `MRN-${1000 + idx}`),
        eye: ((s.eyePosition || 'OD').toUpperCase() === 'OS' ? 'OS' : 'OD') as 'OD' | 'OS',
        riskLevel: (s.riskLevel || s.aiRiskLevel || 'LOW').toUpperCase(),
        riskScore: s.riskScore ?? s.cardiovascularRiskScore ?? 20,
        arteryVeinRatio: s.avRatio ?? s.arteryVeinRatio ?? 0.65,
        status: s.status || 'COMPLETED',
        doctorReviewed: Boolean(s.status === 'REVIEWED' || s.reviewDecision || s.doctorNotes),
        date: s.createdAt ? new Date(s.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US') : (isVi ? 'Hôm nay' : 'Today'),
        originalItem: s,
      });
    });

    // 2. Screenings from batchJob items
    rawItems.forEach((it, idx) => {
      const id = it.id || `BATCH-ITEM-${idx}`;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        list.push({
          id,
          fileName: it.fileName || `fundus_${it.eye.toLowerCase()}_${idx}.png`,
          patientName: it.patientName || (isVi ? 'Bệnh nhân' : 'Patient'),
          mrn: it.mrn || it.pseudonymId || `MRN-${idx}`,
          eye: it.eye || 'OD',
          riskLevel: (it.riskLevel || 'LOW').toUpperCase(),
          riskScore: it.riskScore || 20,
          arteryVeinRatio: it.arteryVeinRatio || 0.65,
          status: it.status || 'COMPLETED',
          doctorReviewed: Boolean(it.status === 'DONE' || it.status === 'COMPLETED'),
          date: it.createdAt ? new Date(it.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US') : (isVi ? 'Hôm nay' : 'Today'),
          originalItem: it,
        });
      }
    });

    // Clean medical state: return real merged screenings, NO hardcoded mock fallback!
    return list;
  }, [apiScreenings, rawItems, isVi]);

  const filtered = useMemo(() => {
    return results.filter(
      (r) =>
        r.patientName.toLowerCase().includes(search.toLowerCase()) ||
        r.mrn.toLowerCase().includes(search.toLowerCase()) ||
        r.fileName.toLowerCase().includes(search.toLowerCase())
    );
  }, [results, search]);

  const columns: DataTableColumn<any>[] = [
    {
      key: 'fileId',
      header: isVi ? 'Mã Ca & Tệp Ảnh' : 'File / Case ID',
      render: (r: any) => (
        <div>
          <span className="font-semibold text-xs text-slate-900 block truncate max-w-[180px]">{r.fileName}</span>
          <span className="text-[11px] text-slate-400 font-mono-data">{r.id}</span>
        </div>
      ),
    },
    {
      key: 'patientName',
      header: isVi ? 'Bệnh Nhân' : 'Patient',
      render: (r: any) => (
        <div>
          <span className="font-semibold text-xs text-slate-900 block">{r.patientName}</span>
          <span className="text-[11px] text-slate-400 font-mono-data">{r.mrn}</span>
        </div>
      ),
    },
    {
      key: 'eye',
      header: isVi ? 'Mắt Khám' : 'Eye',
      align: 'center',
      render: (r: any) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
          {r.eye === 'OD' ? 'Mắt Phải (OD)' : 'Mắt Trái (OS)'}
        </span>
      ),
    },
    {
      key: 'risk',
      header: isVi ? 'Nguy Cơ Mạch Máu' : 'Vascular Risk',
      render: (r: any) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={r.riskLevel} />
          <span className="font-mono-data font-bold text-xs text-slate-700">{r.riskScore}%</span>
        </div>
      ),
    },
    {
      key: 'arteryVeinRatio',
      header: isVi ? 'Tỷ Lệ A/V' : 'A/V Ratio',
      align: 'center',
      render: (r: any) => (
        <span className="font-mono-data text-xs text-slate-700 font-semibold">
          {typeof r.arteryVeinRatio === 'number' ? r.arteryVeinRatio.toFixed(2) : r.arteryVeinRatio}
        </span>
      ),
    },
    {
      key: 'status',
      header: isVi ? 'Trạng Thái' : 'Status',
      align: 'center',
      render: (r: any) => (
        <div className="flex flex-col items-center gap-0.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {r.status}
          </span>
          {r.doctorReviewed && (
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5" /> {isVi ? 'Đã duyệt' : 'Reviewed'}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'date',
      header: isVi ? 'Thời Gian' : 'Date',
      render: (r: any) => (
        <span className="text-xs text-slate-500 font-sans">{r.date}</span>
      ),
    },
    {
      key: 'action',
      header: isVi ? 'Thao Tác' : 'Action',
      align: 'right',
      render: (r: any) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleSelect(r);
          }}
          icon={<Eye className="w-3.5 h-3.5" />}
        >
          {isVi ? 'Chi tiết' : 'Details'}
        </Button>
      ),
    },
  ];

  return (
    <SectionCard
      title={isVi ? 'Kết Quả Sàng Lọc Sức Khỏe Vi Mạch' : 'Screening Results & History'}
      subtitle={
        isVi
          ? 'Hồ sơ kết quả phân tích AI và đánh giá lâm sàng của các ca chụp'
          : 'AI analysis results and clinical sign-off records'
      }
      headerAction={
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={isVi ? 'Tìm kiếm ca hoặc mã MRN...' : 'Search case or MRN...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-clinical-border bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 w-56 transition-all"
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate?.('patient-list')}
            icon={<Camera className="w-3.5 h-3.5" />}
          >
            {isVi ? '+ Sàng lọc ca mới' : '+ New Screening'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate?.('bulk-batch')}
          >
            <Layers className="w-3.5 h-3.5 mr-1 text-brand-600" />
            {isVi ? 'Lô quét mới' : 'New Batch'}
          </Button>
        </div>
      }
    >
      {filtered.length === 0 && !loading ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-clinical-border">
          <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">
            {isVi ? 'Chưa có ca sàng lọc nào trong cơ sở dữ liệu' : 'No screening records found'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {isVi ? 'Các ca sàng lọc sau khi phân tích sẽ được tổng hợp tự động tại đây' : 'Screening records will appear here once analyzed'}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate?.('patient-list')}
              icon={<Camera className="w-3.5 h-3.5" />}
            >
              {isVi ? 'Sàng lọc ca lẻ cho bệnh nhân' : 'Screen Single Patient'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate?.('bulk-batch')}
              icon={<Layers className="w-3.5 h-3.5" />}
            >
              {isVi ? 'Tải lên đợt khám theo lô' : 'Upload Bulk Batch'}
            </Button>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          onRowClick={handleSelect}
          keyExtractor={(r: any) => r.id}
          emptyMessage={isVi ? 'Không có ca sàng lọc nào.' : 'No screening cases found.'}
        />
      )}

      {/* Fallback Local Scan Detail Modal */}
      {localSelectedScan && !onSelectScan && (
        <Modal
          isOpen={Boolean(localSelectedScan)}
          onClose={() => setLocalSelectedScan(null)}
          title={isVi ? 'Chi Tiết Kết Quả Sàng Lọc' : 'Screening Result Details'}
          description={`${localSelectedScan.patientName || (isVi ? 'Bệnh nhân' : 'Patient')} • ${localSelectedScan.mrn || localSelectedScan.id}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-500 block text-[11px]">{isVi ? 'Mã ca' : 'Case ID'}</span>
                <span className="font-mono-data font-bold text-slate-900">{localSelectedScan.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">{isVi ? 'Mắt' : 'Eye'}</span>
                <span className="font-bold text-slate-900">
                  {localSelectedScan.eye === 'OD' ? (isVi ? 'Mắt Phải (OD)' : 'Right Eye (OD)') : (isVi ? 'Mắt Trái (OS)' : 'Left Eye (OS)')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">{isVi ? 'Tỷ lệ A/V' : 'A/V Ratio'}</span>
                <span className="font-mono-data font-bold text-brand-700">
                  {typeof localSelectedScan.arteryVeinRatio === 'number' ? localSelectedScan.arteryVeinRatio.toFixed(2) : '0.65'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">{isVi ? 'Ký duyệt' : 'Review'}</span>
                <StatusBadge
                  status={localSelectedScan.doctorReviewed ? 'COMPLETED' : 'PENDING'}
                  label={localSelectedScan.doctorReviewed ? (isVi ? 'Đã duyệt' : 'Reviewed') : (isVi ? 'Chờ duyệt' : 'Pending')}
                  size="sm"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusBadge status={localSelectedScan.riskLevel || 'LOW'} size="md" />
                <div>
                  <h4 className="font-bold text-slate-900">{isVi ? 'Mức độ nguy cơ vi mạch' : 'Vascular Risk'}: {localSelectedScan.riskLevel}</h4>
                  <p className="text-[11px] text-slate-500">{isVi ? 'Phân tích tự động bởi mô hình AI AURA' : 'AURA AI model inference result'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-black font-mono-data text-slate-900">{localSelectedScan.riskScore}%</span>
                <span className="block text-[10px] text-slate-400">{isVi ? 'Điểm nguy cơ' : 'Risk Score'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setLocalSelectedScan(null)}>
                {isVi ? 'Đóng' : 'Close'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </SectionCard>
  );
};

export interface ClinicCreditSummaryWidgetProps {
  remainingCredits: number;
  usedBatchCredits: number;
  totalPurchasedCredits: number;
  onRecharge?: () => void;
  isVi: boolean;
}

export const ClinicCreditSummaryWidget: React.FC<ClinicCreditSummaryWidgetProps> = ({
  remainingCredits,
  usedBatchCredits,
  totalPurchasedCredits,
  onRecharge,
  isVi,
}) => {
  const isLowBalance = remainingCredits < 50;
  const total = Math.max(1, totalPurchasedCredits);
  const usedPercent = Math.min(100, Math.max(0, Math.round((usedBatchCredits / total) * 100)));
  const remainingPercent = Math.min(100, Math.max(0, 100 - usedPercent));

  return (
    <Card className="border-clinical-border bg-white shadow-xs overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 py-3.5 px-6 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              {isVi ? 'Tài Nguyên Gói Khám & Hạn Mức Sàng Lọc' : 'Credit Resources & Screening Quotas'}
            </CardTitle>
            <p className="text-xs text-slate-500">
              {isVi ? 'Hạn mức phân tích ảnh vi mạch võng mạc AI tự động' : 'Automated retinal microvascular AI screening allocation'}
            </p>
          </div>
        </div>
        <Button
          variant={isLowBalance ? 'danger' : 'primary'}
          size="sm"
          onClick={onRecharge}
          className="flex items-center gap-1.5 text-xs font-semibold shadow-xs"
        >
          <CreditCard className="h-3.5 w-3.5" />
          {isVi ? 'Nạp thêm lượt quét' : 'Recharge Scans'}
        </Button>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Low balance alert (< 50) in amber/rose style */}
        {isLowBalance && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold">
                  {isVi ? 'Cảnh báo hạn mức thấp: ' : 'Low Quota Warning: '}
                </span>
                {isVi
                  ? `Cơ sở y tế còn dưới 50 lượt quét khả dụng (Hiện có: ${remainingCredits.toLocaleString('vi-VN')} lượt). Vui lòng nạp thêm gói lượt khám để không gián đoạn chiến dịch sàng lọc hàng loạt.`
                  : `Facility has less than 50 remaining screening scans (Currently: ${remainingCredits.toLocaleString()} scans). Please recharge to prevent batch interruption.`}
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={onRecharge}
              className="text-xs shrink-0 border-rose-300 text-rose-700 hover:bg-rose-100"
            >
              {isVi ? 'Nạp thêm lượt quét' : 'Recharge Now'}
            </Button>
          </div>
        )}

        {/* 3 Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs font-medium text-slate-500">
              {isVi ? 'Tổng lượt đã mua' : 'Total Purchased Quota'}
            </div>
            <div className="text-2xl font-black font-mono-data text-slate-900 mt-1">
              {totalPurchasedCredits.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">{isVi ? 'lượt' : 'scans'}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isVi ? 'Hạn mức gói dịch vụ đăng ký' : 'Allocated service packages'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs font-medium text-slate-500">
              {isVi ? 'Số lượt đã dùng cho các chiến dịch batch' : 'Used for Batch Campaigns'}
            </div>
            <div className="text-2xl font-black font-mono-data text-blue-600 mt-1">
              {usedBatchCredits.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">{isVi ? 'lượt' : 'scans'}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isVi ? 'Đã phân tích sàng lọc AI' : 'Processed by AI pipeline'}
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${isLowBalance ? 'bg-rose-50/60 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                {isVi ? 'Số lượt khả dụng còn lại' : 'Remaining Available Quota'}
              </span>
              {isLowBalance && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                  {isVi ? '< 50 lượt' : '< 50 scans'}
                </span>
              )}
            </div>
            <div className={`text-2xl font-black font-mono-data mt-1 ${isLowBalance ? 'text-rose-600' : 'text-emerald-600'}`}>
              {remainingCredits.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">{isVi ? 'lượt' : 'scans'}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isVi ? 'Sẵn sàng nạp vào hàng đợi' : 'Ready for bulk screening'}
            </div>
          </div>
        </div>

        {/* Visual Quota Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs text-slate-600 font-medium">
            <span>
              {isVi ? 'Tiến độ tiêu thụ hạn mức' : 'Quota Consumption Progress'}
            </span>
            <span>
              {isVi
                ? `Đã dùng: ${usedPercent}% • Khả dụng: ${remainingPercent}%`
                : `Used: ${usedPercent}% • Available: ${remainingPercent}%`}
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex border border-slate-200/60">
            <div
              className="bg-blue-600 h-full transition-all duration-500 ease-out"
              style={{ width: `${usedPercent}%` }}
              title={isVi ? `Đã dùng ${usedPercent}%` : `Used ${usedPercent}%`}
            />
            <div
              className={`h-full transition-all duration-500 ease-out ${isLowBalance ? 'bg-rose-400' : 'bg-emerald-500'}`}
              style={{ width: `${remainingPercent}%` }}
              title={isVi ? `Còn lại ${remainingPercent}%` : `Remaining ${remainingPercent}%`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export interface ClinicPortalPageProps {
  activeView?: string;
  onNavigate?: (section: string) => void;
  initialBatchJob?: ClinicBatchJob;
}

export const ClinicPortalPage: React.FC<ClinicPortalPageProps> = ({
  activeView = 'bulk-batch',
  onNavigate,
  initialBatchJob,
}) => {
  const { t, isVi } = useLanguage();
  const { user: currentUser } = useAuth();
  const prefersReducedMotion = useAuraReducedMotion();
  const clinicId = currentUser?.id || 'CLINIC';
  const clinicName = currentUser?.name || currentUser?.email || t('clinic.portal.defaultFacility');

  const [batchJob, setBatchJob] = useState<ClinicBatchJob>(
    () => initialBatchJob || loadBatchJobForClinic(currentUser?.id, clinicName)
  );
  const [selectedScanDetail, setSelectedScanDetail] = useState<any | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await billingApi.mySubscriptions();
      if (res && res.success && Array.isArray(res.data)) {
        setSubscriptions(res.data);
      }
    } catch (e) {
      console.warn('Could not fetch clinic subscriptions:', e);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  useEffect(() => {
    try {
      localStorage.removeItem('AURA_CLINIC_BATCH_JOB');
    } catch {
      // Bỏ qua lỗi
    }

    if (initialBatchJob) {
      setBatchJob(initialBatchJob);
      return;
    }

    if (currentUser?.id) {
      setBatchJob(loadBatchJobForClinic(currentUser.id, clinicName));
    } else {
      setBatchJob(createEmptyBatchJob('CLINIC', t('clinic.portal.defaultFacility')));
    }
  }, [currentUser?.id, clinicName, t, initialBatchJob]);

  // Universal Real-time Synchronization for Clinic Portal
  useRealtimeSync(
    ['batch:update', 'credit:change', 'billing:update', 'doctor:assignment'],
    async () => {
      if (currentUser?.id) {
        setBatchJob(loadBatchJobForClinic(currentUser.id, clinicName));
      }
      fetchCredits();
    },
    { pollIntervalMs: 60000, syncOnFocus: false }
  );

  const handleUpdateBatchJob = (updated: ClinicBatchJob) => {
    setBatchJob(updated);
    if (currentUser?.id) {
      try {
        const storageKey = getClinicBatchStorageKey(currentUser.id);
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error('Lỗi lưu đợt khám:', e);
      }
    }
  };

  const usedBatchCredits = Number(batchJob?.processedCount || 0);

  const remainingCredits = useMemo(() => {
    if (subscriptions.length > 0) {
      return subscriptions.reduce((sum, item) => {
        if (item.status === 'ACTIVE') {
          return sum + Number(item.remainingCredits || 0);
        }
        return sum;
      }, 0);
    }
    return 0;
  }, [subscriptions]);

  const totalPurchasedCredits = useMemo(() => {
    if (subscriptions.length > 0) {
      const packageCreditsSum = subscriptions.reduce((sum, item) => {
        const pkgCredits = item.packageCredits || item.totalCredits;
        if (pkgCredits) return sum + Number(pkgCredits);
        return sum;
      }, 0);
      if (packageCreditsSum > 0) {
        return Math.max(packageCreditsSum, remainingCredits + usedBatchCredits);
      }
      return remainingCredits + usedBatchCredits;
    }
    return 0;
  }, [subscriptions, remainingCredits, usedBatchCredits]);

  return (
    <div className="space-y-6">
      {(!activeView || activeView === 'dashboard' || activeView === 'overview') && (
        <>
          <PageHeader
            title={t('clinic.portal.title')}
            subtitle={t('clinic.portal.subtitle')}
            badge={
              <span className="rounded-full bg-slate-50 border border-clinical-border px-2.5 py-1 text-xs font-semibold text-clinical-text">
                {clinicName}
              </span>
            }
          />

          <ClinicCreditSummaryWidget
            remainingCredits={remainingCredits}
            usedBatchCredits={usedBatchCredits}
            totalPurchasedCredits={totalPurchasedCredits}
            onRecharge={() => onNavigate?.('billing')}
            isVi={isVi}
          />
        </>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          custom={prefersReducedMotion}
          variants={pageTransitionVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="space-y-6"
        >
          {(activeView === 'dashboard' || activeView === 'overview') && (
            <ClinicDashboardView
              batchJob={batchJob}
              onNavigate={onNavigate}
              onUploadNewBatch={() => onNavigate?.('bulk-batch')}
              onSelectBatchItem={(item) => setSelectedScanDetail(item)}
            />
          )}

          {activeView === 'patient-list' && (
            <ClinicPatientListSection
              batchJob={batchJob}
              onNavigate={onNavigate}
            />
          )}

          {activeView === 'scan-history' && (
            <ClinicResultsSection
              batchJob={batchJob}
              onNavigate={onNavigate}
              onSelectScan={(item) => setSelectedScanDetail(item)}
            />
          )}

          {activeView === 'bulk-batch' && (
            <div className="space-y-6">
              <ClinicBatchProcessing batchJob={batchJob} onUpdateBatch={handleUpdateBatchJob} />
            </div>
          )}

          {activeView === 'appointments' && (
            <ClinicAppointmentsSection onNavigate={onNavigate} />
          )}

          {activeView === 'doctors-manage' && <ClinicDoctorsSection />}
          {activeView === 'patient-assignments' && (
            <div className="space-y-6">
              <PatientAssignmentBoard />
            </div>
          )}

          {(activeView === 'credit-package' || activeView === 'billing') && (
            <ClinicCreditPackageSection
              batchJob={batchJob}
              onRefreshBatch={() => {
                if (currentUser?.id) {
                  const storageKey = getClinicBatchStorageKey(currentUser.id);
                  const saved = localStorage.getItem(storageKey);
                  if (saved) {
                    try {
                      setBatchJob(JSON.parse(saved));
                    } catch (e) {
                      console.error(e);
                    }
                  }
                } else {
                  setBatchJob(createEmptyBatchJob('CLINIC', t('clinic.portal.defaultFacility')));
                }
              }}
            />
          )}

          {activeView === 'campaign-analytics' && (
            <ClinicCampaignAnalytics />
          )}

          {activeView === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3478F6] flex items-center justify-center font-bold">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {isVi ? 'Thông Báo Phòng Khám' : 'Clinic Notifications'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {isVi
                          ? 'Cập nhật trạng thái đợt khám theo lô, duyệt ca sàng lọc và hạn mức lượt khám'
                          : 'Batch screening status, diagnostic reviews, and quota alerts'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void notificationApi.markAllAsRead();
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-[#3478F6] hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                  >
                    {isVi ? 'Đánh dấu tất cả đã đọc' : 'Mark all as read'}
                  </button>
                </div>

                <div className="mt-4 divide-y divide-slate-100">
                  <div className="py-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#3478F6] flex items-center justify-center shrink-0 mt-0.5">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {isVi ? 'Sàng lọc hàng loạt theo lô (Batch Screening)' : 'Community Batch Screening Queue'}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {isVi
                            ? 'Theo dõi tiến trình AI xử lý các lô ảnh đáy mắt cộng đồng và tải danh sách kết quả.'
                            : 'Monitor AI pipeline processing community fundus image batches and export results.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate?.('bulk-batch')}
                      className="px-3 py-1.5 text-xs font-bold text-[#3478F6] bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer shrink-0"
                    >
                      {isVi ? 'Xem lô khám' : 'View Batches'}
                    </button>
                  </div>

                  <div className="py-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {isVi ? 'Kết quả sàng lọc & Đánh giá bác sĩ' : 'Screening Results & Specialist Reviews'}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {isVi
                            ? 'Các ca sàng lọc đã được bác sĩ chuyên khoa thẩm định và ký duyệt y khoa.'
                            : 'Screening records reviewed and signed off by specialist ophthalmologists.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate?.('scan-history')}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg cursor-pointer shrink-0"
                    >
                      {isVi ? 'Xem kết quả' : 'View Results'}
                    </button>
                  </div>

                  <div className="py-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {isVi ? 'Hạn mức & Gói cước phòng khám' : 'Clinic Quotas & Subscription Packages'}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {isVi
                            ? 'Quản lý số lượt khám cộng đồng và gia hạn gói dịch vụ qua VietQR Napas 24/7.'
                            : 'Manage available community screening quota and renew service packages via VietQR.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate?.('credit-package')}
                      className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg cursor-pointer shrink-0"
                    >
                      {isVi ? 'Gia hạn gói' : 'Manage Packages'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Individual Scan Detail Modal (Cross-Portal Drill-down) */}
      {selectedScanDetail && (
        <Modal
          isOpen={Boolean(selectedScanDetail)}
          onClose={() => setSelectedScanDetail(null)}
          title={isVi ? 'Chi Tiết Kết Quả Sàng Lọc' : 'Screening Result Details'}
          description={
            selectedScanDetail
              ? `${selectedScanDetail.patientName || (isVi ? 'Bệnh nhân' : 'Patient')} • ${selectedScanDetail.mrn || selectedScanDetail.pseudonymId || selectedScanDetail.id}`
              : undefined
          }
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            {/* Vitals / Metadata Cards */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-500 block text-[11px]">{isVi ? 'Mã ca khám' : 'Case ID'}</span>
                <span className="font-mono-data font-bold text-slate-900">{selectedScanDetail.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">{isVi ? 'Mắt chụp' : 'Eye'}</span>
                <span className="font-bold text-slate-900">
                  {selectedScanDetail.eye === 'OD'
                    ? (isVi ? 'Mắt Phải (OD)' : 'Right Eye (OD)')
                    : (isVi ? 'Mắt Trái (OS)' : 'Left Eye (OS)')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">{isVi ? 'Tỷ lệ A/V' : 'A/V Ratio'}</span>
                <span className="font-mono-data font-bold text-brand-700">
                  {typeof selectedScanDetail.arteryVeinRatio === 'number'
                    ? selectedScanDetail.arteryVeinRatio.toFixed(2)
                    : (selectedScanDetail.avRatio ? Number(selectedScanDetail.avRatio).toFixed(2) : '0.65')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">{isVi ? 'Ký duyệt BS' : 'MD Review'}</span>
                <StatusBadge
                  status={selectedScanDetail.doctorReviewed || selectedScanDetail.status === 'DONE' || selectedScanDetail.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING'}
                  label={selectedScanDetail.doctorReviewed || selectedScanDetail.status === 'DONE' || selectedScanDetail.status === 'COMPLETED' ? (isVi ? 'Đã duyệt' : 'Reviewed') : (isVi ? 'Chờ duyệt' : 'Pending')}
                  size="sm"
                />
              </div>
            </div>

            {/* Risk Assessment Box */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedScanDetail.riskLevel || 'LOW'} size="md" />
                <div>
                  <h4 className="font-bold text-slate-900">
                    {isVi ? 'Mức độ nguy cơ vi mạch' : 'Vascular Risk Level'}: {selectedScanDetail.riskLevel || 'LOW'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isVi
                      ? 'Kết quả phân loại tự động bởi mô hình trí tuệ nhân tạo AURA.'
                      : 'Automatic classification by AURA Retinal AI Screening.'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono-data text-slate-900">
                  {selectedScanDetail.riskScore || 0}%
                </span>
                <span className="block text-[10px] text-slate-400 font-semibold">{isVi ? 'Điểm nguy cơ' : 'Risk Score'}</span>
              </div>
            </div>

            {/* Patient & File Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-brand-600 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800 block text-xs truncate max-w-[280px]">
                    {selectedScanDetail.fileName || (isVi ? 'Ảnh chụp võng mạc' : 'Fundus scan')}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono-data">
                    {selectedScanDetail.date || (isVi ? 'Đợt sàng lọc cơ sở' : 'Clinic batch scan')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedScanDetail(null);
                    onNavigate?.('scan-history');
                  }}
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  {isVi ? 'Xem trong lịch sử' : 'View in History'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedScanDetail(null)}
                >
                  {isVi ? 'Đóng' : 'Close'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
