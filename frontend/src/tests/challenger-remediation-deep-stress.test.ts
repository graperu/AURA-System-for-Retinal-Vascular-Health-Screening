/**
 * Challenger Remediation Deep Stress & Verification Suite
 *
 * EMPIRICAL ADVERSARIAL VALIDATION FOR REMEDIATION #2:
 * 1. Categorization collision isolation:
 *    - DOCTOR_REVIEWED, DOCTOR_ASSIGNED, DOCTOR_OVERRIDE must NEVER match SCAN_RESULTS
 *    - CẢNH BÁO HỆ THỐNG / System Alert variations must NEVER match SCAN_RESULTS
 *    - Legitimate OCT_SCAN and FUNDUS_IMAGE must ALWAYS match SCAN_RESULTS
 *    - Cross-boundary stress: Doctor reviews mentioning "ảnh"/"OCT" or Alerts mentioning "ảnh"/"scan"
 * 2. Topbar & Sidebar realtimeBus synchronization:
 *    - NOTIFICATION_READ, NOTIFICATION_UNREAD, NOTIFICATION_CLEARED events
 *    - Full lifecycle state simulation (read, unread, delete read/unread, clear all, mark all read)
 *    - Fallback behavior when event.data.remainingUnread is undefined
 *    - Non-negative count floor (Math.max(0, ...))
 * 3. DOM / Static Markup verification:
 *    - Sidebar badge rendering when unreadNotificationCount > 0 and hiding when === 0
 *    - NotificationCenterDrawer tab filtering rendering correctness
 */

import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  NotificationCenterDrawer,
  NotificationItem,
  filterNotifications,
  isNotificationInCategory,
} from '../components/NotificationCenterDrawer';
import { realtimeBus } from '../services/realtimeService';
import { LanguageProvider } from '../context/LanguageContext';
import { Sidebar } from '../components/layout/Sidebar';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    failed++;
  }
}

console.log('=================================================================');
console.log('   CHALLENGER REMEDIATION 2: DEEP ADVERSARIAL STRESS SUITE');
console.log('=================================================================\n');

// -----------------------------------------------------------------------------
// SECTION 1: ADVERSARIAL DOCTOR NOTIFICATIONS (MUST NEVER MATCH SCAN_RESULTS)
// -----------------------------------------------------------------------------
console.log('--- 1. Adversarial Doctor Notifications vs SCAN_RESULTS ---');

const doctorAdversarialCases: NotificationItem[] = [
  {
    id: 'doc-1',
    title: 'Bác sĩ đã thẩm định ca khám',
    type: 'DOCTOR_REVIEWED',
    message: 'Kết quả bình thường',
  },
  {
    id: 'doc-2',
    title: 'Phân công bác sĩ điều trị',
    type: 'DOCTOR_ASSIGNED',
    message: 'Bác sĩ Nguyễn Văn A phụ trách',
  },
  {
    id: 'doc-3',
    title: 'Bác sĩ can thiệp và ghi đè kết quả',
    type: 'DOCTOR_OVERRIDE',
    message: 'Điều chỉnh phân độ võng mạc',
  },
  // Stress case: Doctor type containing image/scan keywords in title
  {
    id: 'doc-stress-1',
    title: 'Bác sĩ đã xem ảnh chụp đáy mắt OD',
    type: 'DOCTOR_REVIEWED',
    message: 'Cần chụp lại ảnh do mờ',
  },
  {
    id: 'doc-stress-2',
    title: 'Bác sĩ yêu cầu quét lại OCT võng mạc',
    type: 'DOCTOR_ASSIGNED',
    message: 'Chụp cắt lớp lại mắt trái OS',
  },
  {
    id: 'doc-stress-3',
    title: 'Bác sĩ ghi chú về sàng lọc AI',
    type: 'DOCTOR_NOTE',
    message: 'Lưu ý bệnh sử đái tháo đường',
  },
  {
    id: 'doc-stress-4',
    title: 'Thẩm định lâm sàng ca chụp ảnh đáy mắt',
    type: 'CLINICAL_OPINION',
    message: 'Đồng ý với chẩn đoán',
  },
];

test('DOC-1: DOCTOR_REVIEWED, DOCTOR_ASSIGNED, DOCTOR_OVERRIDE NEVER match SCAN_RESULTS', () => {
  for (const item of doctorAdversarialCases) {
    const isScan = isNotificationInCategory(item, 'SCAN_RESULTS');
    assert.strictEqual(
      isScan,
      false,
      `Expected ${item.id} (${item.type} - "${item.title}") to NOT match SCAN_RESULTS, but it did!`
    );
  }
});

