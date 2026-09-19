package com.aura.common.crypto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Base64;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AesGcmAttributeConverterTest {

  private AesGcmAttributeConverter converter;

  @BeforeEach
  void setUp() {
    converter = new AesGcmAttributeConverter();
    converter.setAesKey("AURA_TEST_AES_KEY_32_BYTES_SECURE_2026!!");
  }

  @Test
  @DisplayName("convertToDatabaseColumn: Mã hóa AES-256 GCM thành công với tiền tố ENC: và Base64")
  void convertToDatabaseColumn_success() {
    String rawPhone = "+84912345678";
    String encrypted = converter.convertToDatabaseColumn(rawPhone);

    assertThat(encrypted).isNotNull();
    assertThat(encrypted).startsWith("ENC:");
    assertThat(encrypted).isNotEqualTo(rawPhone);
    assertThat(encrypted.length()).isGreaterThan(rawPhone.length());
  }

  @Test
  @DisplayName("convertToEntityAttribute: Giải mã AES-256 GCM khôi phục chính xác dữ liệu gốc")
  void convertToEntityAttribute_roundTrip() {
    String originalAddress = "123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh";
    String encrypted = converter.convertToDatabaseColumn(originalAddress);
    String decrypted = converter.convertToEntityAttribute(encrypted);

    assertThat(decrypted).isEqualTo(originalAddress);
  }

  @Test
  @DisplayName("convertToDatabaseColumn: Hai lần mã hóa cùng dữ liệu sinh ciphertext khác nhau do random IV")
  void convertToDatabaseColumn_producesUniqueCiphertextDueToRandomIv() {
    String phone = "0987654321";
    String enc1 = converter.convertToDatabaseColumn(phone);
    String enc2 = converter.convertToDatabaseColumn(phone);

    assertThat(enc1).isNotEqualTo(enc2);
    assertThat(converter.convertToEntityAttribute(enc1)).isEqualTo(phone);
    assertThat(converter.convertToEntityAttribute(enc2)).isEqualTo(phone);
  }

  @Test
  @DisplayName("convertToDatabaseColumn / EntityAttribute: Xử lý an toàn giá trị null và rỗng")
  void handleNullAndBlankGracefully() {
    assertThat(converter.convertToDatabaseColumn(null)).isNull();
    assertThat(converter.convertToDatabaseColumn("")).isEqualTo("");
    assertThat(converter.convertToDatabaseColumn("   ")).isEqualTo("   ");

    assertThat(converter.convertToEntityAttribute(null)).isNull();
    assertThat(converter.convertToEntityAttribute("")).isEqualTo("");
  }

  @Test
  @DisplayName("convertToEntityAttribute: Dữ liệu cũ chưa mã hóa (không có tiền tố ENC:) được giữ nguyên")
  void legacyUnencryptedDataRemainsIntact() {
    String legacyPhone = "0901234567";
    String result = converter.convertToEntityAttribute(legacyPhone);

    assertThat(result).isEqualTo(legacyPhone);
  }

  @Test
  @DisplayName("convertToDatabaseColumn: Chuỗi đã được mã hóa hợp lệ không bị mã hóa lặp (idempotent)")
  void idempotentEncryption() {
    String original = "0987654321";
    String encrypted = converter.convertToDatabaseColumn(original);
    String reEncrypted = converter.convertToDatabaseColumn(encrypted);

    assertThat(reEncrypted).isEqualTo(encrypted);
    assertThat(converter.convertToEntityAttribute(reEncrypted)).isEqualTo(original);
  }

  @Test
  @DisplayName("convertToDatabaseColumn: Plaintext bắt đầu bằng ENC: được mã hóa an toàn (loại bỏ prefix collision)")
  void convertToDatabaseColumn_plaintextStartingWithEncPrefix_isEncrypted() {
    String raw = "ENC:0912345678";
    String encrypted = converter.convertToDatabaseColumn(raw);

    assertThat(encrypted).startsWith("ENC:");
    assertThat(encrypted).isNotEqualTo(raw);
    assertThat(converter.convertToEntityAttribute(encrypted)).isEqualTo(raw);
  }

  @Test
  @DisplayName("convertToEntityAttribute: Payload bị tamper hoặc auth tag sai ném SecurityException (Fail-Closed)")
  void convertToEntityAttribute_corruptedPayload_throwsSecurityException() {
    String encrypted = converter.convertToDatabaseColumn("Secret Clinical Note");
    byte[] decoded = Base64.getDecoder().decode(encrypted.substring(4));
    decoded[decoded.length - 1] ^= 0x01; // tamper last byte of auth tag
    String tampered = "ENC:" + Base64.getEncoder().encodeToString(decoded);

    assertThatThrownBy(() -> converter.convertToEntityAttribute(tampered))
        .isInstanceOf(SecurityException.class)
        .hasMessageContaining("Không thể giải mã dữ liệu y tế nhạy cảm");
  }

  @Test
  @DisplayName("convertToEntityAttribute: Payload quá ngắn không đủ IV/Tag ném SecurityException")
  void convertToEntityAttribute_truncatedPayload_throwsSecurityException() {
    String truncated = "ENC:" + Base64.getEncoder().encodeToString(new byte[10]);

    assertThatThrownBy(() -> converter.convertToEntityAttribute(truncated))
        .isInstanceOf(SecurityException.class);
  }

  @Test
  @DisplayName("Static helper methods encryptString / decryptString hoạt động đúng")
  void staticHelpersWork() {
    String text = "Bệnh viện Đa khoa Trung ương";
    String enc = AesGcmAttributeConverter.encryptString(text);
    assertThat(enc).startsWith("ENC:");
    String dec = AesGcmAttributeConverter.decryptString(enc);
    assertThat(dec).isEqualTo(text);
  }
}
