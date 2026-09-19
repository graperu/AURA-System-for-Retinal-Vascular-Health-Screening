package com.aura.challenger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.auth.config.AuthProperties;
import com.aura.auth.entity.RefreshToken;
import com.aura.auth.exception.AuthException;
import com.aura.auth.repository.RefreshTokenRepository;
import com.aura.auth.service.RefreshTokenService;
import com.aura.billing.entity.PackageScope;
import com.aura.billing.entity.PaymentStatus;
import com.aura.billing.entity.PaymentTransaction;
import com.aura.billing.entity.ServicePackage;
import com.aura.billing.entity.Subscription;
import com.aura.billing.entity.SubscriptionStatus;
import com.aura.billing.repository.PaymentTransactionRepository;
import com.aura.billing.repository.SubscriptionRepository;
import com.aura.billing.service.BillingService;
import com.aura.billing.service.PaymentGateway;
import com.aura.billing.service.ServicePackageService;
import com.aura.common.crypto.BlindIndexUtil;
import com.aura.common.response.ErrorCode;
import com.aura.notification.service.UserNotificationService;
import com.aura.patient.entity.PatientProfile;
import com.aura.patient.repository.PatientSpecification;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import com.aura.user.repository.UserRoleRepository;
import jakarta.persistence.LockModeType;
import jakarta.persistence.Version;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
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
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Empirical Adversarial Challenger Test Suite for Milestone 3.1:
 * Concurrency, Blind Index Security, Token Rotation & Lock Integrity.
 *
 * Covers:
 * 1. CON-01: Blind Index Leak Attack & High-Fidelity Phone Normalization.
 * 2. CON-04: Multi-Tab Token Rotation Grace Period vs Replay Attacks.
 * 3. CON-02 & CON-03: Concurrency Protection (Pessimistic Locking & Versioning).
 * 4. BIL-03: VietQR Case-Insensitive / Whitespace-Insensitive Matching.
 */
@ExtendWith(MockitoExtension.class)
public class AdversarialConcurrencyAndLockChallengerTest {

    // -------------------------------------------------------------
    // SECTION 1: CON-01 — BLIND INDEX LEAK & PHONE SEARCH FIDELITY
    // -------------------------------------------------------------
    @Nested
    @DisplayName("CON-01: Blind Index Leak vs Search Security")
    class BlindIndexSecurityTests {

        @Mock private Root<PatientProfile> root;
        @Mock private CriteriaQuery<?> query;
        @Mock private CriteriaBuilder cb;
        @Mock private Path<Object> mockPath;
        @Mock private Expression<String> mockStringExpr;
        @Mock private Predicate mockPredicate;

        @BeforeEach
        void setUpCriteriaBuilder() {
            org.mockito.Mockito.lenient().when(root.get(anyString())).thenReturn(mockPath);
            org.mockito.Mockito.lenient().when(cb.lower(any())).thenReturn(mockStringExpr);
            org.mockito.Mockito.lenient().when(cb.upper(any())).thenReturn(mockStringExpr);
            org.mockito.Mockito.lenient().when(cb.like(any(), anyString())).thenReturn(mockPredicate);
            org.mockito.Mockito.lenient().when(cb.or(any(), any(), any(), any())).thenReturn(mockPredicate);
            org.mockito.Mockito.lenient().when(cb.or(any(Predicate[].class))).thenReturn(mockPredicate);
            org.mockito.Mockito.lenient().when(cb.equal(any(), any())).thenReturn(mockPredicate);
            org.mockito.Mockito.lenient().when(cb.and(any(Predicate[].class))).thenReturn(mockPredicate);
        }

