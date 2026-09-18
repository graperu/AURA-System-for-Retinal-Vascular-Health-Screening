import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Topbar } from '../components/layout/Topbar';
import {
  NotificationBell,
  formatRelativeTime,
} from '../components/layout/NotificationBell';
import {
  MOCK_NOTIFICATIONS,
  type NotificationItem,
} from '../components/layout/mockNotifications';
import type { UserSession } from '../types/auth';

console.log('=================================================================');
console.log('   TOPBAR NOTIFICATIONS & ONLINE PRESENCE VERIFICATION SUITE');
console.log('=================================================================\n');

let totalTests = 0;
let passedTests = 0;

function test(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err: any) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    process.exitCode = 1;
  }
}

const mockUser: UserSession = {
  id: 'doc-001',
  email: 'nguyen.van.a@aura.health',
  name: 'BS. Nguyễn Văn A',
  role: 'doctor',
  roleTitle: 'Bác sĩ chuyên khoa',
  organization: 'AURA Clinic',
  token: 'mock-token',
};

// ============================================================================
// 1. MOCK NOTIFICATION DATA INTEGRITY (BƯỚC 4)
// ============================================================================
console.log('--- 1. Mock Notification Data Integrity Tests ---');

test('NOTIF-DATA-1: MOCK_NOTIFICATIONS contains all 4 required clinical notification types', () => {
  assert.strictEqual(MOCK_NOTIFICATIONS.length, 4, 'Should contain 4 mock notifications');

  const scanUploaded = MOCK_NOTIFICATIONS.find((n) => n.type === 'SCAN_UPLOADED');
  assert.ok(scanUploaded, 'Should contain SCAN_UPLOADED notification');
  assert.ok(
    scanUploaded.title.includes('Bệnh nhân Trần Thị Mai đã tải ảnh fundus mới'),
    'Scan uploaded title matches requirement'
  );

  const resultReviewed = MOCK_NOTIFICATIONS.find((n) => n.type === 'RESULT_REVIEWED');
  assert.ok(resultReviewed, 'Should contain RESULT_REVIEWED notification');
  assert.ok(
    resultReviewed.title.includes('BS. Nguyễn Văn An đã duyệt kết quả #SCR-2026-0918-01'),
    'Result reviewed title matches requirement'
  );

  const batchCompleted = MOCK_NOTIFICATIONS.find((n) => n.type === 'BATCH_COMPLETED');
  assert.ok(batchCompleted, 'Should contain BATCH_COMPLETED notification');
  assert.ok(
    batchCompleted.title.includes('Batch B-2026-0918 đã hoàn tất phân tích AI'),
    'Batch completed title matches requirement'
  );

  const alertHighRisk = MOCK_NOTIFICATIONS.find((n) => n.type === 'ALERT_HIGH_RISK');
  assert.ok(alertHighRisk, 'Should contain ALERT_HIGH_RISK notification');
  assert.ok(
    alertHighRisk.title.includes('Cảnh báo: Phát hiện ca nguy cơ CAO - MRN-78214'),
    'High risk alert title matches requirement'
  );
});

test('NOTIF-DATA-2: Every notification has id, type, title, message, timestamp, read, and link', () => {
  MOCK_NOTIFICATIONS.forEach((n) => {
    assert.ok(typeof n.id === 'string' && n.id.length > 0, 'id is valid string');
    assert.ok(typeof n.type === 'string' && n.type.length > 0, 'type is valid string');
    assert.ok(typeof n.title === 'string' && n.title.length > 0, 'title is valid string');
    assert.ok(typeof n.message === 'string' && n.message.length > 0, 'message is valid string');
    assert.ok(n.timestamp !== undefined && n.timestamp !== null, 'timestamp is present');
    assert.ok(typeof n.read === 'boolean', 'read is boolean');
    assert.ok(typeof n.link === 'string' && n.link.length > 0, 'link is valid string');
  });
});

test('NOTIF-DATA-3: Mock data has exactly 3 unread notifications for default badge count', () => {
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
  assert.strictEqual(unreadCount, 3, 'Exactly 3 unread notifications as required');
});

// ============================================================================
// 2. RELATIVE TIME FORMATTING
// ============================================================================
console.log('\n--- 2. Relative Time Formatting Tests ---');

test('TIME-1: formatRelativeTime outputs correct Vietnamese relative strings', () => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  assert.strictEqual(formatRelativeTime(fiveMinutesAgo, true), '5 phút trước');

  const twentyMinutesAgo = Date.now() - 20 * 60 * 1000;
  assert.strictEqual(formatRelativeTime(twentyMinutesAgo, true), '20 phút trước');

  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  assert.strictEqual(formatRelativeTime(twoHoursAgo, true), '2 giờ trước');

  const justNow = Date.now() - 10 * 1000;
  assert.strictEqual(formatRelativeTime(justNow, true), 'Vừa xong');
});

