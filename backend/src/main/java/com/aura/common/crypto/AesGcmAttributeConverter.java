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
 * Gracefully handles unencrypted legacy fields.
 */
@Converter
@Component
public class AesGcmAttributeConverter implements AttributeConverter<String, String> {

  private static final Logger log = LoggerFactory.getLogger(AesGcmAttributeConverter.class);
  private static final String ALGORITHM = "AES/GCM/NoPadding";
  private static final String PREFIX = "ENC:";
  private static final int TAG_LENGTH_BIT = 128;
  private static final int IV_LENGTH_BYTE = 12;
  private static final String DEFAULT_KEY = "AURA_SYSTEM_SECURE_AES_KEY_2026_32BYTES_LEN_!!";

  private static volatile SecretKey staticSecretKey = deriveKey(DEFAULT_KEY);

  public AesGcmAttributeConverter() {}

  @Value("${aura.security.encryption.aes-key:" + DEFAULT_KEY + "}")
  public void setAesKey(String key) {
    if (key != null && !key.isBlank()) {
      staticSecretKey = deriveKey(key);
    }
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
      log.error("Failed to derive AES-256 key, falling back to default", e);
      return new SecretKeySpec(DEFAULT_KEY.getBytes(StandardCharsets.UTF_8), "AES");
    }
  }

  @Override
  public String convertToDatabaseColumn(String attribute) {
    if (attribute == null || attribute.isBlank()) {
      return attribute;
    }
    if (attribute.startsWith(PREFIX)) {
      return attribute;
    }

    try {
      byte[] iv = new byte[IV_LENGTH_BYTE];
      new SecureRandom().nextBytes(iv);

      Cipher cipher = Cipher.getInstance(ALGORITHM);
      cipher.init(Cipher.ENCRYPT_MODE, staticSecretKey, new GCMParameterSpec(TAG_LENGTH_BIT, iv));

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
      return dbData;
    }

    try {
      byte[] decoded = Base64.getDecoder().decode(dbData.substring(PREFIX.length()));
      if (decoded.length <= IV_LENGTH_BYTE) {
        return dbData;
      }

      ByteBuffer buffer = ByteBuffer.wrap(decoded);
      byte[] iv = new byte[IV_LENGTH_BYTE];
      buffer.get(iv);

      byte[] cipherText = new byte[buffer.remaining()];
      buffer.get(cipherText);

      Cipher cipher = Cipher.getInstance(ALGORITHM);
      cipher.init(Cipher.DECRYPT_MODE, staticSecretKey, new GCMParameterSpec(TAG_LENGTH_BIT, iv));

      byte[] plainTextBytes = cipher.doFinal(cipherText);
      return new String(plainTextBytes, StandardCharsets.UTF_8);
    } catch (Exception e) {
      log.error("AES-256 GCM decryption failed for ciphertext; returning raw data for safety", e);
      return dbData;
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
