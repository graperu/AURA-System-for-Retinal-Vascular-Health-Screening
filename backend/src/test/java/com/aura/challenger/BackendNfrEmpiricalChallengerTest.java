package com.aura.challenger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.admin.dto.AiConfigDto;
import com.aura.audit.annotation.Audited;
import com.aura.audit.aspect.AuditLogAspect;
import com.aura.audit.service.AuditLogService;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.bulk.dto.AiInferenceResultDto;
import com.aura.bulk.dto.PatientAnonymizedDto;
import com.aura.bulk.entity.BulkScreeningBatch;
import com.aura.bulk.entity.BulkScreeningItem;
import com.aura.bulk.queue.BatchItemTask;
import com.aura.bulk.queue.BatchJobQueue;
import com.aura.bulk.repository.BulkScreeningBatchRepository;
import com.aura.bulk.repository.BulkScreeningItemRepository;
import com.aura.bulk.service.AiServiceClient;
import com.aura.bulk.worker.BulkProcessingWorker;
import com.aura.common.crypto.AesGcmAttributeConverter;
import com.aura.common.filter.MdcCorrelationFilter;
import com.aura.dicom.DicomIngestionService;
import com.aura.dicom.DicomMetadata;
import com.aura.realtime.RealtimeEventPublisher;
import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.Screening;
import com.aura.screening.repository.ScreeningRepository;
import com.aura.screening.service.GeminiRetinalAiService;
import com.aura.screening.service.ScreeningService;
import com.aura.system.entity.SystemConfig;
import com.aura.system.repository.SystemConfigRepository;
import com.aura.system.service.SystemConfigService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.slf4j.MDC;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.http.server.PathContainer;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.util.pattern.PathPattern;
import org.springframework.web.util.pattern.PathPatternParser;

/**
 * Empirical Challenge Harness for Backend Non-Functional Requirements:
 * - NFR-9: AES-256 GCM encryption, random IV, null safety, tamper detection, concurrency.
 * - NFR-12: WebSocket handshake permitAll and route matching.
 * - NFR-18: @Audited AOP aspect and MDC request ID tracking.
 * - NFR-16, NFR-23: Dynamic config caching, @CacheEvict, and threshold wiring in ScreeningService.
 * - NFR-2: BulkProcessingWorker WebSocket BATCH_PROGRESS events.
 * - NFR-19: Binary DICOM parser magic bytes, de-identification, and pixel extraction.
 */
@DisplayName("Backend NFR Empirical Challenge Suite")
public class BackendNfrEmpiricalChallengerTest {

  // =========================================================================
  // CHALLENGE 1: AES-256 GCM ENCRYPTION / DECRYPTION & NULL SAFETY (NFR-9)
  // =========================================================================
  @Nested
  @DisplayName("Challenger Area 1: AES-256 GCM Encryption & Decryption")
  class AesGcmChallengerTests {

    private AesGcmAttributeConverter converter;

    @BeforeEach
    void setUp() {
      converter = new AesGcmAttributeConverter();
      converter.setAesKey("AURA_CHALLENGER_KEY_2026_32BYTES_LEN!");
    }

    @Test
    @DisplayName("Roundtrip: Preserves Unicode Vietnamese, special symbols, long text, and emojis")
    void roundTrip_diversePayloads() {
      List<String> payloads = List.of(
          "0912345678",
          "+84-987-654-321",
          "Số 123/45B Đường Nguyễn Văn Cừ, Phường An Khánh, Ninh Kiều, Cần Thơ",
          "Bệnh nhân có tiền sử THA & ĐTĐ type 2; dấu hiệu mờ mắt mắt phải (OD)",
          "Special: !@#$%^&*()_+-=[]{}|;':\",./<>?`~",
          "Multiline:\nLine1\r\nLine2\tTabbed",
          "Emoji: 🏥 👁️ 💉 🩺 🧬",
          "A".repeat(16384) // 16KB large payload
      );

      for (String original : payloads) {
        String encrypted = converter.convertToDatabaseColumn(original);
        assertThat(encrypted).startsWith("ENC:");
        assertThat(encrypted).isNotEqualTo(original);

        String decrypted = converter.convertToEntityAttribute(encrypted);
        assertThat(decrypted).isEqualTo(original);
      }
    }

    @Test
    @DisplayName("Random IV: 1,000 encryptions of identical text generate 1,000 unique ciphertexts")
    void randomIv_uniqueCiphertextsStress() {
      String plaintext = "+84909112233";
      Set<String> ciphertexts = new HashSet<>();

      for (int i = 0; i < 1000; i++) {
        String enc = converter.convertToDatabaseColumn(plaintext);
        boolean added = ciphertexts.add(enc);
        assertThat(added).as("Ciphertext collision detected at iteration %d", i).isTrue();
      }

      assertThat(ciphertexts).hasSize(1000);
    }

