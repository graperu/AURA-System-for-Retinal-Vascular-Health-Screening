/**
 * AURA Real-Time State Synchronization Verification Suite
 * Tests event routing, SSE/WebSocket integration, multi-channel topics,
 * 12 standardized STOMP event types, and zero-F5 UI reactivity.
 */
import { realtimeBus, RealtimeEvent } from '../services/realtimeService';
import { stompClient, AuraWebSocketClient } from '../services/websocketService';
import {
  ANALYSIS_STEP_PERCENTAGES,
  getAnalysisStatusMessage,
  AnalysisStep,
} from '../hooks/useAnalysisProgress';

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

console.log('\n--- 4. Kiểm thử 12 Chuẩn Sự Kiện STOMP & Phong Bì Dữ Liệu (Requirement R6) ---');

// Test 11: SCREENING_CREATED STOMP envelope
let screeningCreatedReceived = false;
let screeningCreatedLegacyReceived = false;
const unsubCreated = realtimeBus.subscribe('SCREENING_CREATED', (e) => {
  if (e.data?.screeningId === 'SCR-001' && e.data?.patientName === 'Nguyễn Văn An') {
    screeningCreatedReceived = true;
  }
});
const unsubCreatedLegacy = realtimeBus.subscribe('screening:new', (e) => {
  if (e.data?.screeningId === 'SCR-001') {
    screeningCreatedLegacyReceived = true;
  }
});

realtimeBus.handleIncomingPayload(
  {
    eventId: 'EVT-101',
    eventType: 'SCREENING_CREATED',
    timestamp: Date.now(),
    producer: 'aura-backend',
    data: {
      screeningId: 'SCR-001',
      patientId: 'PAT-001',
      patientName: 'Nguyễn Văn An',
      eyePosition: 'OD',
      status: 'QUEUED',
    },
  },
  'websocket'
);

assert(
  screeningCreatedReceived && screeningCreatedLegacyReceived,
  'RT-4.1: SCREENING_CREATED phát đúng chuẩn STOMP và điều hướng sang screening:new & screening:update'
);
unsubCreated();
unsubCreatedLegacy();

// Test 12: SCREENING_PROCESSING step tracking
let stepReceived = false;
const unsubProc = realtimeBus.subscribe('SCREENING_PROCESSING', (e) => {
  if (e.data?.step === 'GEMINI_INFERENCE' && e.data?.stepIndex === 3) {
    stepReceived = true;
  }
});

realtimeBus.handleIncomingPayload(
  {
    eventType: 'SCREENING_PROCESSING',
    data: {
      screeningId: 'SCR-001',
      patientId: 'PAT-001',
      step: 'GEMINI_INFERENCE',
      stepIndex: 3,
      totalSteps: 5,
      stepTitle: 'Phân tích vi mạch qua Gemini AI',
    },
  },
  'websocket'
);

assert(
  stepReceived,
  'RT-4.2: SCREENING_PROCESSING cập nhật chuẩn xác step GEMINI_INFERENCE (3/5) phục vụ tiến trình AI thực'
);
unsubProc();

// Test 13: SCREENING_COMPLETED payload with risk score & biomarkers
let completedReceived = false;
let notifReceived = false;
const unsubComp = realtimeBus.subscribe('SCREENING_COMPLETED', (e) => {
  if (e.data?.overallRiskScore === 72 && e.data?.riskLevel === 'HIGH') {
    completedReceived = true;
  }
});
const unsubNotif = realtimeBus.subscribe('notification:new', (e) => {
  if (e.data?.overallRiskScore === 72) {
    notifReceived = true;
  }
});

realtimeBus.handleIncomingPayload(
  {
    eventType: 'SCREENING_COMPLETED',
    data: {
      screeningId: 'SCR-001',
      overallRiskScore: 72,
      riskLevel: 'HIGH',
      confidence: 0.94,
      cardiovascularRiskScore: 70,
      diabeticRetinopathyRiskScore: 45,
    },
  },
  'websocket'
);

assert(
  completedReceived && notifReceived,
  'RT-4.3: SCREENING_COMPLETED phát đồng thời tới kênh kết quả ca khám và trung tâm thông báo chuông'
);
unsubComp();
unsubNotif();

// Test 14: SCREENING_FAILED
let failedReceived = false;
const unsubFail = realtimeBus.subscribe('SCREENING_FAILED', (e) => {
  if (e.data?.errorCode === 'AI_INFERENCE_TIMEOUT') {
    failedReceived = true;
  }
});

realtimeBus.handleIncomingPayload(
  {
    eventType: 'SCREENING_FAILED',
    data: {
      screeningId: 'SCR-001',
      errorCode: 'AI_INFERENCE_TIMEOUT',
      errorMessage: 'Không thể kết nối đến máy chủ phân tích AI.',
    },
  },
  'websocket'
);

