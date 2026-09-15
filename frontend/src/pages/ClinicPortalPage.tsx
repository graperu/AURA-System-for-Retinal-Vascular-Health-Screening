import React, { useEffect, useState, useMemo } from 'react';
import { ClinicBatchProcessing } from '../components/ClinicBatchProcessing';
import { ClinicCampaignAnalytics } from '../components/ClinicCampaignAnalytics';
import { ClinicCreditPackageSection } from '../components/ClinicCreditPackageSection';
import { ClinicBatchJob } from '../types/cds';
import { bulkScreeningApi, clinicApi } from '../services/api';
import { ShieldCheck, Activity, RotateCcw, Search, Loader2, Layers, Building2, UserPlus, Trash2, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingState } from '../components/ui/StateFeedback';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { useAuth } from '../context/AuthContext';
import { ClinicalSelect, ClinicalSelectOption } from '../components/ui/ClinicalSelect';
import { useLanguage } from '../context/LanguageContext';

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
            className="flex-1 h-9 px-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
          />
          <Button type="submit" variant="primary" size="sm" loading={inviting} icon={<UserPlus className="w-4 h-4" />}>
            {t('clinic.portal.doctors.addDoctorButton')}
          </Button>
        </form>

        {message && (
          <div className="p-3 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] text-xs text-[#0891B2] font-semibold">
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

      {/* Doctor-Patient Assignment Box */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">
            {t('clinic.portal.doctors.assignTitle')}
          </h3>
        </div>
        <form onSubmit={handleAssignPatient} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <ClinicalSelect<string>
              label={t('clinic.portal.doctors.selectDoctor')}
              value={assignDoctorId}
              onChange={setAssignDoctorId}
              options={members.map((m) => {
                const docId = m.doctorId || m.userId;
                return {
                  value: docId,
                  label: m.doctorName || m.fullName || m.name || m.doctorEmail || m.email,
                  sublabel: m.doctorEmail || m.email,
                };
              })}
              size="sm"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">{t('clinic.portal.doctors.patientIdLabel')}</label>
            <input
              type="text"
              required
              value={patientIdToAssign}
              onChange={(e) => setPatientIdToAssign(e.target.value)}
              placeholder={t('clinic.portal.doctors.patientIdPlaceholder')}
              className="w-full h-9 px-3 border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-[#0891B2]"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="primary" size="sm" loading={assigning} className="w-full">
              {t('clinic.portal.doctors.assignButton')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export const ClinicPortalPage: React.FC<{ activeView?: string }> = ({ activeView = 'bulk-batch' }) => {
  const { t, isVi } = useLanguage();
  const { user: currentUser } = useAuth();
  const clinicId = currentUser?.id || 'CLINIC';
  const clinicName = currentUser?.name || currentUser?.email || t('clinic.portal.defaultFacility');

  const [batchJob, setBatchJob] = useState<ClinicBatchJob>(() => loadBatchJobForClinic(currentUser?.id, clinicName));

  useEffect(() => {
    try {
      localStorage.removeItem('AURA_CLINIC_BATCH_JOB');
    } catch {
      // Bỏ qua lỗi
    }

    if (currentUser?.id) {
      setBatchJob(loadBatchJobForClinic(currentUser.id, clinicName));
    } else {
      setBatchJob(createEmptyBatchJob('CLINIC', t('clinic.portal.defaultFacility')));
    }
  }, [currentUser?.id, clinicName, t]);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('clinic.portal.title')}
        subtitle={t('clinic.portal.subtitle')}
        badge={
          <span className="rounded-full bg-slate-50 border border-clinical-border px-2.5 py-1 text-xs font-semibold text-clinical-text">
            {clinicName}
          </span>
        }
      />

      {activeView === 'bulk-batch' && (
        <div className="space-y-6">
          <ClinicProfileSection />
          <ClinicBatchProcessing batchJob={batchJob} onUpdateBatch={handleUpdateBatchJob} />
        </div>
      )}

      {activeView === 'doctors-manage' && <ClinicDoctorsSection />}

      {activeView === 'credit-package' && (
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
    </div>
  );
};
