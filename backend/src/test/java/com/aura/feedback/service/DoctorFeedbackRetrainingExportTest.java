package com.aura.feedback.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.aura.bulk.dto.PatientAnonymizedDto;
import com.aura.bulk.service.PatientAnonymizerService;
import com.aura.feedback.dto.RetrainingDatasetItemDto;
import com.aura.feedback.entity.DoctorFeedback;
import com.aura.feedback.repository.DoctorFeedbackRepository;
import com.aura.patient.entity.PatientProfile;
import com.aura.patient.repository.PatientProfileRepository;
import com.aura.screening.entity.Screening;
import com.aura.screening.repository.ScreeningRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("HIPAA NFR-10/NFR-11 PII De-Identification Retraining Dataset Export Tests")
class DoctorFeedbackRetrainingExportTest {

  @Mock private DoctorFeedbackRepository feedbackRepository;
  @Mock private ScreeningRepository screeningRepository;
  @Mock private PatientProfileRepository patientProfileRepository;
  @Mock private PatientAnonymizerService anonymizerService;

  private DoctorFeedbackService service;

  @BeforeEach
  void setUp() {
    service = new DoctorFeedbackService(feedbackRepository, screeningRepository, patientProfileRepository, anonymizerService);
  }

  @Test
  @DisplayName("Khi không có phản hồi lâm sàng chưa tái huấn luyện -> trả về danh sách rỗng")
  void exportRetrainingDataset_whenEmpty_returnsEmptyList() {
    when(feedbackRepository.findByIncludedInRetrainingFalse()).thenReturn(List.of());

    List<RetrainingDatasetItemDto> result = service.exportRetrainingDataset();

    assertThat(result).isEmpty();
    verify(feedbackRepository, never()).save(any());
  }

  @Test
  @DisplayName("Xuất tập dữ liệu tái huấn luyện: Áp dụng PatientAnonymizerService khử định danh PII (Tên, MRN thật)")
  void exportRetrainingDataset_anonymizesPatientPii() {
    UUID doctorId = UUID.randomUUID();
    UUID screeningId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();

    DoctorFeedback feedback = new DoctorFeedback(
        doctorId,
        screeningId,
        "MODERATE",
        "HIGH",
        false,
        "Vi mạch thái dương co thắt, điều chỉnh từ MODERATE lên HIGH",
        "{\"vessels\": []}"
    );

    Screening screening = new Screening(patientId, "https://storage.aura.test/images/retina_01.jpg");
    ReflectionTestUtils.setField(screening, "id", screeningId);

    PatientProfile profile = new PatientProfile("MRN-REAL-9999", "Nguyễn Văn Bệnh Nhân Thật", 58, "Male", "0901234567");
    profile.setSystolicBp(145);
    profile.setDiastolicBp(95);
    profile.setHba1c(7.2);
    profile.setHasDiabetes(true);
    profile.setHasHypertension(true);

    when(feedbackRepository.findByIncludedInRetrainingFalse()).thenReturn(List.of(feedback));
    when(screeningRepository.findById(screeningId)).thenReturn(Optional.of(screening));
    when(patientProfileRepository.findById(patientId)).thenReturn(Optional.of(profile));

    PatientAnonymizedDto anonymizedDto = new PatientAnonymizedDto(
        "ANO-PAT-ABCD1234",
        "MRN-DEID-EF567890",
        58,
        "Male",
        145,
        95,
        7.2,
        true,
        true,
        Instant.now()
    );
    when(anonymizerService.anonymizePatient(
        eq("MRN-REAL-9999"),
        eq("Nguyễn Văn Bệnh Nhân Thật"),
        eq(58),
        eq("Male"),
        eq(145),
        eq(95),
        eq(7.2)
    )).thenReturn(anonymizedDto);

    List<RetrainingDatasetItemDto> result = service.exportRetrainingDataset();

    assertThat(result).hasSize(1);
    RetrainingDatasetItemDto item = result.get(0);

    // Assert PII is de-identified: NO real name, NO real MRN, NO phone
    assertThat(item.pseudonymId()).isEqualTo("ANO-PAT-ABCD1234");
    assertThat(item.deidentifiedMrn()).isEqualTo("MRN-DEID-EF567890");
    assertThat(item.pseudonymId()).doesNotContain("Nguyễn");
    assertThat(item.deidentifiedMrn()).doesNotContain("MRN-REAL-9999");
    assertThat(item.aiRiskLevel()).isEqualTo("MODERATE");
    assertThat(item.doctorRiskLevel()).isEqualTo("HIGH");
    assertThat(item.isAccurate()).isFalse();
    assertThat(item.hasDiabetes()).isTrue();
    assertThat(item.hasHypertension()).isTrue();

    // Assert feedback was flagged as includedInRetraining
    assertThat(feedback.getIncludedInRetraining()).isTrue();
    verify(feedbackRepository).save(feedback);
  }
}
