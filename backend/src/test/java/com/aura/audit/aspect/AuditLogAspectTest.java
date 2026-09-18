package com.aura.audit.aspect;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.aura.audit.annotation.Audited;
import com.aura.audit.service.AuditLogService;
import com.aura.auth.security.AuraUserPrincipal;
import java.lang.reflect.Method;
import java.util.List;
import java.util.UUID;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

class AuditLogAspectTest {

  private AuditLogService auditLogService;
  private AuditLogAspect aspect;

  @BeforeEach
  void setUp() {
    auditLogService = mock(AuditLogService.class);
    aspect = new AuditLogAspect(auditLogService);

    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setRemoteAddr("192.168.1.100");
    request.addHeader("User-Agent", "AURA-Doctor-Station/1.0");
    RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
    RequestContextHolder.resetRequestAttributes();
  }

  @Test
  @DisplayName("Thực thi thành công: ghi nhận AuditLog với trạng thái SUCCESS và đầy đủ thông tin định danh")
  void successfulMethodAudited() throws Throwable {
    UUID userId = UUID.randomUUID();
    AuraUserPrincipal principal = new AuraUserPrincipal(userId, "doctor@aura.test", "BS. Minh", true, List.of("DOCTOR"));
    SecurityContextHolder.getContext().setAuthentication(
        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

    ProceedingJoinPoint joinPoint = mock(ProceedingJoinPoint.class);
    MethodSignature signature = mock(MethodSignature.class);
    Method dummyMethod = SampleAuditedClass.class.getMethod("dummyAuditedMethod", UUID.class);
    when(signature.getMethod()).thenReturn(dummyMethod);
    when(joinPoint.getSignature()).thenReturn(signature);
    UUID resourceId = UUID.randomUUID();
    when(joinPoint.getArgs()).thenReturn(new Object[]{resourceId});
    when(joinPoint.proceed()).thenReturn("SUCCESS_RESULT");

    Audited annotation = dummyMethod.getAnnotation(Audited.class);

    Object result = aspect.logAuditedMethod(joinPoint, annotation);

    assertThat(result).isEqualTo("SUCCESS_RESULT");

    ArgumentCaptor<String> actionCaptor = ArgumentCaptor.forClass(String.class);
    ArgumentCaptor<String> statusCaptor = ArgumentCaptor.forClass(String.class);
    ArgumentCaptor<String> emailCaptor = ArgumentCaptor.forClass(String.class);
    ArgumentCaptor<String> resourceIdCaptor = ArgumentCaptor.forClass(String.class);

    verify(auditLogService).logEvent(
        eq(userId),
        emailCaptor.capture(),
        eq("DOCTOR"),
        eq("PATIENT"),
        actionCaptor.capture(),
        eq("PATIENT_PROFILE"),
        resourceIdCaptor.capture(),
        eq("192.168.1.100"),
        eq("AURA-Doctor-Station/1.0"),
        statusCaptor.capture(),
        anyString());

    assertThat(emailCaptor.getValue()).isEqualTo("doctor@aura.test");
    assertThat(actionCaptor.getValue()).isEqualTo("PHI_READ");
    assertThat(statusCaptor.getValue()).isEqualTo("SUCCESS");
    assertThat(resourceIdCaptor.getValue()).isEqualTo(resourceId.toString());
  }

  @Test
  @DisplayName("Thực thi thất bại (ném exception): ghi nhận AuditLog với trạng thái FAILURE và tiếp tục rethrow exception")
  void failedMethodAudited() throws Throwable {
    UUID userId = UUID.randomUUID();
    AuraUserPrincipal principal = new AuraUserPrincipal(userId, "admin@aura.test", "Admin User", true, List.of("ADMIN"));
    SecurityContextHolder.getContext().setAuthentication(
        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

    ProceedingJoinPoint joinPoint = mock(ProceedingJoinPoint.class);
    MethodSignature signature = mock(MethodSignature.class);
    Method dummyMethod = SampleAuditedClass.class.getMethod("dummyAuditedMethod", UUID.class);
    when(signature.getMethod()).thenReturn(dummyMethod);
    when(joinPoint.getSignature()).thenReturn(signature);
    when(joinPoint.getArgs()).thenReturn(new Object[]{UUID.randomUUID()});
    when(joinPoint.proceed()).thenThrow(new IllegalArgumentException("Hồ sơ không hợp lệ"));

    Audited annotation = dummyMethod.getAnnotation(Audited.class);

    assertThatThrownBy(() -> aspect.logAuditedMethod(joinPoint, annotation))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Hồ sơ không hợp lệ");

    verify(auditLogService).logEvent(
        eq(userId),
        eq("admin@aura.test"),
        eq("ADMIN"),
        eq("PATIENT"),
        eq("PHI_READ_FAILED"),
        eq("PATIENT_PROFILE"),
        any(),
        eq("192.168.1.100"),
        eq("AURA-Doctor-Station/1.0"),
        eq("FAILURE"),
        contains("Hồ sơ không hợp lệ"));
  }

  @Test
  @DisplayName("Khi AuditLogService gặp sự cố lưu CSDL, không làm gián đoạn nghiệp vụ")
  void auditDbFailureDoesNotBreakBusinessMethod() throws Throwable {
    when(auditLogService.logEvent(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
        .thenThrow(new RuntimeException("PostgreSQL audit_logs table deadlock"));

    ProceedingJoinPoint joinPoint = mock(ProceedingJoinPoint.class);
    MethodSignature signature = mock(MethodSignature.class);
    Method dummyMethod = SampleAuditedClass.class.getMethod("dummyAuditedMethod", UUID.class);
    when(signature.getMethod()).thenReturn(dummyMethod);
    when(joinPoint.getSignature()).thenReturn(signature);
    when(joinPoint.getArgs()).thenReturn(new Object[]{UUID.randomUUID()});
    when(joinPoint.proceed()).thenReturn("OK_PROCEED");

    Audited annotation = dummyMethod.getAnnotation(Audited.class);

    Object result = aspect.logAuditedMethod(joinPoint, annotation);
    assertThat(result).isEqualTo("OK_PROCEED");
  }

  static class SampleAuditedClass {
    @Audited(action = "PHI_READ", module = "PATIENT", resourceType = "PATIENT_PROFILE", description = "Đọc hồ sơ bệnh nhân")
    public String dummyAuditedMethod(UUID patientId) {
      return "dummy";
    }
  }
}