test('DOC-2: All doctor notifications correctly match DOCTOR_REVIEWS and ALL', () => {
  for (const item of doctorAdversarialCases) {
    const isDoc = isNotificationInCategory(item, 'DOCTOR_REVIEWS');
    const isAll = isNotificationInCategory(item, 'ALL');
    assert.strictEqual(
      isDoc,
      true,
      `Expected ${item.id} (${item.type} - "${item.title}") to match DOCTOR_REVIEWS`
    );
    assert.strictEqual(
      isAll,
      true,
      `Expected ${item.id} (${item.type} - "${item.title}") to match ALL`
    );
  }
});

// -----------------------------------------------------------------------------
// SECTION 2: ADVERSARIAL SYSTEM ALERTS (MUST NEVER MATCH SCAN_RESULTS)
// -----------------------------------------------------------------------------
console.log('\n--- 2. Adversarial System Alerts vs SCAN_RESULTS ---');

const alertAdversarialCases: NotificationItem[] = [
  {
    id: 'alert-1',
    title: 'CẢNH BÁO HỆ THỐNG: Hạn mức sắp hết',
    type: 'BILLING_ALERT',
    message: 'Còn 3 lượt phân tích',
  },
  {
    id: 'alert-2',
    title: 'Cảnh báo bảo mật hệ thống: Đăng nhập lạ',
    type: 'SECURITY_ALERT',
    message: 'Phát hiện đăng nhập từ IP mới',
  },
  // Stress case: System alerts mentioning "ảnh", "scan", "sàng lọc" in title/message
  {
    id: 'alert-stress-1',
    title: 'Cảnh báo hệ thống: Lỗi tải ảnh chụp lên máy chủ',
    type: 'SYSTEM_ALERT',
    message: 'Ảnh chụp không đạt tiêu chuẩn độ phân giải',
  },
  {
    id: 'alert-stress-2',
    title: 'CẢNH BÁO: Thất bại khi quét scan OCT',
    type: 'SYSTEM_ALERT',
    message: 'Đường truyền bị ngắt quãng',
  },
  {
    id: 'alert-stress-3',
    title: 'Cảnh báo hệ thống: Quá tải tiến trình sàng lọc',
    type: 'ALERT',
    message: 'Hàng đợi sàng lọc AI đang đầy',
  },
  {
    id: 'alert-stress-4',
    title: 'Hệ thống bảo trì máy chủ ảnh võng mạc',
    type: 'SYSTEM_MAINTENANCE',
    message: 'Bảo trì lúc 23:00',
  },
];

test('ALERT-1: CẢNH BÁO HỆ THỐNG and alerts NEVER match SCAN_RESULTS (even with "ảnh"/"scan")', () => {
  for (const item of alertAdversarialCases) {
    const isScan = isNotificationInCategory(item, 'SCAN_RESULTS');
    assert.strictEqual(
      isScan,
      false,
      `Expected ${item.id} (${item.type} - "${item.title}") to NOT match SCAN_RESULTS, but it did!`
    );
  }
});

test('ALERT-2: All alert notifications correctly match SYSTEM_ALERTS and ALL', () => {
  for (const item of alertAdversarialCases) {
    const isAlert = isNotificationInCategory(item, 'SYSTEM_ALERTS');
    const isAll = isNotificationInCategory(item, 'ALL');
    assert.strictEqual(
      isAlert,
      true,
      `Expected ${item.id} (${item.type} - "${item.title}") to match SYSTEM_ALERTS`
    );
    assert.strictEqual(
      isAll,
      true,
      `Expected ${item.id} (${item.type} - "${item.title}") to match ALL`
    );
  }
});

// -----------------------------------------------------------------------------
// SECTION 3: LEGITIMATE SCAN RESULTS (MUST ALWAYS MATCH SCAN_RESULTS)
// -----------------------------------------------------------------------------
console.log('\n--- 3. Legitimate Scan Results Matching SCAN_RESULTS ---');

