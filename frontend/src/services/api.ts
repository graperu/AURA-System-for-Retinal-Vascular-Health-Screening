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