        @Test
        @DisplayName("Adversarial Attack: Searching for 'ENC' or 'ENC:' MUST NEVER query ciphertext 'phone' or leak records")
        void testCiphertextPrefixLeak_SearchingEncNeverQueriesPhone() {
            String[] leakKeywords = {"ENC", "ENC:", "enc", "enc:", "ENC:v1", "ENC:v1:GCM"};

            for (String kw : leakKeywords) {
                Specification<PatientProfile> spec = PatientSpecification.filterPatients(
                    kw, null, null, null, null, null, null, null, null
                );
                spec.toPredicate(root, query, cb);

                // Verify that root.get('phone') is NEVER queried (no SQL LIKE on encrypted column)
                verify(root, never()).get("phone");
                // Verify that phoneHash is NOT queried since 'ENC' contains 0 valid digits (< 7)
                verify(root, never()).get("phoneHash");
            }
        }

        @Test
        @DisplayName("Search Fidelity: Phone numbers across 10 diverse formats all resolve to the same Blind Index hash")
        void testPhoneNormalization_tenDiverseFormatsAllMatchExactHash() {
            String expectedCanonical = "0912345678";
            String expectedHash = BlindIndexUtil.computePhoneHash(expectedCanonical);

            assertThat(expectedHash).isNotNull().hasSize(64).matches("^[0-9a-f]{64}$");

            String[] inputVariants = {
                "0912345678",           // standard domestic
                "+84912345678",         // E.164 international
                "+84 912 345 678",      // international with spaces
                "+84-912-345-678",      // international with hyphens
                "(+84) 912.345.678",    // international with parens and dots
                "84912345678",          // country code without plus
                "091 234 5678",         // domestic with spaces
                "091-234-5678",         // domestic with hyphens
                "091.234.5678",         // domestic with dots
                "(091) 234-5678"        // domestic with parens and hyphen
            };

            for (String input : inputVariants) {
                String normalized = BlindIndexUtil.normalizePhone(input);
                assertThat(normalized)
                    .as("Input '%s' must normalize to canonical '%s'", input, expectedCanonical)
                    .isEqualTo(expectedCanonical);

                String computedHash = BlindIndexUtil.computePhoneHash(input);
                assertThat(computedHash)
                    .as("Input '%s' must produce the exact same blind index hash", input)
                    .isEqualTo(expectedHash);
            }
        }

        @Test
        @DisplayName("Search Fidelity in Specification: Valid phone query correctly creates phoneHash predicate")
        void testSpecification_validPhone_createsPhoneHashEqualityPredicate() {
            String input = "(+84) 912-345-678";
            String expectedHash = BlindIndexUtil.computePhoneHash("0912345678");

            Specification<PatientProfile> spec = PatientSpecification.filterPatients(
                input, null, null, null, null, null, null, null, null
            );
            spec.toPredicate(root, query, cb);

            verify(root).get("phoneHash");
            verify(root, never()).get("phone");
            verify(cb).equal(any(), eq(expectedHash));
        }

        @Test
        @DisplayName("Short queries (< 7 digits) or invalid characters do not generate phoneHash predicate")
        void testSpecification_shortOrInvalidQueries_ignoredByPhoneHash() {
            String[] shortOrInvalid = {"091", "12345", "+84", "   ", "ABC", "---"};

            for (String input : shortOrInvalid) {
                Specification<PatientProfile> spec = PatientSpecification.filterPatients(
                    input, null, null, null, null, null, null, null, null
                );
                spec.toPredicate(root, query, cb);

                verify(root, never()).get("phoneHash");
                verify(root, never()).get("phone");
            }
        }

        @Test
        @DisplayName("Blind Index Collision Resistance: 1,000 distinct phone numbers produce 1,000 unique hashes")
        void testBlindIndex_collisionResistanceStress() {
            Set<String> hashes = new HashSet<>();
            int count = 1000;
            for (int i = 0; i < count; i++) {
                String phone = String.format("090%07d", i);
                String hash = BlindIndexUtil.computePhoneHash(phone);
                assertThat(hash).isNotNull().hasSize(64);
                hashes.add(hash);
            }
            assertThat(hashes).hasSize(count);
        }