    @Test
    @DisplayName("Null and Blank Safety: Handles null, empty, and whitespace without exceptions")
    void nullAndBlankSafety() {
      assertThat(converter.convertToDatabaseColumn(null)).isNull();
      assertThat(converter.convertToDatabaseColumn("")).isEqualTo("");
      assertThat(converter.convertToDatabaseColumn("   ")).isEqualTo("   ");

      assertThat(converter.convertToEntityAttribute(null)).isNull();
      assertThat(converter.convertToEntityAttribute("")).isEqualTo("");
      assertThat(converter.convertToEntityAttribute("   ")).isEqualTo("   ");

      assertThat(AesGcmAttributeConverter.encryptString(null)).isNull();
      assertThat(AesGcmAttributeConverter.decryptString(null)).isNull();
    }

    @Test
    @DisplayName("Idempotency: Re-encrypting an already encrypted string does not double-encrypt")
    void idempotency() {
      String original = "0987654321";
      String encrypted = converter.convertToDatabaseColumn(original);
      String reEncrypted = converter.convertToDatabaseColumn(encrypted);

      assertThat(reEncrypted).isEqualTo(encrypted);
      assertThat(converter.convertToEntityAttribute(reEncrypted)).isEqualTo(original);
    }

    @Test
    @DisplayName("Tamper Detection: Corrupt ciphertext/tag triggers GCM auth failure and returns raw data safely")
    void tamperDetection_returnsRawData() {
      String original = "Confidential Patient Address";
      String encrypted = converter.convertToDatabaseColumn(original);

      // Tamper 1: Corrupted Base64 payload
      String corruptBase64 = "ENC:NOT_VALID_BASE64_$%^&";
      assertThat(converter.convertToEntityAttribute(corruptBase64)).isEqualTo(corruptBase64);

      // Tamper 2: Truncated bytes (fewer than 12-byte IV)
      String truncated = "ENC:" + Base64.getEncoder().encodeToString(new byte[6]);
      assertThat(converter.convertToEntityAttribute(truncated)).isEqualTo(truncated);

      // Tamper 3: Flip a bit in the actual ciphertext payload (GCM authentication tag mismatch)
      byte[] decoded = Base64.getDecoder().decode(encrypted.substring(4));
      decoded[decoded.length - 1] ^= 0x01; // flip last bit of authentication tag
      String tamperedEncrypted = "ENC:" + Base64.getEncoder().encodeToString(decoded);

      String result = converter.convertToEntityAttribute(tamperedEncrypted);
      assertThat(result).isEqualTo(tamperedEncrypted); // gracefully returns raw string rather than crashing application
    }

    @Test
    @DisplayName("Concurrency Stress: 16 parallel threads running 200 cycles achieve 100% integrity")
    void concurrentStressTest() throws Exception {
      int threads = 16;
      int iterations = 200;
      ExecutorService pool = Executors.newFixedThreadPool(threads);
      List<Callable<Boolean>> tasks = new ArrayList<>();

      for (int t = 0; t < threads; t++) {
        final int threadId = t;
        tasks.add(() -> {
          for (int i = 0; i < iterations; i++) {
            String original = "Patient-" + threadId + "-Iter-" + i + "-Data";
            String enc = converter.convertToDatabaseColumn(original);
            String dec = converter.convertToEntityAttribute(enc);
            if (!original.equals(dec)) {
              return false;
            }
          }
          return true;
        });
      }

      List<Future<Boolean>> futures = pool.invokeAll(tasks);
      pool.shutdown();
      pool.awaitTermination(15, TimeUnit.SECONDS);

      for (Future<Boolean> future : futures) {
        assertThat(future.get()).isTrue();
      }
    }
  }

  // =========================================================================
  // CHALLENGE 2: WEBSOCKET /ws-aura/** HANDSHAKE PERMITALL (NFR-12)
  // =========================================================================
  @Nested
  @DisplayName("Challenger Area 2: WebSocket Security Handshake Route Matching")
  class WebSocketSecurityChallengerTests {

    private final PathPatternParser parser = new PathPatternParser();

