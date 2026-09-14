package com.aura.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

import com.aura.auth.exception.AuthException;
import com.aura.common.response.ErrorCode;
import java.lang.reflect.Constructor;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

  @Mock private JavaMailSender mailSender;

  private OtpService otpServiceWithMail;
  private OtpService otpServiceWithoutMail;

  @BeforeEach
  void setUp() {
    otpServiceWithMail = new OtpService(mailSender);
    ReflectionTestUtils.setField(otpServiceWithMail, "senderEmail", "noreply@aura.com");

    otpServiceWithoutMail = new OtpService(null);
  }

  @Nested
  @DisplayName("generateAndSendOtp tests")
  class SendOtpTests {

    @Test
    @DisplayName("sendOtp without mailSender succeeds and stores 6-digit OTP in memory")
    void sendOtp_WithoutMailSender_StoresOtp() {
      // Act
      long validSeconds = otpServiceWithoutMail.sendOtp("test@example.com", "Nguyễn Văn A", "REGISTER");

      // Assert
      assertThat(validSeconds).isEqualTo(300L);
      String code = otpServiceWithoutMail.getLatestOtpForDebug("test@example.com");
      assertThat(code).isNotNull().matches("\\d{6}");
    }

    @Test
    @DisplayName("sendOtp normalizes email case and whitespace")
    void sendOtp_NormalizesEmail() {
      // Act
      otpServiceWithoutMail.sendOtp("  User@Example.COM  ", "User", "REGISTER");

      // Assert
      String code = otpServiceWithoutMail.getLatestOtpForDebug("user@example.com");
      assertThat(code).isNotNull().matches("\\d{6}");
    }

    @Test
    @DisplayName("sendOtp with configured mailSender dispatches SimpleMailMessage")
    void sendOtp_WithMailSender_DispatchesMessage() {
      // Act
      long validSeconds = otpServiceWithMail.sendOtp("patient@aura.com", "Lê Văn C", "REGISTER");

      // Assert
      assertThat(validSeconds).isEqualTo(300L);
      var captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
      verify(mailSender).send(captor.capture());
      SimpleMailMessage sent = captor.getValue();
      assertThat(sent.getFrom()).isEqualTo("noreply@aura.com");
      assertThat(sent.getTo()).containsExactly("patient@aura.com");
      assertThat(sent.getSubject()).contains("[AURA] Mã xác thực đăng ký tài khoản");
      assertThat(sent.getText()).contains("Lê Văn C");
      String code = otpServiceWithMail.getLatestOtpForDebug("patient@aura.com");
      assertThat(sent.getText()).contains(code);
    }

    @Test
    @DisplayName("sendOtp handles mailSender exception gracefully without failing")
    void sendOtp_MailSenderThrowsException_DoesNotPropagate() {
      // Arrange
      doThrow(new MailSendException("SMTP server connection failed"))
          .when(mailSender).send(any(SimpleMailMessage.class));

      // Act
      long validSeconds = otpServiceWithMail.sendOtp("patient@aura.com", "Lê Văn C", "REGISTER");

      // Assert
      assertThat(validSeconds).isEqualTo(300L);
      String code = otpServiceWithMail.getLatestOtpForDebug("patient@aura.com");
      assertThat(code).isNotNull().matches("\\d{6}");
    }

    @Test
    @DisplayName("sendOtp rejects consecutive request within 60s cooldown period")
    void sendOtp_CooldownActive_ThrowsException() {
      // Arrange
      otpServiceWithoutMail.sendOtp("cooldown@aura.com", "User", "REGISTER");

      // Act & Assert
      assertThatThrownBy(() -> otpServiceWithoutMail.sendOtp("cooldown@aura.com", "User", "REGISTER"))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.INVALID_CREDENTIALS);
            assertThat(e.getMessage()).contains("Vui lòng đợi");
          });
    }
  }

  @Nested
  @DisplayName("verifyOtp tests")
  class VerifyOtpTests {

    @Test
    @DisplayName("verifyOtp with correct code succeeds and invalidates code")
    void verifyOtp_Success() {
      // Arrange
      otpServiceWithoutMail.sendOtp("success@aura.com", "User", "REGISTER");
      String code = otpServiceWithoutMail.getLatestOtpForDebug("success@aura.com");

      // Act
      boolean result = otpServiceWithoutMail.verifyOtp("success@aura.com", code);

      // Assert
      assertThat(result).isTrue();
      // Second verification fails as OTP was removed
      assertThatThrownBy(() -> otpServiceWithoutMail.verifyOtp("success@aura.com", code))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.INVALID_CREDENTIALS);
            assertThat(e.getMessage()).contains("Mã OTP đã hết hạn hoặc không tồn tại");
          });
    }

    @Test
    @DisplayName("verifyOtp with whitespace around code succeeds")
    void verifyOtp_TrimsCode() {
      // Arrange
      otpServiceWithoutMail.sendOtp("trim@aura.com", "User", "REGISTER");
      String code = otpServiceWithoutMail.getLatestOtpForDebug("trim@aura.com");

      // Act
      boolean result = otpServiceWithoutMail.verifyOtp("  TRIM@aura.com  ", "  " + code + "  ");

      // Assert
      assertThat(result).isTrue();
    }

    @Test
    @DisplayName("verifyOtp with wrong code increments attempt counter and warns remaining attempts")
    void verifyOtp_WrongCode_IncrementsAttempts() {
      // Arrange
      otpServiceWithoutMail.sendOtp("wrong@aura.com", "User", "REGISTER");

      // Act & Assert (1st wrong attempt -> 4 remaining)
      assertThatThrownBy(() -> otpServiceWithoutMail.verifyOtp("wrong@aura.com", "000000"))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.INVALID_CREDENTIALS);
            assertThat(e.getMessage()).contains("Mã OTP không chính xác. Bạn còn 4 lần thử.");
          });

      // Act & Assert (2nd wrong attempt -> 3 remaining)
      assertThatThrownBy(() -> otpServiceWithoutMail.verifyOtp("wrong@aura.com", "111111"))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.INVALID_CREDENTIALS);
            assertThat(e.getMessage()).contains("Mã OTP không chính xác. Bạn còn 3 lần thử.");
          });
    }

    @Test
    @DisplayName("verifyOtp exceeds 5 attempts invalidates OTP and blocks further tries")
    void verifyOtp_ExceedsMaxAttempts_ThrowsException() {
      // Arrange
      otpServiceWithoutMail.sendOtp("max@aura.com", "User", "REGISTER");

      // Fail 5 times (attempts: 1, 2, 3, 4, 5)
      for (int i = 0; i < 5; i++) {
        final String wrongCode = String.format("%06d", i);
        try {
          otpServiceWithoutMail.verifyOtp("max@aura.com", wrongCode);
        } catch (AuthException ignored) {}
      }

      // 6th attempt: data.attempts() >= MAX_ATTEMPTS -> throws "quá số lần cho phép"
      assertThatThrownBy(() -> otpServiceWithoutMail.verifyOtp("max@aura.com", "999999"))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.INVALID_CREDENTIALS);
            assertThat(e.getMessage()).contains("Bạn đã nhập sai OTP quá số lần cho phép");
          });
    }

    @Test
    @DisplayName("verifyOtp with expired OTP throws expired exception and removes record")
    @SuppressWarnings("unchecked")
    void verifyOtp_ExpiredOtp_ThrowsException() throws Exception {
      // Arrange
      Class<?> otpDataClass = Class.forName("com.aura.auth.service.OtpService$OtpData");
      Constructor<?> constructor = otpDataClass.getDeclaredConstructor(String.class, Instant.class, Instant.class, int.class);
      constructor.setAccessible(true);
      Object expiredData = constructor.newInstance(
          "123456",
          Instant.now().minusSeconds(400),
          Instant.now().minusSeconds(100),
          0
      );

      Map<String, Object> storage = (Map<String, Object>) ReflectionTestUtils.getField(otpServiceWithoutMail, "otpStorage");
      storage.put("expired@aura.com", expiredData);

      // Act & Assert
      assertThatThrownBy(() -> otpServiceWithoutMail.verifyOtp("expired@aura.com", "123456"))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.INVALID_CREDENTIALS);
            assertThat(e.getMessage()).contains("Mã OTP đã hết hạn hoặc không tồn tại");
          });
      assertThat(storage.containsKey("expired@aura.com")).isFalse();
    }

    @Test
    @DisplayName("verifyOtp with non-existent email throws exception")
    void verifyOtp_NonExistentEmail_ThrowsException() {
      assertThatThrownBy(() -> otpServiceWithoutMail.verifyOtp("unknown@aura.com", "123456"))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.INVALID_CREDENTIALS);
            assertThat(e.getMessage()).contains("Mã OTP đã hết hạn hoặc không tồn tại");
          });
    }
  }

  @Nested
  @DisplayName("getLatestOtpForDebug tests")
  class DebugTests {

    @Test
    @DisplayName("getLatestOtpForDebug returns null for unknown email")
    void getLatestOtpForDebug_ReturnsNullForUnknown() {
      assertThat(otpServiceWithoutMail.getLatestOtpForDebug("unknown@aura.com")).isNull();
    }
  }
}
