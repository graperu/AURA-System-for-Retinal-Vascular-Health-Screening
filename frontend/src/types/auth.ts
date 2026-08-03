import { UserRole } from './cds';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  organization: string;
  avatarUrl?: string;
  token: string;
  mrn?: string; // For patient role
}

export const MOCK_USERS: Record<UserRole, UserSession> = {
  patient: {
    id: 'USR-PAT-001',
    email: 'patient@auraclinical.com',
    name: 'Trần Văn Hoàng',
    role: 'patient',
    roleTitle: 'Bệnh Nhân Sàng Lọc',
    organization: 'Cổng Bệnh Nhân AURA Health',
    mrn: 'MRN-2026-0941',
    token: 'MOCK_PATIENT_JWT_TOKEN_2026',
  },
  doctor: {
    id: 'USR-DOC-001',
    email: 'doctor@auraclinical.com',
    name: 'BS. CKII Nguyễn Thị Thanh',
    role: 'doctor',
    roleTitle: 'Bác Sĩ Chẩn Đoán Võng Mạc & CDS',
    organization: 'Bệnh Viện Mắt Kỹ Thuật Cao',
    token: 'MOCK_DOCTOR_JWT_TOKEN_2026',
  },
  clinic: {
    id: 'USR-CLN-001',
    email: 'clinic@auraclinical.com',
    name: 'Bệnh Viện Đa Khoa Trung Ương',
    role: 'clinic',
    roleTitle: 'Quản Lý Phòng Khám & Bulk Screening',
    organization: 'Hệ Thống Phòng Khám Liên Kết AURA',
    token: 'MOCK_CLINIC_JWT_TOKEN_2026',
  },
  admin: {
    id: 'USR-[#0891B2]-001',
    email: 'admin@auraclinical.com',
    name: 'Phan Định',
    role: 'admin',
    roleTitle: 'Quản Trị An Ninh & Nhật Ký Kiểm Toán',
    organization: 'Trung Tâm Điều Hành AURA System',
    token: 'MOCK_ADMIN_JWT_TOKEN_2026',
  },
};
