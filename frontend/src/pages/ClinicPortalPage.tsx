import React, { useEffect, useState } from 'react';
import { ClinicBatchProcessing } from '../components/ClinicBatchProcessing';
import { ClinicCampaignAnalytics } from '../components/ClinicCampaignAnalytics';
import { ClinicBatchJob } from '../types/cds';
import { bulkScreeningApi, clinicApi } from '../services/api';
import { ShieldCheck, Activity, RotateCcw, Search, Loader2, Layers, Building2, UserPlus, Trash2, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingState } from '../components/ui/StateFeedback';

const STORAGE_KEY = 'AURA_CLINIC_BATCH_JOB';

const getInitialBatchJob = (): ClinicBatchJob => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Lỗi nạp dữ liệu đợt khám đã lưu:', e);
  }

  return {
    batchId: 'CHƯA_TẢI_ĐỢT_NÀO',
    clinicId: 'CLN-CHO-RAY-01',
    clinicName: 'Bệnh viện Chợ Rẫy — Trung tâm Sàng lọc Đáy mắt',
    totalImages: 0,
    processedCount: 0,
    failedCount: 0,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
    estimatedTimeRemainingSec: 0,
    items: [],
  };
};

const ClinicProfileSection: React.FC = () => {
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
      setMessage('Đã nộp hồ sơ, đang chờ Quản trị viên xác minh.');
      loadProfile();
    } else {
      setMessage(res.message || 'Nộp hồ sơ thất bại. Vui lòng thử lại.');
    }
  };

  const statusBadge = (status?: string) => {
    if (status === 'APPROVED') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">Đã xác minh</span>;
    if (status === 'REJECTED') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200">Bị từ chối</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">Đang chờ duyệt</span>;
  };

  if (loading) return <LoadingState message="Đang tải hồ sơ cơ sở..." />;

  return (
    <Card padding="md" className="space-y-4">
      <div className="flex items-center justify-between border-b border-clinical-border pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-brand-600" />
          <h2 className="text-base font-bold text-clinical-text">
            Hồ Sơ Đăng Ký & Xác Thực Cơ Sở Y Tế (FR-22)
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
          <label className="block font-semibold text-clinical-text mb-1">Tên tổ chức y tế / Phòng khám</label>
          <input
            type="text"
            required
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Ví dụ: Phòng khám Đa khoa AURA"
            className="w-full h-9 px-3 border border-clinical-border rounded-lg bg-white text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block font-semibold text-clinical-text mb-1">Số giấy phép hoạt động khám chữa bệnh</label>
          <input
            type="text"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder="Ví dụ: 01234/SYT-GPHĐ"
            className="w-full h-9 px-3 border border-clinical-border rounded-lg bg-white text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-semibold text-clinical-text mb-1">Tài liệu đính kèm (Giấy phép, chứng chỉ hành nghề)</label>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
          />
          {licenseFileName && <span className="text-[11px] text-emerald-700 mt-1 block">Đã chọn: {licenseFileName}</span>}
        </div>

        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" variant="primary" size="md" loading={submitting}>
            Lưu & Gửi Hồ Sơ Xác Minh
          </Button>
        </div>
      </form>
    </Card>
  );
};

