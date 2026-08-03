import React, { useState } from 'react';
import { Search, Download, ShieldAlert, Filter, CheckCircle2, AlertTriangle, Info, User } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [severityFilter, setSeverityFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const logs = [
    {
      id: 'LOG-1001',
      timestamp: '2026-08-03 14:32:01',
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
      timestamp: '2026-08-03 14:15:22',
      tz: 'ICT (+7)',
      severity: 'Info',
      title: 'Đăng Ký Đơn Vị Phòng Khám Mới Thành Công',
      desc: 'Trung tâm Mắt Kỹ thuật cao đã hoàn tất quy trình onboarding tự động và cấp 2,500 Credits.',
      user: 'Hệ thống Tự động',
      userType: 'system',
      ip: '10.0.4.22',
    },
    {
      id: 'LOG-1003',
      timestamp: '2026-08-03 13:45:09',
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
      timestamp: '2026-08-03 11:20:00',
      tz: 'ICT (+7)',
      severity: 'Info',
      title: 'Xuất Dữ Liệu Bệnh Nhân Hàng Loạt (Export CSV)',
      desc: 'Xuất 142 bản ghi ảnh võng mạc mã hóa bảo mật HIPAA sang Cổng Nghiên cứu ID-883.',
      user: 'BS. Lê Trang',
      userType: 'person',
      ip: '192.168.1.55',
    },
  ];

  const filteredLogs = logs.filter((log) => {
    const matchesSeverity = severityFilter === 'All' || log.severity === severityFilter;
    const matchesSearch =
      log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip.includes(searchTerm);
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-medical-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#134E4A] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#0891B2]" />
            Nhật Ký Kiểm Toán Hệ Thống (System Audit Logs)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ghi nhận thời gian thực toàn bộ sự kiện an ninh, thay đổi cấu hình AI, và lịch sử truy cập tài nguyên Y tế.
          </p>
        </div>
        <button className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-xs">
          <Download className="w-4 h-4 text-[#0891B2]" />
          Xuất Nhật Ký CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-4 shadow-medical-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm nhật ký theo Sự kiện, Người dùng, Nội dung hoặc Địa chỉ IP..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#0891B2]"
          />
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none w-full md:w-auto"
        >
          <option value="All">Tất cả Mức độ</option>
          <option value="Critical">Nghiêm trọng (Critical)</option>
          <option value="Warning">Cảnh báo (Warning)</option>
          <option value="Info">Thông tin (Info)</option>
        </select>
      </div>

      {/* Log Table */}
      <div className="bg-white border border-[#CCFBF1] rounded-2xl overflow-hidden shadow-medical-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono-data">
                <th className="py-3 px-4">Thời Gian</th>
                <th className="py-3 px-4">Mức Độ</th>
                <th className="py-3 px-4">Mô Tả Sự Kiện An Ninh</th>
                <th className="py-3 px-4">Tài Khoản Thực Hiện</th>
                <th className="py-3 px-4">Địa Chỉ IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F0FDFA]/60 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono-data">
                    <div className="font-bold text-[#134E4A]">{log.timestamp}</div>
                    <div className="text-[10px] text-slate-400">{log.tz}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {log.severity === 'Critical' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold border border-red-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" /> Nghiêm trọng
                      </span>
                    )}
                    {log.severity === 'Warning' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Cảnh báo
                      </span>
                    )}
                    {log.severity === 'Info' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-50 text-[#0891B2] text-[11px] font-semibold border border-cyan-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0891B2]" /> Thông tin
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#134E4A]">{log.title}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{log.desc}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.user}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono-data text-slate-500">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
