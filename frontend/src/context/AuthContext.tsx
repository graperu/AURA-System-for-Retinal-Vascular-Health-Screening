import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, getAccessToken, setAccessToken, type ApiErrorDetail } from '../services/api';
import type { UserSession } from '../types/auth';
import type { UserRole } from '../types/cds';

interface BackendUser { id: string; email: string; fullName: string | null; roles: string[]; active: boolean }
interface LoginResponse { accessToken: string; tokenType: string; expiresIn: number; user: BackendUser }
export interface AuthResult<T = any> { success: boolean; message?: string; code?: string; details?: ApiErrorDetail[]; data?: T }

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: (payload: { idToken: string; email?: string; fullName?: string; picture?: string }) => Promise<AuthResult>;
  loginWithSocial: (payload: { provider: string; idToken: string; email?: string; fullName?: string; picture?: string }) => Promise<AuthResult>;
  register: (data: { fullName?: string; email: string; password: string; phone?: string; role?: string }) => Promise<AuthResult>;
  sendOtp: (data: { email: string; fullName?: string; type?: string }) => Promise<AuthResult<{ email: string; expiresInSeconds: number }>>;
  verifyOtpAndRegister: (data: { email: string; otp: string; fullName?: string; password: string }) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toSession = (user: BackendUser, token: string): UserSession => {
  const roleName = user.roles[0] || 'USER';
  const roleMap: Record<string, UserRole> = { USER: 'patient', PATIENT: 'patient', DOCTOR: 'doctor', CLINIC: 'clinic', ADMIN: 'admin' };
  const role = roleMap[roleName] || 'patient';
  const titles: Record<UserRole, string> = { patient: 'Người dùng AURA', doctor: 'Bác sĩ', clinic: 'Phòng khám', admin: 'Quản trị viên' };
  return { id: user.id, email: user.email, name: user.fullName || user.email, role, roleTitle: titles[role], organization: 'AURA', token };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    let token = getAccessToken();
    if (!token) {
      const refreshed = await apiFetch<LoginResponse>('/api/v1/auth/refresh', { method: 'POST' });
      if (refreshed.success && refreshed.data) {
        token = refreshed.data.accessToken;
        setAccessToken(token);
        setUser(toSession(refreshed.data.user, token));
      } else setUser(null);
      setLoading(false);
      return;
    }
    const response = await apiFetch<BackendUser>('/api/v1/auth/me');
    if (response.success && response.data) setUser(toSession(response.data, getAccessToken() || token));
    else { setAccessToken(null); setUser(null); }
    setLoading(false);
  };

  useEffect(() => { void fetchCurrentUser(); }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const response = await apiFetch<LoginResponse>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) });
    if (response.success && response.data) {
      setAccessToken(response.data.accessToken);
      setUser(toSession(response.data.user, response.data.accessToken));
    }
    return { success: response.success, message: response.message, code: response.code, details: response.details };
  };

  const loginWithGoogle = async (payload: { idToken: string; email?: string; fullName?: string; picture?: string }): Promise<AuthResult> => {
    const response = await apiFetch<LoginResponse>('/api/v1/auth/google', { method: 'POST', body: JSON.stringify(payload) });
    if (response.success && response.data) {
      setAccessToken(response.data.accessToken);
      setUser(toSession(response.data.user, response.data.accessToken));
    }
    return { success: response.success, message: response.message, code: response.code, details: response.details };
  };

  const loginWithSocial = async (payload: { provider: string; idToken: string; email?: string; fullName?: string; picture?: string }): Promise<AuthResult> => {
    const response = await apiFetch<LoginResponse>('/api/v1/auth/social', { method: 'POST', body: JSON.stringify(payload) });
    if (response.success && response.data) {
      setAccessToken(response.data.accessToken);
      setUser(toSession(response.data.user, response.data.accessToken));
    }
    return { success: response.success, message: response.message, code: response.code, details: response.details };
  };

  const sendOtp = async (data: { email: string; fullName?: string; type?: string }): Promise<AuthResult<{ email: string; expiresInSeconds: number }>> => {
    const response = await apiFetch<{ email: string; expiresInSeconds: number }>('/api/v1/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email.trim(),
        fullName: data.fullName?.trim(),
        type: data.type || 'REGISTER'
      })
    });
    return { success: response.success, message: response.message, code: response.code, details: response.details, data: response.data };
  };

  const verifyOtpAndRegister = async (data: { email: string; otp: string; fullName?: string; password: string }): Promise<AuthResult> => {
    const response = await apiFetch<LoginResponse>('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email.trim(),
        otp: data.otp.trim(),
        fullName: data.fullName?.trim(),
        password: data.password
      })
    });
    if (response.success && response.data) {
      setAccessToken(response.data.accessToken);
      setUser(toSession(response.data.user, response.data.accessToken));
    }
    return { success: response.success, message: response.message, code: response.code, details: response.details };
  };

  const register = async (data: { fullName?: string; email: string; password: string; phone?: string; role?: string }): Promise<AuthResult> => {
    const payload = { email: data.email.trim(), password: data.password, ...(data.fullName?.trim() ? { fullName: data.fullName.trim() } : {}) };
    const response = await apiFetch<BackendUser>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    return { success: response.success, message: response.message, code: response.code, details: response.details };
  };

  const logout = async () => {
    await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    setAccessToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, loginWithSocial, register, sendOtp, verifyOtpAndRegister, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
