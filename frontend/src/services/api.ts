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

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || "").replace(
  /\/$/,
  "",
);
let accessToken: string | null = typeof localStorage !== "undefined" ? localStorage.getItem("accessToken") : null;
let refreshRequest: Promise<string | null> | null = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) localStorage.setItem("accessToken", token);
  else localStorage.removeItem("accessToken");
};

const request = async <T>(
  endpoint: string,
  options: RequestInit,
): Promise<{ response: Response; body: ApiResponse<T> }> => {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (accessToken && endpoint !== "/api/v1/auth/refresh")
    headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  let body: any;
  // FE-03: Xử lý an toàn phản hồi HTTP 204 No Content và 205 Reset Content
  if (response.status === 204 || response.status === 205) {
    body = {
      success: true,
      data: null,
      message: "Thao tác thành công",
    };
  } else {
    try {
      const text = await response.text();
      body = text && text.trim().length > 0 ? JSON.parse(text) : { success: true, data: null };
    } catch {
      body = {
        success: false,
        message:
          response.status >= 500
            ? "Máy chủ đang gặp sự cố. Vui lòng thử lại sau."
            : "Phản hồi từ máy chủ không hợp lệ.",
      };
    }
  }

  if (!response.ok) {
    if (typeof body === "object" && body !== null) {
      body.success = false;
    }
  } else {
    // Tự động chuẩn hóa phản hồi từ các endpoint chưa bọc ApiResponse
    if (typeof body === "object" && body !== null && body.success === undefined) {
      body = Array.isArray(body)
        ? { success: true, data: body }
        : {
            success: true,
            data: body,
            ...body,
          };
    }
  }
  return { response, body };
};

const dispatchSessionExpired = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("aura:session_expired"));
  }
};

const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshRequest) {
    refreshRequest = request<{ accessToken: string }>("/api/v1/auth/refresh", {
      method: "POST",
    })
      .then(({ response, body }) => {
        const token =
          response.ok && body.success ? (body.data?.accessToken ?? null) : null;
        setAccessToken(token);
        if (!token) {
          dispatchSessionExpired();
        }
        return token;
      })
      .catch(() => {
        setAccessToken(null);
        dispatchSessionExpired();
        return null;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
};

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    let result = await request<T>(endpoint, options);
    const canRefresh =
      result.response.status === 401 &&
      ![
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/refresh",
      ].includes(endpoint);
    if (canRefresh) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        result = await request<T>(endpoint, options);
      } else {
        dispatchSessionExpired();
      }
    }
    return result.body;
  } catch (error) {
    return {
      success: false,
      code: "NETWORK_ERROR",
      message:
        error instanceof TypeError
          ? "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại."
          : "Đã xảy ra lỗi không xác định.",
    };
  }
}

// ============================================================================
// REAL PRODUCTION BACKEND API CLIENT MODULES (PostgreSQL & Spring Boot 3.4)
// ============================================================================

