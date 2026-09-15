import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  UploadCloud,
  FileImage,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  FileCheck,
  Loader2,
  RotateCcw,
  Target,
  CircleDot,
  Layers,
  Zap,
} from 'lucide-react';
import { FundusAnalysisRequest, PatientProfile } from '../types/cds';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { ClinicalSelect, ClinicalSelectOption } from './ui/ClinicalSelect';
import { useLanguage } from '../context/LanguageContext';

export interface PatientUploaderProps {
  activePatient: PatientProfile;
  onStartAnalysis: (
    request: FundusAnalysisRequest & {
      eye?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
    }
  ) => void;
  isAnalyzing: boolean;
  analysisProgress: { status: string; percent: number };
  analysisError?: string | null;
  onRetry?: () => void;
  userCredits?: number;
  onOpenCreditModal?: () => void;
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.tif', '.tiff', '.dcm'];

export const PatientUploader: React.FC<PatientUploaderProps> = ({
  activePatient,
  onStartAnalysis,
  isAnalyzing,
  analysisProgress,
  analysisError,
  onRetry,
  userCredits,
  onOpenCreditModal,
}) => {
  const { t, isVi } = useLanguage();

  const scanTypeOptions: ClinicalSelectOption<'Fundus_Macula' | 'Fundus_OpticDisc' | 'OCT_Scan'>[] = useMemo(() => [
    {
      value: 'Fundus_Macula',
      label: isVi ? 'Ảnh màu đáy mắt hoàng điểm' : 'Macula-Centered Fundus Color',
      sublabel: isVi
        ? 'Tập trung vùng hoàng điểm và vi mạch trung tâm'
        : 'Foveal center and parafoveal capillary network',
      icon: <Target className="w-4 h-4 text-[#0891B2]" />,
    },
    {
      value: 'Fundus_OpticDisc',
      label: isVi ? 'Ảnh màu đáy mắt gai thị' : 'Optic Disc Fundus Color',
      sublabel: isVi
        ? 'Tập trung gai thị và tỷ lệ cup/disc'
        : 'Neuroretinal rim and optic cup',
      icon: <CircleDot className="w-4 h-4 text-[#0891B2]" />,
    },
    {
      value: 'OCT_Scan',
      label: isVi ? 'Chụp cắt lớp võng mạc (OCT)' : 'Optical Coherence Tomography (OCT)',
      sublabel: isVi
        ? 'Phân tích lớp cắt chuyên sâu'
        : 'Cross-sectional tomographic imaging',
      icon: <Layers className="w-4 h-4 text-[#0891B2]" />,
    },
  ], [isVi]);

  const eyeOptions = useMemo(() => [
    { id: 'Right_OD' as const, label: isVi ? 'Mắt Phải (OD)' : 'Right Eye (OD)' },
    { id: 'Left_OS' as const, label: isVi ? 'Mắt Trái (OS)' : 'Left Eye (OS)' },
  ], [isVi]);

  const [eyeMode, setEyeMode] = useState<'Right_OD' | 'Left_OS'>('Right_OD');
  const [scanType, setScanType] = useState<'Fundus_Macula' | 'Fundus_OpticDisc' | 'OCT_Scan'>('Fundus_Macula');
  const [uploadError, setUploadError] = useState<string>('');
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

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

  // VULN-04 FIX: Tự động dọn dẹp triệt để tệp và preview khi chuyển đổi bệnh nhân
  useEffect(() => {
    setOdFile(null);
    setOdPreviewUrl('');
    setOsFile(null);
    setOsPreviewUrl('');
    setUploadError('');
    if (odInputRef.current) {
      odInputRef.current.value = '';
    }
    if (osInputRef.current) {
      osInputRef.current.value = '';
    }
  }, [activePatient?.id, activePatient?.userId]);

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(
        `${file.name} ${t('uploader.fileSizeError', isVi ? 'vượt quá dung lượng tối đa cho phép (15MB)' : 'exceeds maximum allowed size (15MB)')}. (${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)} MB)`
      );
      return false;
    }