assert(
  failedReceived,
  'RT-4.4: SCREENING_FAILED phát mã lỗi AI_INFERENCE_TIMEOUT phục vụ hiển thị ErrorState và nút thử lại'
);
unsubFail();

// Test 15: DOCTOR_REVIEWED & DOCTOR_OVERRIDE
let doctorReviewedReceived = false;
let doctorOverrideReceived = false;
const unsubRev = realtimeBus.subscribe('DOCTOR_REVIEWED', (e) => {
  if (e.data?.decision === 'MODIFIED') {
    doctorReviewedReceived = true;
  }
});
const unsubOver = realtimeBus.subscribe('DOCTOR_OVERRIDE', (e) => {
  if (e.data?.overrideReason?.includes('Vệt xuất huyết nhỏ')) {
    doctorOverrideReceived = true;
  }
});

realtimeBus.handleIncomingPayload(
  {
    eventType: 'DOCTOR_REVIEWED',
    data: {
      screeningId: 'SCR-001',
      decision: 'MODIFIED',
      doctorName: 'BS. CKII Trần Quốc Toản',
      digitalSignature: 'HMAC-SHA256:xK89...',
    },
  },
  'websocket'
);

realtimeBus.handleIncomingPayload(
  {
    eventType: 'DOCTOR_OVERRIDE',
    data: {
      screeningId: 'SCR-001',
      originalAiRiskLevel: 'CRITICAL',
      adjustedDoctorRiskLevel: 'HIGH',
      overrideReason: 'Vệt xuất huyết nhỏ do góc chiếu ánh sáng khúc xạ',
    },
  },
  'websocket'
);

assert(
  doctorReviewedReceived && doctorOverrideReceived,
  'RT-4.5: DOCTOR_REVIEWED và DOCTOR_OVERRIDE cập nhật tức thời chữ ký số và lý do điều chỉnh lâm sàng'
);
unsubRev();
unsubOver();

// Test 16: RETAKE_REQUIRED
let retakeReceived = false;
const unsubRetake = realtimeBus.subscribe('RETAKE_REQUIRED', (e) => {
  if (e.data?.reason === 'POOR_LIGHTING_BLUR') {
    retakeReceived = true;
  }
});

realtimeBus.handleIncomingPayload(
  {
    eventType: 'RETAKE_REQUIRED',
    data: {
      screeningId: 'SCR-001',
      reason: 'POOR_LIGHTING_BLUR',
      doctorInstructions: 'Ảnh chụp bị rung nhòe và chói sáng.',
    },
  },
  'websocket'
);

assert(
  retakeReceived,
  'RT-4.6: RETAKE_REQUIRED điều hướng thông báo yêu cầu chụp lại ảnh võng mạc đạt chuẩn'
);
unsubRetake();

// Test 17: MESSAGE_RECEIVED for chat
let messageReceived = false;
let chatLegacyReceived = false;
const unsubMsg = realtimeBus.subscribe('MESSAGE_RECEIVED', (e) => {
  if (e.data?.messageText === 'Kết quả khám của bạn đã hoàn tất') {
    messageReceived = true;
  }
});
const unsubChatLeg = realtimeBus.subscribe('chat:message', (e) => {
  if (e.data?.messageText === 'Kết quả khám của bạn đã hoàn tất') {
    chatLegacyReceived = true;
  }
});

realtimeBus.handleIncomingPayload(
  {
    eventType: 'MESSAGE_RECEIVED',
    data: {
      senderId: 'DOC-001',
      receiverId: 'PAT-001',
      messageText: 'Kết quả khám của bạn đã hoàn tất',
    },
  },
  'websocket'
);

assert(
  messageReceived && chatLegacyReceived,
  'RT-4.7: MESSAGE_RECEIVED cập nhật tin nhắn tư vấn và kích hoạt topic chat:message'
);
unsubMsg();
unsubChatLeg();

// Test 18: APPOINTMENT_CREATED & APPOINTMENT_UPDATED
let apptCreatedReceived = false;
let apptUpdatedReceived = false;
const unsubApptC = realtimeBus.subscribe('APPOINTMENT_CREATED', (e) => {
  if (e.data?.appointmentId === 'APT-100') apptCreatedReceived = true;
});
const unsubApptU = realtimeBus.subscribe('APPOINTMENT_UPDATED', (e) => {
  if (e.data?.status === 'CONFIRMED') apptUpdatedReceived = true;
});

realtimeBus.handleIncomingPayload(
  {
    eventType: 'APPOINTMENT_CREATED',
    data: { appointmentId: 'APT-100', patientName: 'Nguyễn Văn An' },
  },
  'websocket'
);

