/**
 * AURA Cross-Portal Navigation Service
 * Centralizes routing paths, URL generation, and deep-linking across:
 * Patient Portal, Doctor CDS Workspace, Clinic Batch Screening, and Admin Auditing.
 */

export const PORTAL_ROUTES = {
  PATIENT: {
    ROOT: '/patient',
    DASHBOARD: '/patient/dashboard',
    UPLOAD_SCAN: '/patient/upload-scan',
    SCAN_HISTORY: '/patient/scan-history',
    SCREENING_RESULT: '/patient/screening-result',
    APPOINTMENT: '/patient/appointment',
    APPOINTMENTS: '/patient/appointment',
    CONSULTATION: '/patient/consultation',
    PROFILE: '/patient/medical-profile',
    BILLING: '/patient/billing',
    NOTIFICATIONS: '/patient/notifications',
    PATIENT_DETAIL: (patientId: string) => `/patient/${encodeURIComponent(patientId)}`,
    DETAIL: (patientId: string) => `/patient/${encodeURIComponent(patientId)}`,
  },
  DOCTOR: {
    ROOT: '/doctor',
    DASHBOARD: '/doctor/dashboard',
    PATIENT_LIST: '/doctor/patient-list',
    CDS_VIEWER: '/doctor/cds-viewer',
    REPORTS: '/doctor/reports',
    CONSULTATION: '/doctor/consultation',
    APPOINTMENT: '/doctor/appointment',
    APPOINTMENTS: '/doctor/appointment',
    RISK_ANALYTICS: '/doctor/risk-analytics',
    PROFILE: '/doctor/medical-profile',
    NOTIFICATIONS: '/doctor/notifications',
    CASE_DETAIL: (caseId: string) => `/doctor/case/${encodeURIComponent(caseId)}`,
    CASE: (caseId: string) => `/doctor/case/${encodeURIComponent(caseId)}`,
    CDS_CASE: (caseId: string) => `/doctor/cds-viewer?caseId=${encodeURIComponent(caseId)}`,
  },
  CLINIC: {
    ROOT: '/clinic',
    DASHBOARD: '/clinic/dashboard',
    PATIENT_LIST: '/clinic/patient-list',
    BULK_BATCH: '/clinic/bulk-batch',
    SCAN_HISTORY: '/clinic/scan-history',
    DOCTORS_MANAGE: '/clinic/doctors-manage',
    CAMPAIGN_ANALYTICS: '/clinic/campaign-analytics',
    CREDIT_PACKAGE: '/clinic/credit-package',
    NOTIFICATIONS: '/clinic/notifications',
    BATCH_DETAIL: (batchId: string) => `/clinic/batch/${encodeURIComponent(batchId)}`,
    BATCH: (batchId: string) => `/clinic/batch/${encodeURIComponent(batchId)}`,
    BULK_BATCH_DETAIL: (batchId: string) => `/clinic/bulk-batch?batchId=${encodeURIComponent(batchId)}`,
  },
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    USER_MANAGEMENT: '/admin/user-management',
    CLINIC_APPROVALS: '/admin/clinic-approvals',
    SCREENINGS: '/admin/screenings',
    RBAC_MATRIX: '/admin/rbac-matrix',
    AUDIT_LOGS: '/admin/audit-logs',
    AI_THRESHOLDS: '/admin/ai-thresholds',
    NOTIFICATIONS: '/admin/notifications',
    AUDIT_DETAIL: (logId: string) => `/admin/audit/${encodeURIComponent(logId)}`,
    AUDIT: (logId: string) => `/admin/audit/${encodeURIComponent(logId)}`,
    AUDIT_LOG_DETAIL: (logId: string) => `/admin/audit-logs?logId=${encodeURIComponent(logId)}`,
  },
} as const;

export type PortalRouteKeys = keyof typeof PORTAL_ROUTES;

/**
 * Returns the URL path for navigating to a specific patient.
 * @param patientId The unique identifier of the patient.
 * @returns Formatted URL path.
 */
export function navigateToPatient(patientId: string): string {
  if (!patientId || typeof patientId !== 'string' || patientId.trim() === '') {
    throw new TypeError('patientId must be a valid non-empty string');
  }
  return PORTAL_ROUTES.PATIENT.PATIENT_DETAIL(patientId.trim());
}

/**
 * Returns the URL path for navigating to a specific doctor case.
 * @param caseId The unique identifier of the diagnostic case.
 * @returns Formatted URL path.
 */
export function navigateToDoctorCase(caseId: string): string {
  if (!caseId || typeof caseId !== 'string' || caseId.trim() === '') {
    throw new TypeError('caseId must be a valid non-empty string');
  }
  return PORTAL_ROUTES.DOCTOR.CASE_DETAIL(caseId.trim());
}

/**
 * Returns the URL path for navigating to a specific clinic batch screening.
 * @param batchId The unique identifier of the batch.
 * @returns Formatted URL path.
 */
export function navigateToClinicBatch(batchId: string): string {
  if (!batchId || typeof batchId !== 'string' || batchId.trim() === '') {
    throw new TypeError('batchId must be a valid non-empty string');
  }
  return PORTAL_ROUTES.CLINIC.BATCH_DETAIL(batchId.trim());
}

/**
 * Returns the URL path for navigating to a specific admin audit log entry.
 * @param logId The unique identifier of the audit log.
 * @returns Formatted URL path.
 */
export function navigateToAdminAudit(logId: string): string {
  if (!logId || typeof logId !== 'string' || logId.trim() === '') {
    throw new TypeError('logId must be a valid non-empty string');
  }
  return PORTAL_ROUTES.ADMIN.AUDIT_DETAIL(logId.trim());
}

/**
 * Parses the target active section from a portal URL path.
 * @param url The URL path (e.g. /patient/scan-history)
 * @returns The section name (e.g. scan-history)
 */
export function parseSectionFromUrl(url: string): string {
  try {
    const path = url.split('?')[0].split('#')[0];
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return 'dashboard';
    if (['patient', 'doctor', 'clinic', 'admin'].includes(segments[0])) {
      return segments[1] || 'dashboard';
    }
    return segments[0] || 'dashboard';
  } catch {
    return 'dashboard';
  }
}

/**
 * Convenience helper to perform navigation in browser environment without full page reload.
 * Dispatches 'aura-navigate' and 'aura:navigate' custom events for SPA routing.
 * @param url The target URL path to navigate to.
 */
export function navigate(url: string): void {
  if (typeof window !== 'undefined') {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.location.href = url;
      return;
    }
    try {
      window.history.pushState({}, '', url);
    } catch {
      // fallback
    }
    const section = parseSectionFromUrl(url);
    window.dispatchEvent(new CustomEvent('aura-navigate', { detail: { url, section } }));
    window.dispatchEvent(new CustomEvent('aura:navigate', { detail: { url, section } }));
  }
}

export const navigationService = {
  PORTAL_ROUTES,
  navigateToPatient,
  navigateToDoctorCase,
  navigateToClinicBatch,
  navigateToAdminAudit,
  parseSectionFromUrl,
  navigate,
};

export default navigationService;