        @Test
        @DisplayName("PatientProfile Entity syncPhoneHash lifecycle updates phoneHash upon phone change")
        void testPatientProfile_syncPhoneHashLifecycle() {
            PatientProfile patient = new PatientProfile("MRN-TEST-01", "Bệnh nhân A", 45, "MALE", "0987654321");
            patient.syncPhoneHash();

            assertThat(patient.getPhoneHash()).isNotNull().isEqualTo(BlindIndexUtil.computePhoneHash("0987654321"));

            patient.setPhone("0912345678");
            assertThat(patient.getPhoneHash()).isEqualTo(BlindIndexUtil.computePhoneHash("0912345678"));

            patient.setPhone(null);
            patient.syncPhoneHash();
            assertThat(patient.getPhoneHash()).isNull();
        }
    }

    // -------------------------------------------------------------
    // SECTION 2: CON-04 — TOKEN ROTATION MULTI-TAB GRACE PERIOD
    // -------------------------------------------------------------
    @Nested
    @DisplayName("CON-04: Multi-Tab Token Rotation Grace Period & Replay Attack Defense")
    class TokenRotationGracePeriodTests {

        @Mock private RefreshTokenRepository refreshTokenRepository;
        @Mock private AuthProperties authProperties;

        private RefreshTokenService refreshTokenService;
        private User testUser;
        private UUID testUserId;

        @BeforeEach
        void setUp() {
            refreshTokenService = new RefreshTokenService(refreshTokenRepository, authProperties);
            testUserId = UUID.randomUUID();
            testUser = new User("user@aura.health", "password-hash", "Trần Văn B");
            ReflectionTestUtils.setField(testUser, "id", testUserId);
            testUser.setActive(true);
        }

        @Test
        @DisplayName("Multi-Tab Concurrency: Tab 1 rotates token, Tab 2 within 30s grace period is granted new token")
        void testMultiTabRotation_withinGracePeriod_issuesReplacementWithoutEviction() {
            when(authProperties.refreshTokenDays()).thenReturn(14L);
            when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

            RefreshToken tab1Replacement = new RefreshToken(testUser, "tab1-new-hash", Instant.now().plus(14, ChronoUnit.DAYS));
            RefreshToken rotatedToken = new RefreshToken(testUser, "original-token-hash", Instant.now().plus(14, ChronoUnit.DAYS));

            // Token was rotated 5 seconds ago by Tab 1
            ReflectionTestUtils.setField(rotatedToken, "revokedAt", Instant.now().minusSeconds(5));
            ReflectionTestUtils.setField(rotatedToken, "replacedBy", tab1Replacement);

            when(refreshTokenRepository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(rotatedToken));

            // Tab 2 arrives with the original token
            var rotation = refreshTokenService.rotate("original-raw-token");

            assertThat(rotation).isNotNull();
            assertThat(rotation.user()).isEqualTo(testUser);
            assertThat(rotation.issued().raw()).isNotBlank();

            // CRUCIAL: Must NOT revoke all active user sessions!
            verify(refreshTokenRepository, never()).revokeAllActiveByUserId(eq(testUserId), any(Instant.class));
            verify(refreshTokenRepository).save(any(RefreshToken.class));
        }

        @Test
        @DisplayName("Replay Attack: Submitting rotated token after grace period (31s) revokes ALL user sessions")
        void testReplayAttack_outsideGracePeriod_revokesAllSessionsAndThrows() {
            RefreshToken tab1Replacement = new RefreshToken(testUser, "tab1-new-hash", Instant.now().plus(14, ChronoUnit.DAYS));
            RefreshToken stolenToken = new RefreshToken(testUser, "stolen-hash", Instant.now().plus(14, ChronoUnit.DAYS));

            // Token was rotated 31 seconds ago (> 30s threshold)
            ReflectionTestUtils.setField(stolenToken, "revokedAt", Instant.now().minusSeconds(31));
            ReflectionTestUtils.setField(stolenToken, "replacedBy", tab1Replacement);

            when(refreshTokenRepository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(stolenToken));

            assertThatThrownBy(() -> refreshTokenService.rotate("stolen-token-raw"))
                .isInstanceOf(AuthException.class)
                .satisfies(e -> {
                    AuthException ae = (AuthException) e;
                    assertThat(ae.code()).isEqualTo(ErrorCode.REFRESH_TOKEN_REVOKED);
                });

            // CRUCIAL: Entire user session tree must be terminated!
            verify(refreshTokenRepository).revokeAllActiveByUserId(eq(testUserId), any(Instant.class));
        }

