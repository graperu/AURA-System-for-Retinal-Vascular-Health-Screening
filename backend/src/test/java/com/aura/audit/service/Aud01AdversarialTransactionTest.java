package com.aura.audit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.aura.audit.entity.AuditLog;
import com.aura.audit.repository.AuditLogRepository;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.aop.support.AopUtils;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionException;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

/**
 * Adversarial Empirical Verification Suite for AUD-01.
 * Verifies transaction rollback isolation and audit log persistence under business transaction abort.
 */
@DisplayName("AUD-01 Adversarial Empirical Stress Test: Transaction Abort & Audit Log Persistence")
public class Aud01AdversarialTransactionTest {

  private AnnotationConfigApplicationContext context;
  private AuditLogService auditLogService;
  private OuterBusinessService outerBusinessService;
  private FlawedAuditLogService flawedAuditLogService;
  private FlawedOuterBusinessService flawedOuterBusinessService;
  private MockAuditDatabase auditDatabase;
  private RecordingTransactionManager txManager;

  @BeforeEach
  void setUp() {
    context = new AnnotationConfigApplicationContext(TestTxConfig.class);
    auditLogService = context.getBean(AuditLogService.class);
    outerBusinessService = context.getBean(OuterBusinessService.class);
    flawedAuditLogService = context.getBean(FlawedAuditLogService.class);
    flawedOuterBusinessService = context.getBean(FlawedOuterBusinessService.class);
    auditDatabase = context.getBean(MockAuditDatabase.class);
    txManager = context.getBean(RecordingTransactionManager.class);

    auditDatabase.clear();
    txManager.clear();
  }

  @AfterEach
  void tearDown() {
    if (context != null) {
      context.close();
    }
  }

  @Test
  @DisplayName("AUD-01 Production Service Contract: Methods declare Propagation.REQUIRES_NEW")
  void verifyAuditLogServiceMethodAnnotations() throws Exception {
    Method logEvent11 = AuditLogService.class.getMethod("logEvent",
        UUID.class, String.class, String.class, String.class, String.class,
        String.class, String.class, String.class, String.class, String.class, String.class);
    Transactional tx11 = logEvent11.getAnnotation(Transactional.class);
    assertThat(tx11).isNotNull();
    assertThat(tx11.propagation()).isEqualTo(Propagation.REQUIRES_NEW);

    Method logEvent9 = AuditLogService.class.getMethod("logEvent",
        UUID.class, String.class, String.class, String.class, String.class,
        String.class, String.class, String.class, String.class);
    Transactional tx9 = logEvent9.getAnnotation(Transactional.class);
    assertThat(tx9).isNotNull();
    assertThat(tx9.propagation()).isEqualTo(Propagation.REQUIRES_NEW);

    // Spring Bean must be wrapped in Spring Transactional AOP Proxy
    assertThat(AopUtils.isAopProxy(auditLogService)).isTrue();
  }

  @Test
  @DisplayName("Adversarial AUD-01 Test: Outer transaction aborts and rolls back, while REQUIRES_NEW audit log is committed and preserved in database")
  void outerTransactionFails_auditLogPersistsInDatabase() {
    UUID doctorId = UUID.randomUUID();
    String patientMrn = "MRN-STRESS-9999";

    // Trigger business transaction failure after audit log is emitted
    assertThatThrownBy(() -> outerBusinessService.executeClinicalReviewWithFailure(
        doctorId,
        patientMrn,
        "Simulated Unhandled Out-Of-Range Clinical Exception"
    ))
    .isInstanceOf(RuntimeException.class)
    .hasMessageContaining("Simulated Unhandled Out-Of-Range Clinical Exception");

    // 1. Assert outer business transaction ROLLED BACK
    assertThat(outerBusinessService.getCommittedBusinessRecords())
        .as("Outer business records must be empty because the outer transaction rolled back")
        .isEmpty();

    // 2. Assert inner audit log transaction COMMITTED and persisted in database
    List<AuditLog> persistedLogs = auditDatabase.getCommittedLogs();
    assertThat(persistedLogs)
        .as("Audit log record must be committed and preserved in the persistent database despite outer rollback")
        .hasSize(1);

    AuditLog persisted = persistedLogs.get(0);
    assertThat(persisted.getUserId()).isEqualTo(doctorId);
    assertThat(persisted.getAction()).isEqualTo("CLINICAL_REVIEW_ABORT_AUDIT");
    assertThat(persisted.getResourceId()).isEqualTo(patientMrn);
    assertThat(persisted.getStatus()).isEqualTo("FAILURE_RECORDED");
    assertThat(persisted.getDetails()).contains("Simulated Unhandled Out-Of-Range Clinical Exception");

    // 3. Assert transaction manager logs verify exact REQUIRES_NEW lifecycle
    assertThat(txManager.getSuspensionEvents())
        .as("Outer transaction must have been suspended when REQUIRES_NEW inner transaction started")
        .isEqualTo(1);
    assertThat(txManager.getResumptionEvents())
        .as("Outer transaction must have been resumed after REQUIRES_NEW inner transaction committed")
        .isEqualTo(1);
    assertThat(txManager.getCommittedTransactions())
        .as("Exactly one inner transaction must have been committed (the audit log)")
        .isEqualTo(1);
    assertThat(txManager.getRolledBackTransactions())
        .as("Exactly one outer transaction must have been rolled back (the business logic)")
        .isEqualTo(1);
  }