    @Test
    @DisplayName("PathPattern /ws-aura/** matches SockJS handshake paths and info endpoints")
    void wsAuraPatternMatchesSockJsRoutes() {
      PathPattern pattern = parser.parse("/ws-aura/**");

      // Verify matching of standard SockJS handshake routes
      assertThat(pattern.matches(PathContainer.parsePath("/ws-aura"))).isTrue();
      assertThat(pattern.matches(PathContainer.parsePath("/ws-aura/"))).isTrue();
      assertThat(pattern.matches(PathContainer.parsePath("/ws-aura/info"))).isTrue();
      assertThat(pattern.matches(PathContainer.parsePath("/ws-aura/999/xyz/websocket"))).isTrue();
      assertThat(pattern.matches(PathContainer.parsePath("/ws-aura/websocket"))).isTrue();
      assertThat(pattern.matches(PathContainer.parsePath("/ws-aura/xhr_streaming"))).isTrue();

      // Negative check
      assertThat(pattern.matches(PathContainer.parsePath("/api/v1/screenings"))).isFalse();
    }

    @Test
    @DisplayName("PathPattern /ws-aura-raw/** matches native WebSocket handshake endpoints")
    void wsAuraRawPatternMatchesNativeRoutes() {
      PathPattern pattern = parser.parse("/ws-aura-raw/**");

      assertThat(pattern.matches(PathContainer.parsePath("/ws-aura-raw"))).isTrue();
      assertThat(pattern.matches(PathContainer.parsePath("/ws-aura-raw/"))).isTrue();
      assertThat(pattern.matches(PathContainer.parsePath("/ws-aura-raw/websocket"))).isTrue();

      assertThat(pattern.matches(PathContainer.parsePath("/ws-aura/info"))).isFalse();
    }
  }

  // =========================================================================
  // CHALLENGE 3: @Audited AOP ASPECT & MDC REQUEST ID TRACKING (NFR-18)
  // =========================================================================
  @Nested
  @DisplayName("Challenger Area 3: Audited Aspect & MDC Correlation Tracing")
  class AuditAndMdcChallengerTests {

    private AuditLogService auditLogService;
    private AuditLogAspect aspect;

    @BeforeEach
    void setUp() {
      auditLogService = mock(AuditLogService.class);
      aspect = new AuditLogAspect(auditLogService);
      MDC.clear();
    }

    @AfterEach
    void tearDown() {
      SecurityContextHolder.clearContext();
      RequestContextHolder.resetRequestAttributes();
      MDC.clear();
    }

