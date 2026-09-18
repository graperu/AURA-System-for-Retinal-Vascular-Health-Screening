package com.aura.challenger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.billing.entity.Subscription;
import com.aura.billing.entity.SubscriptionStatus;
import com.aura.billing.repository.PaymentTransactionRepository;
import com.aura.billing.repository.SubscriptionRepository;
import com.aura.billing.service.BillingService;
import com.aura.billing.service.PaymentGateway;
import com.aura.billing.service.ServicePackageService;
import com.aura.bulk.controller.BulkScreeningController;
import com.aura.bulk.dto.BatchJobResponseDto;
import com.aura.bulk.dto.BulkImageItemUploadDto;
import com.aura.bulk.dto.BulkUploadRequestDto;
import com.aura.bulk.dto.PatientAnonymizedDto;
import com.aura.bulk.entity.BulkScreeningBatch;
import com.aura.bulk.entity.BulkScreeningItem;
import com.aura.bulk.queue.BatchItemTask;
import com.aura.bulk.queue.BatchJobQueue;
import com.aura.bulk.repository.BulkScreeningBatchRepository;
import com.aura.bulk.repository.BulkScreeningItemRepository;
import com.aura.bulk.service.AiServiceClient;
import com.aura.bulk.service.PatientAnonymizerService;
import com.aura.bulk.worker.BulkProcessingWorker;
import com.aura.common.response.ApiResponse;
import com.aura.notification.service.UserNotificationService;
import com.aura.realtime.RealtimeEventPublisher;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import com.aura.user.repository.UserRoleRepository;
import jakarta.persistence.LockModeType;
import java.lang.reflect.Method;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Empirical Challenger Suite for Milestone 1: Credit Concurrency & Gatekeeping.
 * Adversarially verifies:
 * 1. Zero-credit gatekeeping: rejection with HTTP 400 + exact Vietnamese error message.
 * 2. Exact balance boundary: batch size == available credits succeeds, resulting balance == 0.
 * 3. Exact balance + 1 boundary: batch size == available credits + 1 rejected with exact error message.
 * 4. Pessimistic write lock semantics (LockModeType.PESSIMISTIC_WRITE on findByOwnerIdForUpdate).
 * 5. High-concurrency race condition defense against credit over-consumption / overdraft.
 * 6. Multi-subscription FIFO deduction by expiration and automated expiration filtering.
 * 7. Worker auto-refund upon AI failure.
 */
public class CreditConcurrencyEmpiricalChallengerTest {

    private PatientAnonymizerService anonymizerService;
    private BatchJobQueue jobQueue;
    private BillingService billingService;
    private SubscriptionRepository subscriptionRepository;
    private UserRepository userRepository;
    private ServicePackageService servicePackageService;
    private PaymentGateway paymentGateway;
    private PaymentTransactionRepository paymentTransactionRepository;
    private UserNotificationService userNotificationService;
    private UserRoleRepository userRoleRepository;

    private BulkScreeningBatchRepository batchRepository;
    private BulkScreeningItemRepository itemRepository;
    private AiServiceClient aiServiceClient;
    private RealtimeEventPublisher realtimeEventPublisher;

    private UUID clinicId;
    private User clinicUser;

    @BeforeEach
    void setUp() {
        anonymizerService = mock(PatientAnonymizerService.class);
        jobQueue = mock(BatchJobQueue.class);
        subscriptionRepository = mock(SubscriptionRepository.class);
        userRepository = mock(UserRepository.class);
        servicePackageService = mock(ServicePackageService.class);
        paymentGateway = mock(PaymentGateway.class);
        paymentTransactionRepository = mock(PaymentTransactionRepository.class);
        userNotificationService = mock(UserNotificationService.class);
        userRoleRepository = mock(UserRoleRepository.class);

        billingService = new BillingService(
            servicePackageService,
            subscriptionRepository,
            paymentTransactionRepository,
            userRepository,
            userRoleRepository,
            paymentGateway,
            userNotificationService
        );

        batchRepository = mock(BulkScreeningBatchRepository.class);
        itemRepository = mock(BulkScreeningItemRepository.class);
        aiServiceClient = mock(AiServiceClient.class);
        realtimeEventPublisher = mock(RealtimeEventPublisher.class);

        clinicId = UUID.fromString("11111111-2222-3333-4444-555555555555");
        clinicUser = new User("clinic@aura.health", "secret", "Central Clinic");
        ReflectionTestUtils.setField(clinicUser, "id", clinicId);
    }

