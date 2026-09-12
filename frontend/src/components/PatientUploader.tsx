import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  FileCheck,
} from 'lucide-react';
import { FundusAnalysisRequest, PatientProfile } from '../types/cds';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

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

  const validateFile = (file: File): boolean => {
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

  const handleLoadDemoSample = () => {
    setUploadError('');
    const demoUrl = '/assets/images/fundus_original.webp';
    setOdPreviewUrl(demoUrl);
    setOsPreviewUrl(demoUrl);
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
    <Card padding="lg" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-clinical-border pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-clinical-text flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#0891B2]" />
            Tải Ảnh Võng Mạc Khám Sàng Lọc
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hỗ trợ ảnh PNG, JPG, DICOM (tối đa 15MB). Dữ liệu được bảo mật mã hóa an toàn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLoadDemoSample}
            icon={<Sparkles className="w-3.5 h-3.5 text-[#0891B2]" />}
          >
            Dùng ảnh mẫu
          </Button>
          <div className="flex items-center gap-1 text-xs bg-[#F0FDFA] text-[#0891B2] px-2.5 py-1.5 rounded-xl border border-[#CCFBF1] font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Chuẩn bảo mật</span>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selection Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-clinical-border">
          {/* Eye Selection Mode */}
          <div>
            <label className="block text-xs font-semibold text-clinical-text mb-1.5">
              Chọn mắt sàng lọc
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Both_OD_OS', label: 'Cả 2 Mắt (OD & OS)' },
                { id: 'Right_OD', label: 'Mắt Phải (OD)' },
                { id: 'Left_OS', label: 'Mắt Trái (OS)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setEyeMode(opt.id as any)}
                  className={`py-2 px-2.5 text-xs font-semibold rounded-lg border transition-colors ${
                    eyeMode === opt.id
                      ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                      : 'bg-white text-clinical-text-secondary border-clinical-border hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scan Type */}
          <div>
            <label className="block text-xs font-semibold text-clinical-text mb-1.5">
              Loại ảnh chụp đáy mắt
            </label>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value as any)}
              className="w-full h-9 px-3 text-xs rounded-lg border border-clinical-border bg-white text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Fundus_Macula">Ảnh màu đáy mắt hoàng điểm (Fundus Color - Macula Centered)</option>
              <option value="Fundus_OpticDisc">Ảnh màu đáy mắt gai thị (Fundus Color - Optic Disc)</option>
              <option value="OCT_Scan">Chụp cắt lớp võng mạc (Optical Coherence Tomography - OCT)</option>
            </select>
          </div>
        </div>

        {/* Dual Upload Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Right Eye (OD) */}
          {(eyeMode === 'Both_OD_OS' || eyeMode === 'Right_OD') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-clinical-text flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-600" />
                  Mắt Phải - OD (Oculus Dexter)
                </span>
                {odFile && (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã chọn
                  </span>
                )}
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setOdDragOver(true); }}
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
                      alt="Xem trước mắt phải"
                      className="max-h-48 mx-auto rounded-lg object-contain border border-clinical-border shadow-xs"
                    />
                    <div className="text-xs text-slate-600 flex items-center justify-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium truncate max-w-[200px]">{odFile?.name || 'Ảnh OD'}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOdFile(null);
                          setOdPreviewUrl('');
                        }}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Xóa ảnh này"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                      <FileImage className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-semibold text-clinical-text">
                      Kéo thả ảnh Mắt Phải (OD) hoặc bấm tải lên
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
          {(eyeMode === 'Both_OD_OS' || eyeMode === 'Left_OS') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-clinical-text flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-600" />
                  Mắt Trái - OS (Oculus Sinister)
                </span>
                {osFile && (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã chọn
                  </span>
                )}
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setOsDragOver(true); }}
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
                      alt="Xem trước mắt trái"
                      className="max-h-48 mx-auto rounded-lg object-contain border border-clinical-border shadow-xs"
                    />
                    <div className="text-xs text-slate-600 flex items-center justify-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium truncate max-w-[200px]">{osFile?.name || 'Ảnh OS'}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOsFile(null);
                          setOsPreviewUrl('');
                        }}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Xóa ảnh này"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                      <FileImage className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-semibold text-clinical-text">
                      Kéo thả ảnh Mắt Trái (OS) hoặc bấm tải lên
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

        {/* Progress Display */}
        {isAnalyzing && (
          <div className="bg-brand-50/60 p-4 rounded-xl border border-brand-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-brand-900">
                {analysisProgress.status || 'Đang thực hiện phân tích vi mạch AI...'}
              </span>
              <span className="font-mono-data font-bold text-brand-700">
                {analysisProgress.percent}%
              </span>
            </div>
            <div className="w-full bg-brand-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${analysisProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            size="lg"
            loading={isAnalyzing}
            disabled={isAnalyzing || (!odFile && !osFile && !odPreviewUrl && !osPreviewUrl)}
            icon={<Sparkles className="w-4 h-4" />}
          >
            {isAnalyzing ? 'Đang phân tích vi mạch AI...' : 'Bắt đầu phân tích AI'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