export const authApi = {
  loginWithGoogle: (payload: {
    idToken: string;
    email?: string;
    fullName?: string;
    picture?: string;
  }) =>
    apiFetch<any>("/api/v1/auth/google", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  loginWithSocial: (payload: {
    provider: string;
    idToken: string;
    email?: string;
    fullName?: string;
    picture?: string;
  }) =>
    apiFetch<any>("/api/v1/auth/social", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export interface CreateScreeningPayload {
  imageUrl: string;
  eyePosition?: string;
  eye?: string;
  scanType?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export const screeningApi = {
  create: (payload: string | CreateScreeningPayload) => {
    const body = typeof payload === "string" ? { imageUrl: payload } : payload;
    return apiFetch<any>("/api/v1/screenings", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  getAll: async (params?: { page?: number; size?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.size !== undefined) query.set("size", String(params.size));
    if (params?.status) query.set("status", params.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiFetch<any>(`/api/v1/screenings${qs}`, {
      method: "GET",
    });
    if (res && res.success && res.data) {
      if (Array.isArray(res.data)) {
        return res;
      }
      if (Array.isArray(res.data.items)) {
        return { ...res, data: res.data.items, pageInfo: res.data };
      }
      if (Array.isArray(res.data.content)) {
        return { ...res, data: res.data.content, pageInfo: res.data };
      }
    }
    return res;
  },

  getById: (id: string) =>
    apiFetch<any>(`/api/v1/screenings/${id}`, {
      method: "GET",
    }),

  doctorReview: (
    id: string,
    payload: {
      decision: "APPROVED" | "MODIFIED" | "REJECTED";
      doctorNotes: string;
      adjustedCardioRisk?: string;
      adjustedDrRisk?: string;
      icd10Codes: string[];
      recommendations?: string;
      doctorFindings?: string;
      findings?: string;
    },
  ) =>
    apiFetch<any>(`/api/v1/screenings/${id}/review`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/api/v1/screenings/${id}`, {
      method: "DELETE",
    }),

  batchDelete: (ids: string[]) =>
    apiFetch<number>("/api/v1/screenings/batch-delete", {
      method: "POST",
      body: JSON.stringify({ screeningIds: ids }),
    }),
};

export const chatApi = {
  sendMessage: (receiverId: string, content: string, screeningId?: string) =>
    apiFetch<any>("/api/v1/chat/messages", {
      method: "POST",
      body: JSON.stringify({
        receiverId,
        messageText: content,
        content,
        screeningId: screeningId || undefined,
      }),
    }),

  getConversation: (otherUserId: string) =>
    apiFetch<any[]>(`/api/v1/chat/conversation/${otherUserId}`, {
      method: "GET",
    }),

  markAsRead: (senderId: string) =>
    apiFetch<void>(`/api/v1/chat/read/${senderId}`, {
      method: "PUT",
    }),

  getUnreadCount: () =>
    apiFetch<{ unreadCount: number }>("/api/v1/chat/unread-count", {
      method: "GET",
    }),
};

export const notificationApi = {
  getNotifications: () =>
    apiFetch<any[]>("/api/v1/notifications", { method: "GET" }),

  getUnreadCount: () =>
    apiFetch<{ unreadCount: number }>("/api/v1/notifications/unread-count", {
      method: "GET",
    }),

  markAsRead: (id: string) =>
    apiFetch<any>(`/api/v1/notifications/${id}/read`, { method: "PUT" }),

  markAsUnread: (id: string) =>
    apiFetch<any>(`/api/v1/notifications/${id}/unread`, { method: "PUT" }),

  markAllAsRead: () =>
    apiFetch<void>("/api/v1/notifications/read-all", { method: "PUT" }),

  deleteNotification: (id: string) =>
    apiFetch<void>(`/api/v1/notifications/${id}`, { method: "DELETE" }),

  clearAll: () =>
    apiFetch<void>("/api/v1/notifications", { method: "DELETE" }),

  getStreamUrl: () => `${API_BASE_URL}/api/v1/notifications/stream`,
};

export interface ServicePackageResponse {
  id: number;
  name: string;
  description?: string;
  scope: "INDIVIDUAL" | "CLINIC";
  price: number;
  credits: number;
  validityDays?: number;
  active?: boolean;
}

export interface PaymentStatusResponse {
  transactionId: number;
  providerReference: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
  amount: number;
  creditsAdded?: number;
  paidAt?: string;
  expiresAt?: string;
  failureReason?: string;
}

export interface PaymentTransactionResponse {
  id: number;
  servicePackageId?: number;
  servicePackageName?: string;
  amount: number;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
  provider: string;
  failureReason?: string;
  createdAt?: string;
  paidAt?: string;
  providerReference?: string;
  paymentUrl?: string;
  merchantId?: string;
  transferContent?: string;
  qrCodeUrl?: string;
  expiresAt?: string;
}

export const billingApi = {
  checkout: (packageId: number, paymentMethod = "VIETQR") =>
    apiFetch<PaymentTransactionResponse>(
      `/api/v1/me/packages/${packageId}/checkout?paymentMethod=${paymentMethod}`,
      {
        method: "POST",
      },
    ),

  purchase: (packageId: number, paymentMethod = "VIETQR") =>
    apiFetch<PaymentTransactionResponse>(
      `/api/v1/me/packages/${packageId}/purchase?paymentMethod=${paymentMethod}`,
      {
        method: "POST",
      },
    ),

  purchasePackage: (packageId: number, paymentMethod = "VIETQR") =>
    billingApi.purchase(packageId, paymentMethod),

  getTransactionStatus: (transactionId: number | string) =>
    apiFetch<PaymentStatusResponse>(
      `/api/v1/me/payments/${transactionId}/status`,
      {
        method: "GET",
      },
    ),

  confirmLocalPayment: (transactionId: number | string) =>
    apiFetch<PaymentStatusResponse>(
      `/api/v1/me/payments/${transactionId}/confirm-local`,
      {
        method: "POST",
      },
    ),

  packages: (scope: "INDIVIDUAL" | "CLINIC" = "CLINIC") =>
    apiFetch<ServicePackageResponse[]>(`/api/v1/packages?scope=${scope}`, { method: "GET" }),

  mySubscriptions: () =>
    apiFetch<any[]>("/api/v1/me/subscriptions", {
      method: "GET",
    }),

  myPayments: () =>
    apiFetch<PaymentTransactionResponse[]>("/api/v1/me/payments", {
      method: "GET",
    }),

  getRemainingCredits: () =>
    apiFetch<{ remainingCredits: number }>("/api/v1/me/credits", {
      method: "GET",
    }),
};

export const feedbackApi = {
  submit: (request: any) =>
    apiFetch<any>("/api/v1/doctor/feedback", {
      method: "POST",
      body: JSON.stringify(request),
    }),

  getDoctorFeedbacks: (page = 0, size = 20) =>
    apiFetch<any>(`/api/v1/doctor/feedback?page=${page}&size=${size}`, {
      method: "GET",
    }),

  getByScreening: (screeningId: string) =>
    apiFetch<any[]>(`/api/v1/doctor/feedback/screening/${screeningId}`, {
      method: "GET",
    }),
};

export const auditApi = {
  getLogs: (page = 0, size = 20) =>
    apiFetch<any>(`/api/v1/admin/audit-logs?page=${page}&size=${size}`, {
      method: "GET",
    }),

  exportLogs: () =>
    apiFetch<any[]>("/api/v1/admin/audit-logs/export", {
      method: "GET",
    }),
};

export const adminUserApi = {
  getUsers: (page = 0, size = 20, q?: string, role?: string) => {
    let url = `/api/v1/admin/users?page=${page}&size=${size}`;
    if (q) url += `&q=${encodeURIComponent(q)}`;
    if (role && role !== "ALL") {
      let cleanRole = role.replace(/^ROLE_/, "").toUpperCase();
      if (cleanRole === "PATIENT") cleanRole = "USER";
      url += `&role=${cleanRole}`;
    }
    return apiFetch<any>(url, { method: "GET" });
  },

  updateUser: (
    userId: string,
    data: { fullName?: string; phoneNumber?: string; address?: string },
  ) =>
    apiFetch<any>(`/api/v1/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateStatus: (userId: string, active: boolean) =>
    apiFetch<any>(`/api/v1/admin/users/${userId}/status`, {
      method: "PUT",
      body: JSON.stringify({ active }),
    }),

  updateRole: (userId: string, roleName: string) => {
    let cleanRole = (roleName || "").replace(/^ROLE_/, "").toUpperCase();
    if (cleanRole === "PATIENT") cleanRole = "USER";
    return apiFetch<any>(`/api/v1/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role: cleanRole }),
    });
  },

  deleteUser: (userId: string) =>
    apiFetch<any>(`/api/v1/admin/users/${userId}`, {
      method: "DELETE",
    }),

  batchDeleteUsers: (userIds: string[]) =>
    apiFetch<any>("/api/v1/admin/users/batch-delete", {
      method: "POST",
      body: JSON.stringify({ userIds }),
    }),

  getAiConfig: () =>
    apiFetch<any>("/api/v1/admin/ai-config", { method: "GET" }),

  updateAiConfig: (config: any) =>
    apiFetch<any>("/api/v1/admin/ai-config", {
      method: "PUT",
      body: JSON.stringify(config),
    }),
};

export const adminRoleApi = {
  getRoles: () => apiFetch<any[]>("/api/v1/admin/roles", { method: "GET" }),

  updateRole: (roleName: string, description: string) => {
    let cleanRole = roleName.replace(/^ROLE_/, "").toUpperCase();
    if (cleanRole === "PATIENT") cleanRole = "USER";
    return apiFetch<any>(`/api/v1/admin/roles/${cleanRole}`, {
      method: "PUT",
      body: JSON.stringify({ description }),
    });
  },

  updatePermissions: (
    roleName: string,
    permissions: Array<{ id?: string; code?: string; enabled: boolean }>,
  ) => {
    let cleanRole = roleName.replace(/^ROLE_/, "").toUpperCase();
    if (cleanRole === "PATIENT") cleanRole = "USER";
    return apiFetch<any>(`/api/v1/admin/roles/${cleanRole}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permissions }),
    });
  },
};

export const adminNotificationApi = {
  getTemplates: () =>
    apiFetch<any[]>("/api/v1/admin/notification-templates", { method: "GET" }),

  createTemplate: (payload: {
    code: string;
    name: string;
    channel: string;
    subject: string;
    body: string;
    description?: string;
    enabled?: boolean;
  }) =>
    apiFetch<any>("/api/v1/admin/notification-templates", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateTemplate: (
    id: string,
    payload: {
      code: string;
      name: string;
      channel: string;
      subject: string;
      body: string;
      description?: string;
      enabled?: boolean;
    },
  ) =>
    apiFetch<any>(`/api/v1/admin/notification-templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteTemplate: (id: string) =>
    apiFetch<void>(`/api/v1/admin/notification-templates/${id}`, {
      method: "DELETE",
    }),

  getPolicy: () =>
    apiFetch<any>("/api/v1/admin/communication-policy", { method: "GET" }),

  updatePolicy: (payload: any) =>
    apiFetch<any>("/api/v1/admin/communication-policy", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};

export interface DoctorOptionDto {
  id: string;
  fullName: string;
  email: string;
  specialty?: string;
  title?: string;
}

export interface RegisterExaminationPayload {
  doctorId?: string | null;
  examinationReason?: string;
  eyePosition?: 'OD' | 'OS' | 'OU';
  systolicBp?: number | null;
  diastolicBp?: number | null;
  hba1c?: number | null;
  hasDiabetes?: boolean | null;
  hasHypertension?: boolean | null;
  historyOfSmoking?: boolean | null;
  symptomsNotes?: string;
}

export const patientApi = {
  getProfile: () =>
    apiFetch<any>("/api/v1/patient/profile", {
      method: "GET",
    }),

  getDoctors: () =>
    apiFetch<DoctorOptionDto[]>("/api/v1/patient/doctors", {
      method: "GET",
    }),

  registerExamination: (payload: RegisterExaminationPayload) =>
    apiFetch<any>("/api/v1/patient/register-examination", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProfile: (profile: any) =>
    apiFetch<any>("/api/v1/patient/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    }),

  getPatientById: (patientId: string) =>
    apiFetch<any>(`/api/v1/patient/profile/${patientId}`, {
      method: "GET",
    }),

  getLabDocuments: () =>
    apiFetch<any[]>("/api/v1/patient/profile/lab-documents", { method: "GET" }),

  uploadLabDocument: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<any>("/api/v1/patient/profile/lab-documents", {
      method: "POST",
      body: formData,
    });
  },

  deleteLabDocument: (documentId: string) =>
    apiFetch<void>(`/api/v1/patient/profile/lab-documents/${documentId}`, {
      method: "DELETE",
    }),

  downloadLabDocument: async (
    arg1: string,
    arg2: string,
    arg3?: string,
  ) => {
    let patientId: string | undefined;
    let documentId: string;
    let fileName: string;

    if (arg3 !== undefined) {
      patientId = arg1;
      documentId = arg2;
      fileName = arg3;
    } else {
      documentId = arg1;
      fileName = arg2;
    }

    const endpoint = patientId
      ? `${API_BASE_URL}/api/v1/patient/profile/${patientId}/lab-documents/${documentId}/content`
      : `${API_BASE_URL}/api/v1/patient/profile/lab-documents/${documentId}/content`;

    const response = await fetch(
      endpoint,
      {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        credentials: "include",
      },
    );
    if (!response.ok) throw new Error("Không thể tải tệp xét nghiệm");
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};

export const doctorApi = {
  getPatients: (params?: { page?: number; size?: number; q?: string; search?: string }) => {
    const term = params?.search || params?.q;
    const searchParam = term ? `&search=${encodeURIComponent(term)}&q=${encodeURIComponent(term)}` : '';
    return apiFetch<any>(
      `/api/v1/doctor/patients?page=${params?.page ?? 0}&size=${params?.size ?? 20}${searchParam}`,
      { method: "GET" },
    );
  },

  getAssignedPatients: () =>
    apiFetch<any[]>("/api/v1/doctor/patients", {
      method: "GET",
    }),

  getPatientById: (patientId: string) =>
    apiFetch<any>(`/api/v1/doctor/patients/${patientId}`, {
      method: "GET",
    }),

  getPatientScreenings: (patientId: string) =>
    apiFetch<any[]>(`/api/v1/doctor/patients/${patientId}/screenings`, {
      method: "GET",
    }),

  createScreeningForPatient: (
    patientId: string,
    payload: string | CreateScreeningPayload,
  ) => {
    const body = typeof payload === "string" ? { imageUrl: payload } : payload;
    return apiFetch<any>(`/api/v1/doctor/patients/${patientId}/screenings`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  create: (patientData: any) =>
    apiFetch<any>("/api/v1/doctor/patients", {
      method: "POST",
      body: JSON.stringify(patientData),
    }),

  createPatient: (patientData: any) =>
    apiFetch<any>("/api/v1/doctor/patients", {
      method: "POST",
      body: JSON.stringify(patientData),
    }),

  deletePatient: (id: string) =>
    apiFetch<void>(`/api/v1/doctor/patients/${id}`, {
      method: "DELETE",
    }),

  delete: (id: string) =>
    apiFetch<void>(`/api/v1/doctor/patients/${id}`, {
      method: "DELETE",
    }),

  batchDelete: (patientIds: string[]) =>
    apiFetch<number>("/api/v1/doctor/patients/batch-delete", {
      method: "POST",
      body: JSON.stringify({ patientIds }),
    }),
};

export const doctorPatientApi = doctorApi;

export const assignmentApi = {
  getBoard: () =>
    apiFetch<any>("/api/v1/admin/patient-assignments", { method: "GET" }),

  assign: (doctorId: string, patientIds: string[], replaceExisting = true) =>
    apiFetch<any>("/api/v1/admin/patient-assignments", {
      method: "PUT",
      body: JSON.stringify({ doctorId, patientIds, replaceExisting }),
    }),

  unassign: (doctorId: string, patientId: string) =>
    apiFetch<any>(
      `/api/v1/admin/patient-assignments/${doctorId}/${patientId}`,
      {
        method: "DELETE",
      },
    ),
};

export interface BulkUploadItemPayload {
  fileName: string;
  eyePosition: string;
  rawMrn: string;
  rawPatientName: string;
  patientAge: number;
  patientGender: string;
  systolicBp: number;
  diastolicBp: number;
  hbA1c: number;
  base64ImageContent: string;
  previewUrl?: string;
}

export interface BulkUploadPayload {
  clinicId: string;
  imageItems?: BulkUploadItemPayload[];
  campaignName?: string;
  images?: any[];
}

export const bulkScreeningApi = {
  uploadBatch: (payload: BulkUploadPayload) =>
    apiFetch<any>('/api/v1/bulk-screening/batch', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getBatch: (batchId: string) =>
    apiFetch<any>(
      `/api/v1/bulk-screening/batch/${encodeURIComponent(batchId)}`,
      { method: "GET" },
    ),
  getBatchStatus: (batchId: string) =>
    apiFetch<any>(
      `/api/v1/bulk-screening/batch/${encodeURIComponent(batchId)}`,
      { method: "GET" },
    ),
  getStatistics: (batchId: string) =>
    apiFetch<any>(
      `/api/v1/bulk-screening/batch/${encodeURIComponent(batchId)}/statistics`,
      { method: "GET" },
    ),
  getAlerts: (batchId: string) =>
    apiFetch<any>(
      `/api/v1/bulk-screening/batch/${encodeURIComponent(batchId)}/alerts`,
      { method: "GET" },
    ),
  listBatches: () =>
    apiFetch<any[]>(`/api/v1/bulk-screening/batches`, { method: "GET" }),
};

export const servicePackageApi = {
  browse: (scope: "INDIVIDUAL" | "CLINIC") =>
    apiFetch<any[]>(`/api/v1/packages?scope=${scope}`, { method: "GET" }),
  list: (scope: "INDIVIDUAL" | "CLINIC" = "CLINIC") =>
    apiFetch<any[]>(`/api/v1/packages?scope=${scope}`, { method: "GET" }),
};

export const clinicAnalyticsApi = {
  getCampaignAnalytics: () =>
    apiFetch<any>("/api/v1/clinic/analytics/campaigns", { method: "GET" }),

  exportData: async (fileName = "aura_clinic_export.csv") => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/clinic/analytics/export`,
      {
        headers: getAccessToken()
          ? { Authorization: `Bearer ${getAccessToken()}` }
          : {},
        credentials: "include",
      },
    );
    if (!response.ok) throw new Error("Không thể tải file báo cáo");
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};

// FR-22: Đăng ký & xác minh hồ sơ tổ chức phòng khám
export const clinicApi = {
  getProfile: () => apiFetch<any>("/api/v1/clinic/profile", { method: "GET" }),

  submitProfile: (payload: {
    organizationName: string;
    licenseNumber?: string;
    licenseDocumentUrl?: string;
  }) =>
    apiFetch<any>("/api/v1/clinic/profile", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // FR-23: Quản lý bác sĩ & bệnh nhân trực thuộc phòng khám
  listMembers: () =>
    apiFetch<any[]>("/api/v1/clinic/members", { method: "GET" }),

  addMember: (doctorEmail: string) =>
    apiFetch<any>("/api/v1/clinic/members", {
      method: "POST",
      body: JSON.stringify({ doctorEmail }),
    }),

  removeMember: (memberId: string) =>
    apiFetch<void>(`/api/v1/clinic/members/${memberId}`, { method: "DELETE" }),

  assignPatientToDoctor: (doctorId: string, patientId: string) =>
    apiFetch<void>(`/api/v1/clinic/members/${doctorId}/patients/${patientId}`, {
      method: "POST",
    }),

  unassignPatientFromDoctor: (doctorId: string, patientId: string) =>
    apiFetch<void>(`/api/v1/clinic/members/${doctorId}/patients/${patientId}`, {
      method: "DELETE",
    }),
};

export const adminClinicApi = {
  // Admin: duyệt hồ sơ phòng khám (FR-22)
  list: (status?: "PENDING" | "APPROVED" | "REJECTED") =>
    apiFetch<any[]>(
      `/api/v1/admin/clinics${status ? `?status=${status}` : ""}`,
      { method: "GET" },
    ),

  review: (
    clinicProfileId: string,
    decision: "APPROVED" | "REJECTED",
    rejectionReason?: string,
  ) =>
    apiFetch<any>(`/api/v1/admin/clinics/${clinicProfileId}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ decision, rejectionReason }),
    }),
};

// FR-34: Admin quản lý gói dịch vụ và mô hình billing
export interface ServicePackagePayload {
  name: string;
  description?: string;
  price: number;
  credits: number;
  validityDays: number;
  scope: 'INDIVIDUAL' | 'CLINIC' | 'USER';
  active?: boolean;
  features?: string[];
}

export const adminServicePackageApi = {
  listAll: () => apiFetch<any[]>('/api/v1/admin/packages', { method: 'GET' }),
  create: (payload: ServicePackagePayload) =>
    apiFetch<any>('/api/v1/admin/packages', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        scope: (payload.scope as string) === 'USER' ? 'INDIVIDUAL' : payload.scope,
      }),
    }),
  update: (id: number | string, payload: ServicePackagePayload) =>
    apiFetch<any>(`/api/v1/admin/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...payload,
        scope: (payload.scope as string) === 'USER' ? 'INDIVIDUAL' : payload.scope,
      }),
    }),
  setActive: (id: number | string, active: boolean) =>
    apiFetch<any>(`/api/v1/admin/packages/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),
  delete: (id: number | string) =>
    apiFetch<any>(`/api/v1/admin/packages/${id}`, {
      method: 'DELETE',
    }),
  batchDelete: (ids: (number | string)[]) =>
    apiFetch<any>('/api/v1/admin/packages/batch-delete', {
      method: 'POST',
      body: JSON.stringify(ids),
    }),
};

// ============================================================================
// APPOINTMENTS API (R3, AC-3)
// ============================================================================
export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string;
  patientEmail?: string;
  patientMrn?: string;
  patientPhone?: string;
  doctorId?: string;
  doctorName?: string;
  clinicId?: string;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string;       // HH:mm
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  reason?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const appointmentApi = {
  create: (data: {
    doctorId?: string;
    appointmentDate: string;
    timeSlot: string;
    reason?: string;
    notes?: string;
  }) =>
    apiFetch<Appointment>('/api/v1/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: (params?: { role?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.role) query.append('role', params.role);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiFetch<Appointment[]>(`/api/v1/appointments${qs}`, {
      method: 'GET',
    });
  },

  getUpcoming: () =>
    apiFetch<Appointment>('/api/v1/appointments/upcoming', {
      method: 'GET',
    }),

  updateStatus: (
    id: string,
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | string,
    notes?: string
  ) =>
    apiFetch<Appointment>(`/api/v1/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),
};

