import React, { useEffect, useRef, useState } from 'react';
import { Download, FileText, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { patientApi } from '../services/api';
import type { LabDocument } from '../types/cds';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  patientId?: string;
}

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

export const LabDocumentsPanel: React.FC<Props> = ({ patientId }) => {
  const { t, isVi } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<LabDocument[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadDocuments = async () => {
    const response = await patientApi.getLabDocuments();
    if (response.success) setDocuments(response.data || []);
    else setMessage(response.message || (isVi ? 'Không thể tải danh sách tệp xét nghiệm.' : 'Could not load lab documents.'));
  };

  useEffect(() => { void loadDocuments(); }, []);

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setMessage(isVi ? 'Chỉ chấp nhận tệp PDF, PNG hoặc JPEG.' : 'Only PDF, PNG or JPEG files are accepted.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setMessage(isVi ? 'Tệp xét nghiệm không được vượt quá 10 MB.' : 'Lab file must not exceed 10 MB.');
      return;
    }
    setBusy(true);
    setMessage(null);
    const response = await patientApi.uploadLabDocument(file);
    setBusy(false);
    if (response.success && response.data) {
      setDocuments((current) => [response.data, ...current]);
      setMessage(isVi ? 'Đã lưu tệp vào hồ sơ bệnh án.' : 'File saved to medical record.');
    } else setMessage(response.message || (isVi ? 'Tải tệp không thành công.' : 'File upload failed.'));
  };

  const remove = async (documentId: string) => {
    setBusy(true);
    const response = await patientApi.deleteLabDocument(documentId);
    setBusy(false);
    if (response.success) setDocuments((current) => current.filter((doc) => doc.id !== documentId));
    else setMessage(response.message || (isVi ? 'Không thể xóa tệp xét nghiệm.' : 'Could not delete lab document.'));
  };

  const download = async (document: LabDocument) => {
    if (!patientId) {
      setMessage(isVi ? 'Không xác định được hồ sơ bệnh nhân để tải tệp.' : 'Patient profile not identified for download.');
      return;
    }
    try {
      await patientApi.downloadLabDocument(patientId, document.id, document.fileName);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (isVi ? 'Không thể tải tệp xét nghiệm.' : 'Could not download lab document.'));
    }
  };

  return (
    <section className="space-y-4 animate-fadeIn" aria-labelledby="lab-documents-heading">
      <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
        <h3 id="lab-documents-heading" className="flex items-center gap-2 text-sm font-bold text-teal-950">
          <UploadCloud className="h-4 w-4" /> {isVi ? 'Kết quả xét nghiệm đính kèm' : 'Attached Lab Test Results'}
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          {isVi ? 'Lưu phiếu xét nghiệm PDF hoặc ảnh PNG/JPEG để bác sĩ xem cùng hồ sơ y tế.' : 'Attach PDF lab sheets or PNG/JPEG images for doctors to review with medical records.'}
        </p>
        <input ref={inputRef} className="hidden" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={upload} />
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {isVi ? 'Chọn tệp (tối đa 10 MB)' : 'Choose file (max 10 MB)'}
        </button>
      </div>

      {message && <p role="status" className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">{message}</p>}

      {documents.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
          <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" /> {isVi ? 'Chưa có kết quả xét nghiệm nào.' : 'No lab test results attached yet.'}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {documents.map((document) => (
            <li key={document.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800">{document.fileName}</p>
                <p className="text-[11px] text-slate-500">{(document.fileSize / 1024).toFixed(1)} KB · {new Date(document.uploadedAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => void download(document)} className="rounded-lg p-2 text-teal-700 hover:bg-teal-50" aria-label={isVi ? `Tải ${document.fileName}` : `Download ${document.fileName}`}><Download className="h-4 w-4" /></button>
                <button type="button" disabled={busy} onClick={() => void remove(document.id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" aria-label={isVi ? `Xóa ${document.fileName}` : `Delete ${document.fileName}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