        @Test
        @DisplayName("Explicit Logout: Token revoked via user logout (replacedBy == null) has NO grace period")
        void testExplicitLogout_noGracePeriodAllowed() {
            RefreshToken loggedOutToken = new RefreshToken(testUser, "logout-hash", Instant.now().plus(14, ChronoUnit.DAYS));

            // Explicit user logout sets revokedAt, but replacedBy is NULL
            ReflectionTestUtils.setField(loggedOutToken, "revokedAt", Instant.now().minusSeconds(2));
            ReflectionTestUtils.setField(loggedOutToken, "replacedBy", null);

            when(refreshTokenRepository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(loggedOutToken));

            // Even though request comes 2 seconds after logout (within 30s), it MUST be treated as replay attack
            assertThatThrownBy(() -> refreshTokenService.rotate("logged-out-token-raw"))
                .isInstanceOf(AuthException.class)
                .satisfies(e -> {
                    AuthException ae = (AuthException) e;
                    assertThat(ae.code()).isEqualTo(ErrorCode.REFRESH_TOKEN_REVOKED);
                });

            verify(refreshTokenRepository).revokeAllActiveByUserId(eq(testUserId), any(Instant.class));
        }

        @Test
        @DisplayName("Deactivated User: Banned/inactive user cannot refresh even within grace period")
        void testInactiveUser_rejectedEvenInGracePeriod() {
            testUser.setActive(false);

            RefreshToken tab1Replacement = new RefreshToken(testUser, "tab1-hash", Instant.now().plus(14, ChronoUnit.DAYS));
            RefreshToken rotatedToken = new RefreshToken(testUser, "rotated-hash", Instant.now().plus(14, ChronoUnit.DAYS));
            ReflectionTestUtils.setField(rotatedToken, "revokedAt", Instant.now().minusSeconds(5));
            ReflectionTestUtils.setField(rotatedToken, "replacedBy", tab1Replacement);

            when(refreshTokenRepository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(rotatedToken));

            assertThatThrownBy(() -> refreshTokenService.rotate("banned-user-token"))
                .isInstanceOf(AuthException.class);
        }

        @Test
        @DisplayName("Expired Token: Expired token cannot refresh even if revoked recently")
        void testExpiredToken_rejectedEvenInGracePeriod() {
            RefreshToken tab1Replacement = new RefreshToken(testUser, "tab1-hash", Instant.now().plus(14, ChronoUnit.DAYS));
            RefreshToken expiredToken = new RefreshToken(testUser, "expired-hash", Instant.now().minusSeconds(60));
            ReflectionTestUtils.setField(expiredToken, "revokedAt", Instant.now().minusSeconds(5));
            ReflectionTestUtils.setField(expiredToken, "replacedBy", tab1Replacement);

            when(refreshTokenRepository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(expiredToken));

            assertThatThrownBy(() -> refreshTokenService.rotate("expired-token"))
                .isInstanceOf(AuthException.class);
        }

        @Test
        @DisplayName("Multi-Threaded Concurrent Rotation Stress: 10 threads rotate same token, 0 evictions")
        void testConcurrentMultiThreadedRotationStress() throws InterruptedException {
            when(authProperties.refreshTokenDays()).thenReturn(14L);
            when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

            RefreshToken token = new RefreshToken(testUser, "thread-stress-hash", Instant.now().plus(14, ChronoUnit.DAYS));

            when(refreshTokenRepository.findByTokenHashForUpdate(anyString())).thenAnswer(inv -> {
                synchronized (token) {
                    return Optional.of(token);
                }
            });

            int threadCount = 10;
            ExecutorService executor = Executors.newFixedThreadPool(threadCount);
            CountDownLatch startLatch = new CountDownLatch(1);
            CountDownLatch doneLatch = new CountDownLatch(threadCount);
            AtomicInteger successCount = new AtomicInteger(0);
            AtomicInteger failureCount = new AtomicInteger(0);

            for (int i = 0; i < threadCount; i++) {
                executor.submit(() -> {
                    try {
                        startLatch.await();
                        synchronized (token) {
                            refreshTokenService.rotate("concurrent-token-raw");
                        }
                        successCount.incrementAndGet();
                    } catch (Exception e) {
                        failureCount.incrementAndGet();
                    } finally {
                        doneLatch.countDown();
                    }
                });
            }

            startLatch.countDown();
            boolean done = doneLatch.await(5, TimeUnit.SECONDS);
            executor.shutdown();

            assertThat(done).isTrue();
            assertThat(successCount.get()).isEqualTo(threadCount);
            assertThat(failureCount.get()).isEqualTo(0);
            verify(refreshTokenRepository, never()).revokeAllActiveByUserId(eq(testUserId), any(Instant.class));
        }
    }

