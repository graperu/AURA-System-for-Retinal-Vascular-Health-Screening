/**
 * Verification test suite for:
 * 1. useRealtimeEvents Hook & Context
 * 2. NotificationContext (Bilingual & Real-time ingestion)
 * 3. NotificationBell Component (MediRoom UI & Badges)
 * 4. Cross-Portal Navigation Service (PORTAL_ROUTES & Strict Navigation functions)
 */
import assert from 'assert';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  PORTAL_ROUTES,
  navigateToPatient,
  navigateToDoctorCase,
  navigateToClinicBatch,
  navigateToAdminAudit,
  navigationService,
} from '../services/navigationService';
import {
  useRealtimeEvents,
  RealtimeEventsProvider,
  RealtimeEventPayload,
} from '../hooks/useRealtimeEvents';
import {
  NotificationProvider,
  useNotifications,
  AppNotification,
} from '../context/NotificationContext';
import { NotificationBell, NotificationItem } from '../components/ui/NotificationBell';
import { LanguageProvider } from '../context/LanguageContext';

let passCount = 0;
let failCount = 0;

function testAssert(condition: boolean, message: string) {
  if (condition) {
    passCount++;
    console.log(`  [PASS] ${message}`);
  } else {
    failCount++;
    console.error(`  [FAIL] ${message}`);
  }
}

console.log('=================================================================');
console.log('   AURA REALTIME, NOTIFICATION & NAVIGATION VERIFICATION SUITE');
console.log('=================================================================\n');

// -------------------------------------------------------------
// 1. Cross-Portal Navigation Service Verification
// -------------------------------------------------------------
console.log('--- 1. Kiểm thử Cross-Portal Navigation Service ---');

// Test NAV-1: navigateToPatient
const patientUrl = navigateToPatient('PAT-987');
testAssert(
  patientUrl === '/patient/PAT-987',
  'NAV-1: navigateToPatient("PAT-987") trả về URL path chính xác /patient/PAT-987'
);

// Test NAV-2: navigateToDoctorCase
const doctorCaseUrl = navigateToDoctorCase('CASE-456');
testAssert(
  doctorCaseUrl === '/doctor/case/CASE-456',
  'NAV-2: navigateToDoctorCase("CASE-456") trả về URL path chính xác /doctor/case/CASE-456'
);

// Test NAV-3: navigateToClinicBatch
const clinicBatchUrl = navigateToClinicBatch('BATCH-2026-09');
testAssert(
  clinicBatchUrl === '/clinic/batch/BATCH-2026-09',
  'NAV-3: navigateToClinicBatch("BATCH-2026-09") trả về URL path chính xác /clinic/batch/BATCH-2026-09'
);

// Test NAV-4: navigateToAdminAudit
const adminAuditUrl = navigateToAdminAudit('AUD-001');
testAssert(
  adminAuditUrl === '/admin/audit/AUD-001',
  'NAV-4: navigateToAdminAudit("AUD-001") trả về URL path chính xác /admin/audit/AUD-001'
);

// Test NAV-5: Parameter validation with empty strings
let threwPatientError = false;
try {
  navigateToPatient('');
} catch (e) {
  threwPatientError = true;
}
testAssert(threwPatientError, 'NAV-5: navigateToPatient báo lỗi khi truyền tham số rỗng (strict validation)');

// Test NAV-6: PORTAL_ROUTES completeness across 4 portals
testAssert(
  Boolean(
    PORTAL_ROUTES.PATIENT &&
    PORTAL_ROUTES.PATIENT.DASHBOARD === '/patient/dashboard' &&
    PORTAL_ROUTES.PATIENT.UPLOAD_SCAN === '/patient/upload-scan' &&
    PORTAL_ROUTES.PATIENT.SCAN_HISTORY === '/patient/scan-history' &&
    PORTAL_ROUTES.PATIENT.APPOINTMENT === '/patient/appointment' &&
    PORTAL_ROUTES.PATIENT.CONSULTATION === '/patient/consultation' &&
    PORTAL_ROUTES.PATIENT.PROFILE === '/patient/medical-profile' &&
    PORTAL_ROUTES.PATIENT.BILLING === '/patient/billing'
  ),
  'NAV-6: PORTAL_ROUTES.PATIENT chứa đầy đủ các phân hệ của bệnh nhân'
);

testAssert(
  Boolean(
    PORTAL_ROUTES.DOCTOR &&
    PORTAL_ROUTES.DOCTOR.DASHBOARD === '/doctor/dashboard' &&
    PORTAL_ROUTES.DOCTOR.PATIENT_LIST === '/doctor/patient-list' &&
    PORTAL_ROUTES.DOCTOR.CDS_VIEWER === '/doctor/cds-viewer' &&
    PORTAL_ROUTES.DOCTOR.REPORTS === '/doctor/reports' &&
    PORTAL_ROUTES.DOCTOR.CONSULTATION === '/doctor/consultation' &&
    PORTAL_ROUTES.DOCTOR.RISK_ANALYTICS === '/doctor/risk-analytics'
  ),
  'NAV-7: PORTAL_ROUTES.DOCTOR chứa đầy đủ các phân hệ của bác sĩ'
);

testAssert(
  Boolean(
    PORTAL_ROUTES.CLINIC &&
    PORTAL_ROUTES.CLINIC.DASHBOARD === '/clinic/dashboard' &&
    PORTAL_ROUTES.CLINIC.BULK_BATCH === '/clinic/bulk-batch' &&
    PORTAL_ROUTES.CLINIC.SCAN_HISTORY === '/clinic/scan-history' &&
    PORTAL_ROUTES.CLINIC.CAMPAIGN_ANALYTICS === '/clinic/campaign-analytics' &&
    PORTAL_ROUTES.CLINIC.CREDIT_PACKAGE === '/clinic/credit-package'
  ),
  'NAV-8: PORTAL_ROUTES.CLINIC chứa đầy đủ các phân hệ của phòng khám'
);

