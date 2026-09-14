package com.aura.billing.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.billing.dto.CreateServicePackageRequest;
import com.aura.billing.dto.ServicePackageResponse;
import com.aura.billing.dto.UpdateServicePackageRequest;
import com.aura.billing.entity.PackageScope;
import com.aura.billing.entity.ServicePackage;
import com.aura.billing.exception.ServicePackageNotFoundException;
import com.aura.billing.repository.ServicePackageRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("ServicePackageService Unit Tests")
class ServicePackageServiceTest {

  @Mock private ServicePackageRepository servicePackageRepository;

  @InjectMocks private ServicePackageService servicePackageService;

  private ServicePackage package1;
  private ServicePackage package2;

  @BeforeEach
  void setUp() {
    package1 =
        ServicePackage.builder()
            .id(1L)
            .name("Gói Cá Nhân 10 Lượt")
            .description("Phù hợp cho bệnh nhân theo dõi định kỳ")
            .scope(PackageScope.INDIVIDUAL)
            .price(BigDecimal.valueOf(100_000))
            .credits(10)
            .validityDays(30)
            .active(true)
            .build();

    package2 =
        ServicePackage.builder()
            .id(2L)
            .name("Gói Phòng Khám 1000 Lượt")
            .description("Dành cho chiến dịch cộng đồng quy mô lớn")
            .scope(PackageScope.CLINIC)
            .price(BigDecimal.valueOf(8_000_000))
            .credits(1000)
            .validityDays(180)
            .active(true)
            .build();
  }

  @Nested
  @DisplayName("browse / listByScope Tests")
  class BrowseTests {

    @Test
    @DisplayName("browse returns active packages for given scope")
    void browse_ReturnsActivePackagesForScope() {
      when(servicePackageRepository.findByActiveTrueAndScope(PackageScope.INDIVIDUAL))
          .thenReturn(List.of(package1));

      List<ServicePackageResponse> responses =
          servicePackageService.browse(PackageScope.INDIVIDUAL);

      assertThat(responses).hasSize(1);
      assertThat(responses.get(0).id()).isEqualTo(1L);
      assertThat(responses.get(0).name()).isEqualTo("Gói Cá Nhân 10 Lượt");
      assertThat(responses.get(0).scope()).isEqualTo(PackageScope.INDIVIDUAL);
      assertThat(responses.get(0).active()).isTrue();
      verify(servicePackageRepository).findByActiveTrueAndScope(PackageScope.INDIVIDUAL);
    }

    @Test
    @DisplayName("browse returns empty list when no active packages match scope")
    void browse_EmptyResults_ReturnsEmptyList() {
      when(servicePackageRepository.findByActiveTrueAndScope(PackageScope.CLINIC))
          .thenReturn(List.of());

      List<ServicePackageResponse> responses =
          servicePackageService.browse(PackageScope.CLINIC);

      assertThat(responses).isEmpty();
    }
  }

  @Nested
  @DisplayName("listAll Tests")
  class ListAllTests {

    @Test
    @DisplayName("listAll returns all packages including inactive ones")
    void listAll_ReturnsAllPackages() {
      package2.setActive(false);
      when(servicePackageRepository.findAll()).thenReturn(List.of(package1, package2));

      List<ServicePackageResponse> responses = servicePackageService.listAll();

      assertThat(responses).hasSize(2);
      assertThat(responses.get(0).name()).isEqualTo("Gói Cá Nhân 10 Lượt");
      assertThat(responses.get(1).active()).isFalse();
      verify(servicePackageRepository).findAll();
    }

    @Test
    @DisplayName("listAll returns empty list when repository has no records")
    void listAll_Empty_ReturnsEmptyList() {
      when(servicePackageRepository.findAll()).thenReturn(List.of());

      List<ServicePackageResponse> responses = servicePackageService.listAll();

      assertThat(responses).isEmpty();
    }
  }

  @Nested
  @DisplayName("create Tests")
  class CreateTests {

    @Test
    @DisplayName("create builds and saves a new active package")
    void create_ValidRequest_SavesAndReturnsResponse() {
      CreateServicePackageRequest request =
          new CreateServicePackageRequest(
              "Gói Thử Nghiệm",
              "Dành cho bác sĩ dùng thử",
              PackageScope.INDIVIDUAL,
              BigDecimal.valueOf(50_000),
              5,
              15);

      when(servicePackageRepository.save(any(ServicePackage.class)))
          .thenAnswer(inv -> {
            ServicePackage sp = inv.getArgument(0);
            ReflectionTestUtils.setField(sp, "id", 100L);
            return sp;
          });

      ServicePackageResponse response = servicePackageService.create(request);

      assertThat(response).isNotNull();
      assertThat(response.id()).isEqualTo(100L);
      assertThat(response.name()).isEqualTo("Gói Thử Nghiệm");
      assertThat(response.description()).isEqualTo("Dành cho bác sĩ dùng thử");
      assertThat(response.scope()).isEqualTo(PackageScope.INDIVIDUAL);
      assertThat(response.price()).isEqualByComparingTo(BigDecimal.valueOf(50_000));
      assertThat(response.credits()).isEqualTo(5);
      assertThat(response.validityDays()).isEqualTo(15);
      assertThat(response.active()).isTrue();

      ArgumentCaptor<ServicePackage> captor = ArgumentCaptor.forClass(ServicePackage.class);
      verify(servicePackageRepository).save(captor.capture());
      ServicePackage saved = captor.getValue();
      assertThat(saved.isActive()).isTrue();
      assertThat(saved.getName()).isEqualTo("Gói Thử Nghiệm");
    }
  }

