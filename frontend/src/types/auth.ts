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
  mrn?: string;
}