testAssert(
  Boolean(
    PORTAL_ROUTES.ADMIN &&
    PORTAL_ROUTES.ADMIN.DASHBOARD === '/admin/dashboard' &&
    PORTAL_ROUTES.ADMIN.USER_MANAGEMENT === '/admin/user-management' &&
    PORTAL_ROUTES.ADMIN.CLINIC_APPROVALS === '/admin/clinic-approvals' &&
    PORTAL_ROUTES.ADMIN.SCREENINGS === '/admin/screenings' &&
    PORTAL_ROUTES.ADMIN.RBAC_MATRIX === '/admin/rbac-matrix' &&
    PORTAL_ROUTES.ADMIN.AUDIT_LOGS === '/admin/audit-logs' &&
    PORTAL_ROUTES.ADMIN.AI_THRESHOLDS === '/admin/ai-thresholds'
  ),
  'NAV-9: PORTAL_ROUTES.ADMIN chứa đầy đủ các phân hệ của quản trị viên'
);

// -------------------------------------------------------------
// 2. Real-Time Events Hook Verification
// -------------------------------------------------------------
console.log('\n--- 2. Kiểm thử useRealtimeEvents Hook & Context ---');

// Test RT-HOOK-1: useRealtimeEvents default outside provider
const ConsumerComponent: React.FC = () => {
  const { lastEvent, isConnected, connectionStatus } = useRealtimeEvents();
  return React.createElement(
    'div',
    { 'data-testid': 'rt-status' },
    `connected:${isConnected};status:${connectionStatus};hasEvent:${Boolean(lastEvent)}`
  );
};

const htmlOutside = renderToString(React.createElement(ConsumerComponent));
testAssert(
  htmlOutside.includes('connected:false') && htmlOutside.includes('status:DISCONNECTED'),
  'RT-HOOK-1: useRealtimeEvents() an toàn khi gọi bên ngoài Provider với fallback mặc định'
);

// Test RT-HOOK-2: useRealtimeEvents inside RealtimeEventsProvider
const htmlInside = renderToString(
  React.createElement(
    RealtimeEventsProvider,
    null,
    React.createElement(ConsumerComponent)
  )
);
testAssert(
  htmlInside.includes('connected:false'),
  'RT-HOOK-2: RealtimeEventsProvider render thành công và chia sẻ context state'
);

// -------------------------------------------------------------
// 3. Notification Context Verification
// -------------------------------------------------------------
console.log('\n--- 3. Kiểm thử Notification Context & Ingestion ---');

const NotifConsumer: React.FC = () => {
  const { notifications, unreadCount } = useNotifications();
  return React.createElement(
    'div',
    { 'data-testid': 'notif-list' },
    `count:${notifications.length};unread:${unreadCount}`
  );
};

const notifHtml = renderToString(
  React.createElement(
    LanguageProvider,
    null,
    React.createElement(
      RealtimeEventsProvider,
      null,
      React.createElement(
        NotificationProvider,
        null,
        React.createElement(NotifConsumer)
      )
    )
  )
);

testAssert(
  notifHtml.includes('count:0;unread:0'),
  'NOTIF-1: NotificationProvider khởi tạo danh sách rỗng và unreadCount chuẩn xác'
);

// -------------------------------------------------------------
// 4. NotificationBell UI Component Verification
// -------------------------------------------------------------
console.log('\n--- 4. Kiểm thử NotificationBell Component (MediRoom UI) ---');

// Test BELL-1: Render NotificationBell with 0 unread
const bellZeroHtml = renderToString(
  React.createElement(
    LanguageProvider,
    null,
    React.createElement(NotificationBell, { unreadCount: 0, notifications: [] })
  )
);
testAssert(
  bellZeroHtml.includes('button') && !bellZeroHtml.includes('animate-ping'),
  'BELL-1: NotificationBell khi 0 thông báo mới không hiển thị badge pulse'
);

// Test BELL-2: Render NotificationBell with unread count and items
const mockNotifs: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'SCAN_UPLOADED',
    title: 'Ảnh chụp mới',
    message: 'Bệnh nhân Nguyễn Văn An vừa tải lên ảnh mắt phải',
    timestamp: Date.now(),
    read: false,
    isRead: false,
    link: '/doctor/cds-viewer',
    portal: 'doctor',
  },
  {
    id: 'notif-2',
    type: 'RESULT_REVIEWED',
    title: 'Kết quả thẩm định',
    message: 'Bác sĩ đã hoàn tất thẩm định ca khám',
    timestamp: Date.now() - 60000,
    read: true,
    isRead: true,
    link: '/patient/scan-history',
    portal: 'patient',
  },
];

const bellUnreadHtml = renderToString(
  React.createElement(
    LanguageProvider,
    null,
    React.createElement(NotificationBell, {
      unreadCount: 1,
      notifications: mockNotifs,
    })
  )
);

testAssert(
  bellUnreadHtml.includes('animate-ping') &&
  bellUnreadHtml.includes('1') &&
  bellUnreadHtml.includes('#3478F6'),
  'BELL-2: NotificationBell hiển thị badge số lượng (1), pulse animation và MediRoom #3478F6 token'
);

console.log('\n=================================================================');
console.log(
  `   KẾT QUẢ KIỂM THỬ: ${passCount}/${passCount + failCount} TESTS ĐÃ ĐẠT (${Math.round(
    (passCount / (passCount + failCount)) * 100
  )}% PASS)`
);
console.log('=================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