  @Test
  @DisplayName("Adversarial Negative Control: Propagation.REQUIRED causes audit log to be rolled back and LOST on outer failure")
  void negativeControl_propagationRequired_causesAuditLogLoss() {
    UUID doctorId = UUID.randomUUID();
    String patientMrn = "MRN-FLAWED-1111";

    // Trigger failure in service using flawed Propagation.REQUIRED
    assertThatThrownBy(() -> flawedOuterBusinessService.executeWithFlawedAuditAndFailure(
        doctorId,
        patientMrn,
        "Critical Error In Flawed Required Pipeline"
    ))
    .isInstanceOf(RuntimeException.class)
    .hasMessageContaining("Critical Error In Flawed Required Pipeline");

    // In the flawed scenario: both business record AND audit log are lost!
    assertThat(flawedOuterBusinessService.getCommittedBusinessRecords())
        .as("Business records rolled back")
        .isEmpty();

    List<AuditLog> persistedLogs = auditDatabase.getCommittedLogs();
    assertThat(persistedLogs)
        .as("Without REQUIRES_NEW, audit log is rolled back and LOST (reproducing defect BAO_CAO §7.5)")
        .isEmpty();

    assertThat(txManager.getSuspensionEvents())
        .as("No suspension occurred because Propagation.REQUIRED joined ambient transaction")
        .isZero();
    assertThat(txManager.getRolledBackTransactions())
        .as("The single combined transaction rolled back completely")
        .isEqualTo(1);
    assertThat(txManager.getCommittedTransactions())
        .as("Zero transactions committed")
        .isZero();
  }

  // =========================================================================
  // Test Infrastructure & Spring Context Configuration
  // =========================================================================

  @Configuration
  @EnableTransactionManagement(proxyTargetClass = true)
  static class TestTxConfig {

    @Bean
    public MockAuditDatabase mockAuditDatabase() {
      return new MockAuditDatabase();
    }

    @Bean
    public RecordingTransactionManager transactionManager(MockAuditDatabase db) {
      return new RecordingTransactionManager(db);
    }

    @Bean
    public AuditLogRepository auditLogRepository(MockAuditDatabase db, RecordingTransactionManager tx) {
      // Dynamic proxy for AuditLogRepository routing saves to the active transaction buffer
      return (AuditLogRepository) Proxy.newProxyInstance(
          AuditLogRepository.class.getClassLoader(),
          new Class<?>[] { AuditLogRepository.class },
          (proxy, method, args) -> {
            if ("hashCode".equals(method.getName())) {
              return System.identityHashCode(proxy);
            }
            if ("equals".equals(method.getName())) {
              return proxy == args[0];
            }
            if ("toString".equals(method.getName())) {
              return "MockAuditLogRepository@" + Integer.toHexString(System.identityHashCode(proxy));
            }
            if ("save".equals(method.getName()) && args != null && args.length == 1 && args[0] instanceof AuditLog log) {
              tx.stageAuditLog(log);
              return log;
            }
            return null;
          }
      );
    }