    if (file.size === 0) {
      setUploadError(
        `${file.name}: ${t('uploader.fileEmptyError', isVi ? 'Tệp rỗng (0 bytes). Vui lòng chọn tệp ảnh hợp lệ.' : 'File is empty (0 bytes). Please select a valid fundus image.')}`
      );
      return false;
    }

    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError(
        `${ext}: ${t('uploader.fileFormatError', isVi ? 'Định dạng tệp không được hỗ trợ. Vui lòng tải lên tệp DICOM (.dcm), PNG (.png), JPEG (.jpg, .jpeg) hoặc TIFF (.tif).' : 'Unsupported file format. Please upload DICOM (.dcm), PNG (.png), JPEG (.jpg, .jpeg) or TIFF (.tif).')}`
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

  // Fallback vẽ ảnh võng mạc bằng Canvas nếu fetch file tĩnh bị lỗi
  const fallbackToCanvasDemo = (mode: 'Right_OD' | 'Left_OS') => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Nền tối xung quanh
        ctx.fillStyle = '#0a0f1d';
        ctx.fillRect(0, 0, 512, 512);

        // Vùng cầu đáy mắt võng mạc
        const radGrad = ctx.createRadialGradient(256, 256, 40, 256, 256, 230);
        radGrad.addColorStop(0, '#ea580c');
        radGrad.addColorStop(0.65, '#c2410c');
        radGrad.addColorStop(0.92, '#7c2d12');
        radGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(256, 256, 226, 0, Math.PI * 2);
        ctx.fill();

        // Gai thị (Optic Disc)
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        const discX = mode === 'Right_OD' ? 360 : 152;
        ctx.arc(discX, 256, 32, 0, Math.PI * 2);
        ctx.fill();

        // Lõm gai (Optic Cup)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(discX, 256, 14, 0, Math.PI * 2);
        ctx.fill();

        // Hoàng điểm (Macula/Fovea)
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        const maculaX = mode === 'Right_OD' ? 200 : 312;
        ctx.arc(maculaX, 256, 24, 0, Math.PI * 2);
        ctx.fill();

        // Mạng lưới mạch máu võng mạc xuất phát từ gai thị
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(discX, 256);
        ctx.bezierCurveTo(discX + (mode === 'Right_OD' ? -60 : 60), 180, maculaX, 160, 256, 90);
        ctx.moveTo(discX, 256);
        ctx.bezierCurveTo(discX + (mode === 'Right_OD' ? -50 : 50), 320, maculaX, 350, 256, 420);
        ctx.stroke();

        ctx.strokeStyle = '#b91c1c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(discX, 256);
        ctx.bezierCurveTo(discX + (mode === 'Right_OD' ? -90 : 90), 220, maculaX, 230, maculaX - 40, 240);
        ctx.stroke();
      }