  @Nested
  @DisplayName("update Tests")
  class UpdateTests {

    @Test
    @DisplayName("update successfully updates fields of existing package")
    void update_ExistingId_UpdatesFieldsAndSaves() {
      when(servicePackageRepository.findById(1L)).thenReturn(Optional.of(package1));
      when(servicePackageRepository.save(any(ServicePackage.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      UpdateServicePackageRequest request =
          new UpdateServicePackageRequest(
              "Gói Cá Nhân Mở Rộng",
              "Nâng cấp lên 15 lượt khám",
              BigDecimal.valueOf(140_000),
              15,
              45);

      ServicePackageResponse response = servicePackageService.update(1L, request);

      assertThat(response).isNotNull();
      assertThat(response.name()).isEqualTo("Gói Cá Nhân Mở Rộng");
      assertThat(response.description()).isEqualTo("Nâng cấp lên 15 lượt khám");
      assertThat(response.price()).isEqualByComparingTo(BigDecimal.valueOf(140_000));
      assertThat(response.credits()).isEqualTo(15);
      assertThat(response.validityDays()).isEqualTo(45);

      assertThat(package1.getName()).isEqualTo("Gói Cá Nhân Mở Rộng");
      assertThat(package1.getCredits()).isEqualTo(15);
      verify(servicePackageRepository).save(package1);
    }

    @Test
    @DisplayName("update throws ServicePackageNotFoundException when id not found")
    void update_NonExistentId_ThrowsNotFoundException() {
      when(servicePackageRepository.findById(999L)).thenReturn(Optional.empty());

      UpdateServicePackageRequest request =
          new UpdateServicePackageRequest(
              "Tên mới", "Mô tả mới", BigDecimal.valueOf(200_000), 20, 60);

      assertThatThrownBy(() -> servicePackageService.update(999L, request))
          .isInstanceOf(ServicePackageNotFoundException.class)
          .hasMessageContaining("999");

      verify(servicePackageRepository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("setActive Tests")
  class SetActiveTests {

    @Test
    @DisplayName("setActive sets active to false (deactivates package)")
    void setActive_DeactivatesPackage_Success() {
      when(servicePackageRepository.findById(1L)).thenReturn(Optional.of(package1));
      when(servicePackageRepository.save(any(ServicePackage.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      ServicePackageResponse response = servicePackageService.setActive(1L, false);

      assertThat(response.active()).isFalse();
      assertThat(package1.isActive()).isFalse();
      verify(servicePackageRepository).save(package1);
    }

    @Test
    @DisplayName("setActive sets active to true (reactivates package)")
    void setActive_ReactivatesPackage_Success() {
      package1.setActive(false);
      when(servicePackageRepository.findById(1L)).thenReturn(Optional.of(package1));
      when(servicePackageRepository.save(any(ServicePackage.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      ServicePackageResponse response = servicePackageService.setActive(1L, true);

      assertThat(response.active()).isTrue();
      assertThat(package1.isActive()).isTrue();
      verify(servicePackageRepository).save(package1);
    }

    @Test
    @DisplayName("setActive throws ServicePackageNotFoundException when id not found")
    void setActive_NotFound_ThrowsException() {
      when(servicePackageRepository.findById(404L)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> servicePackageService.setActive(404L, true))
          .isInstanceOf(ServicePackageNotFoundException.class)
          .hasMessageContaining("404");

      verify(servicePackageRepository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("findOrThrow Tests")
  class FindOrThrowTests {

    @Test
    @DisplayName("findOrThrow returns entity when found")
    void findOrThrow_Found_ReturnsEntity() {
      when(servicePackageRepository.findById(1L)).thenReturn(Optional.of(package1));

      ServicePackage result = servicePackageService.findOrThrow(1L);

      assertThat(result).isEqualTo(package1);
    }

    @Test
    @DisplayName("findOrThrow throws ServicePackageNotFoundException when not found")
    void findOrThrow_NotFound_ThrowsException() {
      when(servicePackageRepository.findById(888L)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> servicePackageService.findOrThrow(888L))
          .isInstanceOf(ServicePackageNotFoundException.class);
    }
  }
}
