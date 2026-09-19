package com.aura.common.crypto;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * HIPAA NFR-9 Compliant JPA AttributeConverter for At-Rest AES-256 GCM Field Encryption.
 * Stores ciphertext with 12-byte random IV and 128-bit authentication tag prefixed with "ENC:".
 * Fail-Closed cryptographic implementation with dynamic key injection and zero prefix collision.
 */
@Converter
@Component
public class AesGcmAttributeConverter implements AttributeConverter<String, String> {

  private static final Logger log = LoggerFactory.getLogger(AesGcmAttributeConverter.class);
  private static final String ALGORITHM = "AES/GCM/NoPadding";
  public static final String PREFIX = "ENC:";
  private static final int TAG_LENGTH_BIT = 128;
  private static final int IV_LENGTH_BYTE = 12;
  private static final int MIN_ENCRYPTED_PAYLOAD_BYTE = IV_LENGTH_BYTE + (TAG_LENGTH_BIT / 8); // 28 bytes

  private static volatile SecretKey staticSecretKey;

  public AesGcmAttributeConverter() {}

  @Value("${aura.security.encryption.aes-key:${AURA_ENCRYPTION_AES_KEY:}}")
  public void setAesKey(String key) {
    if (key != null && !key.isBlank()) {
      staticSecretKey = deriveKey(key);
    }
  }

  public static void setStaticKey(String key) {
    if (key == null || key.isBlank()) {
      throw new IllegalArgumentException("AES encryption key cannot be null or blank");
    }
    staticSecretKey = deriveKey(key);
  }

  public static void resetKeyForTesting() {
    staticSecretKey = null;
  }

  private static SecretKey deriveKey(String rawKey) {
    try {
      byte[] keyBytes = rawKey.getBytes(StandardCharsets.UTF_8);
      if (keyBytes.length != 32) {
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        keyBytes = sha.digest(keyBytes);
      }
      return new SecretKeySpec(keyBytes, "AES");
    } catch (Exception e) {
      log.error("Failed to derive AES-256 key from provided configuration", e);
      throw new IllegalStateException("Không thể khởi tạo khóa mã hóa AES-256", e);
    }
  }

  private static SecretKey getRequiredKey() {
    SecretKey key = staticSecretKey;
    if (key == null) {
      String envKey = System.getenv("AURA_ENCRYPTION_AES_KEY");
      if (envKey != null && !envKey.isBlank()) {
        key = deriveKey(envKey);
        staticSecretKey = key;
      }
    }
    if (key == null) {
      throw new IllegalStateException(
          "Khóa mã hóa AES-256 chưa được cấu hình. Vui lòng thiết lập biến môi trường AURA_ENCRYPTION_AES_KEY hoặc thuộc tính aura.security.encryption.aes-key.");
    }
    return key;
  }

  private boolean isAlreadyEncrypted(String attribute) {
    if (attribute == null || !attribute.startsWith(PREFIX)) {
      return false;
    }
    try {
      byte[] decoded = Base64.getDecoder().decode(attribute.substring(PREFIX.length()));
      if (decoded.length < MIN_ENCRYPTED_PAYLOAD_BYTE) {
        return false;
      }
      ByteBuffer buffer = ByteBuffer.wrap(decoded);
      byte[] iv = new byte[IV_LENGTH_BYTE];
      buffer.get(iv);
      byte[] cipherText = new byte[buffer.remaining()];
      buffer.get(cipherText);

      SecretKey secretKey = getRequiredKey();
      Cipher cipher = Cipher.getInstance(ALGORITHM);
      cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BIT, iv));
      cipher.doFinal(cipherText);
      return true;
    } catch (Exception e) {
      return false;
    }
  }

  @Override
  public String convertToDatabaseColumn(String attribute) {
    if (attribute == null || attribute.isBlank()) {
      return attribute;
    }
    if (isAlreadyEncrypted(attribute)) {
      return attribute;
    }

    try {
      SecretKey secretKey = getRequiredKey();
      byte[] iv = new byte[IV_LENGTH_BYTE];
      new SecureRandom().nextBytes(iv);

      Cipher cipher = Cipher.getInstance(ALGORITHM);
      cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BIT, iv));

      byte[] cipherText = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));

      ByteBuffer buffer = ByteBuffer.allocate(iv.length + cipherText.length);
      buffer.put(iv);
      buffer.put(cipherText);

      return PREFIX + Base64.getEncoder().encodeToString(buffer.array());
    } catch (Exception e) {
      log.error("AES-256 GCM encryption failed for sensitive PII attribute", e);
      throw new IllegalStateException("Không thể mã hóa dữ liệu y tế nhạy cảm (AES-256 GCM)", e);
    }
  }

  @Override
  public String convertToEntityAttribute(String dbData) {
    if (dbData == null || !dbData.startsWith(PREFIX)) {
      // Dữ liệu cũ chưa mã hóa (legacy unencrypted) được giữ nguyên để tương thích ngược
      return dbData;
    }

    try {
      byte[] decoded = Base64.getDecoder().decode(dbData.substring(PREFIX.length()));
      if (decoded.length < MIN_ENCRYPTED_PAYLOAD_BYTE) {
        throw new IllegalArgumentException(
            "Payload mã hóa không hợp lệ: độ dài " + decoded.length + " bytes nhỏ hơn mức tối thiểu " + MIN_ENCRYPTED_PAYLOAD_BYTE);
      }

      ByteBuffer buffer = ByteBuffer.wrap(decoded);
      byte[] iv = new byte[IV_LENGTH_BYTE];
      buffer.get(iv);

      byte[] cipherText = new byte[buffer.remaining()];
      buffer.get(cipherText);

      SecretKey secretKey = getRequiredKey();
      Cipher cipher = Cipher.getInstance(ALGORITHM);
      cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BIT, iv));

      byte[] plainTextBytes = cipher.doFinal(cipherText);
      return new String(plainTextBytes, StandardCharsets.UTF_8);
    } catch (Exception e) {
      // FAIL-CLOSED: Tuyệt đối không trả về raw dbData (tránh rò rỉ ciphertext và mã hóa kép)
      log.error("AES-256 GCM decryption failed for ciphertext; failing closed for clinical data integrity", e);
      throw new SecurityException("Không thể giải mã dữ liệu y tế nhạy cảm: dữ liệu bị hư hỏng hoặc chữ ký xác thực không hợp lệ", e);
    }
  }

  public static String encryptString(String raw) {
    if (raw == null) return null;
    return new AesGcmAttributeConverter().convertToDatabaseColumn(raw);
  }

  public static String decryptString(String cipherText) {
    if (cipherText == null) return null;
    return new AesGcmAttributeConverter().convertToEntityAttribute(cipherText);
  }
}