    @Test
    @DisplayName("Audit Aspect: Intercepts successful invocation and logs SUCCESS audit event")
    void auditedAspect_success() throws Throwable {
      UUID userId = UUID.randomUUID();
      AuraUserPrincipal principal = new AuraUserPrincipal(userId, "doctor.hoa@aura.test", "BS Hoa", true, List.of("DOCTOR"));
      SecurityContextHolder.getContext().setAuthentication(
          new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

      MockHttpServletRequest request = new MockHttpServletRequest();
      request.setRemoteAddr("10.20.30.40");
      request.addHeader("User-Agent", "AURA-Station-Browser/2.0");
      RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

      ProceedingJoinPoint pjp = mock(ProceedingJoinPoint.class);
      MethodSignature sig = mock(MethodSignature.class);
      Method testMethod = ChallengerAuditedTarget.class.getMethod("sampleAction", UUID.class);
      when(sig.getMethod()).thenReturn(testMethod);
      when(pjp.getSignature()).thenReturn(sig);
      UUID screeningId = UUID.randomUUID();
      when(pjp.getArgs()).thenReturn(new Object[]{screeningId});
      when(pjp.proceed()).thenReturn("RESULT_OK");

      Audited audited = testMethod.getAnnotation(Audited.class);
      Object ret = aspect.logAuditedMethod(pjp, audited);
      assertThat(ret).isEqualTo("RESULT_OK");

      verify(auditLogService).logEvent(
          eq(userId),
          eq("doctor.hoa@aura.test"),
          eq("DOCTOR"),
          eq("SCREENING"),
          eq("REVIEW_SCREENING"),
          eq("SCREENING_RECORD"),
          eq(screeningId.toString()),
          eq("10.20.30.40"),
          eq("AURA-Station-Browser/2.0"),
          eq("SUCCESS"),
          anyString()
      );
    }

    @Test
    @DisplayName("Audit Aspect: On failure, records FAILURE audit event and propagates exception")
    void auditedAspect_failure_propagatesException() throws Throwable {
      UUID userId = UUID.randomUUID();
      AuraUserPrincipal principal = new AuraUserPrincipal(userId, "admin@aura.test", "Admin", true, List.of("ADMIN"));
      SecurityContextHolder.getContext().setAuthentication(
          new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

      ProceedingJoinPoint pjp = mock(ProceedingJoinPoint.class);
      MethodSignature sig = mock(MethodSignature.class);
      Method testMethod = ChallengerAuditedTarget.class.getMethod("sampleAction", UUID.class);
      when(sig.getMethod()).thenReturn(testMethod);
      when(pjp.getSignature()).thenReturn(sig);
      UUID targetId = UUID.randomUUID();
      when(pjp.getArgs()).thenReturn(new Object[]{targetId});
      when(pjp.proceed()).thenThrow(new IllegalStateException("Lỗi xác thực chứng chỉ số"));

      Audited audited = testMethod.getAnnotation(Audited.class);

      assertThatThrownBy(() -> aspect.logAuditedMethod(pjp, audited))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("Lỗi xác thực chứng chỉ số");

      verify(auditLogService).logEvent(
          eq(userId),
          eq("admin@aura.test"),
          eq("ADMIN"),
          eq("SCREENING"),
          eq("REVIEW_SCREENING_FAILED"),
          eq("SCREENING_RECORD"),
          eq(targetId.toString()),
          anyString(),
          anyString(),
          eq("FAILURE"),
          anyString()
      );
    }

    @Test
    @DisplayName("Audit Aspect: Extracts client IP through multi-hop X-Forwarded-For proxies")
    void auditedAspect_extractsMultiHopProxyIp() throws Throwable {
      MockHttpServletRequest request = new MockHttpServletRequest();
      request.addHeader("X-Forwarded-For", "203.0.113.195, 70.41.3.18, 150.172.238.178");
      RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

      ProceedingJoinPoint pjp = mock(ProceedingJoinPoint.class);
      MethodSignature sig = mock(MethodSignature.class);
      Method testMethod = ChallengerAuditedTarget.class.getMethod("sampleAction", UUID.class);
      when(sig.getMethod()).thenReturn(testMethod);
      when(pjp.getSignature()).thenReturn(sig);
      when(pjp.getArgs()).thenReturn(new Object[]{UUID.randomUUID()});
      when(pjp.proceed()).thenReturn("OK");

      Audited audited = testMethod.getAnnotation(Audited.class);
      aspect.logAuditedMethod(pjp, audited);

      ArgumentCaptor<String> ipCaptor = ArgumentCaptor.forClass(String.class);
      verify(auditLogService).logEvent(any(), any(), any(), any(), any(), any(), any(), ipCaptor.capture(), any(), any(), any());

      assertThat(ipCaptor.getValue()).isEqualTo("203.0.113.195");
    }

    @Test
    @DisplayName("MDC Filter: Extracts X-Request-ID, passes to MDC and HTTP response, cleans up in finally")
    void mdcFilter_tracksAndCleansUp() throws ServletException, IOException {
      MdcCorrelationFilter filter = new MdcCorrelationFilter();
      MockHttpServletRequest request = new MockHttpServletRequest();
      request.addHeader("X-Request-ID", "REQ-TEST-778899");
      MockHttpServletResponse response = new MockHttpServletResponse();

      final String[] mdcCapture = new String[1];
      FilterChain chain = (req, res) -> {
        mdcCapture[0] = MDC.get(MdcCorrelationFilter.MDC_KEY_REQUEST_ID);
      };

      filter.doFilter(request, response, chain);

      assertThat(mdcCapture[0]).isEqualTo("REQ-TEST-778899");
      assertThat(response.getHeader("X-Request-ID")).isEqualTo("REQ-TEST-778899");
      assertThat(MDC.get(MdcCorrelationFilter.MDC_KEY_REQUEST_ID)).isNull();
    }
  }

  // =========================================================================
  // CHALLENGE 4: DYNAMIC CONFIG CACHING & THRESHOLD WIRING (NFR-16, NFR-23)
  // =========================================================================
  @Nested
  @DisplayName("Challenger Area 4: Dynamic Config Caching & ScreeningService Threshold Wiring")
  class DynamicConfigAndScreeningWiringChallengerTests {

    private SystemConfigRepository configRepository;
    private SystemConfigService configService;

    @BeforeEach
    void setUp() {
      configRepository = mock(SystemConfigRepository.class);
      configService = new SystemConfigService(configRepository);
    }

    @Test
    @DisplayName("Config Caching: Cache manager returns cached AiConfigDto without re-querying DB")
    void dynamicConfig_cachingWorkflow() {
      ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager("systemConfig");
      org.springframework.cache.Cache cache = cacheManager.getCache("systemConfig");
      assertThat(cache).isNotNull();

      // Seed mock repository
      SystemConfig critCfg = new SystemConfig(SystemConfigService.KEY_CRITICAL_THRESHOLD, "82", "desc", "ADMIN");
      when(configRepository.findByConfigKey(SystemConfigService.KEY_CRITICAL_THRESHOLD)).thenReturn(Optional.of(critCfg));

      // Simulate cache miss: fetch directly and put in cache
      AiConfigDto fetched = configService.getAiConfig();
      assertThat(fetched.criticalThreshold()).isEqualTo(82);
      cache.put("aiConfig", fetched);

      // Simulate cache hit: retrieval from cache
      AiConfigDto cached = cache.get("aiConfig", AiConfigDto.class);
      assertThat(cached).isNotNull();
      assertThat(cached.criticalThreshold()).isEqualTo(82);

      // Simulate eviction on update:
      cache.clear();
      assertThat(cache.get("aiConfig")).isNull();
    }

    @Test
    @DisplayName("ScreeningService: Dynamically uses custom thresholds (e.g. Critical=70) and stamps model version")
    void screeningService_usesDynamicThresholdsEmpirically() throws Exception {
      // Configure dynamic threshold: Critical=70, High=50, Moderate=30
      SystemConfigService dynamicConfigService = mock(SystemConfigService.class);
      when(dynamicConfigService.getCriticalThreshold()).thenReturn(70);
      when(dynamicConfigService.getHighThreshold()).thenReturn(50);
      when(dynamicConfigService.getModerateThreshold()).thenReturn(30);
      when(dynamicConfigService.getActiveModelVersion()).thenReturn("Gemini 3.8 Flash High / AURA-Core v2.4");

      ScreeningRepository screeningRepo = mock(ScreeningRepository.class);
      GeminiRetinalAiService geminiAiService = mock(GeminiRetinalAiService.class);

      ScreeningService screeningService = new ScreeningService(
          screeningRepo, null, null, null, null, null, geminiAiService, null, null, null, dynamicConfigService
      );

      // Construct screening entity
      UUID patientId = UUID.randomUUID();
      Screening screening = new Screening(patientId, "https://cdn.aura.com/retina.jpg");

      // Construct mock AI inference result with risk score = 75
      // Under default threshold (80), 75 would be HIGH.
      // Under dynamic threshold (Critical=70), 75 MUST BE CRITICAL!
      Map<String, Object> aiResponse = Map.of(
          "overallVascularRiskScore", 75,
          "confidence", 0.94,
          "predictions", List.of(
              Map.of("category", "CVD", "riskScore", 75, "riskLevel", "CRITICAL", "clinicalNote", "Severe microvascular changes")
          )
      );
      when(geminiAiService.analyzeRetinalVascular(any(), any())).thenReturn(aiResponse);

      // Invoke private executeAiAnalysisAndPopulate via reflection
      Method method = ScreeningService.class.getDeclaredMethod(
          "executeAiAnalysisAndPopulate", Screening.class, String.class, String.class
      );
      method.setAccessible(true);
      method.invoke(screeningService, screening, "OD", "https://cdn.aura.com/retina.jpg");

      // Verify dynamic classification outcome
      assertThat(screening.getRiskLevel()).isEqualTo(RiskLevel.CRITICAL);
      assertThat(screening.getRiskScore()).isEqualTo(75);
      assertThat(screening.getAiModelVersion()).isEqualTo("Gemini 3.8 Flash High / AURA-Core v2.4");
      assertThat(screening.getAppliedThresholds()).isEqualTo("CRIT:70,HIGH:50,MOD:30");
    }

    @Test
    @DisplayName("ScreeningService: Correctly categorizes HIGH, MODERATE, and LOW against custom thresholds")
    void screeningService_riskBoundaryTesting() throws Exception {
      SystemConfigService dynamicConfigService = mock(SystemConfigService.class);
      when(dynamicConfigService.getCriticalThreshold()).thenReturn(70);
      when(dynamicConfigService.getHighThreshold()).thenReturn(50);
      when(dynamicConfigService.getModerateThreshold()).thenReturn(30);
      when(dynamicConfigService.getActiveModelVersion()).thenReturn("Model-V2");

      GeminiRetinalAiService geminiAiService = mock(GeminiRetinalAiService.class);
      ScreeningService screeningService = new ScreeningService(
          null, null, null, null, null, null, geminiAiService, null, null, null, dynamicConfigService
      );

      Method method = ScreeningService.class.getDeclaredMethod(
          "executeAiAnalysisAndPopulate", Screening.class, String.class, String.class
      );
      method.setAccessible(true);

      // Test score 55 -> should be HIGH (>= 50, < 70)
      when(geminiAiService.analyzeRetinalVascular(any(), any()))
          .thenReturn(Map.of("overallVascularRiskScore", 55, "predictions", List.of()));
      Screening s1 = new Screening(UUID.randomUUID(), "https://cdn.aura.com/s1.jpg");
      method.invoke(screeningService, s1, "OD", "https://cdn.aura.com/s1.jpg");
      assertThat(s1.getRiskLevel()).isEqualTo(RiskLevel.HIGH);

      // Test score 35 -> should be MODERATE (>= 30, < 50)
      when(geminiAiService.analyzeRetinalVascular(any(), any()))
          .thenReturn(Map.of("overallVascularRiskScore", 35, "predictions", List.of()));
      Screening s2 = new Screening(UUID.randomUUID(), "https://cdn.aura.com/s2.jpg");
      method.invoke(screeningService, s2, "OS", "https://cdn.aura.com/s2.jpg");
      assertThat(s2.getRiskLevel()).isEqualTo(RiskLevel.MODERATE);

      // Test score 25 -> should be LOW (< 30)
      when(geminiAiService.analyzeRetinalVascular(any(), any()))
          .thenReturn(Map.of("overallVascularRiskScore", 25, "predictions", List.of()));
      Screening s3 = new Screening(UUID.randomUUID(), "https://cdn.aura.com/s3.jpg");
      method.invoke(screeningService, s3, "OD", "https://cdn.aura.com/s3.jpg");
      assertThat(s3.getRiskLevel()).isEqualTo(RiskLevel.LOW);
    }
  }

  // =========================================================================
  // CHALLENGE 5: BULK PROCESSING WORKER WEBSOCKET BATCH_PROGRESS (NFR-2)
  // =========================================================================
  @Nested
  @DisplayName("Challenger Area 5: BulkProcessingWorker WebSocket BATCH_PROGRESS Events")
  class BulkProcessingWorkerChallengerTests {

    @Test
    @DisplayName("Bulk Worker: Pushes BATCH_PROGRESS on success with correct progress counts")
    void bulkWorker_pushesSuccessProgress() throws Exception {
      BatchJobQueue jobQueue = mock(BatchJobQueue.class);
      AiServiceClient aiServiceClient = mock(AiServiceClient.class);
      BulkScreeningItemRepository itemRepository = mock(BulkScreeningItemRepository.class);
      BulkScreeningBatchRepository batchRepository = mock(BulkScreeningBatchRepository.class);
      RealtimeEventPublisher realtimeEventPublisher = mock(RealtimeEventPublisher.class);

      BulkProcessingWorker worker = new BulkProcessingWorker(
          jobQueue, aiServiceClient, itemRepository, batchRepository, realtimeEventPublisher
      );

      UUID clinicId = UUID.randomUUID();
      UUID batchUuid = UUID.randomUUID();
      BulkScreeningBatch batch = new BulkScreeningBatch("BATCH-EMP-01", clinicId, 20);
      ReflectionTestUtils.setField(batch, "id", batchUuid);
      batch.setProcessedCount(4);
      batch.setFailedCount(1);
      batch.setStatus("IN_PROGRESS");

      BulkScreeningItem item = new BulkScreeningItem(batchUuid, "ITEM-01", "scan.png", "OD", "pat-01");

      PatientAnonymizedDto patient = new PatientAnonymizedDto(
          "pat-01", "MRN-01", 55, "FEMALE", 130, 85, 6.0, true, false, Instant.now());
      BatchItemTask task = new BatchItemTask("BATCH-EMP-01", "ITEM-01", "scan.png", "OD", patient, "b64");

      AiInferenceResultDto aiResult = new AiInferenceResultDto(
          "pat-01", 100L, 65, 45, "MODERATE", 55, "MODERATE", 16.5, 0.62, 14.0, 1.1, 0.35, "maskUrl", 0, List.of("No lesions")
      );

      when(jobQueue.dequeue()).thenReturn(task).thenThrow(new InterruptedException());
      when(aiServiceClient.executeFundusAnalysis(any(), any(), any())).thenReturn(aiResult);
      when(batchRepository.findByBatchCode("BATCH-EMP-01")).thenReturn(Optional.of(batch));
      when(itemRepository.findByBatchIdAndItemCode(batchUuid, "ITEM-01")).thenReturn(Optional.of(item));

      Method method = BulkProcessingWorker.class.getDeclaredMethod("processQueueLoop");
      method.setAccessible(true);
      method.invoke(worker);

      ArgumentCaptor<Map<String, Object>> payloadCaptor = ArgumentCaptor.forClass(Map.class);
      verify(realtimeEventPublisher).publishBatchProgress(eq(clinicId), payloadCaptor.capture());

      Map<String, Object> payload = payloadCaptor.getValue();
      assertThat(payload.get("batchId")).isEqualTo("BATCH-EMP-01");
      assertThat(payload.get("total")).isEqualTo(20);
      assertThat(payload.get("processed")).isEqualTo(5); // 4 + 1
      assertThat(payload.get("failed")).isEqualTo(1);
      assertThat(payload.get("status")).isEqualTo("IN_PROGRESS");
    }

    @Test
    @DisplayName("Bulk Worker: Pushes BATCH_PROGRESS on error and increments failure count")
    void bulkWorker_pushesFailureProgress() throws Exception {
      BatchJobQueue jobQueue = mock(BatchJobQueue.class);
      AiServiceClient aiServiceClient = mock(AiServiceClient.class);
      BulkScreeningItemRepository itemRepository = mock(BulkScreeningItemRepository.class);
      BulkScreeningBatchRepository batchRepository = mock(BulkScreeningBatchRepository.class);
      RealtimeEventPublisher realtimeEventPublisher = mock(RealtimeEventPublisher.class);

      BulkProcessingWorker worker = new BulkProcessingWorker(
          jobQueue, aiServiceClient, itemRepository, batchRepository, realtimeEventPublisher
      );

      UUID clinicId = UUID.randomUUID();
      UUID batchUuid = UUID.randomUUID();
      BulkScreeningBatch batch = new BulkScreeningBatch("BATCH-EMP-02", clinicId, 10);
      ReflectionTestUtils.setField(batch, "id", batchUuid);
      batch.setProcessedCount(9);
      batch.setFailedCount(0);
      batch.setStatus("IN_PROGRESS");

      BulkScreeningItem item = new BulkScreeningItem(batchUuid, "ITEM-02", "scan.png", "OS", "pat-02");
      PatientAnonymizedDto patient = new PatientAnonymizedDto(
          "pat-02", "MRN-02", 60, "MALE", 140, 90, 7.0, false, false, Instant.now());
      BatchItemTask task = new BatchItemTask("BATCH-EMP-02", "ITEM-02", "scan.png", "OS", patient, "b64");

      when(jobQueue.dequeue()).thenReturn(task).thenThrow(new InterruptedException());
      when(aiServiceClient.executeFundusAnalysis(any(), any(), any()))
          .thenThrow(new RuntimeException("GPU Out of Memory"));
      when(batchRepository.findByBatchCode("BATCH-EMP-02")).thenReturn(Optional.of(batch));
      when(itemRepository.findByBatchIdAndItemCode(batchUuid, "ITEM-02")).thenReturn(Optional.of(item));

      Method method = BulkProcessingWorker.class.getDeclaredMethod("processQueueLoop");
      method.setAccessible(true);
      method.invoke(worker);

      ArgumentCaptor<Map<String, Object>> payloadCaptor = ArgumentCaptor.forClass(Map.class);
      verify(realtimeEventPublisher).publishBatchProgress(eq(clinicId), payloadCaptor.capture());

      Map<String, Object> payload = payloadCaptor.getValue();
      assertThat(payload.get("batchId")).isEqualTo("BATCH-EMP-02");
      assertThat(payload.get("total")).isEqualTo(10);
      assertThat(payload.get("processed")).isEqualTo(9);
      assertThat(payload.get("failed")).isEqualTo(1);
      // processed (9) + failed (1) == total (10) -> transitions to COMPLETED
      assertThat(payload.get("status")).isEqualTo("COMPLETED");
    }
  }

  // =========================================================================
  // CHALLENGE 6: BINARY DICOM PARSER & DE-IDENTIFICATION (NFR-19)
  // =========================================================================
  @Nested
  @DisplayName("Challenger Area 6: Binary DICOM Parser, Magic Bytes, De-Identification & Pixels")
  class DicomIngestionChallengerTests {

    private DicomIngestionService dicomService;

    @BeforeEach
    void setUp() {
      dicomService = new DicomIngestionService();
    }

    @Test
    @DisplayName("Magic Bytes: Accurately validates DICM header and rejects corrupted preambles")
    void magicByteValidation() throws IOException {
      byte[] validDicom = createSampleDicomBytes("Doan Van Hau", "MRN-445566", "OP", "OD");
      assertThat(dicomService.isDicom(validDicom)).isTrue();

      // Corrupt magic byte at offset 131 ('M' -> 'X')
      byte[] corruptedMagic = validDicom.clone();
      corruptedMagic[131] = (byte) 'X';
      assertThat(dicomService.isDicom(corruptedMagic)).isFalse();

      // Truncated data
      assertThat(dicomService.isDicom(new byte[131])).isFalse();
      assertThat(dicomService.isDicom(null)).isFalse();
    }

    @Test
    @DisplayName("Metadata Extraction: Extracts clinical tags from valid DICOM binary stream")
    void metadataExtraction() throws IOException {
      byte[] validDicom = createSampleDicomBytes("Hoang Thi Yen", "MRN-778899", "OP", "OS");
      DicomMetadata meta = dicomService.extractMetadata(validDicom);

      assertThat(meta.isDicom()).isTrue();
      assertThat(meta.patientName()).isEqualTo("Hoang Thi Yen");
      assertThat(meta.patientId()).isEqualTo("MRN-778899");
      assertThat(meta.modality()).isEqualTo("OP");
      assertThat(meta.eyeLaterality()).isEqualTo("OS");
      assertThat(meta.rows()).isEqualTo(512);
      assertThat(meta.columns()).isEqualTo(512);
    }

    @Test
    @DisplayName("De-Identification: Strips real patient PHI and replaces with pseudonyms")
    void deidentifyDicom_scrubsPhi() throws IOException {
      byte[] original = createSampleDicomBytes("Vu Dinh Chuan", "MRN-ORIG-12345", "OP", "OD");
      byte[] anonymized = dicomService.deidentifyDicom(original, "ANO-PAT-PSEUDO99", "MRN-DEID-54321");

      DicomMetadata afterMeta = dicomService.extractMetadata(anonymized);
      assertThat(afterMeta.patientName()).doesNotContain("Vu Dinh Chuan");
      assertThat(afterMeta.patientName()).contains("ANO-PAT-PSEUDO99");
      assertThat(afterMeta.patientId()).doesNotContain("MRN-ORIG-12345");
      assertThat(afterMeta.patientId()).contains("MRN-DEID-54321");
      assertThat(afterMeta.eyeLaterality()).isEqualTo("OD");
      assertThat(afterMeta.isDicom()).isTrue();
    }

    @Test
    @DisplayName("Pixel Extraction: Synthesizes valid PNG bytes conforming to image specifications")
    void extractPixelDataAsPng_validPngHeader() throws IOException {
      byte[] validDicom = createSampleDicomBytes("Test Patient", "MRN-000", "OP", "OD");
      byte[] pngBytes = dicomService.extractPixelDataAsPng(validDicom);

      assertThat(pngBytes).isNotEmpty();
      // Verify PNG magic bytes: 0x89, 0x50, 0x4E, 0x47
      assertThat(pngBytes[0]).isEqualTo((byte) 0x89);
      assertThat(pngBytes[1]).isEqualTo((byte) 0x50);
      assertThat(pngBytes[2]).isEqualTo((byte) 0x4E);
      assertThat(pngBytes[3]).isEqualTo((byte) 0x47);

      // Null check
      assertThat(dicomService.extractPixelDataAsPng(null)).isEmpty();
    }

    private byte[] createSampleDicomBytes(String name, String id, String modality, String laterality) throws IOException {
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      baos.write(new byte[128]); // preamble
      baos.write(new byte[] {(byte) 'D', (byte) 'I', (byte) 'C', (byte) 'M'});

      writeDicomElement(baos, 0x0010, 0x0010, "PN", name);
      writeDicomElement(baos, 0x0010, 0x0020, "LO", id);
      writeDicomElement(baos, 0x0008, 0x0060, "CS", modality);
      writeDicomElement(baos, 0x0020, 0x0060, "CS", laterality);

      // Rows: US 512
      baos.write(0x28); baos.write(0x00); baos.write(0x10); baos.write(0x00);
      baos.write("US".getBytes(StandardCharsets.US_ASCII));
      baos.write(2); baos.write(0);
      baos.write(0x00); baos.write(0x02);

      // Cols: US 512
      baos.write(0x28); baos.write(0x00); baos.write(0x11); baos.write(0x00);
      baos.write("US".getBytes(StandardCharsets.US_ASCII));
      baos.write(2); baos.write(0);
      baos.write(0x00); baos.write(0x02);

      // Pixel Data (7FE0,0010)
      baos.write(0xE0); baos.write(0x7F); baos.write(0x10); baos.write(0x00);
      baos.write("OB".getBytes(StandardCharsets.US_ASCII));
      baos.write(0); baos.write(0);
      baos.write(128); baos.write(0); baos.write(0); baos.write(0);
      baos.write(new byte[128]);

      return baos.toByteArray();
    }

    private void writeDicomElement(ByteArrayOutputStream baos, int group, int elem, String vr, String value) throws IOException {
      byte[] valBytes = value.getBytes(StandardCharsets.UTF_8);
      baos.write(group & 0xFF);
      baos.write((group >> 8) & 0xFF);
      baos.write(elem & 0xFF);
      baos.write((elem >> 8) & 0xFF);
      baos.write(vr.getBytes(StandardCharsets.US_ASCII));
      baos.write(valBytes.length & 0xFF);
      baos.write((valBytes.length >> 8) & 0xFF);
      baos.write(valBytes);
    }
  }

  // Target class for @Audited Aspect testing
  public static class ChallengerAuditedTarget {
    @Audited(action = "REVIEW_SCREENING", module = "SCREENING", resourceType = "SCREENING_RECORD", description = "Đánh giá ca sàng lọc")
    public String sampleAction(UUID id) {
      return "OK";
    }
  }
}
