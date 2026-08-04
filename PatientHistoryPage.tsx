import React, { useState } from 'react';
import { SideNavBar } from '../components/SideNavBar';
import { Footer } from '../components/Footer';

export const PatientHistoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('All');
  const [selectedScan, setSelectedScan] = useState<any>(null);

  const historyData = [
    { id: 'A-892', date: '24/10/2024', eye: 'Hai mắt (OU)', risk: 'Thấp', doctor: 'BS. Phan Định', status: 'Đã duyệt' },
    { id: 'A-445', date: '12/10/2023', eye: 'Hai mắt (OU)', risk: 'Thấp', doctor: 'BS. Lê Trang', status: 'Đã duyệt' },
    { id: 'A-112', date: '05/09/2022', eye: 'Mắt Phải (OD)', risk: 'Trung bình', doctor: 'BS. Trần Hoàng', status: 'Đã duyệt' },
    { id: 'A-098', date: '18/01/2021', eye: 'Mắt Trái (OS)', risk: 'Cao', doctor: 'BS. Phan Định', status: 'Đã duyệt' },
  ];

  const filteredData = historyData.filter(item => {
    const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase()) || item.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'All' || item.risk === filterRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="flex min-h-screen bg-surface font-body-md text-body-md">
      <SideNavBar currentRole="Bệnh nhân" />

      <main className="flex-1 md:ml-sidebar-width flex flex-col min-h-screen bg-background overflow-y-auto">
        <div className="p-gutter md:p-margin-page flex-1 max-w-container-max mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-display-lg font-bold text-on-surface">Lịch Sử Tất Cả Các Lần Tầm Soát</h1>
              <p className="text-body-lg text-on-surface-variant mt-1">Danh sách lưu trữ toàn bộ hồ sơ khám võng mạc của bệnh nhân.</p>
            </div>
            <a
              href="/upload"
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tạo Ca Tầm Soát Mới
            </a>
          </div>

          {/* Search and Filters */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center shadow-xs">
            <div className="relative w-full md:flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo Mã ca khám (#A-xxx) hoặc Bác sĩ..."
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-md outline-none transition-shadow"
              />
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="All">Tất cả Mức độ Rủi ro</option>
                <option value="Thấp">Nguy cơ Thấp</option>
                <option value="Trung bình">Nguy cơ Trung bình</option>
                <option value="Cao">Nguy cơ Cao</option>
              </select>
            </div>
          </div>

          {/* History Data Table */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-label-md font-semibold text-on-surface-variant uppercase">
                    <th className="py-3 px-4">Mã Ca Khám</th>
                    <th className="py-3 px-4">Ngày Khám</th>
                    <th className="py-3 px-4">Mắt Khám</th>
                    <th className="py-3 px-4">Mức Độ Rủi Ro</th>
                    <th className="py-3 px-4">Bác Sĩ Phụ Trách</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="text-body-md divide-y divide-outline-variant">
                  {filteredData.map((row) => (
                    <tr key={row.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-4 font-mono-data text-primary font-semibold">#{row.id}</td>
                      <td className="py-3 px-4">{row.date}</td>
                      <td className="py-3 px-4">{row.eye}</td>
                      <td className="py-3 px-4">
                        {row.risk === 'Thấp' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded bg-tertiary-fixed-dim text-on-tertiary-fixed-variant text-label-md font-semibold">Thấp</span>
                        )}
                        {row.risk === 'Trung bình' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded bg-surface-container-high text-on-surface text-label-md font-semibold">Trung bình</span>
                        )}
                        {row.risk === 'Cao' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded bg-error-container text-error text-label-md font-semibold">Cao</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium">{row.doctor}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedScan(row)}
                          className="px-3 py-1 bg-surface border border-outline-variant rounded hover:bg-surface-variant text-primary font-semibold text-label-md transition-colors"
                        >
                          Xem Báo Cáo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Scan Report Modal */}
        {selectedScan && (
          <div className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant mb-4">
                <h3 className="text-headline-sm font-bold text-on-surface">Chi Tiết Ca Khám #{selectedScan.id}</h3>
                <button onClick={() => setSelectedScan(null)} className="material-symbols-outlined text-on-surface-variant hover:text-error">close</button>
              </div>

              <div className="space-y-3 text-body-md mb-6">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Ngày thực hiện:</span>
                  <span className="font-semibold">{selectedScan.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Vùng mắt chụp:</span>
                  <span className="font-semibold">{selectedScan.eye}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Mức độ rủi ro:</span>
                  <span className="font-semibold text-primary">{selectedScan.risk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Bác sĩ chẩn đoán:</span>
                  <span className="font-semibold">{selectedScan.doctor}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button onClick={() => setSelectedScan(null)} className="px-4 py-2 border border-outline-variant rounded-lg font-semibold text-label-md hover:bg-surface-variant">
                  Đóng
                </button>
                <button onClick={() => alert(`Đang tải báo cáo PDF ca khám #${selectedScan.id}...`)} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold text-label-md hover:bg-primary-container">
                  Tải Báo Cáo PDF
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
};
