import React, { useState, useEffect } from 'react';
import { Search, Download, ShieldAlert, Filter, CheckCircle2, AlertTriangle, Info, User, Users, Sliders, CreditCard, ShieldCheck, Building2, Stethoscope, Lock, Unlock, Eye, Sparkles } from 'lucide-react';
import { auditApi, adminUserApi } from '../services/api';

export const AdminAuditLogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'users' | 'ai-config'>('audit');

  // Audit Logs State
  const [severityFilter, setSeverityFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [logsList, setLogsList] = useState<any[]>([
    {
      id: 'LOG-1001',
      timestamp: '2026-08-30 14:32:01',
      tz: 'ICT (+7)',
      severity: 'Critical',
      title: 'Thay Đổi Ngưỡng Chẩn Đoán AI Microservice',
      desc: 'Độ nhạy phát hiện Bệnh Glaucoma thay đổi từ 0.85 xuống 0.70. Yêu cầu xác thực 2FA từ Trưởng khoa.',
      user: 'BS. Phan Định',
      userType: 'person',
      ip: '192.168.1.105',
    },
    {
      id: 'LOG-1002',
      timestamp: '2026-08-30 14:15:22',
      tz: 'ICT (+7)',
      severity: 'Info',
      title: 'Đăng Ký Đơn Vị Phòng Khám Mới Thành Công',
      desc: 'Trung tâm Mắt Kỹ thuật cao đã hoàn tất quy trình onboarding và cấp 2,500 Credits.',
      user: 'Hệ thống Tự động',
      userType: 'system',
      ip: '10.0.4.22',
    },
    {
      id: 'LOG-1003',
      timestamp: '2026-08-30 13:45:09',
      tz: 'ICT (+7)',
      severity: 'Warning',
      title: 'Đăng Nhập Thất Bại Nhiều Lần',
      desc: '5 lần nhập sai mật khẩu tài khoản j.doe@auraclinical.com trong 2 phút. Khóa tài khoản 15 phút.',
      user: 'Chưa Xác Thực',
      userType: 'unknown',
      ip: '203.0.113.45',
    },
    {
      id: 'LOG-1004',
      timestamp: '2026-08-30 11:20:00',
      tz: 'ICT (+7)',
      severity: 'Info',
      title: 'Xuất Dữ Liệu Bệnh Nhân Hàng Loạt (Export CSV)',
      desc: 'Xuất 142 bản ghi ảnh võng mạc mã hóa bảo mật HIPAA sang Cổng Nghiên cứu ID-883.',
      user: 'BS. Lê Trang',
      userType: 'person',
      ip: '192.168.1.55',
    },
  ]);

  // User Management State
  const [usersList, setUsersList] = useState([
    { id: '11111111-1111-1111-1111-111111111111', name: 'Nguyễn Trọng Nam', email: 'patient@aura.com', role: 'ROLE_USER', status: 'ACTIVE', department: 'Bệnh nhân cá nhân', exams: 12 },
    { id: '22222222-2222-2222-2222-222222222222', name: 'BS. CKII Nguyễn Thị Thanh', email: 'doctor@aura.com', role: 'ROLE_DOCTOR', status: 'ACTIVE', department: 'Khoa Mắt Kỹ Thuật Cao', exams: 142 },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Phòng Khám Đa Khoa AURA Clinic', email: 'clinic@aura.com', role: 'ROLE_CLINIC', status: 'ACTIVE', department: 'Cơ sở Y tế Tuyến Quận', exams: 250 },
    { id: '44444444-4444-4444-4444-444444444444', name: 'Quản Trị Viên Hệ Thống', email: 'admin@aura.com', role: 'ROLE_ADMIN', status: 'ACTIVE', department: 'Ban Giám Đốc CNTT', exams: 0 },
  ]);

  // AI Configuration State
  const [glaucomaSensitivity, setGlaucomaSensitivity] = useState(0.70);
  const [drConfidence, setDrConfidence] = useState(0.75);
  const [retrainThreshold, setRetrainThreshold] = useState(50);
  const [isSavedAI, setIsSavedAI] = useState(false);

  // Fetch real audit logs & users from PostgreSQL
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const auditRes = await auditApi.getLogs();
        if (auditRes.success && auditRes.data?.items && auditRes.data.items.length > 0) {
          const mapped = auditRes.data.items.map((a: any) => ({
            id: `LOG-${a.id?.slice(0, 6).toUpperCase() || '1000'}`,
            timestamp: a.createdAt ? new Date(a.createdAt).toLocaleString('vi-VN') : '2026-08-31 14:00',
            tz: 'ICT (+7)',
            severity: a.severity || 'Info',
            title: a.action || 'Sự kiện hệ thống',
            desc: a.details || 'Đã ghi nhận kiểm toán HIPAA bảo mật.',
            user: a.actorEmail || 'System',
            userType: a.actorRole === 'SYSTEM' ? 'system' : 'person',
            ip: a.ipAddress || '127.0.0.1',
          }));
          setLogsList(mapped);
        }
      } catch (e) {
        console.warn('Could not fetch audit logs:', e);
      }

      try {
        const userRes = await adminUserApi.getUsers();
        if (userRes.success && userRes.data?.items && userRes.data.items.length > 0) {
          const mappedUsers = userRes.data.items.map((u: any) => ({
            id: u.id,
            name: u.fullName || u.email,
            email: u.email,
            role: u.roles?.[0] || 'ROLE_USER',
            status: u.active ? 'ACTIVE' : 'SUSPENDED',
            department: u.roles?.[0] === 'ROLE_DOCTOR' ? 'Khoa Mắt Kỹ Thuật Cao' : u.roles?.[0] === 'ROLE_CLINIC' ? 'Phòng Khám Đa Khoa' : 'Cổng Bệnh Nhân',
            exams: u.totalScreenings || 0,
          }));
          setUsersList(mappedUsers);
        }
      } catch (e) {
        console.warn('Could not fetch users:', e);
      }
    };
    fetchAdminData();
  }, []);

  const handleExportLogs = async () => {
    try {
      const res = await auditApi.exportLogs();
      const exportData = (res.success && res.data) ? res.data : logsList;
      const csvContent = 'data:text/csv;charset=utf-8,' + 
        ['Mã Log,Thời Gian,Mức Độ,Sự Kiện,Người Thực Hiện,IP',
          ...exportData.map((l: any) => `"${l.id}","${l.timestamp}","${l.severity}","${l.title} - ${l.desc}","${l.user}","${l.ip}"`)
        ].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `AURA_HIPAA_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.warn('Export logs error:', e);
    }
  };

  const filteredLogs = logsList.filter((log) => {
    const matchesSeverity = severityFilter === 'All' || log.severity === severityFilter;
    const matchesSearch =
      log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const toggleUserStatus = async (id: string) => {
    const targetUser = usersList.find(u => u.id === id);
    const nextStatus = targetUser?.status === 'ACTIVE' ? false : true;
    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          return { ...u, status: nextStatus ? 'ACTIVE' : 'SUSPENDED' };
        }
        return u;
      })
    );
    try {
      await adminUserApi.updateStatus(id, nextStatus);
    } catch (err) {
      console.warn('Failed to update user status in DB:', err);
    }
  };

  const approveClinic = (id: string) => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: 'ACTIVE' } : u))
    );
  };

  const handleSaveAIConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavedAI(true);
    setTimeout(() => setIsSavedAI(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Navigation */}
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-medical-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-cyan-700" />
              <h1 className="text-xl font-extrabold text-[#134E4A]">Cổng Quản Trị Hệ Thống AURA (Global Admin Portal)</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Giám sát toàn diện tính tuân thủ HIPAA/GDPR, phân quyền người dùng và kiểm soát mô hình AI Core.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'audit'
                  ? 'bg-white text-cyan-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Nhật Ký Kiểm Toán (Audit)
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-white text-cyan-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Quản Lý Tài Khoản ({usersList.length})
            </button>
            <button
              onClick={() => setActiveTab('ai-config')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'ai-config'
                  ? 'bg-white text-cyan-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Cấu Hình AI & Bảng Giá
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm nhật ký theo ID, tiêu đề, người dùng hoặc IP..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-cyan-600"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="All">Tất Cả Mức Độ (Severity)</option>
                <option value="Critical">Critical (Nghiêm trọng)</option>
                <option value="Warning">Warning (Cảnh báo)</option>
                <option value="Info">Info (Thông tin)</option>
              </select>

              <button 
                onClick={handleExportLogs}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" /> Xuất Log (CSV)
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider font-mono-data text-[11px]">
                <tr>
                  <th className="py-3 px-4">Mã Log</th>
                  <th className="py-3 px-4">Thời Gian & IP</th>
                  <th className="py-3 px-4">Mức Độ</th>
                  <th className="py-3 px-4">Sự Kiện Hệ Thống</th>
                  <th className="py-3 px-4">Người Thực Hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono-data text-cyan-800 font-bold">{log.id}</td>
                    <td className="py-3.5 px-4 font-mono-data text-slate-500">
                      <div>{log.timestamp}</div>
                      <div className="text-[10px] text-slate-400">IP: {log.ip}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          log.severity === 'Critical'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : log.severity === 'Warning'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {log.severity === 'Critical' ? (
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                        ) : log.severity === 'Warning' ? (
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                        ) : (
                          <Info className="w-3 h-3 text-blue-600" />
                        )}
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{log.title}</div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{log.desc}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{log.user}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{log.userType}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: USER & CLINIC MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Danh Sách Người Dùng, Bác Sĩ & Cơ Sở Phòng Khám</h3>
                <p className="text-xs text-slate-500">Quản lý kích hoạt tài khoản, kiểm soát vai trò RBAC và duyệt phòng khám mới.</p>
              </div>
              <button className="px-3.5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all">
                + Tạo Tài Khoản Mới
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider font-mono-data text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Mã</th>
                    <th className="py-3 px-4">Họ Tên / Cơ Sở</th>
                    <th className="py-3 px-4">Vai Trò (Role)</th>
                    <th className="py-3 px-4">Đơn Vị / Chuyên Khoa</th>
                    <th className="py-3 px-4">Số Ca Khám</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {usersList.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono-data text-cyan-800 font-bold">{usr.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{usr.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono-data">{usr.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            usr.role === 'DOCTOR'
                              ? 'bg-cyan-100 text-cyan-800'
                              : usr.role === 'CLINIC'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {usr.role === 'DOCTOR' ? (
                            <Stethoscope className="w-3 h-3" />
                          ) : usr.role === 'CLINIC' ? (
                            <Building2 className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{usr.department}</td>
                      <td className="py-3.5 px-4 font-mono-data font-bold text-slate-700">{usr.exams} ca</td>
                      <td className="py-3.5 px-4">
                        {usr.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Đang hoạt động
                          </span>
                        )}
                        {usr.status === 'PENDING_APPROVAL' && (
                          <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> Chờ phê duyệt
                          </span>
                        )}
                        {usr.status === 'SUSPENDED' && (
                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-rose-200">
                            <Lock className="w-3 h-3" /> Đang tạm khóa
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {usr.status === 'PENDING_APPROVAL' ? (
                          <button
                            onClick={() => approveClinic(usr.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-xs"
                          >
                            Phê Duyệt
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleUserStatus(usr.id)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-colors ${
                              usr.status === 'ACTIVE'
                                ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {usr.status === 'ACTIVE' ? 'Khóa' : 'Kích Hoạt'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI CONFIGURATION & PRICING */}
      {activeTab === 'ai-config' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: AI Sensitivity & Retraining Config */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-700" />
                Cấu Hình Tham Số & Ngưỡng Quyết Định AI (AI Parameters)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Điều chỉnh độ nhạy mô hình Deep Learning và kích hoạt quy trình huấn luyện lại tự động (Retraining).
              </p>
            </div>

            <form onSubmit={handleSaveAIConfig} className="space-y-4 text-xs">
              <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center font-bold text-slate-800">
                  <span>Ngưỡng nhạy phát hiện Glaucoma (VCDR Cut-off):</span>
                  <span className="font-mono-data text-cyan-800 text-sm">{glaucomaSensitivity}</span>
                </div>
                <input
                  type="range"
                  min="0.50"
                  max="0.90"
                  step="0.05"
                  value={glaucomaSensitivity}
                  onChange={(e) => setGlaucomaSensitivity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-700"
                />
                <span className="text-[10px] text-slate-500 block">Khuyến nghị chuyên gia: 0.70 (Độ nhạy 94.2%, Độ đặc hiệu 91.5%)</span>
              </div>

              <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center font-bold text-slate-800">
                  <span>Ngưỡng tự tin Bệnh Võng Mạc Tiểu Đường (DR Confidence):</span>
                  <span className="font-mono-data text-cyan-800 text-sm">{drConfidence}</span>
                </div>
                <input
                  type="range"
                  min="0.60"
                  max="0.95"
                  step="0.05"
                  value={drConfidence}
                  onChange={(e) => setDrConfidence(parseFloat(e.target.value))}
                  className="w-full accent-cyan-700"
                />
                <span className="text-[10px] text-slate-500 block">Ngưỡng lọc microaneurysms và xuất huyết vi thể.</span>
              </div>

              <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center font-bold text-slate-800">
                  <span>Số ca phản hồi bác sĩ để kích hoạt Retraining:</span>
                  <span className="font-mono-data text-cyan-800 text-sm">{retrainThreshold} ca</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={retrainThreshold}
                  onChange={(e) => setRetrainThreshold(parseInt(e.target.value))}
                  className="w-full accent-cyan-700"
                />
                <span className="text-[10px] text-slate-500 block">Tự động fine-tune mô hình khi nhận đủ nhãn hiệu chỉnh lâm sàng.</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                {isSavedAI ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Đã cập nhật tham số AI vào hệ thống!
                  </span>
                ) : <span />}
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                >
                  Lưu Cấu Hình AI
                </button>
              </div>
            </form>
          </div>

          {/* Right: Service Packages Overview */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-700" />
                Bảng Giá & Gói Dịch Vụ Phân Tích
              </h3>
              <p className="text-xs text-slate-500 mt-1">Quản lý định giá gói cước cá nhân và gói phòng khám.</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">Gói Đơn Lẻ (Single)</div>
                  <span className="text-slate-500 text-[11px]">1 lượt khám cá nhân</span>
                </div>
                <span className="font-mono-data font-bold text-cyan-800">150.000 đ</span>
              </div>

              <div className="p-3 rounded-xl border border-cyan-200 bg-cyan-50/50 flex justify-between items-center">
                <div>
                  <div className="font-bold text-cyan-950">Gói Pro 5 Lượt</div>
                  <span className="text-slate-500 text-[11px]">Theo dõi định kỳ cá nhân</span>
                </div>
                <span className="font-mono-data font-bold text-cyan-800">590.000 đ</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">Gói Phòng Khám 500</div>
                  <span className="text-slate-500 text-[11px]">Chiến dịch sàng lọc lô</span>
                </div>
                <span className="font-mono-data font-bold text-cyan-800">12.500.000 đ</span>
              </div>

              <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/50 flex justify-between items-center">
                <div>
                  <div className="font-bold text-purple-950">Gói Enterprise 2,500</div>
                  <span className="text-slate-500 text-[11px]">Bệnh viện & Trung tâm lớn</span>
                </div>
                <span className="font-mono-data font-bold text-purple-800">48.000.000 đ</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