    @Bean
    public AuditLogService auditLogService(AuditLogRepository repo) {
      return new AuditLogService(repo);
    }

    @Bean
    public OuterBusinessService outerBusinessService(AuditLogService auditLogService, RecordingTransactionManager tx) {
      return new OuterBusinessService(auditLogService, tx);
    }

    @Bean
    public FlawedAuditLogService flawedAuditLogService(AuditLogRepository repo) {
      return new FlawedAuditLogService(repo);
    }

    @Bean
    public FlawedOuterBusinessService flawedOuterBusinessService(FlawedAuditLogService flawedAuditLogService, RecordingTransactionManager tx) {
      return new FlawedOuterBusinessService(flawedAuditLogService, tx);
    }
  }

  /**
   * Outer business service representing a clinical transaction.
   */
  public static class OuterBusinessService {
    private final AuditLogService auditLogService;
    private final RecordingTransactionManager txManager;
    private final List<String> committedBusinessRecords = new CopyOnWriteArrayList<>();

    public OuterBusinessService(AuditLogService auditLogService, RecordingTransactionManager txManager) {
      this.auditLogService = auditLogService;
      this.txManager = txManager;
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public void executeClinicalReviewWithFailure(UUID doctorId, String mrn, String failureReason) {
      // 1. Stage business modification in outer transaction
      txManager.stageBusinessRecord("CLINICAL_REVIEW_DRAFT:" + mrn);

      // 2. Call AuditLogService (which specifies Propagation.REQUIRES_NEW)
      auditLogService.logEvent(
          doctorId,
          "doctor@aura.health",
          "DOCTOR",
          "CLINICAL_CDS",
          "CLINICAL_REVIEW_ABORT_AUDIT",
          "SCREENING_RECORD",
          mrn,
          "127.0.0.1",
          "AuditHarness/1.0",
          "FAILURE_RECORDED",
          failureReason
      );

      // 3. Abort the outer business transaction
      throw new RuntimeException("Business Transaction Aborted: " + failureReason);
    }

    public List<String> getCommittedBusinessRecords() {
      return txManager.getCommittedBusinessRecords();
    }
  }

  /**
   * Flawed service reproducing the bug before AUD-01 (Propagation.REQUIRED instead of REQUIRES_NEW).
   */
  public static class FlawedAuditLogService {
    private final AuditLogRepository auditLogRepository;

    public FlawedAuditLogService(AuditLogRepository auditLogRepository) {
      this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public AuditLog logEvent(UUID userId, String email, String action, String resourceId, String details) {
      AuditLog log = new AuditLog(userId, email, null, "FLAWED", action, "RESOURCE", resourceId, "127.0.0.1", "Harness", "FAILURE", details);
      return auditLogRepository.save(log);
    }
  }

  public static class FlawedOuterBusinessService {
    private final FlawedAuditLogService flawedAuditLogService;
    private final RecordingTransactionManager txManager;

    public FlawedOuterBusinessService(FlawedAuditLogService flawedAuditLogService, RecordingTransactionManager txManager) {
      this.flawedAuditLogService = flawedAuditLogService;
      this.txManager = txManager;
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public void executeWithFlawedAuditAndFailure(UUID doctorId, String mrn, String reason) {
      txManager.stageBusinessRecord("FLAWED_DRAFT:" + mrn);
      flawedAuditLogService.logEvent(doctorId, "doctor@aura.health", "FLAWED_AUDIT", mrn, reason);
      throw new RuntimeException("Business Transaction Aborted: " + reason);
    }

    public List<String> getCommittedBusinessRecords() {
      return txManager.getCommittedBusinessRecords();
    }
  }

  /**
   * Mock database separating committed state from uncommitted transaction staging buffers.
   */
  public static class MockAuditDatabase {
    private final List<AuditLog> committedLogs = new CopyOnWriteArrayList<>();

    public void persistAuditLog(AuditLog log) {
      committedLogs.add(log);
    }

    public List<AuditLog> getCommittedLogs() {
      return Collections.unmodifiableList(new ArrayList<>(committedLogs));
    }

    public void clear() {
      committedLogs.clear();
    }
  }

