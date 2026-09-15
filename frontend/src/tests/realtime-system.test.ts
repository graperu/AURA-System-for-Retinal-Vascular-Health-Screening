/**
 * AURA Real-Time State Synchronization Verification Suite
 * Tests event routing, SSE integration, multi-channel topics, and zero-F5 UI reactivity.
 */
import { realtimeBus, RealtimeEvent } from '../services/realtimeService';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passCount++;
    console.log(`  [PASS] ${message}`);
  } else {
    failCount++;
    console.error(`  [FAIL] ${message}`);
  }
}

console.log('=================================================================');
console.log('   AURA REAL-TIME SYSTEM VERIFICATION SUITE');
console.log('=================================================================\n');

console.log('--- 1. Kiểm thử Realtime Event Bus & Topic Subscription ---');

// Test 1: Subscribe to specific topic
let receivedScreeningEvent: RealtimeEvent | null = null;
const unsubScreening = realtimeBus.subscribe('screening:new', (event) => {
  receivedScreeningEvent = event;
});

realtimeBus.emit('screening:new', { id: 'SCR-101', riskScore: 78 });
assert(
  receivedScreeningEvent !== null && (receivedScreeningEvent as any).data?.id === 'SCR-101',
  'RT-1.1: Event Bus phát và nhận chính xác sự kiện screening:new'
);
unsubScreening();

// Test 2: Wildcard subscription 'all'
let receivedWildcardCount = 0;
const unsubAll = realtimeBus.subscribe('all', () => {
  receivedWildcardCount++;
});

realtimeBus.emit('profile:update', { fullName: 'Bác sĩ Lê Văn C' });
realtimeBus.emit('billing:update', { credits: 10 });
assert(
  receivedWildcardCount === 2,
  'RT-1.2: Wildcard "all" nhận đầy đủ tất cả các sự kiện đa luồng'
);
unsubAll();

// Test 3: Unsubscribe cleanup
let afterUnsubCount = 0;
const unsubTest = realtimeBus.subscribe('billing:update', () => {
  afterUnsubCount++;
});
unsubTest();
realtimeBus.emit('billing:update', { credits: 20 });
assert(
  afterUnsubCount === 0,
  'RT-1.3: Hủy đăng ký (unsubscribe) dọn dẹp triệt để listener chống rò rỉ bộ nhớ'
);

console.log('\n--- 2. Kiểm thử Phân Loại Tải Trọng SSE (handleIncomingPayload) ---');

// Test 4: AI Analysis Completed SSE Payload
let aiScreeningReceived = false;
const unsubAi = realtimeBus.subscribe('screening:new', (event) => {
  if (event.data?.type === 'AI_ANALYSIS_COMPLETED') {
    aiScreeningReceived = true;
  }
});

realtimeBus.handleIncomingPayload({
  type: 'AI_ANALYSIS_COMPLETED',
  title: 'AI đã phân tích xong',
  message: 'Đã hoàn tất tính toán biomarkers',
  severity: 'INFO',
});

assert(
  aiScreeningReceived,
  'RT-2.1: Tải trọng SSE "AI_ANALYSIS_COMPLETED" tự động điều hướng sang topic screening:new & screening:update'
);
unsubAi();

// Test 5: Doctor Review / Validation SSE Payload
let doctorReviewReceived = false;
const unsubDoc = realtimeBus.subscribe('screening:reviewed', (event) => {
  if (event.data?.type === 'DOCTOR_REVIEW') {
    doctorReviewReceived = true;
  }
});

realtimeBus.handleIncomingPayload({
  type: 'DOCTOR_REVIEW',
  title: 'Bác sĩ đã ký duyệt',
  message: 'Bác sĩ chuyên khoa đã thẩm định kết quả',
});

assert(
  doctorReviewReceived,
  'RT-2.2: Tải trọng SSE "DOCTOR_REVIEW" tự động cập nhật topic screening:reviewed theo thời gian thực'
);
unsubDoc();

