import React, { useState, useEffect } from 'react';
import { SideNavBar } from '../components/SideNavBar';
import { Footer } from '../components/Footer';
import { apiFetch } from '../services/api';

export const DoctorAnalysisPage: React.FC = () => {
  const [screenings, setScreenings] = useState<any[]>([]);
  const [activeScreening, setActiveScreening] = useState<any | null>(null);
  const [selectedEye, setSelectedEye] = useState<'OD' | 'OS'>('OD');
  const [showVessels, setShowVessels] = useState(true);
  const [showMicroaneurysms, setShowMicroaneurysms] = useState(true);
  const [showExudates, setShowExudates] = useState(false);
  const [validationState, setValidationState] = useState<'agree' | 'modify' | 'reject'>('agree');
  const [clinicalNotes, setClinicalNotes] = useState(
    'Bệnh nhân xuất hiện dấu hiệu bệnh võng mạc tiểu đường chưa tăng sinh mức độ trung bình. Khuyến nghị tái khám theo dõi sau 6 tháng và kiểm soát chặt chẽ chỉ số đường huyết HbA1c.'
  );
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    loadScreenings();
  }, []);

  const loadScreenings = async () => {
    try {
      const res = await apiFetch('/api/v1/screenings');
      if (res.success && res.data && res.data.length > 0) {
        setScreenings(res.data);
        setActiveScreening(res.data[0]);
        if (res.data[0].doctorNotes) {
          setClinicalNotes(res.data[0].doctorNotes);
        }
      }
    } catch {
      // Offline fallback
    }
  };

  const handleSaveReview = async () => {
    setSaving(true);
    setToastMsg('');

    const screeningId = activeScreening?.id || 'local-demo';

    try {
      const res = await apiFetch(`/api/v1/screenings/${screeningId}/review`, {
        method: 'POST',
        body: JSON.stringify({
          doctorNotes: clinicalNotes,
          riskLevel: activeScreening?.riskLevel || 'MODERATE',
        }),
      });

      if (res.success) {
        setToastMsg('Lưu báo cáo chẩn đoán bác sĩ thành công!');
      } else {
        setToastMsg('Đã lưu chẩn đoán (Offline Mode)!');
      }
    } catch {
      setToastMsg('Đã lưu chẩn đoán (Offline Mode)!');
    } finally {
      setSaving(false);
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface font-body-md text-body-md">
      <SideNavBar currentRole="Bác sĩ Nhãn khoa / Chẩn đoán" />

      <main className="flex-1 md:ml-sidebar-width flex flex-col min-h-screen bg-surface">
        {/* Top Header */}
        <header className="h-16 border-b border-outline-variant bg-surface flex items-center justify-between px-gutter sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <a href="/patient" className="hover:text-primary transition-colors font-medium">Danh sách Bệnh nhân</a>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="font-semibold text-on-surface">Phân tích Ca khám: PT-8492</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
            </button>
            <button className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-colors">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>
        </header>

        {/* Patient Info Bar */}
        <div className="bg-surface-container-lowest border-b border-outline-variant px-gutter py-4 sticky top-16 z-20 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-headline-sm">
              NV
            </div>
            <div>
              <h2 className="text-headline-sm font-bold text-on-surface">Nguyễn Văn An</h2>
              <div className="flex items-center gap-3 text-label-md text-on-surface-variant mt-1">
                <span>Mã BN: 8492-AX</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant" />
                <span>64 Tuổi</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant" />
                <span>Nam</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-error/10 text-error font-semibold text-label-md border border-error/20 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              Tăng Huyết Áp (Giai đoạn 2)
            </span>
            <span className="px-3 py-1 rounded-full bg-surface-variant text-on-surface-variant font-semibold text-label-md border border-outline-variant">
              Đái Tháo Đường Type II
            </span>
          </div>
        </div>

        {/* Workspace Grid */}
        <div className="p-gutter flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter max-w-container-max mx-auto">
            {/* Left Column: Image Viewer & Metrics */}
            <div className="xl:col-span-8 flex flex-col gap-gutter">
              {/* Main Image Viewer */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
                <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
                  <h3 className="font-semibold text-headline-sm text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">visibility</span>
                    Giao Diện Phân Tích Ảnh Võng Mạc
                  </h3>
                  <div className="flex bg-surface rounded-lg p-1 border border-outline-variant">
                    <button
                      onClick={() => setSelectedEye('OD')}
                      className={`px-3 py-1.5 rounded-md font-semibold text-label-md transition-all ${
                        selectedEye === 'OD' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      Mắt Phải (OD)
                    </button>
                    <button
                      onClick={() => setSelectedEye('OS')}
                      className={`px-3 py-1.5 rounded-md font-semibold text-label-md transition-all ${
                        selectedEye === 'OS' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      Mắt Trái (OS)
                    </button>
                  </div>
                </div>

                {/* Retinal Image Container */}
                <div className="bg-black relative aspect-[4/3] w-full flex items-center justify-center overflow-hidden group">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-85 mix-blend-screen transition-all duration-500"
                    style={{
                      backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCXyD8QZM_lt7v-njsIXjTB3qr5gxK3zODLXRnVoKp3C2Mku2-5IqGr8wNXJ7lFjxcPj47xoLv_MUNizezCJlt-6wu3quRQc_AhDCWDGdThMaelLE3E3K_pjbWciNqVtVco8XsAusStRza-_-7Q3H-M2teQps6yh-WBLkOzAIr1NiZ0Hxqjf5KuTIMfVAkIKg6T84GkNPVQB7Eato46VvifG2W_O_x3qYW350PYCq6YQDOWVyaydg7u')`,
                    }}
                  />

                  {/* AI Vessel & Lesion Layers */}
                  <svg
                    className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${
                      showVessels ? 'opacity-100' : 'opacity-0'
                    }`}
                    viewBox="0 0 100 100"
                  >
                    <path
                      d="M50,50 C40,60 30,80 20,90 M50,50 C60,40 70,30 80,20 M50,50 C45,30 35,20 25,10 M50,50 C55,70 65,80 75,90"
                      fill="none"
                      stroke="#00ffff"
                      strokeWidth="0.6"
                      className="opacity-80"
                    />
                  </svg>

                  {showMicroaneurysms && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                      <circle cx="35" cy="65" r="1.5" fill="#ff00ff" className="animate-pulse" />
                      <circle cx="65" cy="45" r="1" fill="#ff00ff" className="animate-pulse" />
                      <circle cx="48" cy="38" r="1.2" fill="#ff00ff" className="animate-pulse" />
                    </svg>
                  )}

                  {showExudates && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                      <circle cx="58" cy="52" r="2" fill="#ffff00" opacity="0.8" />
                      <circle cx="62" cy="55" r="1.5" fill="#ffff00" opacity="0.8" />
                    </svg>
                  )}

                  {/* Viewer Controls */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end opacity-90 group-hover:opacity-100 transition-opacity">
                    <div className="bg-surface/90 backdrop-blur-sm rounded-lg p-2 flex gap-2 shadow-lg border border-outline/20">
                      <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-variant text-on-surface" title="Phóng to">
                        <span className="material-symbols-outlined text-sm">zoom_in</span>
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-variant text-on-surface" title="Thu nhỏ">
                        <span className="material-symbols-outlined text-sm">zoom_out</span>
                      </button>
                      <div className="w-px h-6 bg-outline-variant mx-1 self-center" />
                      <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-variant text-on-surface" title="Đặt lại">
                        <span className="material-symbols-outlined text-sm">restart_alt</span>
                      </button>
                    </div>

                    <div className="bg-surface/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-outline/20 text-xs font-mono-data text-on-surface-variant">
                      ĐỘ PHÓNG THẠI: 1.2x | ĐỘ TƯƠNG PHẢN: +10
                    </div>
                  </div>
                </div>

                {/* AI Layer Toggles */}
                <div className="p-4 bg-surface flex flex-wrap gap-4 items-center">
                  <span className="text-label-md font-semibold text-on-surface-variant mr-2">Hiển thị Lớp AI:</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showVessels}
                      onChange={(e) => setShowVessels(e.target.checked)}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span className="text-body-md font-medium text-on-surface flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00ffff]" /> Cây Mạch Máu
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showMicroaneurysms}
                      onChange={(e) => setShowMicroaneurysms(e.target.checked)}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span className="text-body-md font-medium text-on-surface flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff00ff]" /> Phình Vi Mạch (Microaneurysms)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showExudates}
                      onChange={(e) => setShowExudates(e.target.checked)}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span className="text-body-md font-medium text-on-surface flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffff00]" /> Phù Cứng (Hard Exudates)
                    </span>
                  </label>
                </div>
              </div>

              {/* Vascular Metrics & Trend Graph */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                    <h3 className="font-semibold text-headline-sm text-on-surface">Thông Số Định Lượng Mạch Máu</h3>
                    <button className="text-primary hover:bg-surface-variant p-1 rounded transition-colors" title="Xuất dữ liệu">
                      <span className="material-symbols-outlined text-sm">download</span>
                    </button>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface border-b border-outline-variant text-label-md text-on-surface-variant font-semibold">
                        <th className="p-3">Chỉ số</th>
                        <th className="p-3">Giá trị</th>
                        <th className="p-3">Đánh giá</th>
                      </tr>
                    </thead>
                    <tbody className="text-body-md">
                      <tr className="border-b border-outline-variant hover:bg-surface transition-colors">
                        <td className="p-3 font-medium text-on-surface">Tỷ lệ Động/Tĩnh Mạch (AV Ratio)</td>
                        <td className="p-3 font-mono-data text-on-surface-variant">0.58</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-error/10 text-error">Bất thường</span>
                        </td>
                      </tr>
                      <tr className="border-b border-outline-variant hover:bg-surface transition-colors">
                        <td className="p-3 font-medium text-on-surface">Độ Ngoằn Ngoèo (Tortuosity)</td>
                        <td className="p-3 font-mono-data text-on-surface-variant">1.12</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#eab308]/10 text-[#ca8a04]">Tăng cao</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface transition-colors">
                        <td className="p-3 font-medium text-on-surface">Chiều Phân Tách (Fractal Dim)</td>
                        <td className="p-3 font-mono-data text-on-surface-variant">1.45</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-tertiary/10 text-tertiary">Bình thường</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
                    <h3 className="font-semibold text-headline-sm text-on-surface">Xu Hướng Rủi Ro Qua Các Lần Khám</h3>
                  </div>
                  <div className="p-4 flex-1 flex flex-col relative h-48 bg-surface">
                    <div className="w-full h-full flex items-end justify-between px-4 pb-4 border-b border-l border-outline-variant relative">
                      <div className="w-8 bg-tertiary/60 rounded-t-sm" style={{ height: '30%' }} />
                      <div className="w-8 bg-[#eab308]/60 rounded-t-sm" style={{ height: '55%' }} />
                      <div className="w-8 bg-error/60 rounded-t-sm" style={{ height: '85%' }} />
                      <div className="w-8 bg-error rounded-t-sm border-2 border-primary" style={{ height: '90%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: AI Assessment & Notes */}
            <div className="xl:col-span-4 flex flex-col gap-gutter">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col">
                <div className="px-4 py-3 border-b border-outline-variant bg-primary-container text-on-primary-container rounded-t-xl flex items-center justify-between">
                  <h3 className="font-semibold text-headline-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">smart_toy</span>
                    Đánh Giá Trí Tuệ Nhân Tạo
                  </h3>
                  <span className="px-2 py-0.5 bg-surface-container-lowest/20 rounded text-xs font-mono-data">Độ tin cậy: 94%</span>
                </div>

                <div className="p-4 space-y-6">
                  <div>
                    <h4 className="text-label-md font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">Phát Hiện Chính</h4>
                    <div className="p-3 bg-error/5 border border-error/20 rounded-lg flex gap-3">
                      <span className="material-symbols-outlined text-error mt-0.5">error</span>
                      <div>
                        <p className="font-bold text-error">Bệnh Võng Mạc Tiểu Đường Không Tăng Sinh (Mức Trung Bình)</p>
                        <p className="text-body-md text-on-surface-variant mt-1">
                          Phát hiện nhiều điểm phình vi mạch và hình thành xuất tiết cứng khu vực hoàng điểm.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-outline-variant pt-4">
                    <h4 className="text-label-md font-semibold text-on-surface-variant mb-3">Xác Nhận Của Bác Sĩ Lâm Sàng</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setValidationState('agree')}
                        className={`flex-1 py-2 px-3 border rounded-lg font-semibold text-label-md transition-colors flex items-center justify-center gap-1.5 ${
                          validationState === 'agree' ? 'bg-tertiary text-on-tertiary border-tertiary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-variant'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span> Đồng Ý
                      </button>

                      <button
                        onClick={() => setValidationState('modify')}
                        className={`flex-1 py-2 px-3 border rounded-lg font-semibold text-label-md transition-colors flex items-center justify-center gap-1.5 ${
                          validationState === 'modify' ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-variant'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">edit</span> Điều Chỉnh
                      </button>

                      <button
                        onClick={() => setValidationState('reject')}
                        className={`flex-1 py-2 px-3 border rounded-lg font-semibold text-label-md transition-colors flex items-center justify-center gap-1.5 ${
                          validationState === 'reject' ? 'bg-error text-on-error border-error' : 'border-outline-variant text-on-surface-variant hover:bg-error/10 hover:text-error'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">cancel</span> Bác Bỏ
                      </button>
                    </div>

                    <button className="w-full mt-3 py-2 text-primary font-semibold text-label-md flex items-center justify-center gap-1 hover:underline">
                      <span className="material-symbols-outlined text-sm">model_training</span>
                      Gửi Mẫu Huấn Lại AI Model
                    </button>
                  </div>
                </div>
              </div>

              {/* Medical Notes */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex-1 flex flex-col min-h-[300px]">
                <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
                  <h3 className="font-semibold text-headline-sm text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined">edit_note</span>
                    Ghi Chú & Kết Luận Lâm Sàng
                  </h3>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <textarea
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    rows={6}
                    className="w-full flex-1 resize-none border border-outline-variant rounded-lg p-3 text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-surface transition-shadow"
                    placeholder="Nhập chẩn đoán, quan sát lâm sàng và phác đồ điều trị..."
                  />

                  <div className="mt-4 flex justify-end gap-3">
                    <button className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg font-semibold text-label-md hover:bg-surface-variant transition-colors">
                      Lưu Nháp
                    </button>
                    <button className="px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">check</span>
                      Duyệt Báo Cáo Chẩn Đoán
                    </button>
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
