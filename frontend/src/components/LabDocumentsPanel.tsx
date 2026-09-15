import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileText, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { patientApi } from '../services/api';
import type { LabDocument } from '../types/cds';
import { useLanguage } from '../context/LanguageContext';
import { Modal } from './ui/Modal';
import { Pagination } from './ui/Pagination';

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

  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [docPage, setDocPage] = useState(1);
  const [docPageSize, setDocPageSize] = useState(5);
  const [docToDelete, setDocToDelete] = useState<LabDocument | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBatchDelete, setIsBatchDelete] = useState(false);

  const paginatedDocs = useMemo(() => {
    const start = (docPage - 1) * docPageSize;
    return documents.slice(start, start + docPageSize);
  }, [documents, docPage, docPageSize]);

  const toggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (paginatedDocs.length > 0 && paginatedDocs.every((d) => selectedDocIds.has(d.id))) {
      setSelectedDocIds((prev) => {
        const next = new Set(prev);
        paginatedDocs.forEach((d) => next.delete(d.id));
        return next;
      });
    } else {
      setSelectedDocIds((prev) => {
        const next = new Set(prev);
        paginatedDocs.forEach((d) => next.add(d.id));
        return next;
      });
    }
  };

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

  const handleConfirmDelete = async () => {
    setBusy(true);
    if (isBatchDelete) {
      const ids = Array.from(selectedDocIds);
      let successCount = 0;
      for (const id of ids) {
        const res = await patientApi.deleteLabDocument(id);
        if (res.success) successCount++;
      }
      setDocuments((current) => current.filter((doc) => !selectedDocIds.has(doc.id)));
      setSelectedDocIds(new Set());
      setMessage(isVi ? `Đã xóa ${successCount} tệp xét nghiệm.` : `Deleted ${successCount} lab documents.`);
    } else if (docToDelete) {
      const response = await patientApi.deleteLabDocument(docToDelete.id);
      if (response.success) {
        setDocuments((current) => current.filter((doc) => doc.id !== docToDelete.id));
        setSelectedDocIds((prev) => {
          const next = new Set(prev);
          next.delete(docToDelete.id);
          return next;
        });
        setMessage(isVi ? 'Đã xóa tệp xét nghiệm.' : 'Deleted lab document.');
      } else {
        setMessage(response.message || (isVi ? 'Không thể xóa tệp xét nghiệm.' : 'Could not delete lab document.'));
      }
    }
    setBusy(false);
    setIsDeleteModalOpen(false);
    setDocToDelete(null);
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
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50 cursor-pointer">
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
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={paginatedDocs.length > 0 && paginatedDocs.every((d) => selectedDocIds.has(d.id))}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
              <span>{isVi ? 'Chọn tất cả trên trang' : 'Select all on page'} ({selectedDocIds.size}/{documents.length})</span>
            </label>
            <span className="text-xs text-slate-500 font-medium">
              {isVi ? `Tổng: ${documents.length} tệp` : `Total: ${documents.length} files`}
            </span>
          </div>

          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {paginatedDocs.map((document) => {
              const isSelected = selectedDocIds.has(document.id);
              return (
                <li key={document.id} className={`flex items-center justify-between gap-3 p-3 transition-colors ${isSelected ? 'bg-teal-50/40' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectDoc(document.id)}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer shrink-0"
                      aria-label={`Select ${document.fileName}`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800">{document.fileName}</p>
                      <p className="text-[11px] text-slate-500">{(document.fileSize / 1024).toFixed(1)} KB · {new Date(document.uploadedAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => void download(document)} className="rounded-lg p-2 text-teal-700 hover:bg-teal-50 cursor-pointer" aria-label={isVi ? `Tải ${document.fileName}` : `Download ${document.fileName}`}><Download className="h-4 w-4" /></button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setDocToDelete(document);
                        setIsBatchDelete(false);
                        setIsDeleteModalOpen(true);
                      }}
                      className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-50"
                      aria-label={isVi ? `Xóa ${document.fileName}` : `Delete ${document.fileName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Pagination Controls */}
          {documents.length > 0 && (
            <Pagination
              currentPage={docPage}
              totalPages={Math.max(1, Math.ceil(documents.length / docPageSize))}
              totalItems={documents.length}
              pageSize={docPageSize}
              onPageChange={setDocPage}
              onPageSizeChange={(sz) => {
                setDocPageSize(sz);
                setDocPage(1);
              }}
              pageSizeOptions={[5, 10, 20]}
              itemLabel={isVi ? 'tệp xét nghiệm' : 'lab documents'}
            />
          )}
        </div>
      )}

      {/* Sticky Batch Action Toolbar */}
      {selectedDocIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs font-semibold">
              {isVi
                ? `Đã chọn ${selectedDocIds.size} / ${documents.length} tệp xét nghiệm`
                : `Selected ${selectedDocIds.size} / ${documents.length} lab files`}
            </span>
          </div>
          <div className="h-4 w-[1px] bg-slate-700" />
          <button
            onClick={() => setSelectedDocIds(new Set())}
            className="text-xs text-slate-300 hover:text-white font-medium cursor-pointer"
          >
            {isVi ? 'Bỏ chọn' : 'Deselect'}
          </button>
          <button
            onClick={() => {
              setIsBatchDelete(true);
              setDocToDelete(null);
              setIsDeleteModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isVi ? `Xóa Đã Chọn (${selectedDocIds.size})` : `Delete Selected (${selectedDocIds.size})`}
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDocToDelete(null);
        }}
        title={isVi ? 'Xác nhận xóa tệp xét nghiệm' : 'Confirm Delete Lab Document'}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {isBatchDelete
              ? (isVi
                  ? `Bạn có chắc chắn muốn xóa ${selectedDocIds.size} tệp xét nghiệm đã chọn không? Thao tác này không thể hoàn tác.`
                  : `Are you sure you want to delete ${selectedDocIds.size} selected lab documents? This action cannot be undone.`)
              : (isVi
                  ? `Bạn có chắc chắn muốn xóa tệp "${docToDelete?.fileName}" không?`
                  : `Are you sure you want to delete file "${docToDelete?.fileName}"?`)}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDocToDelete(null);
              }}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {t('common.cancel', isVi ? 'Hủy' : 'Cancel')}
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={busy}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {isVi ? 'Xác Nhận Xóa' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
};
