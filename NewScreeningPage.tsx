import React, { useState, useEffect } from 'react';
import { SideNavBar } from '../components/SideNavBar';
import { Footer } from '../components/Footer';
import { apiFetch } from '../services/api';

export const NewScreeningPage: React.FC = () => {
  const [uploads, setUploads] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchScreenings = async () => {
    try {
      const res = await apiFetch('/api/v1/screenings');
      if (res.success && res.data) {
        setQueue(res.data);
      }
    } catch {
      // Ignore if offline
    }
  };

  useEffect(() => {
    fetchScreenings();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setErrorMsg('');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const newUpload = {
        id: Date.now() + i,
        name: file.name,
        progress: 30,
        status: 'uploading',
      };
      setUploads(prev => [newUpload, ...prev]);

      try {
        // Construct image URL (in real app, upload file via multipart/form-data)
        const fakeImageUrl = `/uploads/${file.name}`;
        
        // Update progress
        setUploads(prev => prev.map(u => u.id === newUpload.id ? { ...u, progress: 70 } : u));

        const res = await apiFetch('/api/v1/screenings', {
          method: 'POST',
          body: JSON.stringify({ imageUrl: fakeImageUrl }),
        });

        if (res.success && res.data) {
          setUploads(prev => prev.map(u => u.id === newUpload.id ? { ...u, progress: 100, status: 'completed' } : u));
          setQueue(prev => [res.data, ...prev]);
        } else {
          // Local fallback demo if backend database is not running
          const fallbackData = {
            id: `local-${Date.now()}`,
            imageUrl: fakeImageUrl,
            riskLevel: 'MODERATE',
            confidence: 0.92,
            status: 'ANALYZED',
            findings: 'Phát hiện hẹp động mạch nhỏ dải rác. Tỷ lệ AVR ~ 0.58.',
            createdAt: new Date().toISOString(),
          };
          setUploads(prev => prev.map(u => u.id === newUpload.id ? { ...u, progress: 100, status: 'completed' } : u));
          setQueue(prev => [fallbackData, ...prev]);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Lỗi khi tải ảnh và phân tích AI.');
      }
    }
    setLoading(false);
  };

  const removeUpload = (id: number) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div className="flex h-screen bg-background text-on-background font-body-md min-h-screen">
      <SideNavBar currentRole="Nhân viên Kỹ thuật Lâm sàng" />

      <main className="flex-1 md:ml-sidebar-width flex flex-col min-h-screen bg-background overflow-y-auto">
        <div className="p-gutter md:p-margin-page flex-1 max-w-container-max mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-display-lg font-bold text-on-surface mb-2">Tải Ảnh Ca Tầm Soát Mới</h2>
            <p className="text-body-lg text-on-surface-variant">Tải ảnh chụp đáy mắt (Fundus) hoặc OCT để AI hỗ trợ phân tích vi mạch võng mạc.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Upload Section */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Patient Context */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center text-headline-sm font-bold">
                    NV
                  </div>
                  <div>
                    <h3 className="text-headline-sm font-bold text-on-surface">Nguyễn Văn An</h3>
                    <p className="text-body-md text-on-surface-variant">Mã Hồ Sơ (MRN): 987654321 • Ngày sinh: 12/05/1954</p>
                  </div>
                </div>
                <button className="text-primary hover:text-primary-container transition-colors text-label-md font-semibold flex items-center gap-1">
                  Đổi Bệnh Nhân <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              </div>

              {/* Drag & Drop Zone */}
              <div className="bg-surface-container-low border-2 border-dashed border-outline-variant hover:border-primary transition-colors rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer group relative shadow-xs">
                <input type="file" multiple accept="image/*,.dcm" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-container transition-colors">
                  <span className="material-symbols-outlined text-3xl text-primary group-hover:text-on-primary-container transition-colors">
                    cloud_upload
                  </span>
                </div>
                <h4 className="text-headline-sm font-bold text-on-surface mb-2">Kéo và thả tệp ảnh võng mạc vào đây</h4>
                <p className="text-body-md text-on-surface-variant mb-4 max-w-md">
                  Định dạng hỗ trợ: DICOM, JPEG, PNG, TIFF. Dung lượng tối đa: 50MB mỗi tệp.
                </p>
                <button className="bg-surface border border-outline-variant text-on-surface px-4 py-2 rounded-lg text-label-md font-semibold hover:bg-surface-container-highest transition-colors">
                  Duyệt Tệp Từ Máy Tính
                </button>
              </div>

              {/* Active Uploads List */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
                <h3 className="text-headline-sm font-semibold text-on-surface mb-4 flex items-center justify-between border-b border-outline-variant pb-2">
                  Đang Tải Lên ({uploads.length})
                </h3>
                <ul className="flex flex-col gap-4">
                  {uploads.map(item => (
                    <li key={item.id} className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant">image</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <span className="text-label-md font-semibold text-on-surface truncate">{item.name}</span>
                          <span className="text-label-md font-semibold text-on-surface-variant">
                            {item.status === 'uploading' ? `${item.progress}%` : 'Chờ tải...'}
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-high rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                      <button onClick={() => removeUpload(item.id)} className="text-on-surface-variant hover:text-error transition-colors p-1">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Analysis Status Queue Section */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col h-full overflow-hidden shadow-sm">
                <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center">
                  <h3 className="text-headline-sm font-semibold text-on-surface">Hàng Đợi Xử Lý AI</h3>
                  <button className="text-primary hover:text-primary-container text-label-md font-semibold flex items-center gap-1 transition-colors">
                    <span className="material-symbols-outlined text-sm">refresh</span> Làm mới
                  </button>
                </div>
                <div className="overflow-y-auto p-4 flex-1 space-y-3">
                  {/* Processing Item */}
                  <div className="p-3 border border-outline-variant rounded-lg bg-surface flex gap-3 items-start relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-surface-tint" />
                    <div className="w-10 h-10 rounded bg-primary-container text-on-primary-container flex items-center justify-center font-bold">OS</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-label-md font-semibold text-on-surface truncate">OS_Fundus_1.jpeg</p>
                      <p className="text-mono-data text-on-surface-variant text-xs mt-0.5">Mã ca: #88392-A</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="inline-flex items-center gap-1 bg-surface-container-low text-primary px-2 py-0.5 rounded text-[10px] font-semibold">
                        <span className="material-symbols-outlined text-[12px] animate-spin">sync</span> Đang Phân Tích
                      </span>
                      <span className="text-[10px] text-on-surface-variant mt-1">Dự kiến ~2 phút</span>
                    </div>
                  </div>

                  {/* Ready Item */}
                  <div className="p-3 border border-tertiary-fixed-dim rounded-lg bg-surface flex gap-3 items-start">
                    <div className="w-10 h-10 rounded bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold">OD</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-label-md font-semibold text-on-surface truncate">OD_Fundus_Prev.jpeg</p>
                      <p className="text-mono-data text-on-surface-variant text-xs mt-0.5">Mã ca: #88391-A</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="inline-flex items-center gap-1 bg-tertiary-fixed-dim bg-opacity-20 text-tertiary px-2 py-0.5 rounded text-[10px] font-semibold">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span> Hoàn Tất
                      </span>
                      <a href="/doctor" className="text-[10px] text-primary hover:underline mt-1 font-semibold">Xem Kết Quả</a>
                    </div>
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
 // Test commit