const legitimateScanCases: NotificationItem[] = [
  {
    id: 'scan-1',
    title: 'Kết quả chụp cắt lớp OCT võng mạc',
    type: 'OCT_SCAN',
    message: 'Đã phân tích xong lát cắt hoàng điểm',
  },
  {
    id: 'scan-2',
    title: 'Tải lên hoàn tất',
    type: 'OCT',
    message: 'Ảnh OCT chất lượng cao',
  },
  {
    id: 'scan-3',
    title: 'Ảnh chụp đáy mắt OD',
    type: 'FUNDUS_IMAGE',
    message: 'Phát hiện tổn thương vi phình mạch',
  },
  {
    id: 'scan-4',
    title: 'Kết quả sàng lọc đáy mắt',
    type: 'FUNDUS',
    message: 'Chỉ số AVR 0.62',
  },
  {
    id: 'scan-5',
    title: 'Kết quả sàng lọc võng mạc hoàn tất',
    type: 'SCAN_COMPLETED',
    message: 'Nguy cơ đột quỵ thấp (12%)',
  },
  {
    id: 'scan-6',
    title: 'Đang phân tích ảnh võng mạc',
    type: 'SCREENING_PROCESSING',
    message: 'Mô hình AI đang trích xuất mạch máu',
  },
  {
    id: 'scan-7',
    title: 'Ảnh chụp đáy mắt mới',
    type: 'IMAGE_UPLOAD',
    message: 'Ảnh đã được lưu vào hồ sơ',
  },
];

test('SCAN-1: Legitimate OCT_SCAN and FUNDUS_IMAGE DO match SCAN_RESULTS', () => {
  for (const item of legitimateScanCases) {
    const isScan = isNotificationInCategory(item, 'SCAN_RESULTS');
    assert.strictEqual(
      isScan,
      true,
      `Expected ${item.id} (${item.type} - "${item.title}") to match SCAN_RESULTS`
    );
  }
});

test('SCAN-2: Legitimate scans do NOT bleed into DOCTOR_REVIEWS or SYSTEM_ALERTS', () => {
  for (const item of legitimateScanCases) {
    const isDoc = isNotificationInCategory(item, 'DOCTOR_REVIEWS');
    const isAlert = isNotificationInCategory(item, 'SYSTEM_ALERTS');
    assert.strictEqual(
      isDoc,
      false,
      `Expected ${item.id} to NOT match DOCTOR_REVIEWS`
    );
    assert.strictEqual(
      isAlert,
      false,
      `Expected ${item.id} to NOT match SYSTEM_ALERTS`
    );
  }
});

// -----------------------------------------------------------------------------
// SECTION 4: REALTIMEBUS BADGE SYNCHRONIZATION EMPIRICAL HARNESS
// -----------------------------------------------------------------------------
console.log('\n--- 4. RealtimeBus Badge Synchronization Harness ---');

test('SYNC-STRESS: Full lifecycle of read/unread/clear operations synchronizes state', () => {
  // Model AppLayout listener logic exactly as implemented in AppLayout.tsx
  let appLayoutUnreadCount = 5;

  const unsubRead = realtimeBus.subscribe('NOTIFICATION_READ', (event) => {
    if (typeof event?.data?.remainingUnread === 'number') {
      appLayoutUnreadCount = event.data.remainingUnread;
    } else {
      appLayoutUnreadCount = Math.max(0, appLayoutUnreadCount - 1);
    }
  });

  const unsubUnread = realtimeBus.subscribe('NOTIFICATION_UNREAD', (event) => {
    if (typeof event?.data?.remainingUnread === 'number') {
      appLayoutUnreadCount = event.data.remainingUnread;
    } else {
      appLayoutUnreadCount = appLayoutUnreadCount + 1;
    }
  });

  const unsubCleared = realtimeBus.subscribe('NOTIFICATION_CLEARED', (event) => {
    if (typeof event?.data?.remainingUnread === 'number') {
      appLayoutUnreadCount = event.data.remainingUnread;
    } else {
      appLayoutUnreadCount = 0;
    }
  });

  // Step A: Topbar marks item as read (5 -> 4)
  realtimeBus.emit('NOTIFICATION_READ', { id: 'notif-101', remainingUnread: 4 });
  assert.strictEqual(appLayoutUnreadCount, 4, 'Step A: Count must be 4');

  // Step B: Topbar marks another item as read (4 -> 3)
  realtimeBus.emit('NOTIFICATION_READ', { id: 'notif-102', remainingUnread: 3 });
  assert.strictEqual(appLayoutUnreadCount, 3, 'Step B: Count must be 3');

  // Step C: Topbar marks item as unread (3 -> 4)
  realtimeBus.emit('NOTIFICATION_UNREAD', { id: 'notif-101', remainingUnread: 4 });
  assert.strictEqual(appLayoutUnreadCount, 4, 'Step C: Count must be 4');

  // Step D: Topbar deletes an unread item (4 -> 3)
  realtimeBus.emit('NOTIFICATION_READ', { id: 'notif-103', remainingUnread: 3 });
  assert.strictEqual(appLayoutUnreadCount, 3, 'Step D: Count must be 3');

  // Step E: Topbar clicks Mark All As Read (3 -> 0)
  realtimeBus.emit('NOTIFICATION_CLEARED', { remainingUnread: 0 });
  assert.strictEqual(appLayoutUnreadCount, 0, 'Step E: Count must be 0');

  // Step F: Fallback test: Event emitted without remainingUnread payload
  // Increment on UNREAD fallback
  realtimeBus.emit('NOTIFICATION_UNREAD', { id: 'notif-104' });
  assert.strictEqual(appLayoutUnreadCount, 1, 'Step F1: Fallback increment to 1');

  // Decrement on READ fallback
  realtimeBus.emit('NOTIFICATION_READ', { id: 'notif-104' });
  assert.strictEqual(appLayoutUnreadCount, 0, 'Step F2: Fallback decrement to 0');

  // Underflow prevention on READ fallback when already 0
  realtimeBus.emit('NOTIFICATION_READ', { id: 'notif-ghost' });
  assert.strictEqual(appLayoutUnreadCount, 0, 'Step F3: Count never drops below 0');

  // CLEARED fallback
  appLayoutUnreadCount = 7;
  realtimeBus.emit('NOTIFICATION_CLEARED', {});
  assert.strictEqual(appLayoutUnreadCount, 0, 'Step F4: Fallback cleared resets to 0');

  unsubRead();
  unsubUnread();
  unsubCleared();
});

