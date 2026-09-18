import assert from 'node:assert';
import {
  eventBus,
  eventBusService,
  EventBusService,
  type ScanUploadedPayload,
  type ResultReviewedPayload,
  type BatchStatusChangedPayload,
  type NotificationNewPayload,
  type UserStatusChangedPayload,
  type DoctorAssignedPayload,
} from '../services/eventBusService';
import { realtimeBus } from '../services/realtimeService';

console.log('=================================================================');
console.log('   AURA EVENT BUS & DATA SYNC VERIFICATION SUITE');
console.log('=================================================================');

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
  } catch (err: any) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    process.exit(1);
  }
}

// 1. Singleton pattern verification
runTest('EB-1.1: EventBusService adheres to Singleton pattern', () => {
  const instance1 = EventBusService.getInstance();
  const instance2 = EventBusService.getInstance();
  assert.strictEqual(instance1, instance2, 'getInstance() must always return the same instance');
  assert.strictEqual(eventBus, instance1, 'eventBus export must match getInstance()');
  assert.strictEqual(eventBusService, instance1, 'eventBusService alias must match getInstance()');
});

// 2. Pub/sub methods verification for all 6 standard event types
runTest('EB-1.2: SCAN_UPLOADED subscribe, publish, and payload verification', () => {
  let received: ScanUploadedPayload | null = null;
  const unsub = eventBus.subscribe('SCAN_UPLOADED', (payload) => {
    received = payload;
  });

  const testPayload: ScanUploadedPayload = {
    scanId: 'SCAN-2026-001',
    patientId: 'PAT-888',
    patientName: 'Nguyễn Văn A',
    imageUrl: 'https://aura.med/scan.jpg',
    uploadedAt: Date.now(),
  };

  eventBus.publish('SCAN_UPLOADED', testPayload);
  assert.deepStrictEqual(received, testPayload, 'Payload received by subscriber matches published');

  // Test unsubscribe
  received = null;
  unsub();
  eventBus.publish('SCAN_UPLOADED', testPayload);
  assert.strictEqual(received, null, 'Unsubscribed callback must not be invoked');
});

runTest('EB-1.3: RESULT_REVIEWED subscribe, publish, and unsubscribe method', () => {
  let received: ResultReviewedPayload | null = null;
  const handler = (payload: ResultReviewedPayload) => {
    received = payload;
  };

  eventBus.subscribe('RESULT_REVIEWED', handler);

  const testPayload: ResultReviewedPayload = {
    screeningId: 'SCR-999',
    doctorId: 'DOC-007',
    doctorName: 'BS. Trần Thị B',
    status: 'APPROVED',
    notes: 'Võng mạc bình thường, không có dấu hiệu phình vi mạch',
    agreesWithAi: true,
  };

  eventBus.publish('RESULT_REVIEWED', testPayload);
  assert.deepStrictEqual(received, testPayload);

  // Test eventBus.unsubscribe directly
  received = null;
  eventBus.unsubscribe('RESULT_REVIEWED', handler);
  eventBus.publish('RESULT_REVIEWED', testPayload);
  assert.strictEqual(received, null);
});

runTest('EB-1.4: BATCH_STATUS_CHANGED subscribe and publish', () => {
  let received: BatchStatusChangedPayload | null = null;
  const unsub = eventBus.subscribe('BATCH_STATUS_CHANGED', (payload) => {
    received = payload;
  });

  const testPayload: BatchStatusChangedPayload = {
    batchId: 'BATCH-555',
    status: 'COMPLETED',
    processedCount: 20,
    totalCount: 20,
    progress: 100,
  };

  eventBus.publish('BATCH_STATUS_CHANGED', testPayload);
  assert.deepStrictEqual(received, testPayload);
  unsub();
});

runTest('EB-1.5: NOTIFICATION_NEW subscribe and publish', () => {
  let received: NotificationNewPayload | null = null;
  const unsub = eventBus.subscribe('NOTIFICATION_NEW', (payload) => {
    received = payload;
  });

  const testPayload: NotificationNewPayload = {
    id: 'NOTIF-123',
    title: 'Kết quả mới',
    message: 'Ảnh đáy mắt đã được phân tích thành công',
    type: 'success',
  };

  eventBus.publish('NOTIFICATION_NEW', testPayload);
  assert.deepStrictEqual(received, testPayload);
  unsub();
});

