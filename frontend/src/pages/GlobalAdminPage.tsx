import React from 'react';
import { SideNavBar } from '../components/SideNavBar';
import { Footer } from '../components/Footer';

export const GlobalAdminPage: React.FC = () => {
  return (
    <div className="flex h-screen bg-surface font-body-md text-body-md min-h-screen">
      <SideNavBar currentRole="Quản trị viên Hệ thống (Global Admin)" />

      <main className="flex-1 md:ml-sidebar-width flex flex-col min-h-screen bg-background overflow-y-auto">
        <div className="p-gutter md:p-margin-page flex-1 max-w-container-max mx-auto w-full">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-display-lg font-bold text-on-background">Tổng Quan Hệ Thống</h2>
              <p className="text-body-lg text-on-surface-variant mt-1">Thông số hạ tầng trực tuyến và mạng lưới phòng khám toàn quốc.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-label-md text-on-surface-variant font-semibold">Trạng thái Hạ tầng</p>
                <p className="text-body-md text-tertiary flex items-center justify-end gap-1.5 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse" /> Đang hoạt động ổn định
                </p>
              </div>
            </div>
          </header>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* KPIs */}
            <section className="col-span-1 md:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider">Tổng Lượt Phân Tích (24h)</span>
                  <span className="material-symbols-outlined text-primary">visibility</span>
                </div>
                <div>
                  <div className="text-display-lg font-bold text-on-background">14,208</div>
                  <div className="text-label-md font-semibold text-tertiary flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span> +12.5% so với hôm qua
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider">Phòng Khám Đang Kết Nối</span>
                  <span className="material-symbols-outlined text-primary">domain</span>
                </div>
                <div>
                  <div className="text-display-lg font-bold text-on-background">842</div>
                  <div className="text-label-md font-semibold text-tertiary flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span> +3 đơn vị mới tuần này
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider">Độ Chính Xác AI (MA/EX)</span>
                  <span className="material-symbols-outlined text-primary">psychology</span>
                </div>
                <div>
                  <div className="text-display-lg font-bold text-on-background">98.4%</div>
                  <div className="text-label-md font-semibold text-on-surface-variant flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[16px]">horizontal_rule</span> Ổn định
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider">Độ Trễ Phân Tích AI</span>
                  <span className="material-symbols-outlined text-primary">timer</span>
                </div>
                <div>
                  <div className="text-display-lg font-bold text-on-background">1.2s</div>
                  <div className="text-label-md font-semibold text-secondary flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span> +0.2s giờ cao điểm
                  </div>
                </div>
              </div>
            </section>

            {/* Diagnostic / Activity Chart */}
            <section className="col-span-1 md:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col h-[400px] shadow-sm">
              <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface/30">
                <h3 className="text-headline-sm font-semibold text-on-background">Tải Hạ Tầng & Năng Suất Xử Lý Ca Khám</h3>
                <button className="text-primary hover:bg-surface-container p-1 rounded transition-colors">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
              <div className="flex-1 p-6 relative flex items-end gap-2">
                <div className="w-full h-full flex items-end justify-between px-4 pb-6 border-b border-l border-outline-variant relative">
                  <div className="w-8 h-[40%] bg-surface-variant rounded-t-sm hover:bg-primary-container cursor-pointer transition-colors" />
                  <div className="w-8 h-[60%] bg-surface-variant rounded-t-sm hover:bg-primary-container cursor-pointer transition-colors" />
                  <div className="w-8 h-[55%] bg-surface-variant rounded-t-sm hover:bg-primary-container cursor-pointer transition-colors" />
                  <div className="w-8 h-[80%] bg-primary rounded-t-sm cursor-pointer" />
                  <div className="w-8 h-[70%] bg-surface-variant rounded-t-sm hover:bg-primary-container cursor-pointer transition-colors" />
                  <div className="w-8 h-[85%] bg-surface-variant rounded-t-sm hover:bg-primary-container cursor-pointer transition-colors" />
                </div>
              </div>
            </section>

            {/* Pending Approvals Queue */}
            <section className="col-span-1 md:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col h-[400px] shadow-sm">
              <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low rounded-t-xl">
                <h3 className="text-headline-sm font-semibold text-on-background flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">how_to_reg</span> Yêu Cầu Đăng Ký Đơn Vị
                </h3>
                <span className="bg-error text-on-error text-xs font-bold px-2 py-1 rounded-full">14 Chờ duyệt</span>
              </div>
              <div className="flex-1 overflow-y-auto p-0">
                <ul className="divide-y divide-outline-variant">
                  <li className="p-4 hover:bg-surface-container transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-body-md font-semibold text-on-background">Phòng khám Mắt Quốc tế St. Jude</p>
                        <p className="text-label-md text-on-surface-variant">Mã YC: REQ-8902 • Gói: Doanh nghiệp</p>
                      </div>
                      <span className="bg-surface-variant text-on-surface px-2 py-0.5 rounded text-[10px] font-bold">2 giờ trước</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="flex-1 bg-primary text-on-primary py-1.5 rounded-lg text-label-md font-semibold hover:bg-primary-container transition-colors">Phê Duyệt</button>
                      <button className="flex-1 border border-outline text-on-surface py-1.5 rounded-lg text-label-md font-semibold hover:bg-surface-variant transition-colors">Xem Hồ Sơ</button>
                    </div>
                  </li>

                  <li className="p-4 hover:bg-surface-container transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-body-md font-semibold text-on-background">Phòng Khám Chuyên Khoa Mắt Ánh Dương</p>
                        <p className="text-label-md text-on-surface-variant">Mã YC: REQ-8901 • Gói: Tiêu chuẩn</p>
                      </div>
                      <span className="bg-surface-variant text-on-surface px-2 py-0.5 rounded text-[10px] font-bold">5 giờ trước</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="flex-1 bg-primary text-on-primary py-1.5 rounded-lg text-label-md font-semibold hover:bg-primary-container transition-colors">Phê Duyệt</button>
                      <button className="flex-1 border border-outline text-on-surface py-1.5 rounded-lg text-label-md font-semibold hover:bg-surface-variant transition-colors">Xem Hồ Sơ</button>
                    </div>
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
};
