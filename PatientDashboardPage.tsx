import React, { useState } from 'react';
import { SideNavBar } from '../components/SideNavBar';
import { Footer } from '../components/Footer';

export const PatientDashboardPage: React.FC = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'BS. Phan Định', text: 'Xin chào! Tôi đã xem qua kết quả phân tích võng mạc mới nhất (Mã #A-892) của bạn. Chỉ số mạch máu khá ổn định. Bạn có thắc mắc gì không?', time: '10:05 AM' }
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { sender: 'Bạn', text: chatInput, time: 'Vừa xong' }
    ]);
    setChatInput('');
  };

  return (
    <div className="flex h-screen bg-background text-on-background font-body-md min-h-screen">
      <SideNavBar currentRole="Bệnh nhân" />

      <main className="flex-1 w-full md:ml-sidebar-width h-full overflow-y-auto bg-background flex flex-col">
        <div className="max-w-container-max mx-auto p-4 md:p-8 space-y-6 flex-1 w-full">
          {/* Hero Section */}
          <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-outline-variant">
            <div>
              <h2 className="text-display-lg font-bold text-primary mb-1">Tổng Quan Sức Khỏe Võng Mạc</h2>
              <p className="text-body-lg text-on-surface-variant">Cập nhật lần cuối: Hôm nay, 09:42 AM</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <a
                href="/upload"
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-surface border border-outline text-on-surface font-label-md rounded-lg hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">upload</span>
                Tải Ảnh Khám Mới
              </a>
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary text-on-primary font-label-md rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Tải Báo Cáo PDF
              </button>
            </div>
          </section>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Result Summary Card */}
            <div className="md:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col items-center text-center shadow-sm">
              <h3 className="text-headline-sm font-semibold text-on-surface w-full text-left mb-6 pb-2 border-b border-outline-variant">
                Đánh Giá Rủi Ro Tổng Thể
              </h3>
              {/* Gauge Visualization */}
              <div className="relative w-48 h-24 overflow-hidden mb-4">
                <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[24px] border-surface-container-high border-b-transparent border-r-transparent rotate-45 transform origin-center" />
                <div className="absolute bottom-0 left-1/2 w-1 h-20 bg-on-surface origin-bottom transform -rotate-[45deg] -translate-x-1/2 transition-transform duration-1000" />
                <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[24px] border-tertiary-fixed border-b-transparent border-r-transparent rotate-45 transform origin-center opacity-80" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed-variant mb-4">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span className="text-label-md font-semibold">Nguy Cơ Thấp</span>
              </div>
              <p className="text-body-md text-on-surface-variant">
                Kết quả chụp võng mạc gần nhất cho thấy cấu trúc vi mạch bình thường, chưa ghi nhận dấu hiệu tổn thương võng mạc tiểu đường hoặc thoái hóa hoàng điểm.
              </p>
            </div>

            {/* Latest Analysis View */}
            <div className="md:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
                <h3 className="text-headline-sm font-semibold text-on-surface">Kết Quả Phân Tích AI Mới Nhất</h3>
                <span className="text-label-md text-on-surface-variant bg-surface-container px-2 py-1 rounded">Mã ca: #A-892</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-label-md text-on-surface-variant text-center font-medium">Ảnh Võng Mạc Gốc (Fundus)</p>
                  <div className="bg-black rounded-lg aspect-square overflow-hidden relative group border border-outline-variant">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCr5k3aBfoFN8wCyKt-tslncVpq0fEWMazygwY3wuyYG-xiKHFbx-d7zKHsozvd7TVoj-qg4lKpFmTpcqfpNnXIDhsRnUyr_VKDF6nKaSICjOaTUHnFLsMaiJGVlOB5mE4LDa3d-P2oaQcGG5daZUcNz-RxzuCQdpUqrkq24hu4bx7t7RRKz0anPYxFOSB5Q15jcsoluw3abAiq0sz2S02VBwA9Uk7-ft1NerRz_PCKQxu3ARvp0hUB"
                      alt="Ảnh Chụp Võng Mạc Gốc"
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-label-md text-on-surface-variant text-center font-medium">Bản Đồ Mạch Máu AI (Annotated Map)</p>
                  <div className="bg-black rounded-lg aspect-square overflow-hidden relative border border-outline-variant">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNVd87A_K3xF7xZnw_5h9WYIhCAuzHxiKHHtSzhbboU6q836TLgZGHxljaJsxV9PcMJFYGvzfkkYUoQOXPdXoCRzg6ABiph03eOICSiA9lV3nQby0NUsTJVwgjXiVbIsg-F8wEb9GcoaqzRK2pybX1OG34uJCoG7iFSdr5m00MWBW043-0LXZEYKFwO0HuXG6gSz7yNIwhX_t2X6stw1p2FeSclYe0Wh8ud3C5R7ac58aQjJQcA03f"
                      alt="Ảnh Phân Tích Mạch Máu Võng Mạc AI"
                      className="w-full h-full object-cover"
                    />
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                      <circle cx="65" cy="45" r="5" fill="none" stroke="#00ffff" strokeWidth="0.5" className="animate-pulse opacity-70" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Recommendations */}
            <div className="md:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
              <h3 className="text-headline-sm font-semibold text-on-surface mb-4 pb-2 border-b border-outline-variant">
                Khuyến Nghị Sức Khỏe Từ Trí Tuệ Nhân Tạo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface p-4 rounded-lg border border-outline-variant">
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <span className="material-symbols-outlined">calendar_month</span>
                    <h4 className="text-label-md font-semibold">Tầm Soát Định Kỳ tiếp theo</h4>
                  </div>
                  <p className="text-body-md text-on-surface-variant">
                    Lên lịch khám tầm soát võng mạc sau 12 tháng dựa trên chỉ số rủi ro thấp hiện tại.
                  </p>
                </div>

                <div className="bg-surface p-4 rounded-lg border border-outline-variant">
                  <div className="flex items-center gap-2 mb-2 text-surface-tint">
                    <span className="material-symbols-outlined">water_drop</span>
                    <h4 className="text-label-md font-semibold">Kiểm Soát Đường Huyết</h4>
                  </div>
                  <p className="text-body-md text-on-surface-variant">
                    Tiếp tục duy trì và theo dõi chỉ số HbA1c ổn định để ngăn ngừa nguy cơ vi mạch tổn thương.
                  </p>
                </div>

                <div className="bg-surface p-4 rounded-lg border border-outline-variant">
                  <div className="flex items-center gap-2 mb-2 text-surface-tint">
                    <span className="material-symbols-outlined">blood_pressure</span>
                    <h4 className="text-label-md font-semibold">Theo Dõi Huyết Áp</h4>
                  </div>
                  <p className="text-body-md text-on-surface-variant">
                    Chưa ghi nhận biến đổi mạch máu do cao huyết áp. Hãy duy trì lối sống lành mạnh.
                  </p>
                </div>
              </div>
            </div>

            {/* History List */}
            <div className="md:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
              <h3 className="text-headline-sm font-semibold text-on-surface mb-4 pb-2 border-b border-outline-variant">
                Lịch Sử Các Lần Tầm Soát
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant text-label-md font-semibold text-on-surface-variant">
                      <th className="py-3 px-4">Ngày khám</th>
                      <th className="py-3 px-4">Mã Ca Khám</th>
                      <th className="py-3 px-4">Mắt khám</th>
                      <th className="py-3 px-4">Mức Độ Rủi Ro</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="text-body-md">
                    <tr className="border-b border-outline-variant hover:bg-surface transition-colors">
                      <td className="py-3 px-4">24/10/2024</td>
                      <td className="py-3 px-4 font-mono-data text-on-surface-variant">#A-892</td>
                      <td className="py-3 px-4">Hai mắt (OU)</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded bg-tertiary-fixed-dim text-on-tertiary-fixed-variant text-label-md font-semibold">Thấp</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-primary hover:underline text-label-md font-semibold">Xem Báo Cáo</button>
                      </td>
                    </tr>
                    <tr className="border-b border-outline-variant hover:bg-surface transition-colors">
                      <td className="py-3 px-4">12/10/2023</td>
                      <td className="py-3 px-4 font-mono-data text-on-surface-variant">#A-445</td>
                      <td className="py-3 px-4">Hai mắt (OU)</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded bg-tertiary-fixed-dim text-on-tertiary-fixed-variant text-label-md font-semibold">Thấp</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-primary hover:underline text-label-md font-semibold">Xem Báo Cáo</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface transition-colors">
                      <td className="py-3 px-4">05/09/2022</td>
                      <td className="py-3 px-4 font-mono-data text-on-surface-variant">#A-112</td>
                      <td className="py-3 px-4">Hai mắt (OU)</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded bg-surface-container-high text-on-surface text-label-md font-semibold">Trung bình</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-primary hover:underline text-label-md font-semibold">Xem Báo Cáo</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Doctor Chat Widget */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          {chatOpen && (
            <div className="bg-surface-container-lowest border border-outline-variant shadow-xl rounded-xl w-80 mb-4 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5">
              <div className="bg-primary p-3 flex justify-between items-center text-on-primary">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-surface">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCuhnuwTGj9cCPNJ-wCdNaL14mOjQG17zYh10wH9WWYGHrzBtLN4gE2h0kJ34qE2b-HymOXqFJq5tZDnfzF_9Aj_ZYy-fVSiLqZaYSwqNVx0Bp6ND1zbrIOd_WgPAIPgcSUhuzblnKRxd_DP4nn7v5IU1ccR6YzBL31jlhyuctH3IvIyx2PRrlUFFYGHld5E0r1ZEVjfXqVZyE75x0H9BbgVAhD2LAGE4yWjYyjXBEVQwKanY72AEWt"
                      alt="BS. Phan Định"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-label-md font-semibold">BS. Phan Định</p>
                    <p className="text-[10px] opacity-80">Bác sĩ Chuyên khoa Mắt</p>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} className="material-symbols-outlined text-[18px]">close</button>
              </div>

              <div className="h-64 bg-surface p-4 flex flex-col gap-3 overflow-y-auto text-body-md">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-lg max-w-[85%] text-body-md ${
                      msg.sender === 'Bạn'
                        ? 'self-end bg-primary text-on-primary'
                        : 'self-start bg-surface-container-high text-on-surface'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className="block text-[10px] opacity-70 mt-1">{msg.time}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-outline-variant bg-surface flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-1.5 text-body-md focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <button type="submit" className="bg-primary text-on-primary p-1.5 rounded-md hover:bg-primary-container">
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </form>
            </div>
          )}

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:bg-primary-container transition-transform transform hover:scale-105"
            aria-label="Trao đổi với Bác sĩ"
          >
            <span className="material-symbols-outlined filled text-2xl">chat</span>
          </button>
        </div>

        <Footer />
      </main>
    </div>
  );
};
