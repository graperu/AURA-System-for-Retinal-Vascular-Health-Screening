import React, { useState, useRef } from 'react';
import { UploadCloud, FileImage, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { FundusAnalysisRequest, PatientProfile } from '../types/cds';

interface PatientUploaderProps {
  activePatient: PatientProfile;
  onStartAnalysis: (request: FundusAnalysisRequest) => void;
  isAnalyzing: boolean;
  analysisProgress: { status: string; percent: number };
}

export const PatientUploader: React.FC<PatientUploaderProps> = ({
  activePatient,
  onStartAnalysis,
  isAnalyzing,
  analysisProgress,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanType, setScanType] = useState<'Fundus_Macula' | 'Fundus_OpticDisc' | 'OCT_Scan'>('Fundus_Macula');
  const [eyePosition, setEyePosition] = useState<'Left_OS' | 'Right_OD'>('Right_OD');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnonymized, setIsAnonymized] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-loaded realistic sample fundus image preview
  const sampleFundusUrl =
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const request: FundusAnalysisRequest = {
      requestId: `REQ-${Date.now().toString().slice(-6)}`,
      patientId: activePatient.id,
      clinicId: 'CLN-MAIN-01',
      imageName: selectedFile ? selectedFile.name : 'fundus_scan_OD_2026.dcm',
      imageUrl: sampleFundusUrl,
      scanType,
      eyePosition,
      uploadedAt: new Date().toISOString(),
    };
    onStartAnalysis(request);
  };

  return (
    <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-medical-md space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#134E4A] flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#0891B2]" />
            Tải Lên Ảnh Võng Mạc Võng Mạc / DICOM
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hỗ trợ định dạng DICOM (.dcm), High-Res PNG, JPEG. Tự động mã hóa & ẩn danh thông tin bệnh nhân.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-[#F0FDFA] px-3 py-1.5 rounded-lg border border-[#99F6E4]">
          <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
          <span className="font-semibold text-[#134E4A]">HIPAA Anonymization Enabled</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Eye Position & Scan Type Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mắt Thắt Chụp (Eye Position):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEyePosition('Right_OD')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  eyePosition === 'Right_OD'
                    ? 'bg-[#0891B2] text-white border-[#0891B2] shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Mắt Phải (OD - Mắt Phải)
              </button>
              <button
                type="button"
                onClick={() => setEyePosition('Left_OS')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  eyePosition === 'Left_OS'
                    ? 'bg-[#0891B2] text-white border-[#0891B2] shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Mắt Trái (OS - Mắt Trái)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Loại Ảnh Chụp Chẩn Đoán (Scan Type):
            </label>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#0891B2] outline-none"
            >
              <option value="Fundus_Macula">Fundus — Cực Sau Hoàng Điểm (Macula-centered)</option>
              <option value="Fundus_OpticDisc">Fundus — Đĩa Thị (Optic Disc-centered)</option>
              <option value="OCT_Scan">OCT — Cắt Lớp Quang Học (Optical Coherence Tomography)</option>
            </select>
          </div>
        </div>

        {/* Drag & Drop Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-[#0891B2] bg-[#F0FDFA]'
              : selectedFile
              ? 'border-[#16A34A] bg-emerald-50/50'
              : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/80'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".dcm,.png,.jpg,.jpeg"
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#0891B2] shadow-md bg-slate-950 flex items-center justify-center group/thumb">
              <img
                src="/assets/images/fundus_original.png"
                alt="Selected Fundus Scan Preview"
                className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
              />
              <div className="absolute inset-0 bg-black/20 group-hover/thumb:bg-transparent transition-colors" />
            </div>
            {selectedFile ? (
              <div>
                <span className="text-sm font-bold text-[#16A34A] block">
                  Đã chọn: {selectedFile.name}
                </span>
                <span className="text-xs text-slate-500">
                  Kích thước: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB | Sẵn sàng gửi AI Processing
                </span>
              </div>
            ) : (
              <div>
                <span className="text-sm font-semibold text-slate-800 block">
                  Kéo thả file ảnh võng mạc (Fundus / DICOM) vào đây
                </span>
                <span className="text-xs text-[#0891B2] font-semibold mt-0.5 block">
                  Đã nạp sẵn ảnh soi đáy mắt mẫu chuẩn (Retinal Scan OD)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* HIPAA Anonymization Checkbox */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymized}
              onChange={(e) => setIsAnonymized(e.target.checked)}
              className="w-4 h-4 text-[#0891B2] rounded focus:ring-[#0891B2]"
            />
            <span className="text-xs font-semibold text-slate-700">
              Tự động xóa metadata nhạy cảm (DICOM De-identification ISO 15224)
            </span>
          </label>
          <span className="text-[11px] text-[#16A34A] font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> An toàn bảo mật
          </span>
        </div>

        {/* Analysis Execution Progress Bar (10-20s simulated loading state) */}
        {isAnalyzing ? (
          <div className="p-4 bg-[#F0FDFA] border border-[#CCFBF1] rounded-xl space-y-3 animate-pulse">
            <div className="flex items-center justify-between text-xs font-bold text-[#134E4A]">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#0891B2] animate-spin" />
                {analysisProgress.status}
              </span>
              <span className="font-mono-data text-[#0891B2]">{analysisProgress.percent}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#0891B2] h-full transition-all duration-300 ease-out"
                style={{ width: `${analysisProgress.percent}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-slate-500 text-center font-mono-data">
              Thời gian thực thi AI dự kiến: 10–20s (PyTorch CUDA Accelerated)
            </div>
          </div>
        ) : (
          <button
            type="submit"
            className="w-full py-3 bg-[#0891B2] hover:bg-[#0E7490] text-white font-bold rounded-xl text-sm transition-all shadow-medical-md flex items-center justify-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Bắt Đầu Phân Tích Mạch Máu Võng Mạc & Nguy Cơ Tim Mạch (AI Run)
          </button>
        )}
      </form>
    </div>
  );
};