      const base64DataUrl = canvas.toDataURL('image/png');
      const byteCharacters = atob(base64DataUrl.split(',')[1]);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
      }
      const blob = new Blob(byteArrays, { type: 'image/png' });
      const fileName = mode === 'Right_OD' ? 'fundus_demo_OD_sample.png' : 'fundus_demo_OS_sample.png';
      const file = new File([blob], fileName, { type: 'image/png', lastModified: Date.now() });

      if (mode === 'Right_OD') {
        setOdPreviewUrl(base64DataUrl);
        setOdFile(file);
      } else {
        setOsPreviewUrl(base64DataUrl);
        setOsFile(file);
      }
    } catch (e) {
      console.error('Canvas fallback error:', e);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  // Nạp ảnh mẫu thực tế từ /assets/images/fundus_original.png và chuyển thành Base64 Data URI
  const handleLoadDemoSample = async () => {
    setUploadError('');
    setIsLoadingDemo(true);
    const demoPath = '/assets/images/fundus_original.png';

    try {
      const response = await fetch(demoPath);
      if (!response.ok) {
        throw new Error(`Fetch demo image failed: ${response.status}`);
      }
      const blob = await response.blob();
      const fileName = eyeMode === 'Right_OD' ? 'fundus_demo_OD_sample.png' : 'fundus_demo_OS_sample.png';
      const file = new File([blob], fileName, {
        type: blob.type || 'image/png',
        lastModified: Date.now(),
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result as string;
        if (eyeMode === 'Right_OD') {
          setOdPreviewUrl(base64Url);
          setOdFile(file);
        } else {
          setOsPreviewUrl(base64Url);
          setOsFile(file);
        }
        setIsLoadingDemo(false);
      };
      reader.onerror = () => {
        fallbackToCanvasDemo(eyeMode);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.warn('Fetch demo image failed, falling back to canvas generation:', err);
      fallbackToCanvasDemo(eyeMode);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');

    const hasOD = Boolean(odFile || odPreviewUrl);
    const hasOS = Boolean(osFile || osPreviewUrl);

    if (eyeMode === 'Right_OD' && !hasOD) {
      setUploadError(
        isVi
          ? 'Vui lòng chọn tệp ảnh chụp võng mạc cho Mắt Phải (OD) trước khi bắt đầu phân tích AI.'
          : 'Please select a retinal scan image for Right Eye (OD) before starting AI analysis.'
      );
      return;
    }
    if (eyeMode === 'Left_OS' && !hasOS) {
      setUploadError(
        isVi
          ? 'Vui lòng chọn tệp ảnh chụp võng mạc cho Mắt Trái (OS) trước khi bắt đầu phân tích AI.'
          : 'Please select a retinal scan image for Left Eye (OS) before starting AI analysis.'
      );
      return;
    }

    const effectiveEyePosition: 'Right_OD' | 'Left_OS' = eyeMode;

    const mainFile = eyeMode === 'Right_OD' ? odFile : osFile;
    const mainPreview = eyeMode === 'Right_OD' ? odPreviewUrl : osPreviewUrl;
    const mainName = mainFile
      ? mainFile.name
      : (effectiveEyePosition === 'Left_OS' ? 'fundus_scan_OS.png' : 'fundus_scan_OD.png');

    const request: FundusAnalysisRequest & {
      eye?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
    } = {
      requestId: `REQ-${Date.now().toString().slice(-6)}`,
      patientId: activePatient.id || activePatient.userId || '',
      clinicId: (activePatient as any)?.clinicId || undefined,
      imageName: mainName,
      imageUrl: mainPreview,
      file: mainFile || undefined,
      scanType,
      eyePosition: effectiveEyePosition,
      eye: effectiveEyePosition,
      fileName: mainName,
      fileSize: mainFile?.size,
      mimeType: mainFile?.type || 'image/png',
      uploadedAt: new Date().toISOString(),
      isDualEye: false,
      odFile: eyeMode === 'Right_OD' ? (odFile || undefined) : undefined,
      odImageUrl: eyeMode === 'Right_OD' ? (odPreviewUrl || undefined) : undefined,
      odImageName: eyeMode === 'Right_OD' ? (odFile?.name || (odPreviewUrl ? 'fundus_demo_OD_sample.png' : undefined)) : undefined,
      osFile: eyeMode === 'Left_OS' ? (osFile || undefined) : undefined,
      osImageUrl: eyeMode === 'Left_OS' ? (osPreviewUrl || undefined) : undefined,
      osImageName: eyeMode === 'Left_OS' ? (osFile?.name || (osPreviewUrl ? 'fundus_demo_OS_sample.png' : undefined)) : undefined,
    };

    onStartAnalysis(request);
  };

  return (
    <Card id="patient-uploader-card" padding="lg" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-clinical-border pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-clinical-text flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#0891B2] shrink-0" />
            <span>{isVi ? 'Tải Ảnh Võng Mạc Khám Sàng Lọc' : 'Upload Retinal Scan for Screening'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {isVi
              ? 'Hỗ trợ ảnh PNG, JPG, DICOM (tối đa 15MB). Dữ liệu được bảo mật mã hóa an toàn.'
              : 'Supports PNG, JPG, DICOM files (max 15MB). Clinical data is securely encrypted.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLoadDemoSample}
            disabled={isLoadingDemo || isAnalyzing}
            loading={isLoadingDemo}
            icon={<Sparkles className="w-3.5 h-3.5 text-[#0891B2]" />}
            className="text-xs font-semibold py-1.5 px-3"
          >
            {isLoadingDemo ? (isVi ? 'Đang nạp ảnh...' : 'Loading scan...') : (isVi ? 'Dùng ảnh mẫu' : 'Use sample scan')}
          </Button>
          <div className="flex items-center gap-1.5 text-xs bg-[#F0FDFA] text-[#0891B2] px-2.5 py-1.5 rounded-xl border border-[#CCFBF1] font-semibold whitespace-nowrap">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{isVi ? 'Chuẩn bảo mật HIPAA' : 'HIPAA Security'}</span>
          </div>
        </div>
      </div>

      {/* Banner Lỗi Nổi Bật Kèm Nút Thử Lại */}
      {(uploadError || analysisError) && (
        <div className="p-4 rounded-xl bg-red-50/90 border-2 border-red-300 text-xs text-red-800 flex items-start justify-between gap-3 animate-in fade-in shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-red-900 text-sm">
                {analysisError ? 'Không thể hoàn tất phân tích AI' : 'Lỗi kiểm tra tệp ảnh'}
              </h4>
              <p className="text-red-700 leading-relaxed">
                {analysisError || uploadError}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setUploadError('');
                if (onRetry) onRetry();
              }}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-lg text-xs shadow-xs transition-all flex items-center gap-1.5 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadError('');
                if (onRetry) onRetry();
              }}
              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100/80 active:bg-red-200 rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-red-400 cursor-pointer"
              title="Đóng thông báo"
              aria-label="Đóng thông báo lỗi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selection Configuration */}
        <div className="space-y-3.5 bg-slate-50/90 p-4 rounded-xl border border-clinical-border">
          {/* Eye Selection Mode */}
          <div>
            <label className="block text-xs font-semibold text-clinical-text mb-1.5">
              {isVi ? 'Chọn mắt sàng lọc' : 'Select Eye for Screening'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {eyeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setEyeMode(opt.id)}
                  className={`py-2 px-2.5 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    eyeMode === opt.id
                      ? 'bg-[#0891B2] text-white border-[#0891B2] shadow-xs'
                      : 'bg-white text-clinical-text-secondary border-clinical-border hover:bg-slate-100 hover:text-clinical-text'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      eyeMode === opt.id ? 'bg-white' : opt.id === 'Right_OD' ? 'bg-[#0891B2]' : 'bg-teal-600'
                    }`}
                  />
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scan Type Custom Clinical Select */}
          <div>
            <ClinicalSelect<'Fundus_Macula' | 'Fundus_OpticDisc' | 'OCT_Scan'>
              label={isVi ? 'Loại ảnh chụp đáy mắt' : 'Retinal Scan Modality'}
              value={scanType}
              onChange={(newVal) => setScanType(newVal)}
              options={scanTypeOptions}
              size="md"
            />
          </div>
        </div>

        {/* Upload Area */}
        <div className="w-full">
          {/* Right Eye (OD) */}
          {eyeMode === 'Right_OD' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-clinical-text flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0891B2]" />
                  {isVi ? 'Mắt Phải (OD)' : 'Right Eye (OD)'}
                </span>
                {odFile && (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {isVi ? 'Đã chọn' : 'Selected'}
                  </span>
                )}
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setOdDragOver(true);
                }}
                onDragLeave={() => setOdDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setOdDragOver(false);
                  if (e.dataTransfer.files[0]) handleOdFile(e.dataTransfer.files[0]);
                }}
                onClick={() => odInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  odDragOver
                    ? 'border-brand-600 bg-brand-50'
                    : odPreviewUrl
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-clinical-border hover:border-brand-400 bg-white'
                }`}
              >
                <input
                  type="file"
                  id="patient-uploader-od-input"
                  ref={odInputRef}
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleOdFile(e.target.files[0]);
                  }}
                  accept=".png,.jpg,.jpeg,.tif,.tiff,.dcm"
                  className="hidden"
                />

                {odPreviewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={odPreviewUrl}
                      alt={isVi ? 'Xem trước mắt phải' : 'Right eye preview'}
                      className="max-h-56 mx-auto rounded-lg object-contain border border-clinical-border shadow-xs"
                    />
                    <div className="text-xs text-slate-600 flex items-center justify-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium truncate max-w-[240px]">
                        {odFile?.name || (isVi ? 'Ảnh Mắt Phải (OD)' : 'Right Eye Scan (OD)')}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOdFile(null);
                          setOdPreviewUrl('');
                        }}
                        className="text-red-600 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                        title={isVi ? 'Xóa ảnh này' : 'Remove this image'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 py-6">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                      <FileImage className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-semibold text-clinical-text">
                      {isVi
                        ? 'Kéo thả ảnh Mắt Phải (OD) hoặc bấm tải lên'
                        : 'Drag & drop Right Eye (OD) image or click to upload'}
                    </div>
                    <p className="text-[11px] text-clinical-text-muted">
                      PNG, JPG, DICOM (tối đa 15MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Left Eye (OS) */}
          {eyeMode === 'Left_OS' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-clinical-text flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-600" />
                  {isVi ? 'Mắt Trái (OS)' : 'Left Eye (OS)'}
                </span>
                {osFile && (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {isVi ? 'Đã chọn' : 'Selected'}
                  </span>
                )}
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setOsDragOver(true);
                }}
                onDragLeave={() => setOsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setOsDragOver(false);
                  if (e.dataTransfer.files[0]) handleOsFile(e.dataTransfer.files[0]);
                }}
                onClick={() => osInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  osDragOver
                    ? 'border-brand-600 bg-brand-50'
                    : osPreviewUrl
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-clinical-border hover:border-brand-400 bg-white'
                }`}
              >
                <input
                  type="file"
                  ref={osInputRef}
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleOsFile(e.target.files[0]);
                  }}
                  accept=".png,.jpg,.jpeg,.tif,.tiff,.dcm"
                  className="hidden"
                />

                {osPreviewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={osPreviewUrl}
                      alt={isVi ? 'Xem trước mắt trái' : 'Left eye preview'}
                      className="max-h-56 mx-auto rounded-lg object-contain border border-clinical-border shadow-xs"
                    />
                    <div className="text-xs text-slate-600 flex items-center justify-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium truncate max-w-[240px]">
                        {osFile?.name || (isVi ? 'Ảnh Mắt Trái (OS)' : 'Left Eye Scan (OS)')}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOsFile(null);
                          setOsPreviewUrl('');
                        }}
                        className="text-red-600 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                        title={isVi ? 'Xóa ảnh này' : 'Remove this image'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 py-6">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                      <FileImage className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-semibold text-clinical-text">
                      {isVi
                        ? 'Kéo thả ảnh Mắt Trái (OS) hoặc bấm tải lên'
                        : 'Drag & drop Left Eye (OS) image or click to upload'}
                    </div>
                    <p className="text-[11px] text-clinical-text-muted">
                      PNG, JPG, DICOM (tối đa 15MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Thanh Tiến Trình Hiển Thị Mượt Mà Từ 0% Đến 100% */}
        {isAnalyzing && (
          <div className="bg-gradient-to-r from-teal-50/90 via-cyan-50/90 to-blue-50/90 p-5 rounded-2xl border-2 border-[#0891B2]/30 shadow-sm space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#0891B2]" />
                {analysisProgress.status || 'Đang thực hiện phân tích vi mạch AI...'}
              </span>
              <span className="font-mono-data font-black text-[#0891B2] bg-white px-3 py-1 rounded-xl border border-cyan-200 shadow-xs text-sm">
                {Math.min(100, Math.max(0, analysisProgress.percent))}%
              </span>
            </div>
            <div className="w-full bg-slate-200/90 h-3.5 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                className="bg-gradient-to-r from-[#0891B2] via-[#0D9488] to-[#16A34A] h-full rounded-full transition-all duration-300 ease-out shadow-xs"
                style={{ width: `${Math.min(100, Math.max(0, analysisProgress.percent))}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
              <span>0% {isVi ? 'Khởi tạo' : 'Init'}</span>
              <span>25% Multimodal Vision</span>
              <span>60% Biomarkers</span>
              <span>85% Grad-CAM</span>
              <span>100% {isVi ? 'Hoàn tất' : 'Complete'}</span>
            </div>
          </div>
        )}

        {/* Action Button & Remaining Credits */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {userCredits !== undefined ? (
            <div className="flex items-center gap-2 text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <span className="text-slate-500">
                {t('uploader.availableQuota', isVi ? 'Lượt khám khả dụng:' : 'Available screening quota:')}
              </span>
              <span
                className={`font-black font-mono-data px-2 py-0.5 rounded-md border text-xs ${
                  userCredits > 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {userCredits} {t('uploader.quotaUnit', isVi ? 'lượt' : 'credits')}
              </span>
              {userCredits <= 0 && onOpenCreditModal && (
                <button
                  type="button"
                  onClick={onOpenCreditModal}
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1 ml-1 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-teal-600 text-teal-600" />
                  <span>{t('uploader.topUp', isVi ? 'Nạp thêm' : 'Top up')}</span>
                </button>
              )}
            </div>
          ) : <div />}

          <Button
            type="submit"
            size="lg"
            loading={isAnalyzing}
            disabled={
              isAnalyzing ||
              isLoadingDemo ||
              (eyeMode === 'Right_OD' ? !odFile && !odPreviewUrl : !osFile && !osPreviewUrl)
            }
            icon={<Sparkles className="w-4 h-4" />}
          >
            {isAnalyzing
              ? (isVi ? 'Đang phân tích vi mạch AI...' : 'Analyzing with AI...')
              : (isVi ? 'Bắt đầu phân tích AI' : 'Start AI Analysis')}
          </Button>
        </div>
      </form>
    </Card>
  );
};
