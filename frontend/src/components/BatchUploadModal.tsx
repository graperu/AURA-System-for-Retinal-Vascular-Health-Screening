import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  UploadCloud,
  FolderUp,
  FileSpreadsheet,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Eye,
  Activity,
  Layers,
  Info,
  Loader2,
  CreditCard,
} from 'lucide-react';
import { BulkUploadItemPayload } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ClinicalSelect, ClinicalSelectOption } from './ui/ClinicalSelect';
import { useLanguage } from '../context/LanguageContext';

export const DICOM_PLACEHOLDER_DATA_URI =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="%230f172a"/><rect x="25" y="20" width="110" height="120" rx="8" fill="%231e293b" stroke="%233478f6" stroke-width="2"/><text x="80" y="72" fill="%2338bdf8" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle">DICOM</text><text x="80" y="96" fill="%2394a3b8" font-family="sans-serif" font-size="10" font-weight="600" text-anchor="middle">Medical File</text><circle cx="80" cy="118" r="4" fill="%233478f6"/></svg>';

interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitBatch: (payload: {
    campaignName: string;
    clinicId: string;
    items: BulkUploadItemPayload[];
  }) => Promise<void>;
  currentCredits: number;
}

interface StagedItem {
  id: string;
  file?: File;
  fileName: string;
  fileSize: number;
  previewUrl: string;
  eye: 'OD' | 'OS';
  mrn: string;
  patientName: string;
  age: number;
  gender: string;
  systolicBp: number;
  diastolicBp: number;
  hbA1c: number;
  isValid: boolean;
  validationError?: string;
}

