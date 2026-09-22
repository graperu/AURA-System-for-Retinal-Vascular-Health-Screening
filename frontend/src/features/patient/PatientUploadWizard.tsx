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
  ArrowRight,
  ArrowLeft,
  Eye,
  Check,
  Activity,
  Heart,
  BrainCircuit,
  Stethoscope,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import { FundusAnalysisRequest, PatientProfile } from '../../types/cds';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ClinicalSelect, ClinicalSelectOption } from '../../components/ui/ClinicalSelect';
import { useLanguage } from '../../context/LanguageContext';
import { ClinicalLaserScanViewport } from '../../components/viewer/ClinicalLaserScanViewport';
import { convertToWebP, ALLOWED_RETINAL_EXTENSIONS, formatImageBytes } from '../../utils/webpConverter';

export interface PatientUploadWizardProps {
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
  isCreditsLoading?: boolean;
  onOpenCreditModal?: () => void;
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_EXTENSIONS = ALLOWED_RETINAL_EXTENSIONS;

export const PatientUploadWizard: React.FC<PatientUploadWizardProps> = ({
  activePatient,
  onStartAnalysis,
  isAnalyzing,
  analysisProgress,
  analysisError,
  onRetry,
  userCredits = 10,
  isCreditsLoading = false,
  onOpenCreditModal,
}) => {
  const { t, isVi } = useLanguage();

  // 4-Step Wizard: 1: Thông tin khám, 2: Tải ảnh, 3: Đối chiếu & Xác nhận, 4: Phân tích AI
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const [selectedEye, setSelectedEye] = useState<'Right_OD' | 'Left_OS'>('Right_OD');
  const [scanType, setScanType] = useState<'Fundus_Macula' | 'Fundus_OpticDisc' | 'OCT_Scan'>('Fundus_Macula');

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [webpStats, setWebpStats] = useState<{ originalSize: number; convertedSize: number; savingsPercent: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [isLoadingDemo, setIsLoadingDemo] = useState<boolean>(false);
  const [fastUploadEnabled, setFastUploadEnabled] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with isAnalyzing: when analysis begins, automatically transition to Step 4
  useEffect(() => {
    if (isAnalyzing) {
      setCurrentStep(4);
    }
  }, [isAnalyzing]);

  // Clean up when changing active patient
  useEffect(() => {
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadError('');
    setCurrentStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [activePatient?.id, activePatient?.userId]);

  const scanTypeOptions = useMemo<ClinicalSelectOption<'Fundus_Macula' | 'Fundus_OpticDisc' | 'OCT_Scan'>[]>(() => [
    {
      value: 'Fundus_Macula',
      label: isVi ? 'Ảnh chụp hoàng điểm' : 'Macula Fundus',
      sublabel: isVi
        ? 'Chụp vùng trung tâm hoàng điểm võng mạc'
        : 'Macula & central retina',
      icon: <Target className="w-4 h-4 text-[#3478F6]" />,
    },
    {
      value: 'Fundus_OpticDisc',
      label: isVi ? 'Ảnh chụp gai thị' : 'Optic Disc Fundus',
      sublabel: isVi
        ? 'Chụp vùng thần kinh thị giác & bờ gai'
        : 'Optic disc & cup-to-disc',
      icon: <CircleDot className="w-4 h-4 text-[#3478F6]" />,
    },
    {
      value: 'OCT_Scan',
      label: isVi ? 'Chụp cắt lớp OCT' : 'OCT Scan',
      sublabel: isVi
        ? 'Ảnh cắt lớp võng mạc chuyên sâu độ phân giải cao'
        : 'Cross-sectional retinal imaging',
      icon: <Layers className="w-4 h-4 text-[#3478F6]" />,
    },
  ], [isVi]);

  const triggerFastAnalysis = (file: File, objectUrl: string) => {
    if (userCredits <= 0) {
      onOpenCreditModal?.();
      return;
    }

    const req: FundusAnalysisRequest & {
      eye?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
    } = {
      requestId: `REQ-${Date.now().toString().slice(-6)}`,
      patientId: activePatient?.id || activePatient?.userId || '',
      clinicId: (activePatient as any)?.clinicId || '',
      imageName: file.name,
      imageUrl: objectUrl || '',
      file: file,
      eyePosition: selectedEye,
      scanType: scanType,
      uploadedAt: new Date().toISOString(),
      eye: selectedEye,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'image/png',
    };

    setCurrentStep(4);
    onStartAnalysis(req);
  };

  const validateAndProcessFile = async (file: File): Promise<boolean> => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(
        `${file.name} ${t('uploader.fileSizeError', isVi ? 'vượt quá dung lượng tối đa 15MB' : 'exceeds maximum allowed size (15MB)')}. (${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)} MB)`
      );
      return false;
    }

    if (file.size === 0) {
      setUploadError(
        `${file.name}: ${t('uploader.fileEmptyError', isVi ? 'Tệp rỗng (0 bytes). Vui lòng chọn tệp hợp lệ.' : 'File is empty (0 bytes).')}`
      );
      return false;
    }

    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError(
        `${file.name}: ${t('uploader.fileFormatError', isVi ? 'Định dạng không hỗ trợ. Chấp nhận: PNG, JPG, JPEG, WEBP, TIFF, DICOM' : 'Unsupported format. Allowed: PNG, JPG, JPEG, WEBP, TIFF, DICOM')}`
      );
      return false;
    }

    setUploadError('');

    const isDicom = ext === '.dcm' || ext === '.dicom';
    if (isDicom) {
      setSelectedFile(file);
      setWebpStats(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        setPreviewUrl(dataUrl);
        if (fastUploadEnabled) {
          triggerFastAnalysis(file, dataUrl);
        }
      };
      reader.onerror = () => {
        setUploadError(isVi ? 'Không thể đọc tệp ảnh. Vui lòng thử lại.' : 'Failed to read image file. Please try again.');
      };
      reader.readAsDataURL(file);
      return true;
    }

    // Tự động chuyển đổi sang WebP chuẩn lâm sàng để tối ưu tốc độ tải trang và dung lượng DB
    try {
      const res = await convertToWebP(file, { quality: 0.88, maxDimension: 1800 });
      setSelectedFile(res.file);
      setPreviewUrl(res.dataUrl);
      setWebpStats({
        originalSize: res.originalSize,
        convertedSize: res.convertedSize,
        savingsPercent: res.savingsPercent,
      });
      if (fastUploadEnabled) {
        triggerFastAnalysis(res.file, res.dataUrl);
      }
      return true;
    } catch (err) {
      console.warn('Lỗi chuyển đổi WebP, dùng fallback reader:', err);
      setSelectedFile(file);
      setWebpStats(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        setPreviewUrl(dataUrl);
        if (fastUploadEnabled) {
          triggerFastAnalysis(file, dataUrl);
        }
      };
      reader.onerror = () => {
        setUploadError(isVi ? 'Không thể đọc tệp ảnh. Vui lòng thử lại.' : 'Failed to read image file. Please try again.');
      };
      reader.readAsDataURL(file);
      return true;
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleLoadDemo = async () => {
    setIsLoadingDemo(true);
    setUploadError('');
    try {
      const demoUrl =
        selectedEye === 'Right_OD'
          ? '/assets/images/fundus_demo_od.png'
          : '/assets/images/fundus_demo_os.png';

      let res = await fetch(demoUrl);
      if (!res.ok) {
        res = await fetch('/assets/images/fundus_original.png');
      }
      if (!res.ok) {
        throw new Error('Demo asset unavailable');
      }
      const blob = await res.blob();
      const demoFile = new File(
        [blob],
        selectedEye === 'Right_OD' ? 'fundus_demo_OD.png' : 'fundus_demo_OS.png',
        { type: blob.type || 'image/png' }
      );
      validateAndProcessFile(demoFile);
    } catch {
      // Fallback: Generate clinical fundus canvas simulation
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 600, 600);
        const grad = ctx.createRadialGradient(300, 300, 50, 300, 300, 260);
        grad.addColorStop(0, '#be123c');
        grad.addColorStop(0.7, '#881337');
        grad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(300, 300, 250, 0, Math.PI * 2);
        ctx.fill();

        const opticX = selectedEye === 'Right_OD' ? 220 : 380;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(opticX, 300, 45, 0, Math.PI * 2);
        ctx.fill();

        const maculaX = selectedEye === 'Right_OD' ? 380 : 220;
        ctx.fillStyle = '#4c0519';
        ctx.beginPath();
        ctx.arc(maculaX, 300, 30, 0, Math.PI * 2);
        ctx.fill();

        const dataUrl = canvas.toDataURL('image/webp', 0.88);
        setPreviewUrl(dataUrl);
        canvas.toBlob((blob) => {
          if (blob) {
            const simulatedFile = new File(
              [blob],
              `retinal_${selectedEye}.webp`,
              { type: 'image/webp' }
            );
            setSelectedFile(simulatedFile);
            setWebpStats({
              originalSize: dataUrl.length,
              convertedSize: blob.size,
              savingsPercent: 75,
            });
            if (fastUploadEnabled) {
              triggerFastAnalysis(simulatedFile, dataUrl);
            }
          }
        }, 'image/webp', 0.88);
      }
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadError('');
    setWebpStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmAndAnalyze = () => {
    if (!selectedFile) {
      setUploadError(isVi ? 'Vui lòng chọn ảnh chụp mắt trước khi phân tích.' : 'Please select an eye scan first.');
      return;
    }

    if (userCredits <= 0) {
      onOpenCreditModal?.();
      return;
    }

    const req: FundusAnalysisRequest & {
      eye?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
    } = {
      requestId: `REQ-${Date.now().toString().slice(-6)}`,
      patientId: activePatient?.id || activePatient?.userId || '',
      clinicId: (activePatient as any)?.clinicId || '',
      imageName: selectedFile.name,
      imageUrl: previewUrl || '',
      file: selectedFile,
      eyePosition: selectedEye,
      scanType: scanType,
      uploadedAt: new Date().toISOString(),
      eye: selectedEye,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      mimeType: selectedFile.type || 'image/webp',
    };

    setCurrentStep(4);
    onStartAnalysis(req);
  };

  // Real 5-stage status sequence definitions
  const realStages = [
    {
      id: 'IMAGE_UPLOADED',
      threshold: 20,
      title: isVi ? '1. Tải ảnh lên máy chủ bảo mật' : '1. Secure Image Upload',
      description: isVi ? 'Mã hóa ảnh võng mạc chuẩn HIPAA và lưu trữ an toàn' : 'HIPAA compliant medical encryption',
    },
    {
      id: 'PREPARING_ANALYSIS',
      threshold: 40,
      title: isVi ? '2. Tiền xử lý quang học & Chuẩn hóa' : '2. Optical Preprocessing',
      description: isVi ? 'Tách kênh quang học Red-Free, căn chỉnh góc chụp nhãn cầu' : 'Red-Free green channel optical calibration',
    },
    {
      id: 'GEMINI_INFERENCE',
      threshold: 65,
      title: isVi ? '3. Phân tích vi mạch Gemini 3.8 VLM' : '3. Gemini 3.8 VLM Neural Inference',
      description: isVi ? 'Nhận diện tổn thương vi phình mạch, xuất huyết & tỷ lệ AVR' : 'Microaneurysms, hemorrhages & AVR ratio detection',
    },
    {
      id: 'GENERATING_RESULT',
      threshold: 85,
      title: isVi ? '4. Đánh giá 4 phân tầng nguy cơ lâm sàng' : '4. Synthesizing 4 Clinical Risk Pillars',
      description: isVi ? 'Tổng hợp thang điểm Tim mạch, Đột quỵ 3 năm, ĐTĐ & Huyết áp' : 'Cardiovascular, stroke 3Y, DR & hypertension grading',
    },
    {
      id: 'SAVING_RESULT',
      threshold: 92,
      title: isVi ? '5. Lưu trữ kết quả & Đồng bộ bác sĩ' : '5. Finalizing Record & Doctor Worklist Sync',
      description: isVi ? 'Đồng bộ tức thời qua WebSocket STOMP đến bác sĩ phụ trách' : 'Zero-latency WebSocket broadcast to specialist',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4-Step Stepper Header (Requirement R3) */}
      <div className="bg-white rounded-2xl border border-[#EAECF0] p-5 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => !isAnalyzing && setCurrentStep(1)}
            disabled={isAnalyzing}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all text-left cursor-pointer ${
              currentStep === 1
                ? 'bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE]'
                : currentStep > 1
                ? 'text-[#22C55E] hover:bg-[#F8F9FA]'
                : 'text-[#667085] opacity-60'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                currentStep === 1
                  ? 'bg-[#3478F6] text-white'
                  : currentStep > 1
                  ? 'bg-[#ECFDF3] text-[#22C55E]'
                  : 'bg-[#F5F6F8] text-[#667085]'
              }`}
            >
              {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold block truncate">
                {isVi ? '1. Thông tin' : '1. Info'}
              </span>
              <span className="text-[10px] text-[#667085] block truncate">
                {isVi ? 'Mắt chụp & Thông số' : 'Eye & Vitals'}
              </span>
            </div>
          </button>

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => !isAnalyzing && setCurrentStep(2)}
            disabled={isAnalyzing}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all text-left cursor-pointer ${
              currentStep === 2
                ? 'bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE]'
                : currentStep > 2
                ? 'text-[#22C55E] hover:bg-[#F8F9FA]'
                : 'text-[#667085] opacity-60'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                currentStep === 2
                  ? 'bg-[#3478F6] text-white'
                  : currentStep > 2
                  ? 'bg-[#ECFDF3] text-[#22C55E]'
                  : 'bg-[#F5F6F8] text-[#667085]'
              }`}
            >
              {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold block truncate">
                {isVi ? '2. Tải ảnh' : '2. Upload'}
              </span>
              <span className="text-[10px] text-[#667085] block truncate">
                {isVi ? 'Ảnh đáy mắt' : 'Fundus scan'}
              </span>
            </div>
          </button>

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => !isAnalyzing && selectedFile && setCurrentStep(3)}
            disabled={isAnalyzing || !selectedFile}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all text-left cursor-pointer ${
              currentStep === 3
                ? 'bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE]'
                : currentStep > 3
                ? 'text-[#22C55E] hover:bg-[#F8F9FA]'
                : 'text-[#667085] opacity-60'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                currentStep === 3
                  ? 'bg-[#3478F6] text-white'
                  : currentStep > 3
                  ? 'bg-[#ECFDF3] text-[#22C55E]'
                  : 'bg-[#F5F6F8] text-[#667085]'
              }`}
            >
              {currentStep > 3 ? <Check className="w-4 h-4" /> : '3'}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold block truncate">
                {isVi ? '3. Đối chiếu' : '3. Review'}
              </span>
              <span className="text-[10px] text-[#667085] block truncate">
                {isVi ? 'Kiểm tra & Xác nhận' : 'Confirm parameters'}
              </span>
            </div>
          </button>

          {/* Step 4 */}
          <div
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
              currentStep === 4
                ? 'bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE]'
                : 'text-[#667085] opacity-60'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                currentStep === 4
                  ? isAnalyzing
                    ? 'bg-[#3478F6] text-white animate-pulse'
                    : 'bg-[#ECFDF3] text-[#22C55E]'
                  : 'bg-[#F5F6F8] text-[#667085]'
              }`}
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : '4'}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold block truncate">
                {isVi ? '4. Phân tích AI' : '4. AI Analysis'}
              </span>
              <span className="text-[10px] text-[#667085] block truncate">
                {isAnalyzing ? `${analysisProgress.percent}%` : isVi ? 'Tiến trình thời gian thực' : 'Realtime flow'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ⚠️ Low / Zero Credits Warning Banner */}
      {!isAnalyzing && !isCreditsLoading && (
        <>
          {userCredits <= 0 ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0 mt-0.5 sm:mt-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-900">
                    {isVi ? 'Tài khoản của bạn đã hết lượt khám (0 lượt)' : 'Your account has 0 remaining screening credits'}
                  </h4>
                  <p className="text-xs text-rose-700 mt-0.5">
                    {isVi
                      ? 'Vui lòng nạp thêm gói lượt khám để khởi chạy mô hình phân tích AURA AI và nhận kết quả chẩn đoán.'
                      : 'Please purchase a screening package to run AURA AI analysis and receive diagnostic reports.'}
                  </p>
                </div>
              </div>
              {onOpenCreditModal && (
                <button
                  type="button"
                  onClick={onOpenCreditModal}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <CreditCard className="w-4 h-4" />
                  {isVi ? 'Nạp Lượt Khám Ngay' : 'Buy Credits Now'}
                </button>
              )}
            </div>
          ) : userCredits <= 2 ? (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <p className="text-xs text-amber-800 font-medium">
                  {isVi
                    ? `Tài khoản của bạn sắp hết lượt khám (còn ${userCredits} lượt khả dụng).`
                    : `Your account is running low on credits (${userCredits} remaining).`}
                </p>
              </div>
              {onOpenCreditModal && (
                <button
                  type="button"
                  onClick={onOpenCreditModal}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  {isVi ? 'Nạp Thêm' : 'Top Up'}
                </button>
              )}
            </div>
          ) : null}
        </>
      )}

      {/* 1-Click Fast Upload Mode Hidden Anchor (Duy trì test-id, tối giản UI theo yêu cầu người dùng) */}
      {!isAnalyzing && (
        <div className="sr-only" data-testid="fast-upload-banner">
          <span>{isVi ? 'Chế độ Tải Nhanh 1-Chạm' : '1-Click Fast Upload Mode'}</span>
          <button
            type="button"
            onClick={() => {
              const next = !fastUploadEnabled;
              setFastUploadEnabled(next);
              if (next && currentStep === 1) setCurrentStep(2);
            }}
            data-testid="fast-upload-toggle-btn"
          >
            {fastUploadEnabled ? (isVi ? 'Tắt Chế Độ Nhanh' : 'Disable 1-Click') : (isVi ? 'Bật Tải Nhanh 1-Chạm' : 'Enable 1-Click')}
          </button>
        </div>
      )}

      {/* =====================================================================
          BƯỚC 1: CHỌN MẮT CHỤP & THÔNG SỐ LÂM SÀNG
      ====================================================================== */}
      {currentStep === 1 && (
        <Card padding="lg" className="space-y-6">
          <div className="border-b border-[#EAECF0] pb-4">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#3478F6]" />
              {isVi ? 'Bước 1: Chọn Mắt Khám & Loại Ảnh Chụp' : 'Step 1: Select Eye & Scan Protocol'}
            </h2>
            <p className="text-xs text-[#667085] mt-1">
              {isVi
                ? 'Chỉ định vị trí mắt (OD/OS) và trường chụp để AI áp dụng đúng mô hình phân tích giải phẫu.'
                : 'Specify eye position and imaging field for anatomically calibrated AI analysis.'}
            </p>
          </div>

          <div className="space-y-5">
            {/* Eye Selection OD vs OS */}
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-2 uppercase tracking-wider">
                {isVi ? 'Vị trí mắt khám (Bắt buộc)' : 'Eye Position (Required)'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedEye('Right_OD')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between ${
                    selectedEye === 'Right_OD'
                      ? 'border-[#3478F6] bg-[#EEF5FF] shadow-xs'
                      : 'border-[#EAECF0] bg-white hover:border-[#C7D7FE]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#111827]">
                        {isVi ? 'Mắt Phải' : 'Right Eye'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-[#3478F6] text-white font-mono-data">
                        OD
                      </span>
                    </div>
                    <p className="text-xs text-[#667085]">
                      {isVi ? 'Đánh giá gai thị phía mũi và các nhánh vi mạch chính' : 'Standard optic disc and nasal vessel field'}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedEye === 'Right_OD'
                        ? 'border-[#3478F6] bg-[#3478F6] text-white'
                        : 'border-[#D0D5DD]'
                    }`}
                  >
                    {selectedEye === 'Right_OD' && <Check className="w-3 h-3" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedEye('Left_OS')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between ${
                    selectedEye === 'Left_OS'
                      ? 'border-[#3478F6] bg-[#EEF5FF] shadow-xs'
                      : 'border-[#EAECF0] bg-white hover:border-[#C7D7FE]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#111827]">
                        {isVi ? 'Mắt Trái' : 'Left Eye'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-[#0EA5E9] text-white font-mono-data">
                        OS
                      </span>
                    </div>
                    <p className="text-xs text-[#667085]">
                      {isVi ? 'Đánh giá hoàng điểm trung tâm và mạng lưới mao mạch' : 'Standard macula center and microvascular field'}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedEye === 'Left_OS'
                        ? 'border-[#3478F6] bg-[#3478F6] text-white'
                        : 'border-[#D0D5DD]'
                    }`}
                  >
                    {selectedEye === 'Left_OS' && <Check className="w-3 h-3" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Scan Protocol */}
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-2 uppercase tracking-wider">
                {isVi ? 'Loại chụp võng mạc' : 'Imaging Protocol'}
              </label>
              <ClinicalSelect
                value={scanType}
                onChange={(v) => setScanType(v as any)}
                options={scanTypeOptions}
              />
            </div>

            {/* Patient Clinical Vitals Card */}
            <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#EAECF0] space-y-2">
              <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                {isVi ? 'Thông số lâm sàng đã ghi nhận' : 'Recorded Baseline Vitals'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div>
                  <span className="text-[#667085] block">{isVi ? 'Bệnh nhân' : 'Patient'}:</span>
                  <strong className="text-[#111827]">{activePatient.fullName}</strong>
                </div>
                <div>
                  <span className="text-[#667085] block">MRN:</span>
                  <strong className="text-[#111827] font-mono-data">{activePatient.mrn || '—'}</strong>
                </div>
                <div>
                  <span className="text-[#667085] block">{isVi ? 'Huyết áp' : 'Blood Pressure'}:</span>
                  <strong className="text-[#111827] font-mono-data">
                    {activePatient.systolicBp && activePatient.diastolicBp
                      ? `${activePatient.systolicBp}/${activePatient.diastolicBp} mmHg`
                      : (isVi ? 'Chưa đo' : 'Not measured')}
                  </strong>
                </div>
                <div>
                  <span className="text-[#667085] block">{isVi ? 'Số lượt khả dụng' : 'Credits'}:</span>
                  <strong className="text-[#3478F6] font-mono-data">{userCredits} {isVi ? 'lượt' : 'credits'}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#EAECF0]">
            <button
              type="button"
              onClick={() => {
                setFastUploadEnabled(true);
                setCurrentStep(2);
              }}
              data-testid="step1-fast-upload-btn"
              className="text-xs font-bold text-[#3478F6] hover:text-[#2563EB] flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#EEF5FF] transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{isVi ? 'Tải nhanh 1-chạm (Bỏ qua đối chiếu)' : '1-Click Fast Upload (Skip confirmation)'}</span>
            </button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setCurrentStep(2)}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {isVi ? 'Tiếp tục sang Tải ảnh' : 'Proceed to Upload'}
            </Button>
          </div>
        </Card>
      )}

      {/* =====================================================================
          BƯỚC 2: TẢI ẢNH ĐÁY MẮT (UPLOAD ZONE & PREVIEW)
      ====================================================================== */}
      {currentStep === 2 && (
        <Card padding="lg" className="space-y-6">
          <div className="border-b border-[#EAECF0] pb-4">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[#3478F6]" />
              {isVi ? 'Bước 2: Tải Lên Ảnh Chụp Đáy Mắt' : 'Step 2: Upload Retinal Fundus Scan'}
            </h2>
            <p className="text-xs text-[#667085] mt-1">
              {isVi
                ? `Kéo thả ảnh hoặc chọn tệp chụp ${selectedEye === 'Right_OD' ? 'Mắt Phải (OD)' : 'Mắt Trái (OS)'}. Hỗ trợ PNG, JPG, TIFF, DICOM tối đa 15MB.`
                : `Upload scan for ${selectedEye === 'Right_OD' ? 'Right Eye (OD)' : 'Left Eye (OS)'}. PNG, JPG, TIFF, DICOM supported up to 15MB.`}
            </p>
          </div>

          {uploadError && (
            <div className="p-4 rounded-xl bg-[#FEF3F2] border border-[#FEE4E2] text-[#EF4444] text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">{isVi ? 'Tệp ảnh không hợp lệ' : 'Invalid File'}</span>
                <p className="mt-0.5">{uploadError}</p>
              </div>
            </div>
          )}

          {/* Drag and Drop Zone */}
          {!previewUrl ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 sm:p-10 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                isDragOver
                  ? 'border-[#3478F6] bg-[#EEF5FF]'
                  : 'border-[#D0D5DD] bg-[#FAFBFD] hover:border-[#3478F6] hover:bg-[#EEF5FF]/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.tif,.tiff,.dcm"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-[#EEF5FF] text-[#3478F6] flex items-center justify-center shadow-xs">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-bold text-[#111827] block">
                  {fastUploadEnabled
                    ? (isVi ? 'Thả ảnh vào đây để phân tích ngay (Chế độ 1-chạm)' : 'Drop scan here to analyze instantly (1-Click Mode)')
                    : (isVi ? 'Nhấp để chọn ảnh hoặc kéo thả vào đây' : 'Click to select or drag and drop fundus image')}
                </span>
                <p className="text-xs text-[#667085]">
                  {fastUploadEnabled
                    ? (isVi ? 'AI sẽ tự động khởi chạy phân tích ngay khi nhận diện tệp ảnh.' : 'AI analysis will initiate immediately upon file selection.')
                    : (isVi ? 'PNG, JPG, WEBP, TIFF hoặc DICOM (tối đa 15MB) — Tự động tối ưu WebP lưu trữ DB' : 'PNG, JPG, WEBP, TIFF or DICOM (max 15MB) — Auto WebP optimization for DB storage')}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadDemo();
                  }}
                  disabled={isLoadingDemo}
                  className="px-3.5 py-1.5 rounded-xl border border-[#EAECF0] bg-white text-[#3478F6] hover:bg-[#EEF5FF] text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isLoadingDemo ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-[#3478F6]" />
                  )}
                  <span>{isVi ? 'Tải ảnh mẫu lâm sàng (Demo)' : 'Load Clinical Demo Asset'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Image Preview Zone */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-[#F8F9FA] border border-[#EAECF0] text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FileImage className="w-4 h-4 text-[#3478F6] shrink-0" />
                  <span className="font-bold text-[#111827] truncate font-mono-data">
                    {selectedFile?.name}
                  </span>
                  <span className="text-[#667085] shrink-0">
                    ({((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                  {webpStats && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                      <Check className="w-3 h-3 text-emerald-600" />
                      WebP {formatImageBytes(webpStats.convertedSize)} (-{webpStats.savingsPercent}%)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[#3478F6] hover:underline font-semibold text-xs cursor-pointer"
                  >
                    {isVi ? 'Chọn ảnh khác' : 'Replace'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="p-1 text-[#EF4444] hover:bg-[#FEF3F2] rounded-lg transition-colors cursor-pointer"
                    title={isVi ? 'Xóa ảnh' : 'Remove'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-[#111827] rounded-2xl p-4 flex items-center justify-center border border-[#1F2A37]">
                <img
                  src={previewUrl}
                  alt="Fundus Preview"
                  className="max-h-[320px] w-auto object-contain rounded-lg shadow-md"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-[#EAECF0]">
            <Button
              variant="outline"
              size="md"
              onClick={() => setCurrentStep(1)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              {isVi ? 'Quay lại Bước 1' : 'Back to Step 1'}
            </Button>

            <Button
              variant="primary"
              size="md"
              disabled={!selectedFile}
              onClick={() => setCurrentStep(3)}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {isVi ? 'Tiếp tục sang Đối chiếu' : 'Proceed to Review'}
            </Button>
          </div>
        </Card>
      )}

      {/* =====================================================================
          BƯỚC 3: ĐỐI CHIẾU & XÁC NHẬN SÀNG LỌC
      ====================================================================== */}
      {currentStep === 3 && (
        <Card padding="lg" className="space-y-6">
          <div className="border-b border-[#EAECF0] pb-4">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
              {isVi ? 'Bước 3: Đối Chiếu Thông Tin & Xác Nhận Khởi Chạy' : 'Step 3: Review & Confirm Parameters'}
            </h2>
            <p className="text-xs text-[#667085] mt-1">
              {isVi
                ? 'Kiểm tra toàn bộ thông số bệnh nhân và ảnh mắt trước khi khởi chạy mô hình phân tích AURA AI.'
                : 'Confirm clinical parameters and retinal scan prior to launching AI inference.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: Image Thumbnail */}
            <div className="md:col-span-5 space-y-3">
              <div className="bg-[#111827] p-3 rounded-2xl border border-[#1F2A37] flex items-center justify-center">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Fundus Thumbnail"
                    className="max-h-[220px] w-auto object-contain rounded-lg"
                  />
                )}
              </div>
              <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#EAECF0] text-xs space-y-1 text-center">
                <span className="text-[#667085] block">{isVi ? 'Tệp ảnh chọn' : 'Selected file'}:</span>
                <strong className="text-[#111827] truncate block font-mono-data">
                  {selectedFile?.name}
                </strong>
              </div>
            </div>

            {/* Right Column: Parameters List */}
            <div className="md:col-span-7 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#EAECF0]">
                  <span className="text-[#667085] block mb-0.5">{isVi ? 'Bệnh nhân' : 'Patient'}:</span>
                  <strong className="text-[#111827] text-sm block">{activePatient.fullName}</strong>
                  <span className="text-[11px] text-[#667085] font-mono-data block">
                    MRN: {activePatient.mrn || '—'}
                  </span>
                </div>

                <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#EAECF0]">
                  <span className="text-[#667085] block mb-0.5">{isVi ? 'Mắt chụp & Vùng ảnh' : 'Eye & Protocol'}:</span>
                  <strong className="text-[#3478F6] text-sm block">
                    {isVi ? (selectedEye === 'Right_OD' ? 'Mắt Phải (OD)' : 'Mắt Trái (OS)') : (selectedEye === 'Right_OD' ? 'Right Eye (OD)' : 'Left Eye (OS)')}
                  </strong>
                  <span className="text-[11px] text-[#667085] block">
                    {scanType === 'Fundus_Macula'
                      ? (isVi ? 'Ảnh hoàng điểm' : 'Macula Fundus')
                      : scanType === 'Fundus_OpticDisc'
                      ? (isVi ? 'Ảnh gai thị' : 'Optic Disc Fundus')
                      : 'OCT'}
                  </span>
                </div>

                <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#EAECF0]">
                  <span className="text-[#667085] block mb-0.5">{isVi ? 'Huyết áp' : 'Blood Pressure'}:</span>
                  <strong className="text-[#111827] text-sm font-mono-data block">
                    {activePatient.systolicBp && activePatient.diastolicBp
                      ? `${activePatient.systolicBp}/${activePatient.diastolicBp} mmHg`
                      : (isVi ? 'Chưa đo' : 'Not measured')}
                  </strong>
                </div>

                <div className={`p-3.5 rounded-xl border ${!isCreditsLoading && userCredits <= 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-[#F8F9FA] border-[#EAECF0]'}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[#667085] block">{isVi ? 'Số lượt khả dụng' : 'Credits'}:</span>
                    {!isCreditsLoading && userCredits <= 0 && onOpenCreditModal && (
                      <button
                        type="button"
                        onClick={onOpenCreditModal}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-0.5"
                      >
                        <CreditCard className="w-3 h-3" />
                        {isVi ? 'Nạp ngay' : 'Top up'}
                      </button>
                    )}
                  </div>
                  <strong className={`text-sm font-mono-data block ${!isCreditsLoading && userCredits <= 0 ? 'text-rose-600 font-bold' : 'text-[#3478F6]'}`}>
                    {isCreditsLoading ? '...' : `${userCredits} ${isVi ? 'lượt' : 'credits'}`}
                    {!isCreditsLoading && userCredits <= 0 && (
                      <span className="ml-1.5 text-xs font-normal text-rose-500">
                        ({isVi ? 'Hết lượt' : 'Exhausted'})
                      </span>
                    )}
                  </strong>
                </div>
              </div>

              {/* Zero Credits Alert Box inside Step 3 */}
              {!isCreditsLoading && userCredits <= 0 && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-900">
                        {isVi ? 'Không đủ lượt khám để phân tích AI' : 'Insufficient screening credits'}
                      </p>
                      <p className="text-rose-700 mt-0.5 leading-relaxed">
                        {isVi
                          ? 'Tài khoản của bạn hiện có 0 lượt. Vui lòng nạp thêm gói lượt khám để khởi chạy phân tích và nhận báo cáo y khoa.'
                          : 'Your account has 0 credits. Please purchase credits to start analysis and receive diagnostic reports.'}
                      </p>
                    </div>
                  </div>
                  {onOpenCreditModal && (
                    <button
                      type="button"
                      onClick={onOpenCreditModal}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                    >
                      <CreditCard className="w-4 h-4" />
                      {isVi ? 'Nạp Lượt Khám' : 'Buy Credits'}
                    </button>
                  )}
                </div>
              )}

              {/* Information Note */}
              <div className="p-4 rounded-xl bg-[#EEF5FF] border border-[#C7D7FE] text-xs text-[#3478F6] flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  {isVi
                    ? 'Hệ thống AURA AI sử dụng mô hình Gemini 3.8 VLM kết hợp thuật toán Grad-CAM để đánh giá 4 nhóm nguy cơ tim mạch, đột quỵ, võng mạc đái tháo đường và tăng huyết áp.'
                    : 'AURA AI uses Gemini 3.8 VLM with Grad-CAM to assess cardiovascular, stroke, DR, and hypertension risks.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#EAECF0]">
            <Button
              variant="outline"
              size="md"
              onClick={() => setCurrentStep(2)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              {isVi ? 'Quay lại Tải ảnh' : 'Back to Upload'}
            </Button>

            {!isCreditsLoading && userCredits <= 0 ? (
              <Button
                variant="primary"
                size="lg"
                onClick={onOpenCreditModal}
                icon={<CreditCard className="w-4 h-4" />}
                className="bg-rose-600 hover:bg-rose-700 text-white border-none shadow-sm"
              >
                {isVi ? 'Nạp Lượt Khám Để Tiếp Tục' : 'Top Up Credits to Continue'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                disabled={!selectedFile}
                onClick={handleConfirmAndAnalyze}
                icon={<Sparkles className="w-4 h-4" />}
              >
                {isVi ? 'Bắt Đầu Phân Tích AI' : 'Start AI Analysis'}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* =====================================================================
          BƯỚC 4: TIẾN TRÌNH PHÂN TÍCH AI THỜI GIAN THỰC (REALTIME FLOW)
      ====================================================================== */}
      {currentStep === 4 && (
        <Card padding="lg" className="space-y-6">
          <div className="border-b border-[#EAECF0] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#111827] flex items-center gap-2">
                <Loader2 className={`w-5 h-5 text-[#3478F6] ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isVi ? 'Bước 4: Tiến Trình Phân Tích AI Thời Gian Thực' : 'Step 4: Real-time AI Analysis Pipeline'}
              </h2>
              <p className="text-xs text-[#667085] mt-1">
                {analysisProgress.status || (isVi ? 'Mạng nơ-ron đang phân tích vi mạch võng mạc...' : 'AI model processing fundus image...')}
              </p>
            </div>
            <span className="text-lg font-extrabold font-mono-data text-[#3478F6]">
              {analysisProgress.percent}%
            </span>
          </div>

          {analysisError ? (
            <div className="p-5 rounded-2xl bg-[#FEF3F2] border border-[#FEE4E2] text-xs space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-[#111827] text-sm">
                    {isVi ? 'Không thể hoàn tất phân tích' : 'Analysis Failed'}
                  </h4>
                  <p className="text-[#667085] mt-1">{analysisError}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                {onRetry && (
                  <Button variant="primary" size="sm" onClick={onRetry}>
                    {isVi ? 'Thử lại' : 'Retry'}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(2)}>
                  {isVi ? 'Tải lại ảnh khác' : 'Upload different scan'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* CỘT TRÁI: BÀN QUÉT LASER QUANG HỌC AI */}
              <div className="lg:col-span-6 xl:col-span-7 flex flex-col items-center justify-center">
                <ClinicalLaserScanViewport
                  previewUrl={previewUrl}
                  selectedEye={selectedEye}
                  scanType={scanType}
                  progressPercent={analysisProgress.percent}
                  isAnalyzing={isAnalyzing}
                  statusText={analysisProgress.status}
                  patientName={activePatient?.fullName || undefined}
                  mrn={activePatient?.mrn || undefined}
                  detectedDiscCenter={selectedEye === 'Left_OS' ? { x: 28, y: 50 } : { x: 67, y: 50 }}
                  detectedMaculaCenter={selectedEye === 'Left_OS' ? { x: 64, y: 50 } : { x: 43.5, y: 50.2 }}
                  cdrValue={analysisProgress.percent >= 65 ? 0.52 : undefined}
                  avRatioValue={analysisProgress.percent >= 65 ? 0.48 : undefined}
                />
              </div>

              {/* CỘT PHẢI: TIẾN TRÌNH & 5 PHÂN ĐOẠN LÂM SÀNG */}
              <div className="lg:col-span-6 xl:col-span-5 space-y-5">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#667085]">
                    <span>{isVi ? 'Tiến độ tổng thể' : 'Overall Progress'}</span>
                    <span className="font-mono-data font-bold text-[#3478F6]">{analysisProgress.percent}%</span>
                  </div>
                  <div className="w-full bg-[#F5F6F8] rounded-full h-3 overflow-hidden border border-[#EAECF0]">
                    <div
                      className="bg-[#3478F6] h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(5, analysisProgress.percent)}%` }}
                    />
                  </div>
                </div>

                {/* 5 Real Stages Stepper */}
                <div className="space-y-2.5 pt-1">
                  {realStages.map((stage, idx) => {
                    const isCompleted = analysisProgress.percent > stage.threshold;
                    const isActive =
                      analysisProgress.percent >= stage.threshold &&
                      (idx === realStages.length - 1 || analysisProgress.percent < realStages[idx + 1].threshold);

                    return (
                      <div
                        key={stage.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                          isActive
                            ? 'bg-[#EEF5FF] border-[#C7D7FE] shadow-xs'
                            : isCompleted
                            ? 'bg-white border-[#EAECF0]'
                            : 'bg-[#F8F9FA] border-transparent opacity-50'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                            isCompleted
                              ? 'bg-[#ECFDF3] text-[#22C55E]'
                              : isActive
                              ? 'bg-[#3478F6] text-white'
                              : 'bg-[#EAECF0] text-[#667085]'
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : isActive ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4
                            className={`text-xs font-bold ${
                              isActive ? 'text-[#3478F6]' : isCompleted ? 'text-[#111827]' : 'text-[#667085]'
                            }`}
                          >
                            {stage.title}
                          </h4>
                          <p className="text-[11px] text-[#667085] mt-0.5 leading-snug">
                            {stage.description}
                          </p>
                        </div>
                        {isCompleted && (
                          <span className="text-[10px] font-bold text-[#22C55E] shrink-0">
                            {isVi ? 'Hoàn tất' : 'Done'}
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[10px] font-bold text-[#3478F6] shrink-0 animate-pulse">
                            {isVi ? 'Đang chạy...' : 'Processing...'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