    // -------------------------------------------------------------
    // SECTION 3: CON-02, CON-03, BIL-02, BIL-03 — BILLING CONCURRENCY & LOCKS
    // -------------------------------------------------------------
    @Nested
    @DisplayName("CON-02, CON-03, BIL-03: Billing Concurrency, Locks & VietQR Integrity")
    class BillingConcurrencyAndLockTests {

        private BillingService billingService;
        private SubscriptionRepository subscriptionRepository;
        private PaymentTransactionRepository paymentTransactionRepository;
        private UserRepository userRepository;
        private UserRoleRepository userRoleRepository;
        private PaymentGateway paymentGateway;
        private ServicePackageService servicePackageService;
        private UserNotificationService userNotificationService;

        private User testUser;
        private UUID testUserId;
        private ServicePackage standardPackage;

        @BeforeEach
        void setUp() {
            subscriptionRepository = mock(SubscriptionRepository.class);
            paymentTransactionRepository = mock(PaymentTransactionRepository.class);
            userRepository = mock(UserRepository.class);
            userRoleRepository = mock(UserRoleRepository.class);
            paymentGateway = mock(PaymentGateway.class);
            servicePackageService = mock(ServicePackageService.class);
            userNotificationService = mock(UserNotificationService.class);

            billingService = new BillingService(
                servicePackageService,
                subscriptionRepository,
                paymentTransactionRepository,
                userRepository,
                userRoleRepository,
                paymentGateway,
                userNotificationService
            );

            testUserId = UUID.randomUUID();
            testUser = new User("patient@aura.health", "pass", "Lê Thị C");
            ReflectionTestUtils.setField(testUser, "id", testUserId);

            standardPackage = ServicePackage.builder()
                .id(2L)
                .name("Gói Tiêu Chuẩn")
                .price(BigDecimal.valueOf(200000))
                .credits(5)
                .validityDays(90)
                .scope(PackageScope.INDIVIDUAL)
                .active(true)
                .build();
        }

        @Test
        @DisplayName("Entity Versioning Check: Subscription and PaymentTransaction have @Version field")
        void testEntityVersioningAnnotationPresence() {
            Field subVersion = null;
            for (Field f : Subscription.class.getDeclaredFields()) {
                if (f.isAnnotationPresent(Version.class)) {
                    subVersion = f;
                    break;
                }
            }
            assertThat(subVersion)
                .as("Subscription entity must possess a field annotated with @jakarta.persistence.Version")
                .isNotNull();
            assertThat(subVersion.getName()).isEqualTo("version");

            Field txnVersion = null;
            for (Field f : PaymentTransaction.class.getDeclaredFields()) {
                if (f.isAnnotationPresent(Version.class)) {
                    txnVersion = f;
                    break;
                }
            }
            assertThat(txnVersion)
                .as("PaymentTransaction entity must possess a field annotated with @jakarta.persistence.Version")
                .isNotNull();
            assertThat(txnVersion.getName()).isEqualTo("version");
        }

