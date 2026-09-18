package com.aura.common.crypto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
  @DisplayName("convertToDatabaseColumn: Chuỗi đã có tiền tố ENC: không bị mã hóa lặp")
  void idempotentEncryption() {
    String alreadyEncrypted = "ENC:abc123456xyz";
    String result = converter.convertToDatabaseColumn(alreadyEncrypted);

    assertThat(result).isEqualTo(alreadyEncrypted);
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