runTest('EB-1.6: USER_STATUS_CHANGED subscribe and publish', () => {
  let received: UserStatusChangedPayload | null = null;
  const unsub = eventBus.subscribe('USER_STATUS_CHANGED', (payload) => {
    received = payload;
  });

  const testPayload: UserStatusChangedPayload = {
    userId: 'USER-101',
    status: 'ONLINE',
    role: 'doctor',
  };

  eventBus.publish('USER_STATUS_CHANGED', testPayload);
  assert.deepStrictEqual(received, testPayload);
  unsub();
});

runTest('EB-1.7: DOCTOR_ASSIGNED subscribe and publish', () => {
  let received: DoctorAssignedPayload | null = null;
  const unsub = eventBus.subscribe('DOCTOR_ASSIGNED', (payload) => {
    received = payload;
  });

  const testPayload: DoctorAssignedPayload = {
    screeningId: 'SCR-333',
    doctorId: 'DOC-501',
    doctorName: 'BS. Hoàng Nam',
  };

  eventBus.publish('DOCTOR_ASSIGNED', testPayload);
  assert.deepStrictEqual(received, testPayload);
  unsub();
});

// 3. Integration with realtimeService
runTest('EB-2.1: Realtime incoming payload (WebSocket) triggers EventBus dispatch', () => {
  let receivedFromWs: ScanUploadedPayload | null = null;
  const unsub = eventBus.subscribe('SCAN_UPLOADED', (payload) => {
    receivedFromWs = payload;
  });

  // Simulate WebSocket payload via realtimeBus
  realtimeBus.handleIncomingPayload(
    {
      eventType: 'SCREENING_CREATED',
      data: {
        id: 'SCR-WS-001',
        patientId: 'PAT-999',
        imageUrl: 'https://aura.med/ws.jpg',
      },
    },
    'websocket'
  );

  assert.ok(receivedFromWs !== null, 'EventBus must receive event mapped from realtimeBus');
  const wsPayload: any = receivedFromWs;
  assert.strictEqual(wsPayload.scanId, 'SCR-WS-001');
  assert.strictEqual(wsPayload.patientId, 'PAT-999');
  unsub();
});

runTest('EB-2.2: Realtime DOCTOR_REVIEWED maps to RESULT_REVIEWED on EventBus', () => {
  let receivedReview: ResultReviewedPayload | null = null;
  const unsub = eventBus.subscribe('RESULT_REVIEWED', (payload) => {
    receivedReview = payload;
  });

  realtimeBus.handleIncomingPayload(
    {
      eventType: 'DOCTOR_REVIEWED',
      data: {
        screeningId: 'SCR-REV-100',
        doctorId: 'DOC-404',
        doctorName: 'BS. Lê Minh',
        status: 'REVIEWED',
      },
    },
    'websocket'
  );

  assert.ok(receivedReview !== null);
  const revPayload: any = receivedReview;
  assert.strictEqual(revPayload.screeningId, 'SCR-REV-100');
  assert.strictEqual(revPayload.doctorId, 'DOC-404');
  unsub();
});

runTest('EB-2.3: Realtime BATCH_PROGRESS maps to BATCH_STATUS_CHANGED on EventBus', () => {
  let receivedBatch: BatchStatusChangedPayload | null = null;
  const unsub = eventBus.subscribe('BATCH_STATUS_CHANGED', (payload) => {
    receivedBatch = payload;
  });

  realtimeBus.handleIncomingPayload(
    {
      eventType: 'BATCH_PROGRESS',
      data: {
        batchId: 'BATCH-RT-1',
        processedCount: 15,
        totalCount: 30,
        progress: 50,
      },
    },
    'websocket'
  );

  assert.ok(receivedBatch !== null);
  const batchPayload: any = receivedBatch;
  assert.strictEqual(batchPayload.batchId, 'BATCH-RT-1');
  assert.strictEqual(batchPayload.progress, 50);
  unsub();
});

// 4. Wildcard listener verification
runTest('EB-3.1: Wildcard "*" subscriber receives all dispatched events', () => {
  const eventsCaught: string[] = [];
  const unsub = eventBus.subscribe('*', (event: any) => {
    eventsCaught.push(event.eventType);
  });

  eventBus.publish('NOTIFICATION_NEW', { message: 'Alert 1' });
  eventBus.publish('USER_STATUS_CHANGED', { userId: 'U1', status: 'OFFLINE' });

  assert.ok(eventsCaught.includes('NOTIFICATION_NEW'));
  assert.ok(eventsCaught.includes('USER_STATUS_CHANGED'));
  unsub();
});

console.log('\n=================================================================');
console.log('   KẾT QUẢ KIỂM THỬ: 11/11 TESTS ĐÃ ĐẠT (100% PASS)');
console.log('=================================================================');