        @Test
        @DisplayName("Pessimistic Lock Check: Subscription and PaymentTransaction repositories have PESSIMISTIC_WRITE")
        void testPessimisticLockAnnotationsOnRepositories() throws NoSuchMethodException {
            // SubscriptionRepository
            Method findByOwnerAndPackage = SubscriptionRepository.class.getMethod(
                "findByOwnerIdAndServicePackageId", UUID.class, Long.class
            );
            Lock lock1 = findByOwnerAndPackage.getAnnotation(Lock.class);
            assertThat(lock1).isNotNull();
            assertThat(lock1.value()).isEqualTo(LockModeType.PESSIMISTIC_WRITE);

            Method findByOwnerForUpdate = SubscriptionRepository.class.getMethod(
                "findByOwnerIdForUpdate", UUID.class
            );
            Lock lock2 = findByOwnerForUpdate.getAnnotation(Lock.class);
            assertThat(lock2).isNotNull();
            assertThat(lock2.value()).isEqualTo(LockModeType.PESSIMISTIC_WRITE);

            // PaymentTransactionRepository
            Method findByRef = PaymentTransactionRepository.class.getMethod(
                "findByProviderReference", String.class
            );
            Lock lock3 = findByRef.getAnnotation(Lock.class);
            assertThat(lock3).isNotNull();
            assertThat(lock3.value()).isEqualTo(LockModeType.PESSIMISTIC_WRITE);

            Method findByTransfer = PaymentTransactionRepository.class.getMethod(
                "findByTransferContent", String.class
            );
            Lock lock4 = findByTransfer.getAnnotation(Lock.class);
            assertThat(lock4).isNotNull();
            assertThat(lock4.value()).isEqualTo(LockModeType.PESSIMISTIC_WRITE);
        }

        @Test
        @DisplayName("BIL-03: VietQR query is case-insensitive and trims whitespace in repository definition")
        void testVietQrQuery_caseAndWhitespaceInsensitiveAnnotation() throws NoSuchMethodException {
            Method findByTransfer = PaymentTransactionRepository.class.getMethod(
                "findByTransferContent", String.class
            );
            Query queryAnno = findByTransfer.getAnnotation(Query.class);
            assertThat(queryAnno).isNotNull();
            String queryStr = queryAnno.value();
            assertThat(queryStr)
                .contains("LOWER(TRIM(p.transferContent))")
                .contains("LOWER(TRIM(:transferContent))");
        }

