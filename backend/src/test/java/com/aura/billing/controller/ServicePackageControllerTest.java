package com.aura.billing.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.aura.billing.dto.ServicePackageResponse;
import com.aura.billing.entity.PackageScope;
import com.aura.billing.service.ServicePackageService;
import com.aura.common.exception.GlobalExceptionHandler;
import com.aura.common.response.ApiResponse;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class ServicePackageControllerTest {

  @Mock
  private ServicePackageService servicePackageService;

  @InjectMocks
  private ServicePackageController controller;

  private MockMvc mockMvc;

  private ServicePackageResponse individualPackage;
  private ServicePackageResponse clinicPackage;

  @BeforeEach
  void setUp() {
    mockMvc = MockMvcBuilders.standaloneSetup(controller)
        .setControllerAdvice(new GlobalExceptionHandler())
        .build();

    individualPackage = new ServicePackageResponse(
        1L,
        "Gói Cá Nhân",
        "Dành cho người dùng cá nhân",
        PackageScope.INDIVIDUAL,
        BigDecimal.valueOf(99000),
        3,
        30,
        true
    );

    clinicPackage = new ServicePackageResponse(
        2L,
        "Gói Phòng Khám",
        "Dành cho phòng khám",
        PackageScope.CLINIC,
        BigDecimal.valueOf(1990000),
        50,
        90,
        true
    );
  }

  @Nested
  @DisplayName("GET /api/v1/packages - Danh mục bảng giá công khai")
  class BrowsePackagesTests {

    @Test
    @DisplayName("Lấy danh sách gói cá nhân theo mặc định (INDIVIDUAL) -> HTTP 200")
    void browse_defaultScope_success() throws Exception {
      when(servicePackageService.browse(eq(PackageScope.INDIVIDUAL)))
          .thenReturn(List.of(individualPackage));

      mockMvc.perform(get("/api/v1/packages"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data[0].id").value(1))
          .andExpect(jsonPath("$.data[0].scope").value("INDIVIDUAL"));

      verify(servicePackageService).browse(PackageScope.INDIVIDUAL);
    }

    @Test
    @DisplayName("Lấy danh sách gói phòng khám (scope=CLINIC) -> HTTP 200")
    void browse_clinicScope_success() throws Exception {
      when(servicePackageService.browse(eq(PackageScope.CLINIC)))
          .thenReturn(List.of(clinicPackage));

      mockMvc.perform(get("/api/v1/packages?scope=CLINIC"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data[0].id").value(2))
          .andExpect(jsonPath("$.data[0].scope").value("CLINIC"));

      verify(servicePackageService).browse(PackageScope.CLINIC);
    }

    @Test
    @DisplayName("Lấy danh sách khi không có gói nào -> HTTP 200, mảng rỗng")
    void browse_emptyList() throws Exception {
      when(servicePackageService.browse(eq(PackageScope.INDIVIDUAL)))
          .thenReturn(List.of());

      mockMvc.perform(get("/api/v1/packages?scope=INDIVIDUAL"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data").isEmpty());

      verify(servicePackageService).browse(PackageScope.INDIVIDUAL);
    }
  }

  @Test
  @DisplayName("Direct controller method invocation")
  void directMethodCoverage_test() {
    when(servicePackageService.browse(PackageScope.CLINIC)).thenReturn(List.of(clinicPackage));
    ApiResponse<List<ServicePackageResponse>> res = controller.browse(PackageScope.CLINIC);
    assertThat(res.success()).isTrue();
    assertThat(res.data()).hasSize(1);
    assertThat(res.data().get(0).name()).isEqualTo("Gói Phòng Khám");
  }
}
