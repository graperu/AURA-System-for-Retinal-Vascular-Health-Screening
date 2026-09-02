export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
  details?: ApiErrorDetail[];
  timestamp?: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
let accessToken: string | null = localStorage.getItem('accessToken');
let refreshRequest: Promise<string | null> | null = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) localStorage.setItem('accessToken', token);
  else localStorage.removeItem('accessToken');
};

const request = async <T>(endpoint: string, options: RequestInit): Promise<{ response: Response; body: ApiResponse<T> }> => {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  let body: ApiResponse<T>;
  try {
    body = await response.json();
  } catch {
    body = { success: false, message: response.status >= 500 ? 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.' : 'Phản hồi từ máy chủ không hợp lệ.' };
  }
  if (!response.ok) body.success = false;
  return { response, body };
};

const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshRequest) {
    refreshRequest = request<{ accessToken: string }>('/api/v1/auth/refresh', { method: 'POST' })
      .then(({ response, body }) => {
        const token = response.ok && body.success ? body.data?.accessToken ?? null : null;
        setAccessToken(token);
        return token;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => { refreshRequest = null; });
  }
  return refreshRequest;
};

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    let result = await request<T>(endpoint, options);
    const canRefresh = result.response.status === 401 && !['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/refresh'].includes(endpoint);
    if (canRefresh && await refreshAccessToken()) result = await request<T>(endpoint, options);
    return result.body;
  } catch (error) {
    return {
      success: false,
      code: 'NETWORK_ERROR',
      message: error instanceof TypeError ? 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.' : 'Đã xảy ra lỗi không xác định.',
    };
  }
}

// ============================================================================
// REAL PRODUCTION BACKEND API CLIENT MODULES (PostgreSQL & Spring Boot 3.4)
// ============================================================================

export const authApi = {
  loginWithGoogle: (payload: { idToken: string; email?: string; fullName?: string; picture?: string }) =>
    apiFetch<any>('/api/v1/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  loginWithSocial: (payload: { provider: string; idToken: string; email?: string; fullName?: string; picture?: string }) =>
    apiFetch<any>('/api/v1/auth/social', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const screeningApi = {
  create: (imageUrl: string) =>
    apiFetch<any>('/api/v1/screenings', {
      method: 'POST',
      body: JSON.stringify({ imageUrl }),
    }),

  getAll: () =>
    apiFetch<any[]>('/api/v1/screenings', {
      method: 'GET',
    }),

  getById: (id: string) =>
    apiFetch<any>(`/api/v1/screenings/${id}`, {
      method: 'GET',
    }),

  doctorReview: (id: string, doctorNotes: string, riskLevel: string) =>
    apiFetch<any>(`/api/v1/screenings/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ doctorNotes, riskLevel }),
    }),
};

export const chatApi = {
  sendMessage: (receiverId: string, content: string, screeningId?: string) =>
    apiFetch<any>('/api/v1/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, content, screeningId }),
    }),

  getConversation: (otherUserId: string) =>
    apiFetch<any[]>(`/api/v1/chat/conversation/${otherUserId}`, {
      method: 'GET',
    }),

  markAsRead: (senderId: string) =>
    apiFetch<void>(`/api/v1/chat/read/${senderId}`, {
      method: 'PUT',
    }),
};

export const billingApi = {
  purchase: (packageId: number) =>
    apiFetch<any>(`/api/v1/me/packages/${packageId}/purchase`, {
      method: 'POST',
    }),

  mySubscriptions: () =>
    apiFetch<any[]>('/api/v1/me/subscriptions', {
      method: 'GET',
    }),

  myPayments: () =>
    apiFetch<any[]>('/api/v1/me/payments', {
      method: 'GET',
    }),
};

export const feedbackApi = {
  submit: (request: any) =>
    apiFetch<any>('/api/v1/doctor/feedback', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  getDoctorFeedbacks: (page = 0, size = 20) =>
    apiFetch<any>(`/api/v1/doctor/feedback?page=${page}&size=${size}`, {
      method: 'GET',
    }),

  getByScreening: (screeningId: string) =>
    apiFetch<any[]>(`/api/v1/doctor/feedback/screening/${screeningId}`, {
      method: 'GET',
    }),
};

export const auditApi = {
  getLogs: (page = 0, size = 20) =>
    apiFetch<any>(`/api/v1/admin/audit-logs?page=${page}&size=${size}`, {
      method: 'GET',
    }),

  exportLogs: () =>
    apiFetch<any[]>('/api/v1/admin/audit-logs/export', {
      method: 'GET',
    }),
};

export const adminUserApi = {
  getUsers: (page = 0, size = 20) =>
    apiFetch<any>(`/api/v1/admin/users?page=${page}&size=${size}`, {
      method: 'GET',
    }),

  updateStatus: (userId: string, active: boolean) =>
    apiFetch<any>(`/api/v1/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),
};
