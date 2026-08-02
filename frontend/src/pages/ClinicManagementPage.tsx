import React from 'react';
import { SideNavBar } from '../components/SideNavBar';
import { Footer } from '../components/Footer';

export const ClinicManagementPage: React.FC = () => {
  return (
    <div className="flex h-screen bg-background text-on-background font-body-md min-h-screen">
      <SideNavBar currentRole="Quản lý Phòng khám" />

      <main className="flex-1 md:ml-sidebar-width flex flex-col min-h-screen bg-background overflow-y-auto">
        <div className="p-gutter md:p-margin-page flex-1 max-w-container-max mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-display-lg font-bold text-on-background">Tổng Quan Báo Cáo</h1>
              <p className="text-body-lg text-on-surface-variant mt-1">Hiệu suất Hoạt động & Tải Bệnh nhân Phòng khám</p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:flex-initial">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm bệnh nhân hoặc mã ca..."
                  className="pl-10 pr-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-body-md w-full md:w-64 transition-all"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-primary font-semibold text-label-md hover:bg-surface-container-low transition-colors bg-surface shadow-xs">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Xuất Báo Cáo Tổng Hợp
              </button>
            </div>
          </div>

          {/* Performance Overview KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col shadow-xs">
              <div className="flex justify-between items-start mb-2">
                <span className="text-label-md font-semibold text-on-surface-variant uppercase">Tổng Số Ca Khám</span>
                <div className="p-1.5 bg-primary-container/20 rounded-lg text-primary">
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                </div>
              </div>
              <div className="mt-auto">
                <span className="text-display-lg font-bold text-on-background">1,248</span>
                <div className="flex items-center gap-1 text-tertiary mt-1">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                  <span className="text-label-md font-semibold">+12% tháng này</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col relative overflow-hidden shadow-xs">
              <div className="absolute inset-0 bg-secondary/5 z-0" />
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-label-md font-semibold text-on-surface-variant uppercase">Cảnh Báo Nguy Cơ Cao</span>
                <div className="p-1.5 bg-error-container rounded-lg text-error">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
              </div>
              <div className="mt-auto relative z-10">
                <span className="text-display-lg font-bold text-error">84</span>
                <div className="text-label-md font-semibold text-on-surface-variant mt-1">Cần hội chẩn gấp</div>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col shadow-xs">
              <div className="flex justify-between items-start mb-2">
                <span className="text-label-md font-semibold text-on-surface-variant uppercase">Bác Sĩ Trực Ca</span>
                <div className="p-1.5 bg-surface-container-high rounded-lg text-primary">
                  <span className="material-symbols-outlined text-[20px]">medical_services</span>
                </div>
              </div>
              <div className="mt-auto">
                <span className="text-display-lg font-bold text-on-background">12</span>
                <div className="text-label-md font-semibold text-on-surface-variant mt-1">Đang hoạt động online</div>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col shadow-xs">
              <div className="flex justify-between items-start mb-2">
                <span className="text-label-md font-semibold text-on-surface-variant uppercase">Dung Lượng Gói Khám</span>
                <div className="p-1.5 bg-surface-container-high rounded-lg text-primary">
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                </div>
              </div>
              <div className="mt-auto">
                <span className="text-display-lg font-bold text-on-background">85%</span>
                <div className="w-full bg-surface-variant rounded-full h-1.5 mt-2 mb-1">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: '85%' }} />
                </div>
                <div className="text-label-md text-on-surface-variant">8,500 / 10,000 lượt quét</div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Patient Queue Table */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
                <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface/50">
                  <h2 className="text-headline-sm font-semibold text-on-background">Hàng Đợi Bệnh Nhân Gần Đây</h2>
                  <button className="text-primary text-label-md font-semibold hover:underline">Xem Tất Cả</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant text-label-md font-semibold text-on-surface-variant uppercase">
                        <th className="p-3">Mã Bệnh Nhân</th>
                        <th className="p-3">Thời gian</th>
                        <th className="p-3">Bác Sĩ Phụ Trách</th>
                        <th className="p-3">Trạng Thái AI</th>
                      </tr>
                    </thead>
                    <tbody className="text-body-md divide-y divide-outline-variant">
                      <tr className="hover:bg-surface transition-colors">
                        <td className="p-3 font-mono-data text-primary">PT-8842-A</td>
                        <td className="p-3 text-on-surface-variant">10:42 AM</td>
                        <td className="p-3 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[10px] font-bold">PĐ</div>
                          BS. Phan Định
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-error text-label-md font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-error" /> Nguy Cơ Cao
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-surface transition-colors">
                        <td className="p-3 font-mono-data text-primary">PT-8841-C</td>
                        <td className="p-3 text-on-surface-variant">10:15 AM</td>
                        <td className="p-3 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-bold">LT</div>
                          BS. Lê Trang
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface-variant text-label-md font-bold">
                            <span className="material-symbols-outlined text-[14px] animate-spin">sync</span> Đang Phân Tích...
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-surface transition-colors">
                        <td className="p-3 font-mono-data text-primary">PT-8840-B</td>
                        <td className="p-3 text-on-surface-variant">09:30 AM</td>
                        <td className="p-3 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center text-[10px] font-bold">TH</div>
                          BS. Trần Hoàng
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-container/20 text-tertiary text-label-md font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Đã Xác Nhận
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Risk Distribution Chart */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col md:flex-row h-64 overflow-hidden">
                <div className="p-6 border-b md:border-b-0 md:border-r border-outline-variant flex-1 bg-surface/30">
                  <h2 className="text-headline-sm font-semibold text-on-background mb-4">Phân Bổ Tỷ Lệ Rủi Ro</h2>
                  <div className="flex h-32 items-end gap-2 px-2 mt-4">
                    <div className="w-1/3 bg-tertiary rounded-t-sm relative group" style={{ height: '70%' }}>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-label-md font-bold">70%</div>
                    </div>
                    <div className="w-1/3 bg-secondary-fixed-dim rounded-t-sm relative group" style={{ height: '22%' }}>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-label-md font-bold">22%</div>
                    </div>
                    <div className="w-1/3 bg-error rounded-t-sm relative group" style={{ height: '8%' }}>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-label-md font-bold text-error">8%</div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 px-2 border-t border-outline-variant pt-2">
                    <span className="text-label-md font-semibold text-tertiary">Thấp</span>
                    <span className="text-label-md font-semibold text-on-surface-variant">Trung bình</span>
                    <span className="text-label-md font-semibold text-error">Cao</span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-center">
                  <h3 className="text-headline-sm font-semibold text-on-background mb-2">Tỷ Lệ Đồng Thuận Phân Tích</h3>
                  <p className="text-body-md text-on-surface-variant mb-4">Độ tương đồng giữa chẩn đoán AI và quyết định của bác sĩ chuyên khoa.</p>
                  <div className="flex items-center gap-4">
                    <div className="text-display-lg font-bold text-primary">94.2%</div>
                    <div className="flex flex-col">
                      <span className="text-label-md font-semibold text-tertiary flex items-center">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span> +2.1%
                      </span>
                      <span className="text-label-md text-on-surface-variant">so với tháng trước</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              {/* Live Alerts Panel */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col shadow-sm h-[320px]">
                <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-error/5">
                  <h2 className="text-headline-sm font-semibold text-on-background flex items-center gap-2">
                    <span className="material-symbols-outlined text-error">campaign</span>
                    Cảnh Báo Trực Tiếp
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  <div className="p-3 rounded-lg bg-error-container/30 border-l-4 border-error hover:bg-error-container/50 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-label-md font-bold text-error">Phát hiện DR Mức Nguy Hiểm</span>
                      <span className="text-label-md text-on-surface-variant">2 phút trước</span>
                    </div>
                    <p className="text-body-md text-on-background">Bệnh nhân PT-8842-A ghi nhận biến chứng võng mạc tiểu đường tăng sinh mức độ nặng.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-container-high border-l-4 border-primary hover:bg-surface-container-highest transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-label-md font-bold text-primary">Cập nhật Hệ thống</span>
                      <span className="text-label-md text-on-surface-variant">1 giờ trước</span>
                    </div>
                    <p className="text-body-md text-on-background">Model AI v2.4 đã triển khai thành công lên máy chủ phòng khám local.</p>
                  </div>
                </div>
              </div>

              {/* Staff Management */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col shadow-sm">
                <div className="p-4 border-b border-outline-variant bg-surface/50">
                  <h2 className="text-headline-sm font-semibold text-on-background">Tải Công Việc Bác Sĩ</h2>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-md font-bold">PĐ</div>
                      <div className="flex flex-col">
                        <span className="text-body-md font-semibold text-on-background">BS. Phan Định</span>
                        <span className="text-label-md text-tertiary">Đang trực tuyến</span>
                      </div>
                    </div>
                    <span className="text-body-md font-mono-data">14 ca</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center text-label-md font-bold">LT</div>
                      <div className="flex flex-col">
                        <span className="text-body-md font-semibold text-on-background">BS. Lê Trang</span>
                        <span className="text-label-md text-tertiary">Đang trực tuyến</span>
                      </div>
                    </div>
                    <span className="text-body-md font-mono-data">8 ca</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
};
