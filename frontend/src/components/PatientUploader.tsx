import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  X,
  FileCheck,
} from 'lucide-react';
import { FundusAnalysisRequest, PatientProfile } from '../types/cds';

interface PatientUploaderProps {
  activePatient: PatientProfile;
  onStartAnalysis: (request: FundusAnalysisRequest) => void;
  isAnalyzing: boolean;
  analysisProgress: { status: string; percent: number };
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.tif', '.tiff', '.dcm'];

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
  const [uploadError, setUploadError] = useState<string>('');

  // Right Eye (OD) State
  const [odFile, setOdFile] = useState<File | null>(null);
  const [odPreviewUrl, setOdPreviewUrl] = useState<string>('');
  const [odDragOver, setOdDragOver] = useState(false);

  // Left Eye (OS) State
  const [osFile, setOsFile] = useState<File | null>(null);
  const [osPreviewUrl, setOsPreviewUrl] = useState<string>('');
  const [osDragOver, setOsDragOver] = useState(false);

  const odInputRef = useRef<HTMLInputElement>(null);
  const osInputRef = useRef<HTMLInputElement>(null);

  // Validation hàm kiểm tra định dạng và kích thước file
  const validateFile = (file: File): boolean => {
    // 1. Kiểm tra kích thước file
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(
        `Tệp "${file.name}" vượt quá dung lượng tối đa cho phép (15MB). Dung lượng hiện tại: ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)} MB.`
      );
      return false;
    }

    if (file.size === 0) {
      setUploadError(`Tệp "${file.name}" rỗng (0 bytes). Vui lòng chọn tệp ảnh chụp võng mạc hợp lệ.`);
      return false;
    }