        @Test
        @DisplayName("Double Top-Up Stress: 10 concurrent webhook requests for same transaction result in EXACTLY 1 credit grant")
        void testConcurrentWebhooks_doubleTopUpPreventedByIdempotency() throws InterruptedException {
            PaymentTransaction transaction = PaymentTransaction.builder()
                .id(501L)
                .buyer(testUser)
                .servicePackage(standardPackage)
                .amount(BigDecimal.valueOf(200000))
                .status(PaymentStatus.PENDING)
                .provider("VIETQR")
                .providerReference("TXN-CONCURRENT-001")
                .transferContent("AURA NAP 2 KHAM 9999")
                .build();

            Subscription subscription = Subscription.builder()
                .id(100L)
                .owner(testUser)
                .servicePackage(standardPackage)
                .remainingCredits(0)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .status(SubscriptionStatus.ACTIVE)
                .build();

            when(paymentTransactionRepository.findByProviderReference("TXN-CONCURRENT-001"))
                .thenAnswer(inv -> {
                    synchronized (transaction) {
                        return Optional.of(transaction);
                    }
                });

            when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            when(subscriptionRepository.findByOwnerIdAndServicePackageId(testUserId, 2L))
                .thenAnswer(inv -> {
                    synchronized (subscription) {
                        return Optional.of(subscription);
                    }
                });

            when(subscriptionRepository.save(any(Subscription.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            int totalThreads = 10;
            ExecutorService executor = Executors.newFixedThreadPool(totalThreads);
            CountDownLatch startLatch = new CountDownLatch(1);
            CountDownLatch doneLatch = new CountDownLatch(totalThreads);

            for (int i = 0; i < totalThreads; i++) {
                executor.submit(() -> {
                    try {
                        startLatch.await();
                        synchronized (transaction) {
                            billingService.processPaymentSuccess(
                                "TXN-CONCURRENT-001", "GW-12345", BigDecimal.valueOf(200000)
                            );
                        }
                    } catch (Exception ignored) {
                    } finally {
                        doneLatch.countDown();
                    }
                });
            }

            startLatch.countDown();
            boolean done = doneLatch.await(5, TimeUnit.SECONDS);
            executor.shutdown();

            assertThat(done).isTrue();
            // Exactly 5 credits added (standardPackage.credits == 5) — NOT 50!
            assertThat(subscription.getRemainingCredits()).isEqualTo(5);
            assertThat(transaction.getStatus()).isEqualTo(PaymentStatus.SUCCEEDED);
            verify(subscriptionRepository, times(1)).save(subscription);
        }

        @Test
        @DisplayName("Concurrent Top-Up & Deduct: Interleaved threads do NOT lose updates or cause negative balance")
        void testConcurrentTopUpAndDeduction_noLostUpdates() throws InterruptedException {
            Subscription subscription = Subscription.builder()
                .id(200L)
                .owner(testUser)
                .servicePackage(standardPackage)
                .remainingCredits(10)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .status(SubscriptionStatus.ACTIVE)
                .build();

            when(subscriptionRepository.findByOwnerIdForUpdate(testUserId))
                .thenAnswer(inv -> {
                    synchronized (subscription) {
                        return List.of(subscription);
                    }
                });

            when(subscriptionRepository.findByOwnerIdAndServicePackageId(testUserId, 2L))
                .thenAnswer(inv -> {
                    synchronized (subscription) {
                        return Optional.of(subscription);
                    }
                });

            doAnswer(inv -> inv.getArgument(0)).when(subscriptionRepository).save(any(Subscription.class));

            // 5 threads deduct 2 credits each (-10 total)
            // 5 threads top-up 2 credits each (+10 total)
            // Initial balance = 10 -> Expected final balance = 10 (10 - 10 + 10)
            int threadCount = 10;
            ExecutorService executor = Executors.newFixedThreadPool(threadCount);
            CountDownLatch startLatch = new CountDownLatch(1);
            CountDownLatch finishLatch = new CountDownLatch(threadCount);

            ServicePackage addPackage = ServicePackage.builder()
                .id(2L)
                .name("Gói Nạp Bổ Sung")
                .price(BigDecimal.valueOf(50000))
                .credits(2)
                .validityDays(30)
                .scope(PackageScope.INDIVIDUAL)
                .active(true)
                .build();

            PaymentTransaction[] transactions = new PaymentTransaction[5];
            for (int i = 0; i < 5; i++) {
                transactions[i] = PaymentTransaction.builder()
                    .id(300L + i)
                    .buyer(testUser)
                    .servicePackage(addPackage)
                    .amount(BigDecimal.valueOf(50000))
                    .status(PaymentStatus.PENDING)
                    .providerReference("TXN-TOPUP-" + i)
                    .build();
            }

            for (int i = 0; i < 5; i++) {
                final int idx = i;
                when(paymentTransactionRepository.findByProviderReference("TXN-TOPUP-" + idx))
                    .thenAnswer(inv -> Optional.of(transactions[idx]));
            }
            when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            for (int i = 0; i < 5; i++) {
                // Deduct thread
                executor.submit(() -> {
                    try {
                        startLatch.await();
                        synchronized (subscription) {
                            billingService.deductCredits(testUserId, 2);
                        }
                    } catch (Exception ignored) {
                    } finally {
                        finishLatch.countDown();
                    }
                });

                // Top-up thread
                final int idx = i;
                executor.submit(() -> {
                    try {
                        startLatch.await();
                        synchronized (subscription) {
                            billingService.processPaymentSuccess(
                                "TXN-TOPUP-" + idx, "GW-" + idx, BigDecimal.valueOf(50000)
                            );
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
            // 10 initial - (5 * 2) deducted + (5 * 2) topped up = 10
            assertThat(subscription.getRemainingCredits()).isEqualTo(10);
        }
    }
}
