import React, { useRef, useState } from 'react';
import { LesionAnnotationMarker } from '../types/cds';
import { MapPin, Trash2, Info } from 'lucide-react';

interface LesionAnnotationCanvasProps {
  imageUrl?: string;
  markers: LesionAnnotationMarker[];
  onChange: (markers: LesionAnnotationMarker[]) => void;
}

// FR-19: Cho phép bác sĩ đánh dấu vị trí vùng tổn thương ngay trên ảnh fundus
// để gửi kèm phản hồi hiệu chỉnh về kho dữ liệu tái huấn luyện mô hình
// (vesselAnnotationData). Đây là công cụ đánh dấu điểm đơn giản (click-to-mark),
// không phải công cụ khoanh vùng tự do (freehand polygon).
export const LesionAnnotationCanvas: React.FC<LesionAnnotationCanvasProps> = ({
  imageUrl,
  markers,
  onChange,
}) => {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [pendingMarkerId, setPendingMarkerId] = useState<string | null>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = imageContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    const newMarker: LesionAnnotationMarker = {
      id: `LES-${Date.now().toString().slice(-6)}`,
      xPercent: Math.max(0, Math.min(100, xPercent)),
      yPercent: Math.max(0, Math.min(100, yPercent)),
    };
    onChange([...markers, newMarker]);
    setPendingMarkerId(newMarker.id);
    setNoteDraft('');
  };

  const handleRemoveMarker = (id: string) => {
    onChange(markers.filter((m) => m.id !== id));
    if (pendingMarkerId === id) setPendingMarkerId(null);
  };

  const handleSaveNote = (id: string) => {
    onChange(markers.map((m) => (m.id === id ? { ...m, note: noteDraft } : m)));
    setPendingMarkerId(null);
    setNoteDraft('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#0891B2]" />
          Đánh Dấu Vùng Tổn Thương Trên Ảnh (Lesion Annotation)
        </label>
        {markers.length > 0 && (
          <span className="text-[11px] font-mono-data text-slate-500">{markers.length} điểm đã đánh dấu</span>
        )}
      </div>

      <div className="flex items-start gap-2 p-2.5 bg-[#F0FDFA] border border-[#CCFBF1] rounded-lg">
        <Info className="w-3.5 h-3.5 text-[#0891B2] mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-slate-600">
          Nhấp vào vị trí tổn thương trên ảnh để đặt điểm đánh dấu. Dữ liệu này sẽ được gửi kèm phản
          hồi về kho dữ liệu tái huấn luyện mô hình AI (FR-19).
        </p>
      </div>

      <div
        ref={imageContainerRef}
        onClick={handleImageClick}
        className="relative w-full max-w-md mx-auto aspect-square rounded-xl overflow-hidden border-2 border-slate-800 bg-black cursor-crosshair select-none"
      >
        <img
          src={imageUrl || '/assets/images/fundus_original.png'}
          alt="Ảnh fundus để đánh dấu tổn thương"
          className="w-full h-full object-cover pointer-events-none"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/images/fundus_original.png';
          }}
        />
        {markers.map((m, idx) => (
          <div
            key={m.id}
            onClick={(e) => e.stopPropagation()}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${m.xPercent}%`, top: `${m.yPercent}%` }}
          >
            <button
              type="button"
              onClick={() => setPendingMarkerId(pendingMarkerId === m.id ? null : m.id)}
              className="w-6 h-6 rounded-full bg-red-500/90 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
              title={m.note || `Điểm ${idx + 1}`}
            >
              {idx + 1}
            </button>
          </div>
        ))}
      </div>

      {markers.length > 0 && (
        <div className="space-y-1.5">
          {markers.map((m, idx) => (
            <div
              key={m.id}
              className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </span>
              {pendingMarkerId === m.id ? (
                <>
                  <input
                    autoFocus
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveNote(m.id)}
                    placeholder="Mô tả tổn thương (vd: Vi phình mạch, Xuất huyết)..."
                    className="flex-1 px-2 py-1 border border-slate-300 rounded outline-none focus:border-[#0891B2]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveNote(m.id)}
                    className="text-[#0891B2] font-semibold px-2"
                  >
                    Lưu
                  </button>
                </>
              ) : (
                <span
                  className="flex-1 text-slate-600 cursor-text"
                  onClick={() => {
                    setPendingMarkerId(m.id);
                    setNoteDraft(m.note || '');
                  }}
                >
                  {m.note || <em className="text-slate-400">Nhấp để thêm mô tả...</em>}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemoveMarker(m.id)}
                className="text-slate-400 hover:text-red-600 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
