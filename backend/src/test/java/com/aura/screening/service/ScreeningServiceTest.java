package com.aura.screening.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.screening.entity.Screening;
import com.aura.screening.entity.ScreeningStatus;
import com.aura.screening.repository.ScreeningRepository;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

@ExtendWith(MockitoExtension.class)
class ScreeningServiceTest {

  @Mock
  private ScreeningRepository screeningRepository;

  private ScreeningService screeningService;

  @BeforeEach
  void setUp() {
    RestClient.Builder builder = RestClient.builder();
    screeningService = new ScreeningService(screeningRepository, builder);
  }

  @Test
  @DisplayName("P0-1: Khi AI microservice offline, ca khám phải chuyển sang FAILED, giữ nguyên ảnh và KHÔNG sinh risk/confidence giả")
  void createScreening_whenAiOffline_shouldSetStatusFailedAndNullRisk() {
    UUID patientId = UUID.randomUUID();
    String imageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    when(screeningRepository.save(any(Screening.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    Screening result = screeningService.createScreening(patientId, imageUrl);

    assertNotNull(result);
    assertEquals(patientId, result.getPatientId());
    assertEquals(imageUrl, result.getImageUrl(), "Ảnh gốc phải được bảo toàn nguyên vẹn");
    assertEquals(ScreeningStatus.FAILED, result.getStatus(), "Trạng thái ca khám phải là FAILED khi AI offline");
    assertNull(result.getRiskLevel(), "RiskLevel bắt buộc phải là null (không được sinh giả HIGH/CRITICAL)");
    assertNull(result.getConfidence(), "Confidence bắt buộc phải là null (không được sinh giả 0.94)");
    assertNotNull(result.getFindings());

    verify(screeningRepository).save(any(Screening.class));
  }
}