// Test 6: Payment Success / Credit Recharge SSE Payload
let creditUpdateReceived = false;
const unsubPay = realtimeBus.subscribe('credit:change', (event) => {
  if (event.data?.type === 'PAYMENT_SUCCESS') {
    creditUpdateReceived = true;
  }
});

realtimeBus.handleIncomingPayload({
  type: 'PAYMENT_SUCCESS',
  title: 'Nạp credit thành công',
  message: 'Gói Tiêu Chuẩn 5 lượt đã được kích hoạt',
});

assert(
  creditUpdateReceived,
  'RT-2.3: Tải trọng SSE "PAYMENT_SUCCESS" kích hoạt topic credit:change cập nhật số dư ngay lập tức'
);
unsubPay();

// Test 7: Profile Update SSE Payload
let profileUpdateReceived = false;
const unsubProfile = realtimeBus.subscribe('profile:update', (event) => {
  if (event.data?.type === 'PROFILE_UPDATE') {
    profileUpdateReceived = true;
  }
});

realtimeBus.handleIncomingPayload({
  type: 'PROFILE_UPDATE',
  title: 'Hồ sơ y tế được cập nhật',
  fullName: 'Nguyễn Văn Test',
});

assert(
  profileUpdateReceived,
  'RT-2.4: Tải trọng SSE "PROFILE_UPDATE" kích hoạt topic profile:update đồng bộ thông tin không cần F5'
);
unsubProfile();

// Test 8: Doctor Assignment SSE Payload
let assignmentReceived = false;
const unsubAssign = realtimeBus.subscribe('doctor:assignment', (event) => {
  if (event.data?.type === 'DOCTOR_ASSIGNMENT') {
    assignmentReceived = true;
  }
});

realtimeBus.handleIncomingPayload({
  type: 'DOCTOR_ASSIGNMENT',
  title: 'Phân công bác sĩ',
  doctorName: 'BS. CKII Trần Quốc Toản',
});

assert(
  assignmentReceived,
  'RT-2.5: Tải trọng SSE "DOCTOR_ASSIGNMENT" kích hoạt topic doctor:assignment điều phối tức thời'
);
unsubAssign();

console.log('\n--- 3. Kiểm thử Đa Kênh Lắng Nghe Đồng Thời (Multi-Topic Subscription) ---');

// Test 9: Subscribing to array of topics
let multiTopicCount = 0;
const unsubMulti = realtimeBus.subscribe(
  ['screening:new', 'screening:reviewed', 'screening:deleted'],
  () => {
    multiTopicCount++;
  }
);

realtimeBus.emit('screening:new', { id: '1' });
realtimeBus.emit('screening:reviewed', { id: '2' });
realtimeBus.emit('screening:deleted', { id: '3' });
realtimeBus.emit('profile:update', { name: 'X' }); // Should NOT trigger

assert(
  multiTopicCount === 3,
  'RT-3.1: Đăng ký mảng đa topic [screening:new, screening:reviewed, screening:deleted] nhận đúng 3 sự kiện mục tiêu'
);
unsubMulti();

// Test 10: Robustness on empty / invalid payload
let errorTriggered = false;
try {
  realtimeBus.handleIncomingPayload(null as any);
  realtimeBus.handleIncomingPayload(undefined as any);
  realtimeBus.emit('test:invalid', null);
} catch (e) {
  errorTriggered = true;
}

assert(
  !errorTriggered,
  'RT-3.2: Xử lý an toàn các payload rỗng hoặc null mà không làm gián đoạn luồng ứng dụng'
);

console.log('\n=================================================================');
console.log(`   KẾT QUẢ KIỂM THỬ REAL-TIME: ${passCount}/${passCount + failCount} TESTS ĐÃ ĐẠT (${Math.round((passCount / (passCount + failCount)) * 100)}% PASS)`);
console.log('=================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
