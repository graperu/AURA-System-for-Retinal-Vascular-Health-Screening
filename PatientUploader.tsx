import React, { useState, useRef } from 'react';
import { UploadCloud, FileImage, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Image as ImageIcon } from 'lucide-react';
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
  // Eye selection mode: 'Both_OD_OS' | 'Right_OD' | 'Left_OS'
  const [eyeMode, setEyeMode] = useState<'Both_OD_OS' | 'Right_OD' | 'Left_OS'>('Both_OD_OS');
  const [scanType, setScanType] = useState<'Fundus_Macula' | 'Fundus_OpticDisc' | 'OCT_Scan'>('Fundus_Macula');
  const [isAnonymized, setIsAnonymized] = useState(true);

  // Right Eye (OD) State
  const [odFile, setOdFile] = useState<File | null>(null);
  const [odPreviewUrl, setOdPreviewUrl] = useState<string>('/assets/images/fundus_original.png');
  const [odDragOver, setOdDragOver] = useState(false);

  // Left Eye (OS) State
  const [osFile, setOsFile] = useState<File | null>(null);
  const [osPreviewUrl, setOsPreviewUrl] = useState<string>('/assets/images/fundus_original.png');
  const [osDragOver, setOsDragOver] = useState(false);

  const odInputRef = useRef<HTMLInputElement>(null);
  const osInputRef = useRef<HTMLInputElement>(null);

  const handleOdFile = (file: File) => {
    setOdFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setOdPreviewUrl(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOsFile = (file: File) => {
    setOsFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setOsPreviewUrl(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isDual = eyeMode === 'Both_OD_OS';
    const mainFile = isDual ? (odFile || osFile) : (eyeMode === 'Right_OD' ? odFile : osFile);
    const mainPreview = isDual ? odPreviewUrl : (eyeMode === 'Right_OD' ? odPreviewUrl : osPreviewUrl);
    const mainName = mainFile ? mainFile.name : (eyeMode === 'Left_OS' ? 'fundus_scan_OS_2026.png' : 'fundus_scan_OD_2026.png');

    const request: FundusAnalysisRequest = {
      requestId: `REQ-${Date.now().toString().slice(-6)}`,
      patientId: activePatient.id,
      clinicId: 'CLN-MAIN-01',
      imageName: mainName,
      imageUrl: mainPreview,
      file: mainFile || undefined,
      scanType,
      eyePosition: eyeMode,
      uploadedAt: new Date().toISOString(),
      isDualEye: isDual,
      odFile: odFile || undefined,
      odImageUrl: odPreviewUrl,
      odImageName: odFile ? odFile.name : 'fundus_scan_OD_2026.png',
      osFile: osFile || undefined,
      osImageUrl: osPreviewUrl,
      osImageName: osFile ? osFile.name : 'fundus_scan_OS_2026.png',
    };
    onStartAnalysis(request);
  };

  return (
    <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-medical-md space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#134E4A] flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#0891B2]" />
            Tải ảnh võng mạc khám sàng lọc (FR-2: 2 Mắt OD & OS)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hỗ trợ DICOM, PNG, JPEG, TIFF. Tải đồng thời 2 mắt (Mắt phải OD & Mắt trái OS) để sàng lọc mạch máu toàn diện nhất.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-[#F0FDFA] px-3 py-1.5 rounded-lg border border-[#99F6E4]">
          <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
          <span className="font-semibold text-[#134E4A]">Bảo mật HIPAA</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Controls: Mode & Scan Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chế độ khám mắt
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEyeMode('Both_OD_OS')}
                className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all text-center ${eyeMode === 'Both_OD_OS'
                  ? 'bg-[#0891B2] text-white border-[#0891B2] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
              >
                Cả 2 mắt (OD + OS)
              </button>
              <button
                type="button"
                onClick={() => setEyeMode('Right_OD')}
                className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all text-center ${eyeMode === 'Right_OD'
                  ? 'bg-[#0891B2] text-white border-[#0891B2] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
              >
                Chỉ Mắt phải (OD)
              </button>
              <button
                type="button"
                onClick={() => setEyeMode('Left_OS')}
                className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all text-center ${eyeMode === 'Left_OS'
                  ? 'bg-[#0891B2] text-white border-[#0891B2] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
              >
                Chỉ Mắt trái (OS)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Loại ảnh chụp y tế
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

        {/* Dropzones Grid */}
        <div className={`grid gap-4 ${eyeMode === 'Both_OD_OS' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Right Eye (OD) Dropzone */}
          {(eyeMode === 'Both_OD_OS' || eyeMode === 'Right_OD') && (
            <div
              onDragOver={(e) => { e.preventDefault(); setOdDragOver(true); }}
              onDragLeave={() => setOdDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOdDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) handleOdFile(e.dataTransfer.files[0]);
              }}
              onClick={() => odInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all relative ${odDragOver
                ? 'border-[#0891B2] bg-[#F0FDFA]'
                : odFile
                  ? 'border-[#16A34A] bg-emerald-50/40'
                  : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/80'
                }`}
            >
              <input
                type="file"
                ref={odInputRef}
                onChange={(e) => e.target.files?.[0] && handleOdFile(e.target.files[0])}
                accept=".dcm,.png,.jpg,.jpeg,.tif"
                className="hidden"
              />
              <div className="absolute top-3 left-3 bg-[#0891B2] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Mắt Phải (OD)
              </div>
              <div className="flex flex-col items-center justify-center gap-2.5 pt-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[#0891B2] shadow-sm bg-slate-950 flex items-center justify-center">
                  <img
                    src={odPreviewUrl}
                    alt="OD Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                {odFile ? (
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#16A34A] flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã chọn OD: {odFile.name}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {(odFile.size / 1024 / 1024).toFixed(2)} MB • Nhấp để đổi ảnh
                    </span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1">
                      <UploadCloud className="w-4 h-4 text-[#0891B2]" /> Tải ảnh Mắt Phải (OD)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Kéo thả ảnh hoặc nhấp để chọn file
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Left Eye (OS) Dropzone */}
          {(eyeMode === 'Both_OD_OS' || eyeMode === 'Left_OS') && (
            <div
              onDragOver={(e) => { e.preventDefault(); setOsDragOver(true); }}
              onDragLeave={() => setOsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) handleOsFile(e.dataTransfer.files[0]);
              }}
              onClick={() => osInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all relative ${osDragOver
                ? 'border-[#0891B2] bg-[#F0FDFA]'
                : osFile
                  ? 'border-[#16A34A] bg-emerald-50/40'
                  : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/80'
                }`}
            >
              <input
                type="file"
                ref={osInputRef}
                onChange={(e) => e.target.files?.[0] && handleOsFile(e.target.files[0])}
                accept=".dcm,.png,.jpg,.jpeg,.tif"
                className="hidden"
              />
              <div className="absolute top-3 left-3 bg-[#0D9488] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Mắt Trái (OS)
              </div>
              <div className="flex flex-col items-center justify-center gap-2.5 pt-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[#0D9488] shadow-sm bg-slate-950 flex items-center justify-center">
                  <img
                    src={osPreviewUrl}
                    alt="OS Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                {osFile ? (
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#16A34A] flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã chọn OS: {osFile.name}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {(osFile.size / 1024 / 1024).toFixed(2)} MB • Nhấp để đổi ảnh
                    </span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1">
                      <UploadCloud className="w-4 h-4 text-[#0D9488]" /> Tải ảnh Mắt Trái (OS)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Kéo thả ảnh hoặc nhấp để chọn file
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
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
              Tự động ẩn danh hóa thông tin bệnh nhân (HMAC SHA-256 / ISO 15224)
            </span>
          </label>
          <span className="text-[11px] text-[#16A34A] font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> An toàn bảo mật
          </span>
        </div>

        {/* Analysis Execution Progress Bar */}
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
              Thời gian thực thi AI: ~2-5s (PyTorch / OpenCV CLAHE đa luồng song song)
            </div>
          </div>
        ) : (
          <button
            type="submit"
            className="w-full py-3 bg-[#0891B2] hover:bg-[#0E7490] text-white font-bold rounded-xl text-sm transition-all shadow-medical-md flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            {eyeMode === 'Both_OD_OS'
              ? 'Bắt đầu phân tích toàn diện 2 mắt (OD & OS) bằng AI'
              : `Bắt đầu phân tích AI cho ${eyeMode === 'Right_OD' ? 'Mắt Phải (OD)' : 'Mắt Trái (OS)'}`}
          </button>
        )}
      </form>
    </div>
  );
};