  /**
   * Test PlatformTransactionManager implementing standard Spring transaction lifecycle,
   * isolating uncommitted staging per transaction and asserting suspension/resumption.
   */
  public static class RecordingTransactionManager extends AbstractPlatformTransactionManager {
    private final MockAuditDatabase database;

    private int suspensionEvents = 0;
    private int resumptionEvents = 0;
    private int committedTransactions = 0;
    private int rolledBackTransactions = 0;

    private final ThreadLocal<TxContext> activeTxContext = new ThreadLocal<>();
    private final List<String> committedBusinessRecords = new CopyOnWriteArrayList<>();

    public RecordingTransactionManager(MockAuditDatabase database) {
      this.database = database;
    }

    public static class TxContext {
      final String txId = UUID.randomUUID().toString();
      final List<AuditLog> stagedAuditLogs = new ArrayList<>();
      final List<String> stagedBusinessRecords = new ArrayList<>();
    }

    public static class TxObject {
      TxContext context;
    }

    public void stageAuditLog(AuditLog log) {
      TxContext ctx = activeTxContext.get();
      if (ctx != null) {
        ctx.stagedAuditLogs.add(log);
      } else {
        database.persistAuditLog(log);
      }
    }

    public void stageBusinessRecord(String record) {
      TxContext ctx = activeTxContext.get();
      if (ctx != null) {
        ctx.stagedBusinessRecords.add(record);
      } else {
        committedBusinessRecords.add(record);
      }
    }

    public List<String> getCommittedBusinessRecords() {
      return Collections.unmodifiableList(new ArrayList<>(committedBusinessRecords));
    }

    @Override
    protected Object doGetTransaction() throws TransactionException {
      TxObject txObject = new TxObject();
      txObject.context = activeTxContext.get();
      return txObject;
    }

    @Override
    protected boolean isExistingTransaction(Object transaction) throws TransactionException {
      TxObject txObject = (TxObject) transaction;
      return txObject.context != null;
    }

    @Override
    protected void doBegin(Object transaction, TransactionDefinition definition) throws TransactionException {
      TxObject txObject = (TxObject) transaction;
      TxContext newContext = new TxContext();
      txObject.context = newContext;
      activeTxContext.set(newContext);
    }

    @Override
    protected Object doSuspend(Object transaction) throws TransactionException {
      suspensionEvents++;
      TxObject txObject = (TxObject) transaction;
      txObject.context = null;
      TxContext suspended = activeTxContext.get();
      activeTxContext.remove();
      return suspended;
    }

    @Override
    protected void doResume(Object transaction, Object suspendedResources) throws TransactionException {
      resumptionEvents++;
      TxObject txObject = (TxObject) transaction;
      TxContext suspended = (TxContext) suspendedResources;
      txObject.context = suspended;
      activeTxContext.set(suspended);
    }

    @Override
    protected void doCommit(DefaultTransactionStatus status) throws TransactionException {
      committedTransactions++;
      TxObject txObject = (TxObject) status.getTransaction();
      TxContext ctx = txObject.context;
      if (ctx != null) {
        for (AuditLog log : ctx.stagedAuditLogs) {
          database.persistAuditLog(log);
        }
        committedBusinessRecords.addAll(ctx.stagedBusinessRecords);
        if (activeTxContext.get() == ctx) {
          activeTxContext.remove();
        }
      }
    }

    @Override
    protected void doRollback(DefaultTransactionStatus status) throws TransactionException {
      rolledBackTransactions++;
      TxObject txObject = (TxObject) status.getTransaction();
      TxContext ctx = txObject.context;
      if (ctx != null) {
        ctx.stagedAuditLogs.clear();
        ctx.stagedBusinessRecords.clear();
        if (activeTxContext.get() == ctx) {
          activeTxContext.remove();
        }
      }
    }

    public int getSuspensionEvents() { return suspensionEvents; }
    public int getResumptionEvents() { return resumptionEvents; }
    public int getCommittedTransactions() { return committedTransactions; }
    public int getRolledBackTransactions() { return rolledBackTransactions; }

    public void clear() {
      suspensionEvents = 0;
      resumptionEvents = 0;
      committedTransactions = 0;
      rolledBackTransactions = 0;
      committedBusinessRecords.clear();
      activeTxContext.remove();
    }
  }
}