    // 2. Kiểm tra phần mở rộng file (Extension)
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError(
        `Định dạng tệp "${ext}" không được hỗ trợ. Vui lòng tải lên tệp DICOM (.dcm), PNG (.png), JPEG (.jpg, .jpeg) hoặc TIFF (.tif).`
      );
      return false;
    }

    setUploadError('');
    return true;
  };

  const handleOdFile = (file: File) => {
    if (!validateFile(file)) return;
    setOdFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setOdPreviewUrl(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOsFile = (file: File) => {
    if (!validateFile(file)) return;
    setOsFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setOsPreviewUrl(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Nạp ảnh mẫu chuẩn khi người dùng muốn thử nghiệm demo
  const handleLoadDemoSample = () => {
    setUploadError('');
    const demoUrl = '/assets/images/fundus_original.png';
    setOdPreviewUrl(demoUrl);
    setOsPreviewUrl(demoUrl);
    // Tạo dummy File object với metadata
    const dummyFileOD = new File(['[AURA_DEMO_OD_DATA]'], 'fundus_demo_OD_sample.png', {
      type: 'image/png',
      lastModified: Date.now(),
    });
    const dummyFileOS = new File(['[AURA_DEMO_OS_DATA]'], 'fundus_demo_OS_sample.png', {
      type: 'image/png',
      lastModified: Date.now(),
    });
    setOdFile(dummyFileOD);
    setOsFile(dummyFileOS);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');

    const hasOD = Boolean(odFile);
    const hasOS = Boolean(osFile);

    // Kiểm tra tính hợp lệ: bắt buộc phải có file thực sự được chọn
    if (eyeMode === 'Both_OD_OS' && !hasOD && !hasOS) {
      setUploadError(
        'Vui lòng tải lên ít nhất một ảnh chụp võng mạc (Mắt Phải OD hoặc Mắt Trái OS) trước khi bắt đầu phân tích AI.'
      );
      return;
    }
    if (eyeMode === 'Right_OD' && !hasOD) {
      setUploadError('Vui lòng chọn tệp ảnh chụp võng mạc cho Mắt Phải (OD) trước khi bắt đầu phân tích AI.');
      return;
    }
    if (eyeMode === 'Left_OS' && !hasOS) {
      setUploadError('Vui lòng chọn tệp ảnh chụp võng mạc cho Mắt Trái (OS) trước khi bắt đầu phân tích AI.');
      return;
    }

    // Xác định chế độ thực tế: nếu chọn Cả 2 mắt nhưng chỉ tải 1 bên thì chỉ phân tích bên đó
    const isDual = eyeMode === 'Both_OD_OS' && hasOD && hasOS;
    const effectiveEyePosition: 'Both_OD_OS' | 'Right_OD' | 'Left_OS' = isDual
      ? 'Both_OD_OS'
      : (hasOD ? 'Right_OD' : 'Left_OS');

    const mainFile = hasOD ? odFile : osFile;
    const mainPreview = hasOD ? odPreviewUrl : osPreviewUrl;
    const mainName = mainFile ? mainFile.name : (effectiveEyePosition === 'Left_OS' ? 'fundus_scan_OS.png' : 'fundus_scan_OD.png');

    const request: FundusAnalysisRequest = {
      requestId: `REQ-${Date.now().toString().slice(-6)}`,
      patientId: activePatient.id || 'PAT-DEFAULT',
      clinicId: 'CLN-MAIN-01',
      imageName: mainName,
      imageUrl: mainPreview,
      file: mainFile || undefined,
      scanType,
      eyePosition: effectiveEyePosition,
      uploadedAt: new Date().toISOString(),
      isDualEye: isDual,
      odFile: hasOD ? odFile! : undefined,
      odImageUrl: hasOD ? odPreviewUrl : undefined,
      odImageName: hasOD && odFile ? odFile.name : undefined,
      osFile: hasOS ? osFile! : undefined,
      osImageUrl: hasOS ? osPreviewUrl : undefined,
      osImageName: hasOS && osFile ? osFile.name : undefined,
    };

    onStartAnalysis(request);
  };

  return (
    <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-medical-md space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#134E4A] flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#0891B2]" />
            Tải ảnh võng mạc khám sàng lọc (FR-2: 2 Mắt OD & OS)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hỗ trợ DICOM (.dcm), PNG, JPEG, TIFF (tối đa 15MB/ảnh). Sàng lọc mạch máu võng mạc và đánh giá rủi ro tim mạch.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadDemoSample}
            className="text-[11px] font-bold text-[#0891B2] hover:text-[#0E7490] px-2.5 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition-colors flex items-center gap-1"
            title="Nạp nhanh ảnh mẫu đáy mắt để thử nghiệm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0891B2]" />
            Dùng ảnh mẫu AURA
          </button>
          <div className="flex items-center gap-1.5 text-xs bg-[#F0FDFA] px-3 py-1.5 rounded-lg border border-[#99F6E4]">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            <span className="font-semibold text-[#134E4A]">HIPAA An Toàn</span>
          </div>
        </div>
      </div>

      {/* Thông báo lỗi validation nếu có */}
      {uploadError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-start justify-between gap-2.5 animate-fadeIn">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError('')}
            className="text-rose-500 hover:text-rose-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form cấu hình tải ảnh */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chế độ chụp mắt (Vị trí nhãn cầu)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEyeMode('Both_OD_OS')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition-all text-center ${
                  eyeMode === 'Both_OD_OS'
                    ? 'bg-[#0891B2] text-white border-[#0891B2] shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Cả 2 mắt (OD + OS)
              </button>
              <button
                type="button"
                onClick={() => setEyeMode('Right_OD')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition-all text-center ${
                  eyeMode === 'Right_OD'
                    ? 'bg-[#0891B2] text-white border-[#0891B2] shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Mắt Phải (OD)
              </button>
              <button
                type="button"
                onClick={() => setEyeMode('Left_OS')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition-all text-center ${
                  eyeMode === 'Left_OS'
                    ? 'bg-[#0891B2] text-white border-[#0891B2] shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Mắt Trái (OS)
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
              onDragOver={(e) => {
                e.preventDefault();
                setOdDragOver(true);
              }}
              onDragLeave={() => setOdDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOdDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) handleOdFile(e.dataTransfer.files[0]);
              }}
              onClick={() => odInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all relative ${
                odDragOver
                  ? 'border-[#0891B2] bg-[#F0FDFA]'
                  : odFile
                  ? 'border-emerald-500 bg-emerald-50/30'
                  : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/80'
              }`}
            >
              <input
                type="file"
                ref={odInputRef}
                onChange={(e) => e.target.files?.[0] && handleOdFile(e.target.files[0])}
                accept=".dcm,.png,.jpg,.jpeg,.tif,.tiff"
                className="hidden"
              />
              <div className="absolute top-3 left-3 bg-[#0891B2] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Mắt Phải (OD)
              </div>
              {odFile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOdFile(null);
                    setOdPreviewUrl('');
                    if (odInputRef.current) odInputRef.current.value = '';
                  }}
                  className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 z-10 shadow-2xs"
                  title="Hủy chọn ảnh Mắt Phải"
                >
                  <X className="w-3 h-3" />
                  Bỏ ảnh
                </button>
              )}

              <div className="flex flex-col items-center justify-center gap-2.5 pt-4">
                {odPreviewUrl ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-[#0891B2] shadow-sm bg-slate-950 flex items-center justify-center">
                    <img src={odPreviewUrl} alt="OD Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-[#0891B2]">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                )}

                {odFile ? (
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Đã chọn: {odFile.name}
                    </span>
                    <span className="text-[11px] text-slate-500 block font-mono-data">
                      {(odFile.size / 1024 / 1024).toFixed(2)} MB • Nhấp để đổi tệp
                    </span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1">
                      <UploadCloud className="w-4 h-4 text-[#0891B2]" /> Tải ảnh Mắt Phải (OD)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Kéo thả ảnh hoặc nhấp để duyệt file từ máy tính
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Left Eye (OS) Dropzone */}
          {(eyeMode === 'Both_OD_OS' || eyeMode === 'Left_OS') && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setOsDragOver(true);
              }}
              onDragLeave={() => setOsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) handleOsFile(e.dataTransfer.files[0]);
              }}
              onClick={() => osInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all relative ${
                osDragOver
                  ? 'border-[#0D9488] bg-[#F0FDFA]'
                  : osFile
                  ? 'border-emerald-500 bg-emerald-50/30'
                  : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/80'
              }`}
            >
              <input
                type="file"
                ref={osInputRef}
                onChange={(e) => e.target.files?.[0] && handleOsFile(e.target.files[0])}
                accept=".dcm,.png,.jpg,.jpeg,.tif,.tiff"
                className="hidden"
              />
              <div className="absolute top-3 left-3 bg-[#0D9488] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Mắt Trái (OS)
              </div>
              {osFile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOsFile(null);
                    setOsPreviewUrl('');
                    if (osInputRef.current) osInputRef.current.value = '';
                  }}
                  className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 z-10 shadow-2xs"
                  title="Hủy chọn ảnh Mắt Trái"
                >
                  <X className="w-3 h-3" />
                  Bỏ ảnh
                </button>
              )}

              <div className="flex flex-col items-center justify-center gap-2.5 pt-4">
                {osPreviewUrl ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-[#0D9488] shadow-sm bg-slate-950 flex items-center justify-center">
                    <img src={osPreviewUrl} alt="OS Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0D9488]">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                )}

                {osFile ? (
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Đã chọn: {osFile.name}
                    </span>
                    <span className="text-[11px] text-slate-500 block font-mono-data">
                      {(osFile.size / 1024 / 1024).toFixed(2)} MB • Nhấp để đổi tệp
                    </span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1">
                      <UploadCloud className="w-4 h-4 text-[#0D9488]" /> Tải ảnh Mắt Trái (OS)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Kéo thả ảnh hoặc nhấp để duyệt file từ máy tính
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* HIPAA Anonymization Checkbox */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymized}
              onChange={(e) => setIsAnonymized(e.target.checked)}
              className="rounded border-slate-300 text-[#0891B2] focus:ring-[#0891B2]"
            />
            <span className="font-semibold text-slate-800">
              Tự động ẩn danh hóa thông tin định danh y tế (HIPAA Safe Harbor De-identification)
            </span>
          </label>
          <span className="text-[11px] text-slate-500">Mã hóa SHA-256</span>
        </div>

        {/* Action Button & Progress */}
        <div className="pt-2">
          {isAnalyzing ? (
            <div className="space-y-2 p-4 bg-[#F0FDFA] border border-[#CCFBF1] rounded-xl">
              <div className="flex justify-between items-center text-xs font-bold text-[#134E4A]">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0891B2]" />
                  {analysisProgress.status}
                </span>
                <span className="font-mono-data">{analysisProgress.percent}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#0891B2] to-[#0D9488] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${analysisProgress.percent}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-[#0891B2] to-[#0D9488] hover:from-[#0E7490] hover:to-[#0F766E] text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              {eyeMode === 'Both_OD_OS' && odFile && osFile
                ? 'Bắt Đầu Phân Tích Mạch Máu Võng Mạc AI (Cả 2 Mắt OD & OS)'
                : (eyeMode === 'Left_OS' || (!odFile && osFile))
                ? 'Bắt Đầu Phân Tích Mạch Máu Võng Mạc AI (Mắt Trái OS)'
                : 'Bắt Đầu Phân Tích Mạch Máu Võng Mạc AI (Mắt Phải OD)'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