const ClinicDoctorsSection: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [assignDoctorId, setAssignDoctorId] = useState('');
  const [patientIdToAssign, setPatientIdToAssign] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadMembers = async () => {
    setLoading(true);
    const res = await clinicApi.listMembers();
    if (res.success && Array.isArray(res.data)) {
      setMembers(res.data);
      if (res.data.length > 0 && !assignDoctorId) {
        setAssignDoctorId(res.data[0].id || res.data[0].userId);
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
      setMessage(`Đã thêm bác sĩ ${doctorEmail} vào danh sách phòng khám.`);
      setDoctorEmail('');
      loadMembers();
    } else {
      setMessage(res.message || 'Thêm bác sĩ thất bại. Vui lòng kiểm tra email.');
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
      setMessage(`Đã phân công bệnh nhân ${patientIdToAssign} cho bác sĩ thành công.`);
      setPatientIdToAssign('');
    } else {
      setMessage(res.message || 'Phân công bệnh nhân thất bại.');
    }
  };

  const handleRemove = async (doctorId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bác sĩ này khỏi phòng khám?')) return;
    const res = await clinicApi.removeMember(doctorId);
    if (res.success) {
      loadMembers();
    }
  };

  return (
    <div className="space-y-6">
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            Quản Lý Đội Ngũ Bác Sĩ Của Phòng Khám (FR-23)
          </h2>
        </div>

        <form onSubmit={handleAddDoctor} className="flex gap-2 text-xs">
          <input
            type="email"
            required
            value={doctorEmail}
            onChange={(e) => setDoctorEmail(e.target.value)}
            placeholder="Nhập email bác sĩ cần thêm..."
            className="flex-1 h-9 px-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
          />
          <Button type="submit" variant="primary" size="sm" loading={inviting} icon={<UserPlus className="w-4 h-4" />}>
            Thêm Bác Sĩ
          </Button>
        </form>

        {message && (
          <div className="p-3 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] text-xs text-[#0891B2] font-semibold">
            {message}
          </div>
        )}

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="p-3">Họ và Tên</th>
                <th className="p-3">Email</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">Chưa có bác sĩ nào trong cơ sở.</td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{m.fullName || m.name || 'Bác sĩ'}</td>
                    <td className="p-3 text-slate-600">{m.email}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Hoạt động
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleRemove(m.id || m.userId)}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Xóa khỏi phòng khám"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Doctor-Patient Assignment Box */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">
            Phân Công Bệnh Nhân Cho Bác Sĩ (FR-23)
          </h3>
        </div>
        <form onSubmit={handleAssignPatient} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Chọn Bác Sĩ</label>
            <select
              value={assignDoctorId}
              onChange={(e) => setAssignDoctorId(e.target.value)}
              className="w-full h-9 px-3 border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-[#0891B2]"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id || m.userId}>
                  {m.fullName || m.name || m.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Mã / ID Bệnh Nhân</label>
            <input
              type="text"
              required
              value={patientIdToAssign}
              onChange={(e) => setPatientIdToAssign(e.target.value)}
              placeholder="Nhập ID bệnh nhân..."
              className="w-full h-9 px-3 border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-[#0891B2]"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="primary" size="sm" loading={assigning} className="w-full">
              Phân Công Tiếp Nhận
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export const ClinicPortalPage: React.FC<{ activeView?: string }> = ({ activeView = 'bulk-batch' }) => {
  const [batchJob, setBatchJob] = useState<ClinicBatchJob>(getInitialBatchJob);

  const handleUpdateBatchJob = (updated: ClinicBatchJob) => {
    setBatchJob(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Lỗi lưu đợt khám:', e);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Không Gian Quản Lý Sàng Lọc Phòng Khám (Clinic Portal)"
        subtitle="Quản trị chiến dịch tầm soát vi mạch số lượng lớn, phân công bác sĩ và thống kê lâm sàng."
        badge={
          <span className="rounded-full bg-slate-50 border border-clinical-border px-2.5 py-1 text-xs font-semibold text-clinical-text">
            Bệnh viện Chợ Rẫy
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
        <Card padding="lg" className="space-y-4 text-center py-12">
          <CreditCard className="w-12 h-12 text-brand-600 mx-auto" />
          <h3 className="text-base font-bold text-clinical-text">Gói Dịch Vụ Cơ Sở & Hạn Mức Khám</h3>
          <p className="text-xs text-clinical-text-muted max-w-md mx-auto">
            Quản lý dung lượng lượt khám tầm soát hàng loạt và gia hạn hợp đồng chiến dịch phòng khám.
          </p>
        </Card>
      )}

      {activeView === 'campaign-analytics' && (
        <ClinicCampaignAnalytics />
      )}
    </div>
  );
};