export const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  isOpen,
  onClose,
  onSubmitBatch,
  currentCredits = 0,
}) => {
  const { t, isVi } = useLanguage();
  const { user: currentUser } = useAuth();
  const currentClinicName = currentUser?.name || currentUser?.email || t('clinic.portal.defaultFacility');
  const currentClinicId = currentUser?.id || 'CLINIC';

  const eyeFilterOptions: ClinicalSelectOption<string>[] = useMemo(
    () => [
      { value: 'ALL', label: t('clinic.batchUploadModal.filterAllEyes') },
      { value: 'OD', label: t('clinic.batchUploadModal.filterOd') },
      { value: 'OS', label: t('clinic.batchUploadModal.filterOs') },
    ],
    [t]
  );

  const itemEyeOptions: ClinicalSelectOption<'OD' | 'OS'>[] = useMemo(
    () => [
      { value: 'OD', label: t('clinic.batchUploadModal.allOdButton') },
      { value: 'OS', label: t('clinic.batchUploadModal.allOsButton') },
    ],
    [t]
  );

  const clinicOptions = useMemo(
    () => [
      { value: currentClinicId, label: currentClinicName },
      { value: 'CLINIC_SATELLITE', label: t('clinic.batchUploadModal.satelliteOption') },
    ],
    [currentClinicId, currentClinicName, t]
  );

  const [campaignName, setCampaignName] = useState(() =>
    isVi
      ? `Chiến dịch Tầm soát Đột quỵ & Mạch máu Võng mạc Đợt ${new Date().toLocaleDateString('vi-VN')}`
      : `Retinal Vascular & Stroke Screening Campaign ${new Date().toLocaleDateString('en-US')}`
  );
  const [clinicId, setClinicId] = useState(currentClinicId);
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterEye, setFilterEye] = useState<string>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Always reset staged items to 0 whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStagedItems([]);
      setFilterEye('ALL');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Smart regex parser from filename (e.g. BN102_NguyenVanA_OD.png, MRN-001_OS.dcm)
  const parseFilename = (filename: string, index: number) => {
    const base = filename.replace(/\.[^/.]+$/, '');
    let eye: 'OD' | 'OS' = index % 2 === 0 ? 'OD' : 'OS';
    if (/(?:^|[_\-.])(OD|RIGHT|PHAI)(?:[_\-.]|$)/i.test(base)) eye = 'OD';
    else if (/(?:^|[_\-.])(OS|LEFT|TRAI)(?:[_\-.]|$)/i.test(base)) eye = 'OS';

    const mrnMatch = base.match(/(?:MRN|BN|PAT)[\-_]?\d+/i);
    const mrn = mrnMatch ? mrnMatch[0].toUpperCase() : `MRN-2026-${String(1000 + index).padStart(4, '0')}`;

    return { eye, mrn };
  };

  const handleProcessFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      /\.(png|jpe?g|dcm|dicom|tiff?)$/i.test(f.name)
    );

    if (fileArray.length === 0) return;

    const newItems: StagedItem[] = fileArray.map((file, idx) => {
      const overallIndex = stagedItems.length + idx + 1;
      const parsed = parseFilename(file.name, overallIndex);
      const isDicom = /\.(dcm|dicom|tif|tiff)$/i.test(file.name);
      const preview = isDicom ? DICOM_PLACEHOLDER_DATA_URI : URL.createObjectURL(file);

      return {
        id: `STAGED-${Date.now()}-${overallIndex}`,
        file,
        fileName: file.name,
        fileSize: file.size,
        previewUrl: preview,
        eye: parsed.eye,
        mrn: parsed.mrn,
        patientName: isVi ? `Bệnh nhân ${parsed.mrn}` : `Patient ${parsed.mrn}`,
        age: 50 + (overallIndex % 25),
        gender: isVi ? (overallIndex % 2 === 0 ? 'Nữ' : 'Nam') : (overallIndex % 2 === 0 ? 'Female' : 'Male'),
        systolicBp: 120 + (overallIndex % 35),
        diastolicBp: 75 + (overallIndex % 20),
        hbA1c: Number((5.5 + (overallIndex % 30) * 0.1).toFixed(1)),
        isValid: true,
      };
    });

    setStagedItems((prev) => [...prev, ...newItems]);
  };

  // Quick 1-click clinical test batch generator (100 images)
  const handleLoadDemo100 = () => {
    const firstNamesVi = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ'];
    const middleNamesVi = ['Văn', 'Thị', 'Hồng', 'Minh', 'Đức', 'Thanh', 'Quang', 'Anh', 'Xuân', 'Ngọc'];
    const lastNamesVi = ['Tuấn', 'Lan', 'Hương', 'Hùng', 'Mai', 'Dũng', 'Hoa', 'Bình', 'Cường', 'Trang', 'Tâm', 'Vy'];

    const firstNamesEn = ['James', 'Robert', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Daniel', 'Matthew'];
    const lastNamesEn = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez'];

    const demo100: StagedItem[] = Array.from({ length: 100 }).map((_, idx) => {
      const i = idx + 1;
      let name = '';
      let gender = '';
      if (isVi) {
        const fn = firstNamesVi[i % firstNamesVi.length];
        const mn = middleNamesVi[i % middleNamesVi.length];
        const ln = lastNamesVi[i % lastNamesVi.length];
        name = `${fn} ${mn} ${ln}`;
        gender = i % 3 === 0 ? 'Nam' : 'Nữ';
      } else {
        const fn = firstNamesEn[i % firstNamesEn.length];
        const ln = lastNamesEn[i % lastNamesEn.length];
        name = `${fn} ${ln}`;
        gender = i % 3 === 0 ? 'Male' : 'Female';
      }
      const mrn = `MRN-2026-${String(1000 + i).padStart(4, '0')}`;
      const eye: 'OD' | 'OS' = i % 2 === 1 ? 'OD' : 'OS';
      const age = 42 + (i % 38);
      const systolic = 118 + ((i * 3) % 45);
      const diastolic = 72 + ((i * 2) % 25);
      const hba1c = Number((5.3 + ((i * 7) % 40) * 0.1).toFixed(1));

      return {
        id: `DEMO-ITEM-${i}`,
        fileName: `RETINA_${mrn}_${eye}_${String(i).padStart(3, '0')}.dcm`,
        fileSize: 2450000 + (i % 500000),
        previewUrl: DICOM_PLACEHOLDER_DATA_URI,
        eye,
        mrn,
        patientName: name,
        age,
        gender,
        systolicBp: systolic,
        diastolicBp: diastolic,
        hbA1c: hba1c,
        isValid: true,
      };
    });

    setStagedItems(demo100);
  };

  const handleRemoveItem = (id: string) => {
    setStagedItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItemEye = (id: string, eye: 'OD' | 'OS') => {
    setStagedItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, eye } : it))
    );
  };

  const createThumbnailBase64 = (file: File, maxDim: number = 160): Promise<string> => {
    return new Promise((resolve) => {
      const isDicom = /\.dcm|\.dicom|\.tif|\.tiff/i.test(file.name);
      if (isDicom) {
        resolve(DICOM_PLACEHOLDER_DATA_URI);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          resolve('/assets/images/fundus_original.png');
          return;
        }
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            canvas.width = Math.max(1, w);
            canvas.height = Math.max(1, h);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
              return;
            }
          } catch (err) {
            console.warn('Canvas thumbnail generation failed, using dataUrl', err);
          }
          resolve(dataUrl);
        };
        img.onerror = () => {
          resolve(dataUrl || '/assets/images/fundus_original.png');
        };
        img.src = dataUrl;
      };
      reader.onerror = () => {
        resolve('/assets/images/fundus_original.png');
      };
      reader.readAsDataURL(file);
    });
  };

  const compressImageForAi = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const isDicom = /\.dcm|\.dicom|\.tif|\.tiff/i.test(file.name);
      if (isDicom) {
        resolve(
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          resolve(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
          );
          return;
        }

        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxDim = 512;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            canvas.width = Math.max(1, w);
            canvas.height = Math.max(1, h);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
              return;
            }
          } catch (err) {
            console.warn('Canvas compress for AI failed, using dataUrl', err);
          }
          resolve(dataUrl);
        };
        img.onerror = () => {
          resolve(dataUrl);
        };
        img.src = dataUrl;
      };
      reader.onerror = () => {
        resolve(
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        );
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (stagedItems.length === 0) return;
    setIsSubmitting(true);

    try {
      const fallbackBase64 =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const itemsPayload: BulkUploadItemPayload[] = await Promise.all(
        stagedItems.map(async (item) => {
          let base64Ai = fallbackBase64;
          let thumb = item.previewUrl || (/\.dcm|\.dicom|\.tif|\.tiff/i.test(item.fileName) ? DICOM_PLACEHOLDER_DATA_URI : '/assets/images/fundus_original.png');

          if (item.file) {
            const [aiCompressed, generatedThumb] = await Promise.all([
              compressImageForAi(item.file),
              createThumbnailBase64(item.file, 160),
            ]);
            base64Ai = aiCompressed;
            thumb = generatedThumb;
          } else if (item.previewUrl) {
            base64Ai = item.previewUrl;
            thumb = item.previewUrl;
          }

          return {
            fileName: item.fileName,
            base64ImageContent: base64Ai,
            previewUrl: thumb,
            eyePosition: item.eye,
            rawMrn: item.mrn,
            rawPatientName: item.patientName,
            patientAge: item.age,
            patientGender: item.gender,
            systolicBp: item.systolicBp,
            diastolicBp: item.diastolicBp,
            hbA1c: item.hbA1c,
          };
        })
      );

      await onSubmitBatch({
        campaignName,
        clinicId,
        items: itemsPayload,
      });

      onClose();
    } catch (err) {
      console.error('Error submitting batch:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAssignEye = (mode: 'ALL_OD' | 'ALL_OS' | 'ALTERNATE') => {
    setStagedItems((prev) =>
      prev.map((it, idx) => {
        let eye: 'OD' | 'OS' = 'OD';
        if (mode === 'ALL_OD') eye = 'OD';
        else if (mode === 'ALL_OS') eye = 'OS';
        else eye = idx % 2 === 0 ? 'OD' : 'OS';
        return { ...it, eye };
      })
    );
  };

  const handleBulkApplyVitals = () => {
    setStagedItems((prev) =>
      prev.map((it, idx) => ({
        ...it,
        systolicBp: 120 + ((idx * 3) % 30),
        diastolicBp: 75 + ((idx * 2) % 18),
        hbA1c: Number((5.4 + ((idx * 7) % 25) * 0.1).toFixed(1)),
      }))
    );
  };

  const filteredStaged = stagedItems.filter(
    (item) => filterEye === 'ALL' || item.eye === filterEye
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-[#EAECF0] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-modal-enter">
        {/* Modal Header */}
        <div className="bg-white text-slate-900 p-5 sm:p-6 border-b border-[#EAECF0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE] flex items-center justify-center shrink-0">
              <UploadCloud className="w-6 h-6 text-[#3478F6]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {t('clinic.batchUploadModal.uploadTitle')}
                </h2>
                <span className="bg-[#EEF5FF] text-[#3478F6] text-[10px] font-mono-data uppercase px-2.5 py-0.5 rounded-full border border-[#C7D7FE] font-bold">
                  {t('clinic.batchUploadModal.standardBadge')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('clinic.batchUploadModal.description')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Campaign Details Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('clinic.batchUploadModal.campaignNameLabel')}
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-[#3478F6] outline-none font-medium text-slate-800"
                placeholder={t('clinic.batchUploadModal.campaignNamePlaceholder')}
              />
            </div>
            <div>
              <ClinicalSelect<string>
                label={t('clinic.batchUploadModal.facilityLabel')}
                value={clinicId}
                onChange={setClinicId}
                options={clinicOptions}
                size="sm"
              />
            </div>
          </div>

          {/* Upload Dropzones and Quick Action */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) handleProcessFiles(e.dataTransfer.files);
              }}
              className={`lg:col-span-2 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all ${
                isDragging
                  ? 'border-[#3478F6] bg-blue-50/50'
                  : 'border-[#EAECF0] hover:border-[#3478F6] bg-[#F5F6F8]'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE] flex items-center justify-center mb-3">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {t('clinic.batchUploadModal.dropzone')}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                {t('clinic.batchUploadModal.dropzoneHint')}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && handleProcessFiles(e.target.files)}
                  className="hidden"
                  accept=".dcm,.dicom,.png,.jpg,.jpeg,.tif,.tiff"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-white border border-[#EAECF0] hover:border-[#3478F6] text-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-[#3478F6]" /> {t('clinic.batchUploadModal.selectFilesButton')}
                </button>

                <input
                  type="file"
                  ref={folderInputRef}
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  onChange={(e) => e.target.files && handleProcessFiles(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="px-4 py-2 bg-white border border-[#EAECF0] hover:border-[#3478F6] text-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FolderUp className="w-4 h-4 text-[#3478F6]" /> {t('clinic.batchUploadModal.selectFolderButton')}
                </button>
              </div>
            </div>

            {/* Quick 1-Click Demo Generator Card */}
            <div className="bg-white border border-[#EAECF0] rounded-2xl p-5 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
                  <Sparkles className="w-4 h-4 text-[#3478F6]" />
                  {t('clinic.batchUploadModal.quickDemoTitle')}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t('clinic.batchUploadModal.quickDemoDesc')}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-[#EAECF0]">
                <button
                  type="button"
                  onClick={handleLoadDemo100}
                  className="w-full py-2.5 bg-[#3478F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> {t('clinic.batchUploadModal.loadDemoButton')}
                </button>
                <span className="text-[11px] text-slate-500 text-center block mt-1.5">
                  {t('clinic.batchUploadModal.demoStandardBadge')}
                </span>
              </div>
            </div>
          </div>

          {/* Validation Status & Pre-flight Data Grid */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-800">
                  {t('clinic.batchUploadModal.preflightTitle')}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono-data font-bold bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE]">
                  {stagedItems.length} {t('clinic.batchUploadModal.scansLoaded')}
                </span>
                {stagedItems.length >= 100 ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-bold">
                    <CheckCircle2 className="w-3 h-3" /> {t('clinic.batchUploadModal.standardPassed')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px] font-bold">
                    <AlertTriangle className="w-3 h-3" /> {t('clinic.batchUploadModal.standardRequired')} ({stagedItems.length}/100)
                  </span>
                )}
              </div>

              {/* Quick Batch Actions */}
              {stagedItems.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-400 mr-1">{t('clinic.batchUploadModal.quickAssignLabel')}</span>
                  <button
                    type="button"
                    onClick={() => handleBulkAssignEye('ALL_OD')}
                    className="px-2 py-1 bg-[#EEF5FF] hover:bg-[#E0EDFE] text-[#3478F6] border border-[#C7D7FE] rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    {t('clinic.batchUploadModal.allOdButton')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkAssignEye('ALL_OS')}
                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    {t('clinic.batchUploadModal.allOsButton')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkAssignEye('ALTERNATE')}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-[10px] font-bold transition-all"
                  >
                    {t('clinic.batchUploadModal.alternateEyesButton')}
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkApplyVitals}
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold transition-all"
                    title={t('clinic.batchUploadModal.fillVitalsTooltip')}
                  >
                    {t('clinic.batchUploadModal.fillSampleVitalsButton')}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <ClinicalSelect<string>
                  value={filterEye}
                  onChange={setFilterEye}
                  options={eyeFilterOptions}
                  size="sm"
                  className="w-48"
                />
                {stagedItems.length > 0 && (
                  <button
                    onClick={() => setStagedItems([])}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1"
                  >
                    {t('clinic.batchUploadModal.clearAllButton')}
                  </button>
                )}
              </div>
            </div>

            {stagedItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                {t('clinic.batchUploadModal.emptyStaged')}
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 font-mono-data sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">{t('clinic.batchUploadModal.colNum')}</th>
                      <th className="py-2.5 px-3">{t('clinic.batchUploadModal.colPreview')}</th>
                      <th className="py-2.5 px-3">{t('clinic.batchUploadModal.colFileName')}</th>
                      <th className="py-2.5 px-3">{t('clinic.batchUploadModal.colMrnPatient')}</th>
                      <th className="py-2.5 px-3">{t('clinic.batchUploadModal.colEyePosition')}</th>
                      <th className="py-2.5 px-3">{t('clinic.batchUploadModal.colVitals')}</th>
                      <th className="py-2.5 px-3 text-right">{t('clinic.batchUploadModal.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStaged.slice(0, 50).map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 font-mono-data text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <img
                            src={item.previewUrl}
                            alt={item.fileName}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 bg-slate-100"
                          />
                        </td>
                        <td className="py-2 px-3 font-mono-data font-medium text-slate-700 max-w-[200px] truncate">
                          {item.fileName}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-[#111827]">{item.patientName}</div>
                          <div className="text-[11px] text-slate-400 font-mono-data">{item.mrn}</div>
                        </td>
                        <td className="py-2 px-3">
                          <ClinicalSelect<'OD' | 'OS'>
                            value={item.eye}
                            onChange={(val) => handleUpdateItemEye(item.id, val)}
                            options={itemEyeOptions}
                            size="sm"
                            className="w-36"
                          />
                        </td>
                        <td className="py-2 px-3 text-[11px] font-mono-data text-slate-600">
                          {item.systolicBp}/{item.diastolicBp} mmHg &bull; {item.hbA1c}%
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStaged.length > 50 && (
                  <div className="py-2 text-center text-slate-400 text-xs bg-slate-50 border-t border-slate-100">
                    ... {isVi ? 'và' : 'and'} {filteredStaged.length - 50} {t('clinic.batchUploadModal.moreScansCount')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <CreditCard className="w-4 h-4 text-[#3478F6]" />
              <span>{t('clinic.batchUploadModal.estimatedConsumption')} <strong>{stagedItems.length} Credits</strong></span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="text-slate-600">
              {t('clinic.batchUploadModal.availableBalance')} <strong className="text-emerald-700">{currentCredits.toLocaleString()}</strong> Credits
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
            >
              {t('clinic.batchUploadModal.cancelButton')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={stagedItems.length === 0 || isSubmitting}
              className="px-5 py-2.5 bg-[#3478F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('clinic.batchUploadModal.deidentifyingQueuing')}
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  {t('clinic.batchUploadModal.startBatchButton')} ({stagedItems.length} {isVi ? 'Ảnh' : 'Scans'})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
