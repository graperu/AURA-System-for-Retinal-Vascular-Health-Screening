package com.aura.common.crypto;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Tiện ích băm tìm kiếm mù (Blind Index HMAC-SHA256) cho các trường mã hóa AES-256 GCM (CON-01).
 * Đảm bảo tính toán băm tất định (deterministic hash) an toàn cho việc tra cứu chính xác trong CSDL
 * mà không để lộ dữ liệu bản rõ và không phụ thuộc vào ciphertext ngẫu nhiên.
 */
public final class BlindIndexUtil {

  private static final Logger log = LoggerFactory.getLogger(BlindIndexUtil.class);
  private static final String HMAC_ALGORITHM = "HmacSHA256";
  private static volatile byte[] blindIndexKeyBytes;

  private BlindIndexUtil() {}

  /**
   * Chuẩn hóa số điện thoại: loại bỏ khoảng trắng, dấu gạch nối, dấu ngoặc.
   * Đồng bộ tiền tố quốc tế (+84 / 84) về chuẩn 0.
   */
  public static String normalizePhone(String rawPhone) {
    if (rawPhone == null || rawPhone.isBlank()) {
      return null;
    }
    String cleaned = rawPhone.trim().replaceAll("[^0-9+]", "");
    if (cleaned.startsWith("+84")) {
      cleaned = "0" + cleaned.substring(3);
    } else if (cleaned.startsWith("84") && cleaned.length() > 9) {
      cleaned = "0" + cleaned.substring(2);
    }
    return cleaned.isEmpty() ? null : cleaned;
  }

  /**
   * Tính toán Blind Index (chuỗi hex 64 ký tự) từ số điện thoại.
   */
  public static String computePhoneHash(String rawPhone) {
    String normalized = normalizePhone(rawPhone);
    if (normalized == null) {
      return null;
    }
    return computeBlindIndex(normalized);
  }

  /**
   * Tính HMAC-SHA256 của chuỗi giá trị đã chuẩn hóa.
   */
  public static String computeBlindIndex(String value) {
    if (value == null) {
      return null;
    }
    try {
      Mac mac = Mac.getInstance(HMAC_ALGORITHM);
      mac.init(new SecretKeySpec(getKeyBytes(), HMAC_ALGORITHM));
      byte[] hash = mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(hash);
    } catch (Exception e) {
      log.error("Không thể tính toán blind index cho giá trị", e);
      throw new IllegalStateException("Lỗi tính toán Blind Index", e);
    }
  }

  private static byte[] getKeyBytes() {
    if (blindIndexKeyBytes == null) {
      synchronized (BlindIndexUtil.class) {
        if (blindIndexKeyBytes == null) {
          String key = System.getenv("AURA_BLIND_INDEX_KEY");
          if (key == null || key.isBlank()) {
            key = System.getenv("AURA_ENCRYPTION_AES_KEY");
          }
          if (key == null || key.isBlank()) {
            key = "AURA_SYSTEM_SECURE_BLIND_INDEX_KEY_2026_HMAC_SHA256_DEFAULT";
          }
          try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            blindIndexKeyBytes = sha.digest(key.getBytes(StandardCharsets.UTF_8));
          } catch (Exception e) {
            throw new IllegalStateException("Không thể khởi tạo khóa băm Blind Index", e);
          }
        }
      }
    }
    return blindIndexKeyBytes;
  }

  public static void setKeyForTesting(String testKey) {
    try {
      MessageDigest sha = MessageDigest.getInstance("SHA-256");
      blindIndexKeyBytes = sha.digest(testKey.getBytes(StandardCharsets.UTF_8));
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  public static void resetKeyForTesting() {
    blindIndexKeyBytes = null;
  }
}