realtimeBus.handleIncomingPayload(
  {
    eventType: 'APPOINTMENT_UPDATED',
    data: { appointmentId: 'APT-100', status: 'CONFIRMED' },
  },
  'websocket'
);

assert(
  apptCreatedReceived && apptUpdatedReceived,
  'RT-4.8: APPOINTMENT_CREATED và APPOINTMENT_UPDATED đồng bộ lịch hẹn khám bệnh viện'
);
unsubApptC();
unsubApptU();

// Test 19: NOTIFICATION_CREATED & BATCH_PROGRESS
let notifCreatedReceived = false;
let batchProgressReceived = false;
const unsubNotifC = realtimeBus.subscribe('NOTIFICATION_CREATED', (e) => {
  if (e.data?.title === 'Bác sĩ đã thẩm định kết quả') notifCreatedReceived = true;
});
const unsubBatch = realtimeBus.subscribe('BATCH_PROGRESS', (e) => {
  if (e.data?.processedCount === 45 && e.data?.percent === 37.5) batchProgressReceived = true;
});

realtimeBus.handleIncomingPayload(
  {
    eventType: 'NOTIFICATION_CREATED',
    data: { id: 'N-01', title: 'Bác sĩ đã thẩm định kết quả', type: 'DOCTOR_REVIEW' },
  },
  'websocket'
);

realtimeBus.handleIncomingPayload(
  {
    eventType: 'BATCH_PROGRESS',
    data: { batchId: 'B-100', totalImages: 120, processedCount: 45, percent: 37.5 },
  },
  'websocket'
);

assert(
  notifCreatedReceived && batchProgressReceived,
  'RT-4.9: NOTIFICATION_CREATED và BATCH_PROGRESS đồng bộ badge thông báo và thanh tiến độ lô ảnh phòng khám'
);
unsubNotifC();
unsubBatch();

console.log('\n--- 5. Kiểm thử Client STOMP (AuraWebSocketClient / stompClient) ---');

// Test 20: stompClient subscribe returns clean unsubscribe callback
let customMsgCount = 0;
const cleanUnsub = stompClient.subscribe('/topic/screening.PAT-123', () => {
  customMsgCount++;
});

assert(
  typeof cleanUnsub === 'function',
  'RT-5.1: stompClient.subscribe trả về callback hủy đăng ký chuẩn () => void'
);

cleanUnsub();

// Test 21: Client lifecycle tracking
const status = stompClient.getStatus();
assert(
  status === 'CLOSED' || status === 'CONNECTING' || status === 'OPEN',
  'RT-5.2: stompClient.getStatus() phản ánh chính xác trạng thái kết nối STOMP WebSocket'
);

assert(
  AuraWebSocketClient === stompClient.constructor,
  'RT-5.3: Export AuraWebSocketClient và stompClient đồng nhất cho toàn bộ ứng dụng'
);

console.log('\n--- 6. Kiểm thử Định Tiến Trình AI Xác Định (useAnalysisProgress) ---');

// Test 22: Deterministic step percentages
assert(
  ANALYSIS_STEP_PERCENTAGES.IMAGE_UPLOADED === 20 &&
    ANALYSIS_STEP_PERCENTAGES.PREPARING_ANALYSIS === 40 &&
    ANALYSIS_STEP_PERCENTAGES.GEMINI_INFERENCE === 65 &&
    ANALYSIS_STEP_PERCENTAGES.GENERATING_RESULT === 85 &&
    ANALYSIS_STEP_PERCENTAGES.SAVING_RESULT === 92 &&
    ANALYSIS_STEP_PERCENTAGES.COMPLETED === 100,
  'RT-6.1: Định nghĩa bảng tỷ lệ tiến trình 5 bước AI xác định chuẩn (20 -> 40 -> 65 -> 85 -> 92 -> 100)'
);

// Test 23: Deterministic status messages
assert(
  getAnalysisStatusMessage(20) === 'Khởi tạo mã hóa bảo mật & tiền xử lý ảnh võng mạc...' &&
    getAnalysisStatusMessage(65) === 'Nhận diện vi phình mạch, xuất huyết & tính toán Biomarkers...' &&
    getAnalysisStatusMessage(100) === 'Hoàn tất phân tích! Đang chuyển sang bảng kết quả lâm sàng...',
  'RT-6.2: Thông điệp trạng thái phân tích AI tương ứng chính xác với từng mốc phần trăm lâm sàng'
);

console.log('\n=================================================================');
console.log(
  `   KẾT QUẢ KIỂM THỬ REAL-TIME: ${passCount}/${passCount + failCount} TESTS ĐÃ ĐẠT (${Math.round(
    (passCount / (passCount + failCount)) * 100
  )}% PASS)`
);
console.log('=================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
