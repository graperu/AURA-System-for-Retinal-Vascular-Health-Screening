import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, GripVertical, Loader2, RefreshCw, Stethoscope, UserRound, Users } from 'lucide-react';
import { assignmentApi } from '../services/api';
import { realtimeBus } from '../services/realtimeService';
import { ClinicalSelect, ClinicalSelectOption } from './ui/ClinicalSelect';
import { useLanguage } from '../context/LanguageContext';

interface Doctor {
  id: string;
  fullName?: string | null;
  email: string;
  assignedPatientCount: number;
}

interface Patient {
  id: string;
  fullName?: string | null;
  email: string;
  mrn?: string | null;
  assignedDoctorIds: string[];
}

interface Board {
  doctors: Doctor[];
  patients: Patient[];
}

interface DragPayload { patientId: string; sourceDoctorId?: string }

export const PatientAssignmentBoard: React.FC = () => {
  const { t, isVi } = useLanguage();
  const [board, setBoard] = useState<Board>({ doctors: [], patients: [] });
  const [selected, setSelected] = useState<string[]>([]);
  const [targetDoctorId, setTargetDoctorId] = useState('');
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = async () => {
    setBusy(true);
    setErrorMessage(null);
    try {
      const response = await assignmentApi.getBoard();
      setBusy(false);
      if (response.success && response.data) {
        setBoard(response.data);
        setErrorMessage(null);
      } else {
        setErrorMessage(response.message || (isVi ? 'Không thể tải bảng phân công bệnh nhân.' : 'Failed to load patient assignment board.'));
      }
    } catch (err: any) {
      setBusy(false);
      setErrorMessage(err.message || (isVi ? 'Không thể kết nối máy chủ phân công.' : 'Failed to connect to assignment server.'));
    }
  };

  useEffect(() => { void load(); }, []);

  const unassigned = useMemo(
    () => board.patients.filter((patient) => patient.assignedDoctorIds.length === 0),
    [board.patients]
  );

  const assign = async (doctorId: string, patientIds: string[]) => {
    if (!doctorId || patientIds.length === 0) return;
    setBusy(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const response = await assignmentApi.assign(doctorId, patientIds, true);
      setBusy(false);
      if (response.success && response.data) {
        setBoard(response.data);
        setSelected([]);
        setMessage(isVi ? `Đã phân công ${patientIds.length} bệnh nhân.` : `Assigned ${patientIds.length} patients.`);
        realtimeBus.emit('doctor:assignment', { doctorId, patientIds });
      } else {
        setErrorMessage(response.message || (isVi ? 'Phân công bệnh nhân không thành công.' : 'Patient assignment failed.'));
      }
    } catch (err: any) {
      setBusy(false);
      setErrorMessage(err.message || (isVi ? 'Lỗi kết nối máy chủ.' : 'Server connection error.'));
    }
  };

  const unassign = async (doctorId: string, patientId: string) => {
    setBusy(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const response = await assignmentApi.unassign(doctorId, patientId);
      setBusy(false);
      if (response.success && response.data) {
        setBoard(response.data);
        setMessage(isVi ? 'Đã đưa bệnh nhân về danh sách chưa phân công.' : 'Patient moved back to unassigned queue.');
        realtimeBus.emit('doctor:assignment', { doctorId, patientId });
      } else {
        setErrorMessage(response.message || (isVi ? 'Không thể hủy phân công.' : 'Failed to unassign patient.'));
      }
    } catch (err: any) {
      setBusy(false);
      setErrorMessage(err.message || (isVi ? 'Lỗi kết nối máy chủ.' : 'Server connection error.'));
    }
  };

  const readDrag = (event: React.DragEvent): DragPayload | null => {
    try {
      const raw = event.dataTransfer.getData('application/json') || event.dataTransfer.getData('text/plain');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const PatientCard = ({ patient, sourceDoctorId }: { patient: Patient; sourceDoctorId?: string }) => (
    <div draggable
      onDragStart={(event) => {
        const payload = JSON.stringify({ patientId: patient.id, sourceDoctorId });
        event.dataTransfer.setData('application/json', payload);
        event.dataTransfer.setData('text/plain', payload);
      }}
      className="flex cursor-grab items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing">
      <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />
      <input type="checkbox" checked={selected.includes(patient.id)}
        onChange={(event) => setSelected((current) => event.target.checked ? [...new Set([...current, patient.id])] : current.filter((id) => id !== patient.id))}
        aria-label={`${isVi ? 'Chọn' : 'Select'} ${patient.fullName || patient.email}`} />
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slate-900">{patient.fullName || patient.email}</p>
        <p className="truncate text-[11px] text-slate-500"><span className="font-mono-data font-semibold text-slate-700">{patient.mrn || (isVi ? 'Chưa có MRN' : 'No MRN')}</span> · {patient.email}</p>
      </div>
    </div>
  );

  const doctorOptions: ClinicalSelectOption<string>[] = useMemo(() => [
    { value: '', label: t('doctor.assignmentBoard.selectDoctorPlaceholder', 'Chọn bác sĩ phụ trách') },
    ...board.doctors.map((doctor) => ({
      value: doctor.id,
      label: doctor.fullName || doctor.email,
      sublabel: doctor.fullName ? doctor.email : undefined,
    }))
  ], [board.doctors, t]);

  if (busy && board.doctors.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-sm text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" /> {t('doctor.assignmentBoard.loading', 'Đang tải bảng phân công...')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
              <Users className="h-5 w-5 text-brand-700" /> {t('doctor.assignmentBoard.title', 'Điều phối bệnh nhân cho bác sĩ')}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {t('doctor.assignmentBoard.subtitle', 'Kéo thẻ bệnh nhân sang bác sĩ hoặc chọn nhiều bệnh nhân để phân công hàng loạt.')}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ClinicalSelect<string>
              value={targetDoctorId}
              onChange={setTargetDoctorId}
              options={doctorOptions}
              size="sm"
              placeholder={t('doctor.assignmentBoard.selectDoctorPlaceholder', 'Chọn bác sĩ phụ trách')}
              className="w-full sm:w-60"
            />
            <button type="button" disabled={busy || !targetDoctorId || selected.length === 0} onClick={() => void assign(targetDoctorId, selected)}
              className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 active:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
              {t('doctor.assignmentBoard.assignButton', 'Phân công')} {selected.length > 0 ? `${selected.length} ${isVi ? 'bệnh nhân' : 'patients'}` : t('doctor.assignmentBoard.selected', 'đã chọn')}
            </button>
          </div>
        </div>
        {errorMessage && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 flex items-center justify-between gap-3 text-xs text-rose-800">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="shrink-0 px-3 py-1 bg-white border border-rose-300 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
            >
              {isVi ? 'Thử lại' : 'Retry'}
            </button>
          </div>
        )}
        {message && (
          <p role="status" className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> {message}
          </p>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const item = readDrag(event); if (item?.sourceDoctorId) void unassign(item.sourceDoctorId, item.patientId); }}
          className="min-h-64 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 flex flex-col justify-start">
          <h3 className="mb-3 flex items-center justify-between text-sm font-bold text-slate-800">
            <span className="flex items-center gap-2"><UserRound className="h-4 w-4 text-slate-600" /> {t('doctor.assignmentBoard.unassignedColumn', 'Chưa phân công')}</span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">{unassigned.length}</span>
          </h3>
          <div className="space-y-2">{unassigned.map((patient) => <PatientCard key={patient.id} patient={patient} />)}</div>
          {unassigned.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Users className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">
                {isVi ? 'Tất cả bệnh nhân đã có bác sĩ phụ trách' : 'All patients have been assigned'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isVi ? 'Không có ca bệnh nào đang chờ điều phối.' : 'No pending cases waiting for assignment.'}
              </p>
            </div>
          )}
        </section>

        {board.doctors.length === 0 ? (
          <div className="xl:col-span-2 min-h-64 rounded-2xl border border-slate-200 bg-white p-8 flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#3478F6] flex items-center justify-center mb-3">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              {isVi ? 'Chưa có bác sĩ trong danh sách điều phối' : 'No attending doctors available'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mb-4 leading-relaxed">
              {isVi
                ? 'Hệ thống chưa có bác sĩ nào sẵn sàng tiếp nhận phân công bệnh nhân. Vui lòng thêm tài khoản bác sĩ tại mục "Quản lý Bác sĩ" hoặc liên hệ Quản trị viên để cấu hình danh sách bác sĩ chuyên khoa.'
                : 'No active doctor accounts available to receive patient assignments. Please register doctors in Doctor Management.'}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {isVi ? 'Tải lại danh sách' : 'Refresh list'}
            </button>
          </div>
        ) : (
          board.doctors.map((doctor) => {
            const assigned = board.patients.filter((patient) => patient.assignedDoctorIds.includes(doctor.id));
            return (
              <section key={doctor.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const item = readDrag(event); if (item) void assign(doctor.id, [item.patientId]); }}
                className="min-h-64 rounded-2xl border border-brand-200 bg-brand-50/50 p-4">
                <h3 className="mb-1 flex items-center justify-between text-sm font-bold text-brand-950">
                  <span className="flex items-center gap-2 truncate max-w-[200px]">
                    <Stethoscope className="h-4 w-4 shrink-0 text-brand-600" />
                    <span className="truncate">{doctor.fullName || doctor.email}</span>
                  </span>
                  <span className="rounded-full bg-brand-100 text-brand-800 px-2 py-0.5 text-xs font-bold shrink-0">{assigned.length}</span>
                </h3>
                <p className="mb-3 truncate text-[11px] text-slate-500">{doctor.email}</p>
                <div className="space-y-2">{assigned.map((patient) => <PatientCard key={patient.id} patient={patient} sourceDoctorId={doctor.id} />)}</div>
                {assigned.length === 0 && <p className="py-8 text-center text-xs text-slate-500">{t('doctor.assignmentBoard.dropToAssign', 'Thả bệnh nhân vào đây để phân công.')}</p>}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
};
