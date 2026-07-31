package com.aura.backend.billing.service;

import com.aura.backend.billing.dto.CreateServicePackageRequest;
import com.aura.backend.billing.entity.PackageScope;
import com.aura.backend.billing.entity.ServicePackage;
import com.aura.backend.billing.exception.ServicePackageNotFoundException;
import com.aura.backend.billing.repository.ServicePackageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ServicePackageServiceTest {

    private ServicePackageRepository repository;
    private ServicePackageService service;

    @BeforeEach
    void setUp() {
        repository = mock(ServicePackageRepository.class);
        service = new ServicePackageService(repository);
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void createBuildsAnActivePackageFromRequest() {
        var request = new CreateServicePackageRequest(
                "Gói Cơ bản", "5 lượt phân tích / tháng", PackageScope.INDIVIDUAL,
                BigDecimal.valueOf(199000), 5, 30);

        var response = service.create(request);

        assertThat(response.active()).isTrue();
        assertThat(response.credits()).isEqualTo(5);
        assertThat(response.scope()).isEqualTo(PackageScope.INDIVIDUAL);
    }

    @Test
    void setActiveTogglesFlagWithoutTouchingOtherFields() {
        ServicePackage pkg = ServicePackage.builder()
                .id(1L).name("Gói Cơ bản").scope(PackageScope.INDIVIDUAL)
                .price(BigDecimal.valueOf(199000)).credits(5).validityDays(30).active(true)
                .build();
        when(repository.findById(1L)).thenReturn(Optional.of(pkg));

        var response = service.setActive(1L, false);

        assertThat(response.active()).isFalse();
        assertThat(response.credits()).isEqualTo(5);
    }

    @Test
    void updatingAnUnknownPackageThrows() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.setActive(99L, false))
                .isInstanceOf(ServicePackageNotFoundException.class);
    }
}
