import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, GripVertical, Loader2, Stethoscope, UserRound, Users } from 'lucide-react';
import { assignmentApi } from '../services/api';

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
  const [board, setBoard] = useState<Board>({ doctors: [], patients: [] });
  const [selected, setSelected] = useState<string[]>([]);
  const [targetDoctorId, setTargetDoctorId] = useState('');
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setBusy(true);
    const response = await assignmentApi.getBoard();
    setBusy(false);
    if (response.success && response.data) setBoard(response.data);
    else setMessage(response.message || 'Không thể tải bảng phân công bệnh nhân.');
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
    const response = await assignmentApi.assign(doctorId, patientIds, true);
    setBusy(false);
    if (response.success && response.data) {
      setBoard(response.data);
      setSelected([]);
      setMessage(`Đã phân công ${patientIds.length} bệnh nhân.`);
    } else setMessage(response.message || 'Phân công bệnh nhân không thành công.');
  };

  const unassign = async (doctorId: string, patientId: string) => {
    setBusy(true);
    const response = await assignmentApi.unassign(doctorId, patientId);
    setBusy(false);
    if (response.success && response.data) {
      setBoard(response.data);
      setMessage('Đã đưa bệnh nhân về danh sách chưa phân công.');
    } else setMessage(response.message || 'Không thể hủy phân công.');
  };

  const readDrag = (event: React.DragEvent): DragPayload | null => {
    try { return JSON.parse(event.dataTransfer.getData('application/json')); }
    catch { return null; }
  };

  const PatientCard = ({ patient, sourceDoctorId }: { patient: Patient; sourceDoctorId?: string }) => (
    <div draggable
      onDragStart={(event) => event.dataTransfer.setData('application/json', JSON.stringify({ patientId: patient.id, sourceDoctorId }))}
      className="flex cursor-grab items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing">
      <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />
      <input type="checkbox" checked={selected.includes(patient.id)}
        onChange={(event) => setSelected((current) => event.target.checked ? [...new Set([...current, patient.id])] : current.filter((id) => id !== patient.id))}
        aria-label={`Chọn ${patient.fullName || patient.email}`} />
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slate-900">{patient.fullName || patient.email}</p>
        <p className="truncate text-[11px] text-slate-500">{patient.mrn || 'Chưa có MRN'} · {patient.email}</p>
      </div>
    </div>
  );

  if (busy && board.doctors.length === 0) {
    return <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-sm text-slate-600"><Loader2 className="h-5 w-5 animate-spin" /> Đang tải bảng phân công...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900"><Users className="h-5 w-5 text-cyan-700" /> Điều phối bệnh nhân cho bác sĩ</h2>
            <p className="mt-1 text-xs text-slate-500">Kéo thẻ bệnh nhân sang bác sĩ hoặc chọn nhiều bệnh nhân để phân công hàng loạt.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select value={targetDoctorId} onChange={(event) => setTargetDoctorId(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs">
              <option value="">Chọn bác sĩ phụ trách</option>
              {board.doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.fullName || doctor.email}</option>)}
            </select>
            <button type="button" disabled={busy || !targetDoctorId || selected.length === 0} onClick={() => void assign(targetDoctorId, selected)}
              className="rounded-lg bg-cyan-700 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50">
              Phân công {selected.length > 0 ? `${selected.length} bệnh nhân` : 'đã chọn'}
            </button>
          </div>
        </div>
        {message && <p role="status" className="mt-3 flex items-center gap-1 text-xs text-slate-700"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> {message}</p>}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const item = readDrag(event); if (item?.sourceDoctorId) void unassign(item.sourceDoctorId, item.patientId); }}
          className="min-h-64 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
          <h3 className="mb-3 flex items-center justify-between text-sm font-bold text-slate-800"><span className="flex items-center gap-2"><UserRound className="h-4 w-4" /> Chưa phân công</span><span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">{unassigned.length}</span></h3>
          <div className="space-y-2">{unassigned.map((patient) => <PatientCard key={patient.id} patient={patient} />)}</div>
          {unassigned.length === 0 && <p className="py-8 text-center text-xs text-slate-500">Tất cả bệnh nhân đã có bác sĩ phụ trách.</p>}
        </section>

        {board.doctors.map((doctor) => {
          const assigned = board.patients.filter((patient) => patient.assignedDoctorIds.includes(doctor.id));
          return (
            <section key={doctor.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const item = readDrag(event); if (item) void assign(doctor.id, [item.patientId]); }}
              className="min-h-64 rounded-2xl border border-cyan-200 bg-cyan-50/40 p-4">
              <h3 className="mb-1 flex items-center justify-between text-sm font-bold text-cyan-950"><span className="flex items-center gap-2"><Stethoscope className="h-4 w-4" /> {doctor.fullName || doctor.email}</span><span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs">{assigned.length}</span></h3>
              <p className="mb-3 truncate text-[11px] text-slate-500">{doctor.email}</p>
              <div className="space-y-2">{assigned.map((patient) => <PatientCard key={patient.id} patient={patient} sourceDoctorId={doctor.id} />)}</div>
              {assigned.length === 0 && <p className="py-8 text-center text-xs text-slate-500">Thả bệnh nhân vào đây để phân công.</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
};
