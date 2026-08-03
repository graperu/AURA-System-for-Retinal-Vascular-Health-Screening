import React, { useState } from 'react';
import { SideNavBar } from '../components/SideNavBar';
import { Footer } from '../components/Footer';

type AuditLog = {
  id: string;
  timestamp: string;
  tz: string;
  severity: string;
  title: string;
  desc: string;
  user: string;
  userType: string;
  ip: string;
};

export const AdminAuditLogsPage: React.FC = () => {
  const [severityFilter, setSeverityFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const logs = [
    {
      id: '1',
      timestamp: '2026-05-20 14:32:01',
      tz: 'ICT (+7)',
      severity: 'Critical',
      title: 'Thay Đổi Ngưỡng Chẩn Đoán AI',
      desc: 'Độ nhạy phát hiện Bệnh Glaucoma thay đổi từ 0.85 xuống 0.70. Yêu cầu xác thực hai yếu tố từ Trưởng khoa.',
      user: 'BS. Phan Định',
      userType: 'person',
      ip: '192.168.1.105',
    },
    {
      id: '2',
      timestamp: '2026-05-20 14:15:22',
      tz: 'ICT (+7)',
      severity: 'Info',
      title: 'Đăng Ký Đơn Vị Mới Thành Công',
      desc: 'Trung tâm Mắt Kỹ thuật cao đã hoàn tất quy trình onboarding tự động.',
      user: 'Hệ thống Tự động',
      userType: 'system',
      ip: '10.0.4.22',
    },
    {
      id: '3',
      timestamp: '2026-05-20 13:45:09',
      tz: 'ICT (+7)',
      severity: 'Warning',
      title: 'Đăng Nhập Thất Bại Nhiều Lần',
      desc: '5 lần nhập sai mật khẩu tài khoản j.doe@auraclinical.com trong 2 phút. Tài khoản tạm thời bị khóa 15 phút.',
      user: 'Chưa Xác Thực',
      userType: 'unknown',
      ip: '203.0.113.45',
    },
    {
      id: '4',
      timestamp: '2026-05-20 11:20:00',
      tz: 'ICT (+7)',
      severity: 'Info',
      title: 'Xuất Dữ Liệu Bệnh Nhân Hàng Loạt',
      desc: 'Xuất 142 bản ghi ảnh võng mạc mã hóa bảo mật sang Cổng Nghiên cứu ID-883.',
      user: 'BS. Lê Trang',
      userType: 'person',
      ip: '192.168.1.55',
    },
  ];

  const escapeCsvField = (field: string) => `"${field.replace(/"/g, '""')}"`;

  const handleExportCsv = () => {
    const headers = ['Thời Gian', 'Múi Giờ', 'Mức Độ', 'Tiêu Đề', 'Mô Tả', 'Tài Khoản', 'Địa Chỉ IP'];
    const rows = filteredLogs.map(log => [
      log.timestamp,
      log.tz,
      log.severity,
      log.title,
      log.desc,
      log.user,
      log.ip,
    ].map(escapeCsvField).join(','));

    const csvContent = '\uFEFF' + [headers.map(escapeCsvField).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nhat-ky-kiem-toan-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSeverity = severityFilter === 'All' || log.severity === severityFilter;
    const matchesSearch =
      log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip.includes(searchTerm);
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-surface font-body-md text-body-md">
      <SideNavBar currentRole="Quản trị Bảo mật & Kiểm toán" />

      <main className="flex-1 md:ml-sidebar-width pt-16 md:pt-0 p-margin-page bg-surface min-h-screen flex flex-col">
        <div className="max-w-container-max mx-auto w-full flex-1">
          {/* Header section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-display-lg font-bold text-on-background mb-1">Nhật Ký Kiểm Toán Hệ Thống</h2>
              <p className="text-body-lg text-on-surface-variant">
                Nhật ký theo thời gian thực ghi lại toàn bộ sự kiện an ninh, cảnh báo rủi ro và truy cập hệ thống.
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={handleExportCsv}
                disabled={filteredLogs.length === 0}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-container-low transition-colors font-semibold text-label-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Xuất File CSV
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center shadow-xs">
            <div className="relative w-full md:flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm nhật ký theo Mã Sự Kiện, Người Dùng, Hành Động hoặc IP..."
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-md outline-none transition-shadow"
              />
            </div>
            <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="All">Tất cả Mức độ</option>
                <option value="Critical">Nghiêm trọng (Critical)</option>
                <option value="Warning">Cảnh báo (Warning)</option>
                <option value="Info">Thông tin (Info)</option>
              </select>
            </div>
          </div>

          {/* Log Table */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-label-md font-semibold text-on-surface-variant uppercase">
                    <th className="py-3 px-4 w-[180px]">Thời Gian</th>
                    <th className="py-3 px-4 w-[140px]">Mức Độ</th>
                    <th className="py-3 px-4">Mô Tả Sự Kiện</th>
                    <th className="py-3 px-4 w-[200px]">Tài Khoản Thực Hiện</th>
                    <th className="py-3 px-4 w-[140px]">Địa Chỉ IP</th>
                    <th className="py-3 px-4 w-[80px] text-right">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="text-body-md divide-y divide-outline-variant">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-on-surface font-mono-data">{log.timestamp}</div>
                        <div className="text-outline text-xs mt-0.5">{log.tz}</div>
                      </td>
                      <td className="py-3 px-4">
                        {log.severity === 'Critical' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container text-label-md font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-error" /> Nghiêm trọng
                          </span>
                        )}
                        {log.severity === 'Warning' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fef08a] text-[#713f12] text-label-md font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#eab308]" /> Cảnh báo
                          </span>
                        )}
                        {log.severity === 'Info' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface text-label-md font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Thông tin
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-on-surface">
                        <div className="font-semibold">{log.title}</div>
                        <div className="text-on-surface-variant text-sm mt-0.5">{log.desc}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-outline text-[18px]">account_circle</span>
                          <span className="text-on-surface font-medium">{log.user}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono-data text-on-surface-variant">{log.ip}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-outline hover:text-primary transition-colors p-1"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Footer />
      </main>

      {selectedLog && (
        <div
          className="fixed inset-0 bg-inverse-surface/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-headline-md font-bold text-on-background">{selectedLog.title}</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-outline hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3 text-body-md text-on-surface">
              <p>{selectedLog.desc}</p>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-outline-variant text-sm">
                <div>
                  <div className="text-on-surface-variant text-xs uppercase mb-0.5">Thời Gian</div>
                  <div className="font-mono-data">{selectedLog.timestamp} ({selectedLog.tz})</div>
                </div>
                <div>
                  <div className="text-on-surface-variant text-xs uppercase mb-0.5">Mức Độ</div>
                  <div>{selectedLog.severity}</div>
                </div>
                <div>
                  <div className="text-on-surface-variant text-xs uppercase mb-0.5">Tài Khoản</div>
                  <div>{selectedLog.user}</div>
                </div>
                <div>
                  <div className="text-on-surface-variant text-xs uppercase mb-0.5">Địa Chỉ IP</div>
                  <div className="font-mono-data">{selectedLog.ip}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