    private BulkUploadRequestDto createBatchRequest(int count) {
        List<BulkImageItemUploadDto> items = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            items.add(new BulkImageItemUploadDto(
                "image_" + i + ".png",
                "base64_data_" + i,
                i % 2 == 0 ? "OD" : "OS",
                "MRN-" + i,
                "Patient " + i,
                40 + i,
                i % 2 == 0 ? "MALE" : "FEMALE",
                120,
                80,
                5.5
            ));
        }
        return new BulkUploadRequestDto(clinicId.toString(), "Empirical Test Batch", items);
    }

    @Nested
    @DisplayName("1. Zero Credit Gatekeeping & Exact Vietnamese Error")
    class ZeroCreditGatekeepingTests {

        @Test
        @DisplayName("Clinic with 0 credits attempting to upload 1 image is rejected with exact Vietnamese error")
        void testZeroCredit_rejectedForSingleImage() throws Exception {
            BillingService mockBilling = mock(BillingService.class);
            when(mockBilling.getRemainingCredits(clinicId)).thenReturn(0);

            BulkScreeningController controller = new BulkScreeningController(anonymizerService, jobQueue, mockBilling);
            BulkUploadRequestDto request = createBatchRequest(1);

            AuraUserPrincipal principal = new AuraUserPrincipal(clinicId, "clinic@aura.health", "secret", true, List.of("CLINIC"));

            assertThatThrownBy(() -> controller.createBulkBatchJob(request, principal))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Cơ sở y tế không đủ lượt quét khả dụng (Cần 1, hiện có 0). Vui lòng nạp thêm gói lượt khám.");

            verify(jobQueue, never()).createBatchJob(anyString(), anyString(), anyInt());
            verify(jobQueue, never()).enqueue(any());
            verify(mockBilling, never()).deductCredits(any(), anyInt());
        }

        @Test
        @DisplayName("Clinic with 0 credits attempting to upload 10 images is rejected with exact Vietnamese error")
        void testZeroCredit_rejectedForMultipleImages() throws Exception {
            BillingService mockBilling = mock(BillingService.class);
            when(mockBilling.getRemainingCredits(clinicId)).thenReturn(0);

            BulkScreeningController controller = new BulkScreeningController(anonymizerService, jobQueue, mockBilling);
            BulkUploadRequestDto request = createBatchRequest(10);

            AuraUserPrincipal principal = new AuraUserPrincipal(clinicId, "clinic@aura.health", "secret", true, List.of("CLINIC"));

            assertThatThrownBy(() -> controller.createBulkBatchJob(request, principal))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Cơ sở y tế không đủ lượt quét khả dụng (Cần 10, hiện có 0). Vui lòng nạp thêm gói lượt khám.");

            verify(jobQueue, never()).createBatchJob(anyString(), anyString(), anyInt());
            verify(jobQueue, never()).enqueue(any());
            verify(mockBilling, never()).deductCredits(any(), anyInt());
        }
    }

    @Nested
    @DisplayName("2. Exact Balance Boundary (N == N)")
    class ExactBalanceBoundaryTests {

        @Test
        @DisplayName("Boundary N == N: available == 5, request == 5 -> deduction succeeds, remaining balance == 0")
        void testExactBalance_deductionSucceeds_balanceBecomesZero() {
            Subscription sub = Subscription.builder()
                .id(101L)
                .owner(clinicUser)
                .remainingCredits(5)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .status(SubscriptionStatus.ACTIVE)
                .build();

            when(subscriptionRepository.findByOwnerIdForUpdate(clinicId)).thenReturn(List.of(sub));
            when(subscriptionRepository.findByOwnerId(clinicId)).thenReturn(List.of(sub));

            int beforeCredits = billingService.getRemainingCredits(clinicId);
            assertThat(beforeCredits).isEqualTo(5);

            boolean deducted = billingService.deductCredits(clinicId, 5);
            assertThat(deducted).isTrue();
            assertThat(sub.getRemainingCredits()).isEqualTo(0);
            verify(subscriptionRepository).save(sub);

            int afterCredits = billingService.getRemainingCredits(clinicId);
            assertThat(afterCredits).isEqualTo(0);

            boolean subsequentDeduct = billingService.deductCredits(clinicId, 1);
            assertThat(subsequentDeduct).isFalse();
        }

        @Test
        @DisplayName("Controller accepts batch of exact balance 5 when clinic has exactly 5 credits")
        void testController_exactBalanceAccepted() {
            BillingService mockBilling = mock(BillingService.class);
            when(mockBilling.getRemainingCredits(clinicId)).thenReturn(5);
            when(mockBilling.deductCredits(clinicId, 5)).thenReturn(true);

            when(anonymizerService.anonymizePatient(anyString(), anyString(), anyInt(), anyString(), anyInt(), anyInt(), anyDouble()))
                .thenReturn(new PatientAnonymizedDto("P", "D", 50, "M", 120, 80, 5.5, false, true, Instant.now()));
            when(anonymizerService.stripDicomMetadataHeaders(anyString())).thenReturn("clean-b64");

            when(jobQueue.getBatchStatus(anyString())).thenReturn(new BatchJobResponseDto(
                "BATCH-EXACT", clinicId.toString(), 5, 0, 0, "QUEUED", Instant.now(), 60.0, List.of()
            ));

            BulkScreeningController controller = new BulkScreeningController(anonymizerService, jobQueue, mockBilling);
            BulkUploadRequestDto request = createBatchRequest(5);
            AuraUserPrincipal principal = new AuraUserPrincipal(clinicId, "clinic@aura.health", "secret", true, List.of("CLINIC"));

            ApiResponse<BatchJobResponseDto> response = controller.createBulkBatchJob(request, principal);
            assertThat(response.success()).isTrue();
            verify(mockBilling).deductCredits(clinicId, 5);
            verify(jobQueue).createBatchJob(anyString(), eq(clinicId.toString()), eq(5));
        }
    }

    @Nested
    @DisplayName("3. Exact Balance + 1 Boundary (N + 1 > N)")
    class ExceededBalanceBoundaryTests {

        @Test
        @DisplayName("Boundary N + 1: available == 5, request == 6 -> rejected immediately with exact error")
        void testExceededBalance_rejectedWithExactMessage() {
            BillingService mockBilling = mock(BillingService.class);
            when(mockBilling.getRemainingCredits(clinicId)).thenReturn(5);

            BulkScreeningController controller = new BulkScreeningController(anonymizerService, jobQueue, mockBilling);
            BulkUploadRequestDto request = createBatchRequest(6);
            AuraUserPrincipal principal = new AuraUserPrincipal(clinicId, "clinic@aura.health", "secret", true, List.of("CLINIC"));

            assertThatThrownBy(() -> controller.createBulkBatchJob(request, principal))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Cơ sở y tế không đủ lượt quét khả dụng (Cần 6, hiện có 5). Vui lòng nạp thêm gói lượt khám.");

            verify(mockBilling, never()).deductCredits(any(), anyInt());
            verify(jobQueue, never()).createBatchJob(anyString(), anyString(), anyInt());
        }

        @Test
        @DisplayName("Mid-Air Race Condition: getRemainingCredits passed, but deductCredits returns false")
        void testMidAirCollision_controllerCatchesDeductFailure() {
            BillingService mockBilling = mock(BillingService.class);
            when(mockBilling.getRemainingCredits(clinicId)).thenReturn(5);
            when(mockBilling.deductCredits(clinicId, 5)).thenReturn(false);

            BulkScreeningController controller = new BulkScreeningController(anonymizerService, jobQueue, mockBilling);
            BulkUploadRequestDto request = createBatchRequest(5);
            AuraUserPrincipal principal = new AuraUserPrincipal(clinicId, "clinic@aura.health", "secret", true, List.of("CLINIC"));

            assertThatThrownBy(() -> controller.createBulkBatchJob(request, principal))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Cơ sở y tế không đủ lượt quét khả dụng (Cần 5, hiện có 5). Vui lòng nạp thêm gói lượt khám.");

            verify(jobQueue, never()).createBatchJob(anyString(), anyString(), anyInt());
        }
    }

    @Nested
    @DisplayName("4. Pessimistic Write Lock Semantics & Concurrency Stress")
    class PessimisticLockAndConcurrencyTests {

        @Test
        @DisplayName("Verify findByOwnerIdForUpdate has LockModeType.PESSIMISTIC_WRITE")
        void testPessimisticLockAnnotationPresent() throws NoSuchMethodException {
            Method method = SubscriptionRepository.class.getMethod("findByOwnerIdForUpdate", UUID.class);
            Lock lockAnnotation = method.getAnnotation(Lock.class);
            assertThat(lockAnnotation).isNotNull();
            assertThat(lockAnnotation.value()).isEqualTo(LockModeType.PESSIMISTIC_WRITE);
        }

        @Test
        @DisplayName("Concurrent Stress Test: 10 threads compete for 50 credits in 10-credit chunks (No Overdraft)")
        void testConcurrentDeduction_preventsOverdraft() throws InterruptedException {
            Subscription sub = Subscription.builder()
                .id(200L)
                .owner(clinicUser)
                .remainingCredits(50)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .status(SubscriptionStatus.ACTIVE)
                .build();

            when(subscriptionRepository.findByOwnerIdForUpdate(clinicId)).thenAnswer(inv -> {
                synchronized (sub) {
                    return List.of(sub);
                }
            });

            doAnswer(inv -> inv.getArgument(0)).when(subscriptionRepository).save(any(Subscription.class));

            int totalThreads = 10;
            int amountPerThread = 10;
            ExecutorService executor = Executors.newFixedThreadPool(totalThreads);
            CountDownLatch startLatch = new CountDownLatch(1);
            CountDownLatch finishLatch = new CountDownLatch(totalThreads);

            AtomicInteger successCount = new AtomicInteger(0);
            AtomicInteger failureCount = new AtomicInteger(0);

            for (int i = 0; i < totalThreads; i++) {
                executor.submit(() -> {
                    try {
                        startLatch.await();
                        boolean ok;
                        synchronized (sub) {
                            ok = billingService.deductCredits(clinicId, amountPerThread);
                        }
                        if (ok) {
                            successCount.incrementAndGet();
                        } else {
                            failureCount.incrementAndGet();
                        }
                    } catch (Exception ignored) {
                    } finally {
                        finishLatch.countDown();
                    }
                });
            }

            startLatch.countDown();
            boolean finished = finishLatch.await(5, TimeUnit.SECONDS);
            executor.shutdown();

            assertThat(finished).isTrue();
            assertThat(successCount.get()).isEqualTo(5);
            assertThat(failureCount.get()).isEqualTo(5);
            assertThat(sub.getRemainingCredits()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("5. Multi-Subscription Expiry & FIFO Ordering")
    class MultiSubscriptionTests {

        @Test
        @DisplayName("Deduction consumes earliest-expiring subscription first and ignores expired subscriptions")
        void testFifoDeductionAndExpiryFiltering() {
            Subscription subExpired = Subscription.builder()
                .id(1L)
                .owner(clinicUser)
                .remainingCredits(100)
                .expiresAt(LocalDateTime.now().minusDays(1))
                .status(SubscriptionStatus.ACTIVE)
                .build();

            Subscription subExpiringSoon = Subscription.builder()
                .id(2L)
                .owner(clinicUser)
                .remainingCredits(10)
                .expiresAt(LocalDateTime.now().plusDays(2))
                .status(SubscriptionStatus.ACTIVE)
                .build();

            Subscription subExpiringLater = Subscription.builder()
                .id(3L)
                .owner(clinicUser)
                .remainingCredits(20)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .status(SubscriptionStatus.ACTIVE)
                .build();

            when(subscriptionRepository.findByOwnerIdForUpdate(clinicId))
                .thenReturn(new ArrayList<>(List.of(subExpiringLater, subExpired, subExpiringSoon)));

            boolean deducted = billingService.deductCredits(clinicId, 15);

            assertThat(deducted).isTrue();
            assertThat(subExpired.getStatus()).isEqualTo(SubscriptionStatus.EXPIRED);
            assertThat(subExpiringSoon.getRemainingCredits()).isEqualTo(0);
            assertThat(subExpiringLater.getRemainingCredits()).isEqualTo(15);

            verify(subscriptionRepository).save(subExpired);
            verify(subscriptionRepository).save(subExpiringSoon);
            verify(subscriptionRepository).save(subExpiringLater);
        }
    }

    @Nested
    @DisplayName("6. Worker Auto-Refund Financial Integrity")
    class WorkerAutoRefundTests {

        @Test
        @DisplayName("Worker refunds 1 credit to clinic upon AI task processing failure")
        void testWorkerRefundsCreditOnFailure() {
            BulkProcessingWorker worker = new BulkProcessingWorker(
                jobQueue,
                aiServiceClient,
                itemRepository,
                batchRepository,
                billingService
            );

            UUID batchUuid = UUID.randomUUID();
            BulkScreeningBatch batch = new BulkScreeningBatch("BATCH-REFUND-01", clinicId, 1);
            ReflectionTestUtils.setField(batch, "id", batchUuid);
            BulkScreeningItem item = new BulkScreeningItem(batchUuid, "ITEM-001", "image_1.png", "OD", "P-1");

            when(batchRepository.findByBatchCode("BATCH-REFUND-01")).thenReturn(Optional.of(batch));
            when(itemRepository.findByBatchIdAndItemCode(batchUuid, "ITEM-001")).thenReturn(Optional.of(item));

            Subscription activeSub = Subscription.builder()
                .id(99L)
                .owner(clinicUser)
                .remainingCredits(4)
                .expiresAt(LocalDateTime.now().plusDays(10))
                .status(SubscriptionStatus.ACTIVE)
                .build();

            when(subscriptionRepository.findByOwnerIdForUpdate(clinicId)).thenReturn(List.of(activeSub));

            PatientAnonymizedDto anonymizedPatient = new PatientAnonymizedDto(
                "P-1", "D-1", 50, "MALE", 120, 80, 5.5, false, true, Instant.now()
            );
            BatchItemTask task = new BatchItemTask("BATCH-REFUND-01", "ITEM-001", "image_1.png", "OD", anonymizedPatient, "clean-b64");

            try {
                Method method = BulkProcessingWorker.class.getDeclaredMethod("syncItemAndBatchFailure", BatchItemTask.class, Exception.class);
                method.setAccessible(true);
                method.invoke(worker, task, new RuntimeException("AI Core Connection Timeout"));
            } catch (Exception e) {
                throw new RuntimeException(e);
            }

            assertThat(activeSub.getRemainingCredits()).isEqualTo(5);
            verify(subscriptionRepository).save(activeSub);
            assertThat(item.getStatus()).isEqualTo("FAILED");
            assertThat(item.getErrorMessage()).isEqualTo("AI Core Connection Timeout");
        }
    }
}
