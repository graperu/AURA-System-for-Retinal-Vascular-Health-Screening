package com.aura.auth.service;

import com.aura.auth.exception.AuthException;
import com.aura.common.response.ErrorCode;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class OtpService {
  private static final Logger log = LoggerFactory.getLogger(OtpService.class);
  private static final long OTP_VALID_SECONDS = 300; // 5 minutes
  private static final long RESEND_COOLDOWN_SECONDS = 60; // 60s cooldown
  private static final int MAX_ATTEMPTS = 5;

  private final JavaMailSender mailSender;

  @Value("${spring.mail.username:}")
  private String senderEmail;

  @Autowired
  public OtpService(@Autowired(required = false) JavaMailSender mailSender) {
    this.mailSender = mailSender;
  }

  private record OtpData(
      String code,
      Instant createdAt,
      Instant expiresAt,
      int attempts
  ) {}

  private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();
  private final SecureRandom secureRandom = new SecureRandom();

  public long sendOtp(String rawEmail, String fullName, String type) {
    String email = rawEmail.trim().toLowerCase(Locale.ROOT);
    Instant now = Instant.now();

    OtpData existing = otpStorage.get(email);
    if (existing != null && now.isBefore(existing.createdAt().plusSeconds(RESEND_COOLDOWN_SECONDS))) {
      long remaining = existing.createdAt().plusSeconds(RESEND_COOLDOWN_SECONDS).getEpochSecond() - now.getEpochSecond();
      throw new AuthException(
          ErrorCode.INVALID_CREDENTIALS,
          "Vui lòng đợi " + Math.max(1, remaining) + " giây trước khi yêu cầu mã OTP mới."
      );
    }

    String otp = String.format("%06d", secureRandom.nextInt(1_000_000));
    Instant expiresAt = now.plusSeconds(OTP_VALID_SECONDS);

    otpStorage.put(email, new OtpData(otp, now, expiresAt, 0));

    // 1. Log to console / docker logs for immediate inspection
    log.info("\n=======================================================\n"
        + "🔑 [AURA OTP SERVICE] MÃ XÁC THỰC EMAIL:\n"
        + "📧 Email: {}\n"
        + "👤 Người nhận: {}\n"
        + "🔢 Mã OTP (Hiệu lực 5 phút): {}\n"
        + "=======================================================",
        email, (fullName != null ? fullName : "Người dùng AURA"), otp);

    // 2. Dispatch real email via SMTP if configured
    if (mailSender != null && senderEmail != null && !senderEmail.isBlank()) {
      try {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(email);
        message.setSubject("[AURA] Mã xác thực đăng ký tài khoản của bạn");
        message.setText("Xin chào " + (fullName != null ? fullName : "Quý khách") + ",\n\n"
            + "Mã xác thực OTP của bạn là: " + otp + "\n"
            + "Mã có hiệu lực trong vòng 5 phút.\n\n"
            + "Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.\n\n"
            + "Trân trọng,\nĐội ngũ Hệ thống AURA");
        mailSender.send(message);
        log.info("Đã gửi email OTP thực tế thành công tới: {}", email);
      } catch (Exception e) {
        log.warn("Không thể gửi email OTP qua SMTP server: {}. Mã OTP vẫn hiển thị trong logs hệ thống.", e.getMessage());
      }
    }

    return OTP_VALID_SECONDS;
  }

  public String getLatestOtpForDebug(String rawEmail) {
    String email = rawEmail.trim().toLowerCase(Locale.ROOT);
    OtpData data = otpStorage.get(email);
    return data != null ? data.code() : null;
  }

  public boolean verifyOtp(String rawEmail, String inputOtp) {
    String email = rawEmail.trim().toLowerCase(Locale.ROOT);
    Instant now = Instant.now();

    OtpData data = otpStorage.get(email);
    if (data == null || now.isAfter(data.expiresAt())) {
      otpStorage.remove(email);
      throw new AuthException(ErrorCode.INVALID_CREDENTIALS, "Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng gửi lại mã mới.");
    }

    if (data.attempts() >= MAX_ATTEMPTS) {
      otpStorage.remove(email);
      throw new AuthException(ErrorCode.INVALID_CREDENTIALS, "Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu mã mới.");
    }

    if (!data.code().equals(inputOtp.trim())) {
      otpStorage.put(email, new OtpData(data.code(), data.createdAt(), data.expiresAt(), data.attempts() + 1));
      int remaining = MAX_ATTEMPTS - (data.attempts() + 1);
      throw new AuthException(ErrorCode.INVALID_CREDENTIALS, "Mã OTP không chính xác. Bạn còn " + remaining + " lần thử.");
    }

    // OTP verified successfully -> invalidate it
    otpStorage.remove(email);
    return true;
  }
}
