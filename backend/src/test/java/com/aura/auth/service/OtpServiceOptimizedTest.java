package com.aura.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.aura.auth.exception.AuthException;
import com.aura.common.response.ErrorCode;
import java.lang.reflect.Constructor;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("OtpService - Optimized Boundary Cooldown & Mail Config Unit Tests")
class OtpServiceOptimizedTest {

  @Mock private JavaMailSender mailSender;

  private OtpService otpService;
  private Map<String, Object> otpStorage;
  private Constructor<?> otpDataConstructor;

  @BeforeEach
  void setUp() throws Exception {
    otpService = new OtpService(mailSender);
    ReflectionTestUtils.setField(otpService, "senderEmail", "noreply@aura.hospital");
    @SuppressWarnings("unchecked")
    Map<String, Object> storage = (Map<String, Object>) ReflectionTestUtils.getField(otpService, "otpStorage");
    this.otpStorage = storage;

    Class<?> otpDataClass = Class.forName("com.aura.auth.service.OtpService$OtpData");
    this.otpDataConstructor = otpDataClass.getDeclaredConstructor(String.class, Instant.class, Instant.class, int.class);
    this.otpDataConstructor.setAccessible(true);
  }

  @ParameterizedTest(name = "Elapsed seconds: {0}s -> Should be blocked (AuthException)")
  @ValueSource(longs = {0, 1, 15, 30, 45, 58, 59})
  @DisplayName("sendOtp: Chặn gửi OTP khi chưa đủ 60 giây cooldown (< 60s)")
  void testCooldownBoundaryBlockedWithin60Seconds(long elapsedSeconds) throws Exception {
    String email = "cooldown.test@aurascreening.ai";
    Instant createdAt = Instant.now().minusSeconds(elapsedSeconds);
    Instant expiresAt = createdAt.plusSeconds(300);

    Object existingData = otpDataConstructor.newInstance("123456", createdAt, expiresAt, 0);
    otpStorage.put(email, existingData);

    assertThatThrownBy(() -> otpService.sendOtp(email, "Dr. User", "REGISTER"))
        .isInstanceOf(AuthException.class)
        .hasFieldOrPropertyWithValue("code", ErrorCode.INVALID_CREDENTIALS)
        .hasMessageContaining("Vui lòng đợi");

    verify(mailSender, never()).send(any(SimpleMailMessage.class));
  }

  @ParameterizedTest(name = "Elapsed seconds: {0}s -> Should allow sending OTP")
  @ValueSource(longs = {60, 61, 75, 120, 300})
  @DisplayName("sendOtp: Cho phép gửi tiếp OTP khi vừa đúng hoặc vượt quá 60 giây cooldown (>= 60s)")
  void testCooldownBoundaryAllowedAtOrAfter60Seconds(long elapsedSeconds) throws Exception {
    String email = "cooldown.allowed@aurascreening.ai";
    Instant createdAt = Instant.now().minusSeconds(elapsedSeconds);
    Instant expiresAt = createdAt.plusSeconds(300);

    Object existingData = otpDataConstructor.newInstance("987654", createdAt, expiresAt, 0);
    otpStorage.put(email, existingData);

    long validSeconds = otpService.sendOtp(email, "Dr. User", "REGISTER");

    assertThat(validSeconds).isEqualTo(300L);
    verify(mailSender).send(any(SimpleMailMessage.class));
  }

  @Test
  @DisplayName("sendOtp: Hoạt động bình thường khi mailSender là null (Không có cấu hình SMTP)")
  void testSendOtpWhenMailSenderIsNull() {
    OtpService serviceWithoutMail = new OtpService(null);
    ReflectionTestUtils.setField(serviceWithoutMail, "senderEmail", "noreply@aura.hospital");

    long validSeconds = serviceWithoutMail.sendOtp("nomail@aurascreening.ai", "Doctor Without Mail", "REGISTER");

    assertThat(validSeconds).isEqualTo(300L);
    assertThat(serviceWithoutMail.getLatestOtpForDebug("nomail@aurascreening.ai")).hasSize(6);
  }

  @ParameterizedTest(name = "senderEmail = \"{0}\" -> Should skip sending mail")
  @NullAndEmptySource
  @ValueSource(strings = {"   ", "\t", "\n"})
  @DisplayName("sendOtp: Bỏ qua gửi mail khi senderEmail rỗng hoặc chỉ có khoảng trắng")
  void testSendOtpWhenSenderEmailIsNullOrBlank(String blankSenderEmail) {
    ReflectionTestUtils.setField(otpService, "senderEmail", blankSenderEmail);

    long validSeconds = otpService.sendOtp("blank.email@aurascreening.ai", "Doctor Blank", "REGISTER");

    assertThat(validSeconds).isEqualTo(300L);
    verify(mailSender, never()).send(any(SimpleMailMessage.class));
  }

  @ParameterizedTest
  @CsvSource(value = {
    "Dr. Alice, Xin chào Dr. Alice,",
    "null, Xin chào Quý khách,"
  }, nullValues = {"null"})
  @DisplayName("sendOtp: Định dạng nội dung email chính xác với tên người nhận hoặc fallback Quý khách")
  void testEmailContentFormattingWithFullNameAndFallback(String fullName, String expectedGreeting) {
    String email = "greeting.test@aurascreening.ai";

    otpService.sendOtp(email, fullName, "REGISTER");

    ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
    verify(mailSender).send(captor.capture());
    SimpleMailMessage message = captor.getValue();

    assertThat(message.getFrom()).isEqualTo("noreply@aura.hospital");
    assertThat(message.getTo()).containsExactly(email);
    assertThat(message.getSubject()).isEqualTo("[AURA] Mã xác thực đăng ký tài khoản của bạn");
    assertThat(message.getText()).contains(expectedGreeting);
  }

  @Test
  @DisplayName("sendOtp: Không gián đoạn quy trình khi JavaMailSender ném ngoại lệ kết nối SMTP")
  void testSendOtpHandlesMailSendExceptionGracefully() {
    doThrow(new MailSendException("SMTP Connection Timeout: 587"))
        .when(mailSender)
        .send(any(SimpleMailMessage.class));

    assertThatCode(() -> otpService.sendOtp("smtp.fail@aurascreening.ai", "User", "REGISTER"))
        .doesNotThrowAnyException();

    String generatedOtp = otpService.getLatestOtpForDebug("smtp.fail@aurascreening.ai");
    assertThat(generatedOtp).isNotNull().hasSize(6);
  }
}
