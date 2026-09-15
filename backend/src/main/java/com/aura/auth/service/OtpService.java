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
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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

    // 1. Log audit notification with OTP code for backend verification
    log.info("================================================================================");
    log.info(">>> [AURA AUTH OTP] Mã OTP xác thực cho email [{}]: {} <<<", email, otp);
    log.info("================================================================================");

    // 2. Dispatch real email via SMTP if configured
    if (mailSender != null && senderEmail != null && !senderEmail.isBlank()) {
      try {
        boolean sentHtml = false;
        try {
          MimeMessage mimeMessage = mailSender.createMimeMessage();
          if (mimeMessage != null) {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(senderEmail, "Hệ thống Y tế AURA");
            helper.setTo(email);
            helper.setSubject("[AURA] Mã xác thực đăng ký tài khoản của bạn");
            helper.setText(buildHtmlEmail(fullName, otp), true);
            mailSender.send(mimeMessage);
            sentHtml = true;
            log.info("Đã gửi email OTP định dạng HTML thành công tới: {}", maskEmail(email));
          }
        } catch (Throwable t) {
          log.warn("Fallback to SimpleMailMessage: {}", t.getMessage());
        }

        if (!sentHtml) {
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
          log.info("Đã gửi email OTP thực tế thành công tới: {}", maskEmail(email));
        }
      } catch (Exception e) {
        log.warn("Không thể gửi email OTP qua SMTP server: {}", e.getMessage());
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

  private String maskEmail(String email) {
    if (email == null || !email.contains("@")) {
      return "***";
    }
    int atIndex = email.indexOf('@');
    String namePart = email.substring(0, atIndex);
    String domainPart = email.substring(atIndex);
    if (namePart.length() <= 1) {
      return "*..." + domainPart;
    }
    return namePart.charAt(0) + "***" + domainPart;
  }

  private String buildHtmlEmail(String fullName, String otp) {
    String displayName = (fullName != null && !fullName.isBlank()) ? fullName.trim() : "Quý khách";
    return """
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mã xác thực AURA</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 15px;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.03); border: 1px solid #e2e8f0;">

                  <!-- Header Banner -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); padding: 36px 32px; text-align: center;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center">
                            <span style="display: inline-block; padding: 6px 14px; background-color: rgba(255, 255, 255, 0.2); border-radius: 20px; color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
                              HỆ THỐNG Y TẾ AURA
                            </span>
                            <h1 style="margin: 14px 0 0 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                              Mã Xác Thực Tài Khoản
                            </h1>
                            <p style="margin: 6px 0 0 0; color: #ccfbf1; font-size: 13px;">
                              Hệ thống Sàng lọc Sức khỏe Vi mạch Võng mạc
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 36px 32px 28px 32px;">
                      <p style="margin: 0 0 16px 0; color: #1e293b; font-size: 15px; line-height: 1.6;">
                        Xin chào <strong style="color: #0f766e;">{{FULL_NAME}}</strong>,
                      </p>
                      <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                        Bạn đang thực hiện thao tác đăng ký tài khoản trên hệ thống <strong>AURA</strong>. Vui lòng sử dụng mã xác thực dùng một lần (OTP) dưới đây để hoàn tất kích hoạt tài khoản:
                      </p>

                      <!-- OTP Box -->
                      <div style="margin: 28px 0; padding: 24px 20px; background-color: #f0fdfa; border: 2px dashed #0d9488; border-radius: 16px; text-align: center;">
                        <span style="display: block; font-size: 11px; font-weight: 700; color: #0f766e; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                          MÃ XÁC THỰC CỦA BẠN
                        </span>
                        <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #0f766e; letter-spacing: 12px; margin: 10px 0; padding-left: 12px;">
                          {{OTP_CODE}}
                        </div>
                        <span style="display: inline-block; font-size: 12px; color: #0d9488; font-weight: 600; margin-top: 4px;">
                          ⏱️ Mã có hiệu lực trong vòng 5 phút (300 giây)
                        </span>
                      </div>

                      <!-- Security Warning -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 14px 16px; color: #92400e; font-size: 13px; line-height: 1.5;">
                            <strong>Lưu ý an toàn:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Nhân viên y tế và quản trị viên hệ thống AURA sẽ không bao giờ yêu cầu bạn cung cấp mã xác thực OTP.
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                        Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này một cách an toàn.
                      </p>
                    </td>
                  </tr>

                  <!-- Divider -->
                  <tr>
                    <td style="padding: 0 32px;">
                      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0;">
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; background-color: #f8fafc; text-align: center;">
                      <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px; font-weight: 600;">
                        AURA - Retinal Vascular Health Screening System
                      </p>
                      <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                        © 2026 AURA System. Tiêu chuẩn lâm sàng & Bảo vệ thông tin y tế theo chuẩn HIPAA.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """.replace("{{FULL_NAME}}", displayName).replace("{{OTP_CODE}}", otp);
  }
}
