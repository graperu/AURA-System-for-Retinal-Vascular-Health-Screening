package com.aura.billing.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.aura.billing.dto.CreateServicePackageRequest;
import com.aura.billing.dto.ServicePackageResponse;
import com.aura.billing.dto.UpdateServicePackageRequest;
import com.aura.billing.dto.UpdateServicePackageStatusRequest;
import com.aura.billing.entity.PackageScope;
import com.aura.billing.exception.ServicePackageNotFoundException;
import com.aura.billing.service.ServicePackageService;
import com.aura.common.exception.GlobalExceptionHandler;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class AdminServicePackageControllerTest {

  @Mock
  private ServicePackageService servicePackageService;

  @InjectMocks
  private AdminServicePackageController controller;

  private MockMvc mockMvc;
  private ObjectMapper objectMapper;

  private Long packageId;
  private ServicePackageResponse samplePackageResponse;

  @BeforeEach
  void setUp() {
    mockMvc = MockMvcBuilders.standaloneSetup(controller)
        .setControllerAdvice(new GlobalExceptionHandler())
        .build();
    objectMapper = new ObjectMapper();

    packageId = 100L;
    samplePackageResponse = new ServicePackageResponse(
        packageId,
        "Gói Tiêu Chuẩn Sàng Lọc",
        "Gói sàng lọc 5 lượt ảnh đáy mắt",
        PackageScope.INDIVIDUAL,
        BigDecimal.valueOf(199000),
        5,
        30,
        true
    );
  }

  @Nested
  @DisplayName("GET /api/v1/admin/packages - Danh sách tất cả gói dịch vụ (FR-34)")
  class ListAllPackagesTests {

    @Test
    @DisplayName("Lấy danh sách tất cả gói dịch vụ thành công -> HTTP 200")
    void listAll_success() throws Exception {
      when(servicePackageService.listAll()).thenReturn(List.of(samplePackageResponse));

      mockMvc.perform(get("/api/v1/admin/packages"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data[0].id").value(packageId))
          .andExpect(jsonPath("$.data[0].name").value("Gói Tiêu Chuẩn Sàng Lọc"))
          .andExpect(jsonPath("$.data[0].scope").value("INDIVIDUAL"))
          .andExpect(jsonPath("$.data[0].credits").value(5));

      verify(servicePackageService).listAll();
    }
  }

  @Nested
  @DisplayName("POST /api/v1/admin/packages - Tạo gói dịch vụ mới")
  class CreatePackageTests {

    @Test
    @DisplayName("Tạo gói dịch vụ thành công -> HTTP 201 CREATED")
    void createPackage_success() throws Exception {
      CreateServicePackageRequest request = new CreateServicePackageRequest(
          "Gói Phòng Khám Vàng",
          "Dành cho phòng khám với 100 lượt phân tích",
          PackageScope.CLINIC,
          BigDecimal.valueOf(3500000),
          100,
          90
      );
      when(servicePackageService.create(any(CreateServicePackageRequest.class)))
          .thenReturn(samplePackageResponse);

      mockMvc.perform(post("/api/v1/admin/packages")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isCreated())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data.id").value(packageId));

      verify(servicePackageService).create(any(CreateServicePackageRequest.class));
    }

    @Test
    @DisplayName("Tạo gói thất bại do thiếu tên gói hoặc giá âm -> HTTP 400 VALIDATION_ERROR")
    void createPackage_validationError() throws Exception {
      CreateServicePackageRequest invalidRequest = new CreateServicePackageRequest(
          "", "Mô tả", null, BigDecimal.valueOf(-100), 0, 0
      );

      mockMvc.perform(post("/api/v1/admin/packages")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(invalidRequest)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.code").value(ErrorCode.VALIDATION_ERROR.name()));
    }
  }

  @Nested
  @DisplayName("PUT /api/v1/admin/packages/{id} - Cập nhật gói dịch vụ")
  class UpdatePackageTests {

    @Test
    @DisplayName("Cập nhật gói dịch vụ thành công -> HTTP 200")
    void updatePackage_success() throws Exception {
      UpdateServicePackageRequest request = new UpdateServicePackageRequest(
          "Gói Cập Nhật",
          "Mô tả cập nhật",
          BigDecimal.valueOf(250000),
          10,
          60
      );
      when(servicePackageService.update(eq(packageId), any(UpdateServicePackageRequest.class)))
          .thenReturn(samplePackageResponse);

      mockMvc.perform(put("/api/v1/admin/packages/{id}", packageId)
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true));

      verify(servicePackageService).update(eq(packageId), any(UpdateServicePackageRequest.class));
    }

    @Test
    @DisplayName("Cập nhật gói không tồn tại -> ServicePackageNotFoundException")
    void updatePackage_notFound() {
      UpdateServicePackageRequest request = new UpdateServicePackageRequest(
          "Gói", "Mô tả", BigDecimal.valueOf(1000), 1, 1
      );
      when(servicePackageService.update(eq(999L), any(UpdateServicePackageRequest.class)))
          .thenThrow(new ServicePackageNotFoundException(999L));

      assertThatThrownBy(() -> controller.update(999L, request))
          .isInstanceOf(ServicePackageNotFoundException.class)
          .hasMessageContaining("999");

      verify(servicePackageService).update(eq(999L), any(UpdateServicePackageRequest.class));
    }
  }

  @Nested
  @DisplayName("PATCH /api/v1/admin/packages/{id}/status - Bật/tắt trạng thái gói dịch vụ")
  class SetActiveTests {

    @Test
    @DisplayName("Kích hoạt hoặc ẩn gói dịch vụ thành công -> HTTP 200")
    void setActive_success() throws Exception {
      UpdateServicePackageStatusRequest request = new UpdateServicePackageStatusRequest(false);
      ServicePackageResponse deactivated = new ServicePackageResponse(
          packageId, "Gói", "Mô tả", PackageScope.INDIVIDUAL, BigDecimal.TEN, 1, 1, false
      );
      when(servicePackageService.setActive(eq(packageId), eq(false))).thenReturn(deactivated);

      mockMvc.perform(patch("/api/v1/admin/packages/{id}/status", packageId)
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data.active").value(false));

      verify(servicePackageService).setActive(packageId, false);
    }

    @Test
    @DisplayName("Cập nhật trạng thái thất bại do request body null -> HTTP 400 VALIDATION_ERROR")
    void setActive_validationError_nullActive() throws Exception {
      String json = "{\"active\": null}";

      mockMvc.perform(patch("/api/v1/admin/packages/{id}/status", packageId)
              .contentType(MediaType.APPLICATION_JSON)
              .content(json))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.code").value(ErrorCode.VALIDATION_ERROR.name()));
    }
  }

  @Nested
  @DisplayName("DELETE /api/v1/admin/packages/{id} & POST /batch-delete")
  class DeletePackageTests {

    @Test
    @DisplayName("Xóa thành công một gói dịch vụ -> HTTP 200")
    void delete_success() {
      ApiResponse<Void> res = controller.delete(packageId);
      assertThat(res.success()).isTrue();
      assertThat(res.message()).contains("xóa");
      verify(servicePackageService).delete(packageId);
    }

    @Test
    @DisplayName("Xóa hàng loạt gói dịch vụ thành công -> HTTP 200")
    void batchDelete_success() {
      List<Long> ids = List.of(packageId, 99L);
      when(servicePackageService.batchDelete(ids)).thenReturn(2);

      ApiResponse<Integer> res = controller.batchDelete(ids);
      assertThat(res.success()).isTrue();
      assertThat(res.data()).isEqualTo(2);
      verify(servicePackageService).batchDelete(ids);
    }
  }

  @Test
  @DisplayName("Direct method invocation coverage")
  void directMethodCoverage_test() {
    CreateServicePackageRequest createReq = new CreateServicePackageRequest(
        "Gói Mới", "Mô tả", PackageScope.INDIVIDUAL, BigDecimal.TEN, 1, 30
    );
    when(servicePackageService.create(eq(createReq))).thenReturn(samplePackageResponse);

    ResponseEntity<ApiResponse<ServicePackageResponse>> res = controller.create(createReq);
    assertThat(res.getStatusCode().is2xxSuccessful()).isTrue();
    assertThat(res.getBody().data().id()).isEqualTo(packageId);

    when(servicePackageService.listAll()).thenReturn(List.of(samplePackageResponse));
    ApiResponse<List<ServicePackageResponse>> listRes = controller.listAll();
    assertThat(listRes.data()).hasSize(1);
  }
}