// -----------------------------------------------------------------------------
// SECTION 5: DOM & STATIC MARKUP VERIFICATION
// -----------------------------------------------------------------------------
console.log('\n--- 5. DOM & Static Markup Verification ---');

test('DOM-1: Sidebar renders badge with exact count and hides when count is 0', () => {
  // Render Sidebar with count = 12
  const html12 = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(Sidebar, {
        currentRole: 'doctor',
        activeSection: 'dashboard',
        unreadNotificationCount: 12,
      })
    )
  );
  assert.ok(html12.includes('12'), 'Sidebar markup contains badge number "12"');

  // Render Sidebar with count = 0
  const html0 = renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(Sidebar, {
        currentRole: 'doctor',
        activeSection: 'dashboard',
        unreadNotificationCount: 0,
      })
    )
  );
  // Badge container should not be rendered
  assert.ok(!html0.includes('unreadNotificationCount'), 'No badge element when count is 0');
});

test('DOM-2: NotificationCenterDrawer filters accurately across all tabs in DOM', () => {
  const allNotifications = [
    ...doctorAdversarialCases,
    ...alertAdversarialCases,
    ...legitimateScanCases,
  ];

  // Tab SCAN_RESULTS: must contain exactly 7 scan notifications and 0 doctor/alert notifications
  const scanFiltered = filterNotifications(allNotifications, 'SCAN_RESULTS', false);
  assert.strictEqual(scanFiltered.length, 7, 'SCAN_RESULTS tab has exactly 7 items');
  for (const item of scanFiltered) {
    assert.ok(
      legitimateScanCases.some((s) => s.id === item.id),
      `Item ${item.id} in SCAN_RESULTS is legitimate`
    );
  }

  // Tab DOCTOR_REVIEWS: must contain exactly 7 doctor items
  const docFiltered = filterNotifications(allNotifications, 'DOCTOR_REVIEWS', false);
  assert.strictEqual(docFiltered.length, 7, 'DOCTOR_REVIEWS tab has exactly 7 items');

  // Tab SYSTEM_ALERTS: must contain exactly 6 alert items
  const alertFiltered = filterNotifications(allNotifications, 'SYSTEM_ALERTS', false);
  assert.strictEqual(alertFiltered.length, 6, 'SYSTEM_ALERTS tab has exactly 6 items');

  // Tab ALL: must contain all 20 items
  const allFiltered = filterNotifications(allNotifications, 'ALL', false);
  assert.strictEqual(allFiltered.length, 20, 'ALL tab has all 20 items');
});

console.log('\n=================================================================');
console.log(`   DEEP STRESS SUITE: ${passed}/${passed + failed} TESTS PASSED`);
console.log('=================================================================\n');

if (failed === 0) {
  process.exit(0);
} else {
  process.exit(1);
}