test('TIME-2: formatRelativeTime outputs correct English relative strings', () => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  assert.strictEqual(formatRelativeTime(fiveMinutesAgo, false), '5m ago');

  const justNow = Date.now() - 10 * 1000;
  assert.strictEqual(formatRelativeTime(justNow, false), 'Just now');
});

// ============================================================================
// 3. NOTIFICATION BELL COMPONENT (BƯỚC 2)
// ============================================================================
console.log('\n--- 3. Notification Bell Component Tests ---');

test('BELL-1: Renders Lucide Bell icon and badge count with 3 unread', () => {
  const html = renderToStaticMarkup(
    React.createElement(NotificationBell, {
      notifications: MOCK_NOTIFICATIONS,
      unreadCount: 3,
    })
  );

  assert.ok(html.includes('lucide-bell'), 'Renders lucide Bell icon');
  assert.ok(html.includes('bg-[#3478F6]'), 'Renders unread badge container');
  assert.ok(html.includes('3'), 'Renders 3 unread count badge');
});

test('BELL-2: When unreadCount is 0, badge is hidden', () => {
  const allRead = MOCK_NOTIFICATIONS.map((n) => ({ ...n, read: true, isRead: true }));
  const html = renderToStaticMarkup(
    React.createElement(NotificationBell, {
      notifications: allRead,
      unreadCount: 0,
    })
  );

  assert.ok(html.includes('lucide-bell'), 'Renders lucide Bell icon');
  assert.ok(!html.includes('bg-[#3478F6]'), 'Unread badge is hidden when count is 0');
});

test('BELL-3: NotificationBell includes required styling classes', () => {
  const html = renderToStaticMarkup(
    React.createElement(NotificationBell, {
      notifications: MOCK_NOTIFICATIONS,
    })
  );

  assert.ok(html.includes('rounded-xl'), 'Has rounded-xl styling on trigger button');
  assert.ok(html.includes('border-[#EAECF0]'), 'Has #EAECF0 border styling');
});

// ============================================================================
// 4. ONLINE PRESENCE INDICATOR & TOPBAR INTEGRATION (BƯỚC 3)
// ============================================================================
console.log('\n--- 4. Online Presence Indicator & Topbar Tests ---');

test('PRESENCE-1: Connected state renders green dot (w-2 h-2 rounded-full bg-emerald-500)', () => {
  const html = renderToStaticMarkup(
    React.createElement(Topbar, {
      currentUser: mockUser,
      onlineStatus: 'connected',
      onLogout: () => {},
    })
  );

  assert.ok(html.includes('w-2 h-2 rounded-full'), 'Has w-2 h-2 rounded-full dot class');
  assert.ok(html.includes('bg-emerald-500'), 'Has bg-emerald-500 class for connected state');
  assert.ok(
    html.includes('Kết nối real-time: Đang hoạt động'),
    'Has active connection tooltip in Vietnamese'
  );
});

test('PRESENCE-2: Reconnecting state renders yellow dot (bg-amber-500)', () => {
  const html = renderToStaticMarkup(
    React.createElement(Topbar, {
      currentUser: mockUser,
      onlineStatus: 'reconnecting',
      onLogout: () => {},
    })
  );

  assert.ok(html.includes('bg-amber-500'), 'Has bg-amber-500 class for reconnecting state');
  assert.ok(
    html.includes('Kết nối real-time: Đang kết nối lại'),
    'Has reconnecting tooltip in Vietnamese'
  );
});

test('PRESENCE-3: Disconnected state renders red dot (bg-rose-500)', () => {
  const html = renderToStaticMarkup(
    React.createElement(Topbar, {
      currentUser: mockUser,
      onlineStatus: 'disconnected',
      onLogout: () => {},
    })
  );

  assert.ok(html.includes('bg-rose-500'), 'Has bg-rose-500 class for disconnected state');
  assert.ok(
    html.includes('Kết nối real-time: Mất kết nối'),
    'Has disconnected tooltip in Vietnamese'
  );
});

test('PRESENCE-4: Topbar integrates NotificationBell, doctor name, and avatar', () => {
  const html = renderToStaticMarkup(
    React.createElement(Topbar, {
      currentUser: mockUser,
      title: 'Bàn chẩn đoán lâm sàng',
      onLogout: () => {},
    })
  );

  assert.ok(html.includes('lucide-bell'), 'Notification bell is present');
  assert.ok(html.includes('BS. Nguyễn Văn A'), 'Doctor username is present');
  assert.ok(html.includes('Bàn chẩn đoán lâm sàng'), 'Page title is present');
  assert.ok(html.includes('w-2 h-2 rounded-full'), 'Online presence dot is present');
  assert.ok(html.includes('h-[76px]'), 'Topbar height is 76px');
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n=================================================================');
console.log(`   TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('=================================================================');

if (totalTests !== passedTests) {
  process.exit(1);
} else {
  process.exit(0);
}
