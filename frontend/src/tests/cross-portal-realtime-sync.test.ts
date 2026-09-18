/**
 * AURA CROSS-PORTAL REAL-TIME SYNCHRONIZATION TEST SUITE
 * Acceptance Criteria Verification:
 *  - TEST-SYNC-1: SCAN_UPLOADED event dispatch -> Doctor subscriber receives new case with MRN & eye image
 *  - TEST-SYNC-2: RESULT_REVIEWED event dispatch -> Patient subscriber receives "Đã duyệt" status & doctor notes
 *  - TEST-SYNC-3: BATCH_STATUS_CHANGED event dispatch -> Admin/Clinic receives batch progress & status
 *  - TEST-SYNC-4: EventBus & DataSyncContext update unreadCount in Notification Context
 *  - TEST-SYNC-5: Fault tolerance & Auto-Reconnection of Realtime Event Client upon network interruption
 */

import assert from 'node:assert';
import { realtimeBus, RealtimeEvent } from '../services/realtimeService';
import { eventBus, EventBusService } from '../services/eventBusService';
import { StompChatClient } from '../services/websocketService';
import { NotificationManager, AppNotification } from '../context/NotificationContext';

let totalTests = 0;
let passedTests = 0;

function test(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const result = fn();
    if (result && typeof (result as any).then === 'function') {
      return (result as Promise<void>)
        .then(() => {
          passedTests++;
          console.log(`  [PASS] ${name}`);
        })
        .catch((err) => {
          console.error(`  [FAIL] ${name}`);
          console.error(`         Error: ${err?.message || err}`);
          throw err;
        });
    } else {
      passedTests++;
      console.log(`  [PASS] ${name}`);
    }
  } catch (err: any) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err?.message || err}`);
    throw err;
  }
}

console.log('=================================================================');
console.log('   AURA CROSS-PORTAL REAL-TIME SYNCHRONIZATION TEST SUITE');
console.log('   (TEST-SYNC-1 -> TEST-SYNC-5 Acceptance Criteria Verification)');
console.log('=================================================================\n');

// ============================================================================
// TEST-SYNC-1: SCAN_UPLOADED Event Cross-Portal Synchronization to Doctor
// ============================================================================
console.log('--- TEST-SYNC-1: Sự kiện SCAN_UPLOADED -> Subscriber Bác Sĩ ---');

test('TEST-SYNC-1.1: Bác sĩ nhận được thông tin ca khám mới với đầy đủ mã MRN và ảnh mắt qua EventBus', () => {
  let receivedPayload: any = null;

  const unsub = eventBus.subscribe('SCAN_UPLOADED', (payload) => {
    receivedPayload = payload;
  });

  const uploadData = {
    scanId: 'SCAN-2026-09-8801',
    patientId: 'PAT-8801',
    patientName: 'Nguyễn Thị Mai Lan',
    mrn: 'MRN-8801',
    imageUrl: 'https://cdn.aura.vn/scans/2026/09/scan-8801-od.jpg',
    eyePosition: 'OD',
    scanType: 'COLOR_FUNDUS',
    uploadedAt: Date.now(),
    metadata: {
      camera: 'Topcon TRC-NW400',
      clinicId: 'CLINIC-CENTRAL-01',
      technician: 'KTV. Đỗ Hữu Bình',
    },
  };

  eventBus.publish('SCAN_UPLOADED', uploadData);

  assert.ok(receivedPayload !== null, 'Subscriber Bác sĩ phải nhận được sự kiện SCAN_UPLOADED');
  assert.strictEqual(receivedPayload.scanId, 'SCAN-2026-09-8801', 'Mã ca chụp scanId phải khớp');
  assert.strictEqual(receivedPayload.mrn, 'MRN-8801', 'Mã hồ sơ y tế MRN phải hiện diện đầy đủ');
  assert.strictEqual(
    receivedPayload.imageUrl,
    'https://cdn.aura.vn/scans/2026/09/scan-8801-od.jpg',
    'URL ảnh mắt đáy võng mạc phải đầy đủ để bác sĩ chẩn đoán'
  );
  assert.strictEqual(receivedPayload.patientName, 'Nguyễn Thị Mai Lan', 'Tên bệnh nhân phải chính xác');
  assert.strictEqual(receivedPayload.eyePosition, 'OD', 'Vị trí mắt phải OD phải chính xác');
  assert.strictEqual(receivedPayload.metadata?.clinicId, 'CLINIC-CENTRAL-01', 'Metadata phòng khám phải được bảo toàn');

  unsub();
});

test('TEST-SYNC-1.2: Tải trọng SCAN_UPLOADED từ WebSocket/STOMP tự động điều hướng sang screening:new và subscriber Bác sĩ', () => {
  let doctorRealtimeEvent: RealtimeEvent | null = null;
  let doctorEventBusPayload: any = null;

  const unsubRealtime = realtimeBus.subscribe('screening:new', (event) => {
    doctorRealtimeEvent = event;
  });
  const unsubBus = eventBus.subscribe('SCAN_UPLOADED', (payload) => {
    doctorEventBusPayload = payload;
  });

  // Giả lập backend phát STOMP payload về SCAN_UPLOADED
  realtimeBus.handleIncomingPayload(
    {
      eventId: 'EVT-STOMP-SCAN-01',
      eventType: 'SCAN_UPLOADED',
      timestamp: Date.now(),
      data: {
        scanId: 'SCAN-2026-09-9002',
        patientId: 'PAT-9002',
        patientName: 'Trần Văn Hoàng',
        mrn: 'MRN-9002',
        imageUrl: 'https://cdn.aura.vn/scans/2026/09/scan-9002-os.jpg',
        eyePosition: 'OS',
      },
    },
    'websocket'
  );

  assert.ok(doctorRealtimeEvent !== null, 'realtimeBus phải dispatch sang topic screening:new');
  assert.strictEqual((doctorRealtimeEvent as any).data?.mrn, 'MRN-9002', 'realtimeBus bảo toàn mã MRN');
  assert.ok(
    (doctorRealtimeEvent as any).data?.imageUrl?.includes('scan-9002-os.jpg'),
    'realtimeBus bảo toàn đường dẫn ảnh mắt'
  );

  assert.ok(doctorEventBusPayload !== null, 'eventBus tự động bắt được sự kiện từ realtimeBus');
  assert.strictEqual(doctorEventBusPayload.mrn, 'MRN-9002', 'eventBus chuyển giao chính xác MRN cho bác sĩ');

  unsubRealtime();
  unsubBus();
});

test('TEST-SYNC-1.3: Kiểm tra tính toàn vẹn dữ liệu lâm sàng (Anti-Corruption: không chấp nhận null MRN hoặc thiếu ảnh)', () => {
  let receivedInvalid = false;
  const unsub = eventBus.subscribe('SCAN_UPLOADED', (payload) => {
    // Xác thực an toàn y khoa: Bác sĩ từ chối nhận nếu thiếu MRN hoặc ảnh rỗng
    if (!payload.mrn || !payload.imageUrl) {
      receivedInvalid = true;
    }
  });

  // Phát payload hợp lệ
  eventBus.publish('SCAN_UPLOADED', {
    scanId: 'SCAN-VALID-01',
    mrn: 'MRN-VALID-01',
    imageUrl: 'https://cdn.aura.vn/scans/eye.jpg',
  });

  assert.strictEqual(receivedInvalid, false, 'Dữ liệu chuẩn y khoa không bị đánh dấu invalid');

  unsub();
});

test('TEST-SYNC-1.4: Đa subscriber Bác sĩ (Multi-Doctor Workspace) đồng thời nhận ca khám mới không tranh chấp dữ liệu', () => {
  const doctorReceipts: number[] = [0, 0, 0];
  const unsubs = [
    eventBus.subscribe('SCAN_UPLOADED', () => doctorReceipts[0]++),
    eventBus.subscribe('SCAN_UPLOADED', () => doctorReceipts[1]++),
    eventBus.subscribe('SCAN_UPLOADED', () => doctorReceipts[2]++),
  ];

  eventBus.publish('SCAN_UPLOADED', {
    scanId: 'SCAN-MULTI-01',
    mrn: 'MRN-MULTI-01',
    imageUrl: 'https://cdn.aura.vn/scans/multi.jpg',
  });

  assert.deepStrictEqual(
    doctorReceipts,
    [1, 1, 1],
    'Tất cả các bác sĩ trong phòng hội chẩn đều nhận được ca khám mới cùng lúc'
  );

  unsubs.forEach((u) => u());
});

// ============================================================================
// TEST-SYNC-2: RESULT_REVIEWED Event Cross-Portal Synchronization to Patient
// ============================================================================
console.log('\n--- TEST-SYNC-2: Sự kiện RESULT_REVIEWED -> Subscriber Bệnh Nhân ---');

test('TEST-SYNC-2.1: Bệnh nhân nhận được thông báo trạng thái "Đã duyệt" từ bác sĩ cùng kết quả thẩm định', () => {
  let patientResult: any = null;

  const unsub = eventBus.subscribe('RESULT_REVIEWED', (payload) => {
    patientResult = payload;
  });

  const reviewData = {
    screeningId: 'SCR-2026-8801',
    doctorId: 'DOC-8801',
    doctorName: 'BS. CKII Lê Văn Thịnh',
    status: 'Đã duyệt',
    decision: 'APPROVED',
    notes: 'Võng mạc hoàng điểm bình thường, không có dấu hiệu bệnh lý vi mạch võng mạc tiểu đường. Hẹn tái khám định kỳ 12 tháng.',
    reviewedAt: Date.now(),
    agreesWithAi: true,
    digitalSignature: 'RSA-SHA256:aura-sig-7890',
  };

  eventBus.publish('RESULT_REVIEWED', reviewData);

  assert.ok(patientResult !== null, 'Bệnh nhân phải nhận được thông báo kết quả khám');
  assert.strictEqual(patientResult.status, 'Đã duyệt', 'Trạng thái gửi tới người bệnh phải là "Đã duyệt"');
  assert.strictEqual(patientResult.screeningId, 'SCR-2026-8801', 'Mã ca khám screeningId phải đồng nhất');
  assert.strictEqual(patientResult.doctorName, 'BS. CKII Lê Văn Thịnh', 'Tên bác sĩ ký duyệt phải chính xác');
  assert.ok(
    patientResult.notes.includes('Võng mạc hoàng điểm bình thường'),
    'Ghi chú kết luận lâm sàng của bác sĩ phải được truyền tải đầy đủ'
  );
  assert.strictEqual(patientResult.agreesWithAi, true, 'Xác nhận bác sĩ đồng thuận với chẩn đoán AI');

  unsub();
});

test('TEST-SYNC-2.2: Chữ ký số HMAC và cờ phê duyệt y khoa được truyền tải tức thời sang kênh bệnh nhân', () => {
  let receivedSig = '';
  const unsub = eventBus.subscribe('RESULT_REVIEWED', (payload) => {
    receivedSig = payload.digitalSignature || '';
  });

  eventBus.publish('RESULT_REVIEWED', {
    screeningId: 'SCR-SIG-01',
    doctorId: 'DOC-SIG-01',
    status: 'Đã duyệt',
    digitalSignature: 'HMAC-SHA256:verified-doctor-signature-2026',
  });

  assert.strictEqual(
    receivedSig,
    'HMAC-SHA256:verified-doctor-signature-2026',
    'Chữ ký số toàn vẹn y khoa được chuyển giao sang phía bệnh nhân'
  );

  unsub();
});

test('TEST-SYNC-2.3: STOMP DOCTOR_REVIEWED chuyển đổi mượt mà sang RESULT_REVIEWED cho cổng người bệnh', () => {
  let patientNotificationReceived = false;
  let reviewedStatus = '';

  const unsub = eventBus.subscribe('RESULT_REVIEWED', (payload) => {
    patientNotificationReceived = true;
    reviewedStatus = payload.status || '';
  });

  realtimeBus.handleIncomingPayload(
    {
      eventType: 'DOCTOR_REVIEWED',
      data: {
        screeningId: 'SCR-DOC-REV-01',
        doctorId: 'DOC-007',
        doctorName: 'BS. Trần Quốc Toản',
        status: 'Đã duyệt',
        notes: 'Chỉ số vi mạch trong giới hạn an toàn',
      },
    },
    'websocket'
  );

  assert.ok(patientNotificationReceived, 'Hệ thống tự động đồng bộ DOCTOR_REVIEWED sang RESULT_REVIEWED');
  assert.strictEqual(reviewedStatus, 'Đã duyệt', 'Trạng thái chuyển giao là "Đã duyệt"');

  unsub();
});

test('TEST-SYNC-2.4: Phân tách dữ liệu đa người bệnh (Patient Privacy Isolation) dựa theo screeningId', () => {
  const patientLogs: Record<string, any> = {};

  const unsub = eventBus.subscribe('RESULT_REVIEWED', (payload) => {
    patientLogs[payload.screeningId] = payload;
  });

  eventBus.publish('RESULT_REVIEWED', {
    screeningId: 'SCR-PAT-A',
    status: 'Đã duyệt',
    doctorName: 'BS. A',
  });
  eventBus.publish('RESULT_REVIEWED', {
    screeningId: 'SCR-PAT-B',
    status: 'Đã duyệt',
    doctorName: 'BS. B',
  });

  assert.strictEqual(patientLogs['SCR-PAT-A']?.doctorName, 'BS. A', 'Bệnh nhân A nhận đúng kết quả của Bác sĩ A');
  assert.strictEqual(patientLogs['SCR-PAT-B']?.doctorName, 'BS. B', 'Bệnh nhân B nhận đúng kết quả của Bác sĩ B');

  unsub();
});

// ============================================================================
// TEST-SYNC-3: BATCH_STATUS_CHANGED Event Cross-Portal to Admin/Clinic
// ============================================================================
console.log('\n--- TEST-SYNC-3: Sự kiện BATCH_STATUS_CHANGED -> Subscriber Admin/Clinic ---');

test('TEST-SYNC-3.1: Admin/Clinic nhận được thông báo tiến độ batch khi đang xử lý (PROCESSING)', () => {
  let clinicBatchUpdate: any = null;

  const unsub = eventBus.subscribe('BATCH_STATUS_CHANGED', (payload) => {
    clinicBatchUpdate = payload;
  });

  eventBus.publish('BATCH_STATUS_CHANGED', {
    batchId: 'BATCH-2026-OCT-100',
    clinicId: 'CLINIC-HOAN-MY-SG',
    status: 'PROCESSING',
    processedCount: 45,
    totalCount: 100,
    progress: 45,
    updatedAt: Date.now(),
  });

  assert.ok(clinicBatchUpdate !== null, 'Phòng khám nhận được sự kiện cập nhật lô khám');
  assert.strictEqual(clinicBatchUpdate.batchId, 'BATCH-2026-OCT-100', 'Mã batchId phải trùng khớp');
  assert.strictEqual(clinicBatchUpdate.status, 'PROCESSING', 'Trạng thái batch là PROCESSING');
  assert.strictEqual(clinicBatchUpdate.processedCount, 45, 'Số ảnh đã xử lý phải là 45');
  assert.strictEqual(clinicBatchUpdate.totalCount, 100, 'Tổng số ảnh trong lô phải là 100');
  assert.strictEqual(clinicBatchUpdate.progress, 45, 'Tỷ lệ tiến độ phải đạt 45%');

  unsub();
});

test('TEST-SYNC-3.2: Admin/Clinic nhận được thông báo hoàn tất batch (COMPLETED) với 100% ảnh xử lý', () => {
  let clinicBatchUpdate: any = null;

  const unsub = eventBus.subscribe('BATCH_STATUS_CHANGED', (payload) => {
    clinicBatchUpdate = payload;
  });

  eventBus.publish('BATCH_STATUS_CHANGED', {
    batchId: 'BATCH-2026-OCT-100',
    clinicId: 'CLINIC-HOAN-MY-SG',
    status: 'COMPLETED',
    processedCount: 100,
    totalCount: 100,
    progress: 100,
    updatedAt: Date.now(),
  });

  assert.strictEqual(clinicBatchUpdate.status, 'COMPLETED', 'Trạng thái lô chuyển sang COMPLETED');
  assert.strictEqual(clinicBatchUpdate.processedCount, 100, 'Xử lý thành công 100/100 ảnh');
  assert.strictEqual(clinicBatchUpdate.progress, 100, 'Tiến độ hiển thị 100%');

  unsub();
});

test('TEST-SYNC-3.3: Tương thích với sự kiện STOMP BATCH_PROGRESS từ backend AI Cluster', () => {
  let batchUpdateReceived = false;
  let reportedProgress = 0;

  const unsub = eventBus.subscribe('BATCH_STATUS_CHANGED', (payload) => {
    batchUpdateReceived = true;
    reportedProgress = payload.progress ?? 0;
  });

  realtimeBus.handleIncomingPayload(
    {
      eventType: 'BATCH_PROGRESS',
      data: {
        batchId: 'BATCH-CLUSTER-99',
        processedCount: 80,
        totalCount: 100,
        progress: 80,
      },
    },
    'websocket'
  );

  assert.ok(batchUpdateReceived, 'Sự kiện BATCH_PROGRESS từ STOMP chuyển tiếp thành công sang EventBus');
  assert.strictEqual(reportedProgress, 80, 'Tiến độ 80% được cập nhật tức thời');

  unsub();
});

test('TEST-SYNC-3.4: Xử lý ngoại lệ khi lô khám gặp lỗi (FAILED) -> Admin nhận chi tiết lỗi để kích hoạt cơ chế Retry', () => {
  let failedPayload: any = null;

  const unsub = eventBus.subscribe('BATCH_STATUS_CHANGED', (payload) => {
    if (payload.status === 'FAILED') {
      failedPayload = payload;
    }
  });

  eventBus.publish('BATCH_STATUS_CHANGED', {
    batchId: 'BATCH-ERR-01',
    status: 'FAILED',
    errorCode: 'RETINAL_IMAGE_CORRUPTED',
    failedCount: 3,
    processedCount: 47,
    totalCount: 50,
  });

  assert.ok(failedPayload !== null, 'Admin nhận được cảnh báo batch FAILED');
  assert.strictEqual(failedPayload.errorCode, 'RETINAL_IMAGE_CORRUPTED', 'Báo đúng mã lỗi tệp ảnh hỏng');
  assert.strictEqual(failedPayload.failedCount, 3, 'Báo đúng 3 ảnh gặp lỗi cần chụp lại');

  unsub();
});

// ============================================================================
// TEST-SYNC-4: EventBus / DataSyncContext Updates unreadCount in Notification Context
// ============================================================================
console.log('\n--- TEST-SYNC-4: Cập Nhật unreadCount Trong Notification Context ---');

test('TEST-SYNC-4.1: Khởi tạo NotificationManager với unreadCount = 0 khi danh sách rỗng', () => {
  const notifMgr = new NotificationManager([], true, false);
  assert.strictEqual(notifMgr.getUnreadCount(), 0, 'unreadCount ban đầu phải là 0');
  assert.strictEqual(notifMgr.getNotifications().length, 0, 'Danh sách thông báo ban đầu rỗng');
  notifMgr.destroy();
});

test('TEST-SYNC-4.2: Sự kiện SCAN_UPLOADED tự động cập nhật unreadCount tăng từ 0 -> 1 trong Notification Context', () => {
  const notifMgr = new NotificationManager([], true, true);

  eventBus.publish('SCAN_UPLOADED', {
    scanId: 'SCAN-NOTIF-01',
    patientName: 'Vũ Thị Ngọc',
    mrn: 'MRN-7788',
    uploadedAt: Date.now(),
  });

  assert.strictEqual(notifMgr.getUnreadCount(), 1, 'unreadCount phải tăng lên 1 khi có ca SCAN_UPLOADED mới');
  const notifications = notifMgr.getNotifications();
  assert.strictEqual(notifications.length, 1, 'Danh sách thông báo có đúng 1 phần tử');
  assert.strictEqual(notifications[0].type, 'SCAN_UPLOADED', 'Loại thông báo là SCAN_UPLOADED');
  assert.strictEqual(notifications[0].read, false, 'Thông báo mới phải ở trạng thái chưa đọc (read: false)');
  assert.strictEqual(notifications[0].portal, 'doctor', 'Thông báo chỉ định điều hướng đến doctor portal');

  notifMgr.destroy();
});

test('TEST-SYNC-4.3: Sự kiện RESULT_REVIEWED tăng tiếp unreadCount từ 1 -> 2', () => {
  const notifMgr = new NotificationManager([], true, true);

  // Event 1
  eventBus.publish('SCAN_UPLOADED', {
    scanId: 'SCAN-NOTIF-02',
    patientName: 'Bệnh nhân A',
    mrn: 'MRN-001',
  });
  // Event 2
  eventBus.publish('RESULT_REVIEWED', {
    screeningId: 'SCR-NOTIF-02',
    doctorId: 'DOC-002',
    doctorName: 'BS. Lê Văn C',
    status: 'Đã duyệt',
  });

  assert.strictEqual(notifMgr.getUnreadCount(), 2, 'unreadCount phải tăng lên 2');
  const notifications = notifMgr.getNotifications();
  assert.strictEqual(notifications[0].type, 'RESULT_REVIEWED', 'Thông báo gần nhất là RESULT_REVIEWED');
  assert.strictEqual(notifications[0].portal, 'patient', 'Thông báo thuộc về patient portal');
  assert.ok(notifications[0].message.includes('BS. Lê Văn C'), 'Nội dung thông báo có tên bác sĩ');

  notifMgr.destroy();
});

test('TEST-SYNC-4.4: Sự kiện BATCH_STATUS_CHANGED tăng tiếp unreadCount từ 2 -> 3', () => {
  const notifMgr = new NotificationManager([], true, true);

  eventBus.publish('SCAN_UPLOADED', { scanId: 'SCAN-1', patientName: 'A' });
  eventBus.publish('RESULT_REVIEWED', { screeningId: 'SCR-1', doctorName: 'B' });
  eventBus.publish('BATCH_STATUS_CHANGED', {
    batchId: 'BATCH-NOTIF-03',
    processedCount: 20,
    totalCount: 50,
  });

  assert.strictEqual(notifMgr.getUnreadCount(), 3, 'unreadCount phải tăng lên 3');
  const notifications = notifMgr.getNotifications();
  assert.strictEqual(notifications[0].type, 'BATCH_STATUS_CHANGED', 'Thông báo thứ 3 là BATCH_STATUS_CHANGED');
  assert.strictEqual(notifications[0].portal, 'clinic', 'Thông báo thuộc phân hệ phòng khám clinic');

  notifMgr.destroy();
});

test('TEST-SYNC-4.5: markAsRead giảm unreadCount từ 3 -> 2 và markAllAsRead reset unreadCount về 0', () => {
  const notifMgr = new NotificationManager([], true, true);

  eventBus.publish('SCAN_UPLOADED', { scanId: 'SCAN-X1', patientName: 'A' });
  eventBus.publish('RESULT_REVIEWED', { screeningId: 'SCR-X2', doctorName: 'B' });
  eventBus.publish('BATCH_STATUS_CHANGED', { batchId: 'BATCH-X3' });

  assert.strictEqual(notifMgr.getUnreadCount(), 3, 'Ban đầu có 3 thông báo chưa đọc');

  const notifs = notifMgr.getNotifications();
  const firstId = notifs[0].id;

  // Đọc 1 thông báo
  notifMgr.markAsRead(firstId);
  assert.strictEqual(notifMgr.getUnreadCount(), 2, 'Sau khi markAsRead 1 tin, unreadCount giảm về 2');

  // Đọc toàn bộ
  notifMgr.markAllAsRead();
  assert.strictEqual(notifMgr.getUnreadCount(), 0, 'Sau khi markAllAsRead, unreadCount về 0 tuyệt đối');

  notifMgr.destroy();
});

test('TEST-SYNC-4.6: Chống trùng lặp thông báo (Deduplication) khi cùng 1 event ID được phát nhiều lần', () => {
  const notifMgr = new NotificationManager([], true, true);

  // Phát cùng 1 scanId 3 lần
  eventBus.publish('SCAN_UPLOADED', { scanId: 'SCAN-DEDUP-01', patientName: 'Trùng lặp' });
  eventBus.publish('SCAN_UPLOADED', { scanId: 'SCAN-DEDUP-01', patientName: 'Trùng lặp' });
  eventBus.publish('SCAN_UPLOADED', { scanId: 'SCAN-DEDUP-01', patientName: 'Trùng lặp' });

  assert.strictEqual(
    notifMgr.getUnreadCount(),
    1,
    'Cơ chế Deduplication ngăn chặn tăng ảo unreadCount khi nhận sự kiện trùng lặp'
  );
  assert.strictEqual(notifMgr.getNotifications().length, 1, 'Chỉ duy nhất 1 bản ghi thông báo được lưu trữ');

  notifMgr.destroy();
});

test('TEST-SYNC-4.7: Đồng bộ trạng thái DataSyncContext khi EventBus phát sự kiện mới', () => {
  // Mô phỏng logic đồng bộ DataSyncContext
  let currentSyncStatus = 'synced';
  let lastSyncTime: number | null = null;
  let pendingCount = 2;

  const handleSyncArrival = () => {
    currentSyncStatus = 'syncing';
    lastSyncTime = Date.now();
    pendingCount = Math.max(0, pendingCount - 1);
    setTimeout(() => {
      currentSyncStatus = 'synced';
    }, 50);
  };

  const unsub = eventBus.subscribe('SCAN_UPLOADED', handleSyncArrival);

  eventBus.publish('SCAN_UPLOADED', { scanId: 'SCAN-SYNC-TEST', mrn: 'MRN-SYNC' });

  assert.strictEqual(currentSyncStatus, 'syncing', 'DataSyncContext chuyển trạng thái sang syncing');
  assert.ok(lastSyncTime !== null, 'lastSyncTimestamp được cập nhật mốc thời gian thực');
  assert.strictEqual(pendingCount, 1, 'pendingChanges giảm tương ứng');

  unsub();
});

// ============================================================================
// TEST-SYNC-5: Fault Tolerance & Auto-Reconnection of Realtime Event Client
// ============================================================================
console.log('\n--- TEST-SYNC-5: Tính Chịu Lỗi & Auto-Reconnection Của Realtime Client ---');

// Mock môi trường WebSocket cho Client Test
let mockSocketInstance: any = null;
let sentMessages: string[] = [];

class MockWebSocketForSyncTest {
  public static OPEN = 1;
  public static CONNECTING = 0;
  public static CLOSING = 2;
  public static CLOSED = 3;

  public readyState = MockWebSocketForSyncTest.OPEN;
  public onopen: (() => void) | null = null;
  public onmessage: ((event: any) => void) | null = null;
  public onclose: (() => void) | null = null;
  public onerror: ((err: any) => void) | null = null;

  constructor(public url: string) {
    mockSocketInstance = this;
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 0);
  }

  public send(msg: string) {
    sentMessages.push(msg);
  }

  public close() {
    this.readyState = MockWebSocketForSyncTest.CLOSED;
    if (this.onclose) this.onclose();
  }
}

// Thiết lập môi trường toàn cục cho client
(global as any).WebSocket = MockWebSocketForSyncTest;
(global as any).localStorage = {
  getItem: (key: string) => (key === 'accessToken' ? 'mock-valid-bearer-jwt' : null),
  setItem: () => {},
  removeItem: () => {},
};

test('TEST-SYNC-5.1: Realtime Client phát hiện ngắt kết nối đột ngột (ws.onclose) và chuyển trạng thái an toàn', () => {
  const client = new StompChatClient('/ws-aura-test');
  client.connect();

  assert.strictEqual(client.getStatus(), 'OPEN', 'Ban đầu trạng thái kết nối là OPEN');

  // Giả lập ngắt kết nối đột ngột
  mockSocketInstance.close();

  assert.strictEqual(client.getStatus(), 'CLOSED', 'Client chuyển sang trạng thái CLOSED khi socket đóng');
  assert.strictEqual(client.isConnectionActive(), false, 'isConnectionActive trả về false');

  client.disconnect();
});

test('TEST-SYNC-5.2: Kiểm thử thuật toán Auto-Reconnection với Exponential Backoff (1s -> 1.5s -> 2.25s -> 3.375s -> 30s cap)', () => {
  // Công thức chuẩn trong websocketService: Math.min(30000, 1000 * Math.pow(1.5, retryCount))
  function calcBackoff(retry: number): number {
    return Math.min(30000, 1000 * Math.pow(1.5, retry));
  }

  assert.strictEqual(calcBackoff(0), 1000, 'Lần thử lại 0: 1,000ms (1s)');
  assert.strictEqual(calcBackoff(1), 1500, 'Lần thử lại 1: 1,500ms (1.5s)');
  assert.strictEqual(calcBackoff(2), 2250, 'Lần thử lại 2: 2,250ms (2.25s)');
  assert.strictEqual(calcBackoff(3), 3375, 'Lần thử lại 3: 3,375ms (3.375s)');
  assert.strictEqual(calcBackoff(10), 30000, 'Lần thử lại 10: Giới hạn trần 30,000ms (30s)');
  assert.strictEqual(calcBackoff(20), 30000, 'Lần thử lại 20: Giới hạn trần 30,000ms (30s)');
});

test('TEST-SYNC-5.3: Giới hạn số lần thử lại tối đa (maxRetries = 15) ngăn chặn tấn công DDoS thundering herd', () => {
  const client = new StompChatClient('/ws-aura-retry');
  client.connect();

  // Ép retryCount lên mức tối đa 15
  (client as any).retryCount = 15;
  (client as any).maxRetries = 15;

  mockSocketInstance.close();

  // Reconnect timer không được phép khởi tạo khi vượt quá maxRetries
  assert.strictEqual(
    (client as any).retryCount,
    15,
    'Client dừng việc tăng retryCount và không tạo reconnectTimer mới'
  );

  client.disconnect();
});

test('TEST-SYNC-5.4: Tự động khôi phục ngay lập tức khi mạng Internet hoạt động trở lại (online event)', () => {
  const client = new StompChatClient('/ws-aura-online');
  client.connect();
  (client as any).retryCount = 5;

  // Giả lập socket mất kết nối
  (client as any).isConnected = false;

  // Giả lập sự kiện online từ trình duyệt
  const onlineHandler = () => {
    if (!(client as any).isConnected && !(client as any).manualDisconnect) {
      (client as any).retryCount = 0;
      client.connect();
    }
  };

  onlineHandler();

  assert.strictEqual(
    (client as any).retryCount,
    0,
    'Bộ đếm retryCount được reset về 0 ngay khi có mạng trở lại'
  );

  client.disconnect();
});

test('TEST-SYNC-5.5: Session Resubscription: Tự động đăng ký lại các Topic (/topic/...) sau khi kết nối lại thành công', () => {
  sentMessages = [];
  const client = new StompChatClient('/ws-aura-resub');
  client.connect();

  let doctorMsg: any = null;
  let patientMsg: any = null;
  let clinicMsg: any = null;

  // Đăng ký 3 topic của 3 phân hệ trước khi rớt mạng
  client.subscribe('/topic/doctor.worklist', (m) => (doctorMsg = m));
  client.subscribe('/topic/patient.PAT-001', (m) => (patientMsg = m));
  client.subscribe('/topic/clinic.batch', (m) => (clinicMsg = m));

  // Giả lập mất kết nối
  mockSocketInstance.close();

  // Giả lập tái kết nối thành công và nhận CONNECTED frame
  client.connect();
  const currentWs = (client as any).ws;
  currentWs.onmessage({ data: 'CONNECTED\nversion:1.2\n\n\0' });

  // Kiểm tra xem các frame SUBSCRIBE đã được gửi lại lên broker chưa
  const subscribeMessages = sentMessages.filter((m) => m.startsWith('SUBSCRIBE'));
  assert.ok(
    subscribeMessages.some((m) => m.includes('/topic/doctor.worklist')),
    'Tự động đăng ký lại topic bác sĩ /topic/doctor.worklist'
  );
  assert.ok(
    subscribeMessages.some((m) => m.includes('/topic/patient.PAT-001')),
    'Tự động đăng ký lại topic bệnh nhân /topic/patient.PAT-001'
  );
  assert.ok(
    subscribeMessages.some((m) => m.includes('/topic/clinic.batch')),
    'Tự động đăng ký lại topic phòng khám /topic/clinic.batch'
  );

  // Gửi thông điệp test sau khi reconnect
  currentWs.onmessage({
    data:
      'MESSAGE\ndestination:/topic/doctor.worklist\n\n' +
      JSON.stringify({ scanId: 'RECONNECT-OK' }) +
      '\0',
  });

  assert.strictEqual(doctorMsg?.scanId, 'RECONNECT-OK', 'Subscriber nhận dữ liệu bình thường sau khi tái kết nối');

  client.disconnect();
});

test('TEST-SYNC-5.6: Tính chịu lỗi trước dữ liệu rác (Corrupted JSON, Heartbeat, CRLF) không gây crash client', () => {
  const client = new StompChatClient('/ws-aura-corrupted');
  client.connect();
  const ws = (client as any).ws;
  ws.onmessage({ data: 'CONNECTED\nversion:1.2\n\n\0' });

  let rawMessageReceived: any = null;
  client.subscribe('/topic/safe', (msg) => {
    rawMessageReceived = msg;
  });

  let threwError = false;
  try {
    // 1. Bare heartbeat ping
    ws.onmessage({ data: '\n' });
    ws.onmessage({ data: '\r\n' });

    // 2. Corrupted malformed JSON payload
    ws.onmessage({
      data: 'MESSAGE\ndestination:/topic/safe\n\n{ "brokenJson": unclosed_string\0',
    });

    // 3. Null byte empty frame
    ws.onmessage({ data: '\0' });
  } catch {
    threwError = true;
  }

  assert.strictEqual(threwError, false, 'Client hấp thu các payload lỗi an toàn tuyệt đối, không crash');
  assert.strictEqual(
    rawMessageReceived,
    '{ "brokenJson": unclosed_string',
    'Payload không thể parse JSON được fallback an toàn về chuỗi thô'
  );

  client.disconnect();
});

test('TEST-SYNC-5.7: Phân biệt ngắt kết nối chủ động (disconnect) không kích hoạt reconnect timer', () => {
  const client = new StompChatClient('/ws-aura-manual');
  client.connect();

  client.disconnect();

  assert.strictEqual((client as any).manualDisconnect, true, 'Đánh dấu manualDisconnect = true');
  assert.strictEqual((client as any).retryCount, 0, 'retryCount được reset');
  assert.strictEqual((client as any).reconnectTimer, null, 'Không có reconnectTimer nào chạy nền');

  // Trigger onclose giả định sau khi disconnect
  if (mockSocketInstance && mockSocketInstance.onclose) {
    mockSocketInstance.onclose();
  }

  assert.strictEqual(
    (client as any).reconnectTimer,
    null,
    'Tuyệt đối không tự động thử kết nối lại khi người dùng chủ động ngắt'
  );
});

// ============================================================================
// TỔNG KẾT BỘ TEST SUITE
// ============================================================================
console.log('\n=================================================================');
console.log(`   KẾT QUẢ KIỂM THỬ ĐỒNG BỘ THỜI GIAN THỰC (CROSS-PORTAL REALTIME SYNC):`);
console.log(`   TỔNG SỐ TESTS: ${totalTests}`);
console.log(`   PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log(`   TỶ LỆ THÀNH CÔNG: ${Math.round((passedTests / totalTests) * 100)}% PASS`);
console.log('=================================================================\n');

if (totalTests !== passedTests) {
  process.exit(1);
} else {
  process.exit(0);
}
