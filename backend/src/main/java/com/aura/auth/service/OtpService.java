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
import org.springframework.stereotype.Service;

@Service
public class OtpService {
  private static final Logger log = LoggerFactory.getLogger(OtpService.class);
  private static final long OTP_VALID_SECONDS = 300; // 5 minutes
  private static final long RESEND_COOLDOWN_SECONDS = 60; // 60s cooldown
  private static final int MAX_ATTEMPTS = 5;

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

    // Log to console/logger for development & monitoring
    log.info("\n=======================================================\n"
        + "🔑 [AURA OTP SERVICE] MÃ XÁC THỰC EMAIL:\n"
        + "📧 Email: {}\n"
        + "👤 Người nhận: {}\n"
        + "🔢 Mã OTP (Hiệu lực 5 phút): {}\n"
        + "=======================================================",
        email, (fullName != null ? fullName : "Người dùng AURA"), otp);

    return OTP_VALID_SECONDS;
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
