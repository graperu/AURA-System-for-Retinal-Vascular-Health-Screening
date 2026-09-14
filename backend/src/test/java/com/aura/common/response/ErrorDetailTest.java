package com.aura.common.response;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ErrorDetailTest {

  @Test
  @DisplayName("Khởi tạo ErrorDetail và kiểm tra các phương thức accessors (field, message)")
  void testConstructorAndAccessors() {
    ErrorDetail errorDetail = new ErrorDetail("email", "Email không đúng định dạng chuẩn");

    assertThat(errorDetail.field()).isEqualTo("email");
    assertThat(errorDetail.message()).isEqualTo("Email không đúng định dạng chuẩn");
  }

  @Test
  @DisplayName("Khởi tạo ErrorDetail với giá trị null")
  void testNullValues() {
    ErrorDetail errorDetail = new ErrorDetail(null, null);

    assertThat(errorDetail.field()).isNull();
    assertThat(errorDetail.message()).isNull();
  }

  @Test
  @DisplayName("Kiểm tra hợp đồng equals và hashCode")
  void testEqualsAndHashCode() {
    ErrorDetail detail1 = new ErrorDetail("password", "Mật khẩu quá ngắn");
    ErrorDetail detail2 = new ErrorDetail("password", "Mật khẩu quá ngắn");
    ErrorDetail differentField = new ErrorDetail("username", "Mật khẩu quá ngắn");
    ErrorDetail differentMessage = new ErrorDetail("password", "Mật khẩu không khớp");
    ErrorDetail nullFields1 = new ErrorDetail(null, null);
    ErrorDetail nullFields2 = new ErrorDetail(null, null);

    // Reflexive
    assertThat(detail1).isEqualTo(detail1);
    assertThat(detail1.hashCode()).isEqualTo(detail1.hashCode());

    // Symmetric
    assertThat(detail1).isEqualTo(detail2);
    assertThat(detail2).isEqualTo(detail1);
    assertThat(detail1.hashCode()).isEqualTo(detail2.hashCode());

    // With null values
    assertThat(nullFields1).isEqualTo(nullFields2);
    assertThat(nullFields1.hashCode()).isEqualTo(nullFields2.hashCode());

    // Non-equality checks
    assertThat(detail1).isNotEqualTo(null);
    assertThat(detail1).isNotEqualTo("some string object");
    assertThat(detail1).isNotEqualTo(differentField);
    assertThat(detail1).isNotEqualTo(differentMessage);
    assertThat(detail1).isNotEqualTo(nullFields1);
    assertThat(nullFields1).isNotEqualTo(detail1);
  }

  @Test
  @DisplayName("Kiểm tra toString() chứa đầy đủ tên trường và thông điệp lỗi")
  void testToString() {
    ErrorDetail errorDetail = new ErrorDetail("imageUrl", "URL ảnh không được để trống");
    String str = errorDetail.toString();

    assertThat(str).contains("ErrorDetail");
    assertThat(str).contains("imageUrl");
    assertThat(str).contains("URL ảnh không được để trống");
  }
}
