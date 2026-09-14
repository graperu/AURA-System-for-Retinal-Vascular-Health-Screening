package com.aura.feedback.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.feedback.dto.DoctorFeedbackRequest;
import com.aura.feedback.dto.DoctorFeedbackResponse;
import com.aura.feedback.entity.DoctorFeedback;
import com.aura.feedback.repository.DoctorFeedbackRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("DoctorFeedbackService Unit Tests (FR-15 Human-in-the-Loop Feedback)")
class DoctorFeedbackServiceTest {

  @Mock private DoctorFeedbackRepository doctorFeedbackRepository;

  @InjectMocks private DoctorFeedbackService doctorFeedbackService;

  private UUID doctorId;
  private UUID screeningId;

  @BeforeEach
  void setUp() {
    doctorId = UUID.randomUUID();
    screeningId = UUID.randomUUID();
  }

  @Nested
  @DisplayName("submitFeedback Tests")
  class SubmitFeedbackTests {

    @Test
    @DisplayName("Successfully submits feedback when doctor overrides AI evaluation")
    void submitFeedback_DoctorDisagrees_SavesAndReturnsResponse() {
      DoctorFeedbackRequest request =
          new DoctorFeedbackRequest(
              screeningId,
              "LOW",
              "HIGH",
              false,
              "AI bỏ sót vi phình mạch ở góc phần tư trên thái dương",
              "{\"type\":\"FeatureCollection\",\"features\":[{\"type\":\"Point\",\"coordinates\":[120,240]}]}");

      UUID feedbackId = UUID.randomUUID();
      when(doctorFeedbackRepository.save(any(DoctorFeedback.class)))
          .thenAnswer(inv -> {
            DoctorFeedback fb = inv.getArgument(0);
            ReflectionTestUtils.setField(fb, "id", feedbackId);
            ReflectionTestUtils.setField(fb, "createdAt", Instant.now());
            return fb;
          });

      DoctorFeedbackResponse response = doctorFeedbackService.submitFeedback(doctorId, request);

      assertThat(response).isNotNull();
      assertThat(response.id()).isEqualTo(feedbackId);
      assertThat(response.doctorId()).isEqualTo(doctorId);
      assertThat(response.screeningId()).isEqualTo(screeningId);
      assertThat(response.aiRiskLevel()).isEqualTo("LOW");
      assertThat(response.doctorRiskLevel()).isEqualTo("HIGH");
      assertThat(response.isAccurate()).isFalse();
      assertThat(response.feedbackNotes()).contains("AI bỏ sót vi phình mạch");
      assertThat(response.vesselAnnotationData()).contains("FeatureCollection");
      assertThat(response.includedInRetraining()).isFalse();

      ArgumentCaptor<DoctorFeedback> captor = ArgumentCaptor.forClass(DoctorFeedback.class);
      verify(doctorFeedbackRepository).save(captor.capture());
      DoctorFeedback saved = captor.getValue();
      assertThat(saved.getDoctorId()).isEqualTo(doctorId);
      assertThat(saved.getScreeningId()).isEqualTo(screeningId);
      assertThat(saved.getIncludedInRetraining()).isFalse();
    }

    @Test
    @DisplayName("Successfully submits feedback when doctor agrees with AI evaluation")
    void submitFeedback_DoctorAgrees_SavesAndReturnsResponse() {
      DoctorFeedbackRequest request =
          new DoctorFeedbackRequest(screeningId, "MODERATE", "MODERATE", true, null, null);

      UUID feedbackId = UUID.randomUUID();
      when(doctorFeedbackRepository.save(any(DoctorFeedback.class)))
          .thenAnswer(inv -> {
            DoctorFeedback fb = inv.getArgument(0);
            ReflectionTestUtils.setField(fb, "id", feedbackId);
            ReflectionTestUtils.setField(fb, "createdAt", Instant.now());
            return fb;
          });

      DoctorFeedbackResponse response = doctorFeedbackService.submitFeedback(doctorId, request);

      assertThat(response).isNotNull();
      assertThat(response.id()).isEqualTo(feedbackId);
      assertThat(response.isAccurate()).isTrue();
      assertThat(response.feedbackNotes()).isNull();
      assertThat(response.vesselAnnotationData()).isNull();
    }
  }

  @Nested
  @DisplayName("getDoctorFeedbacks Tests")
  class GetDoctorFeedbacksTests {

    @Test
    @DisplayName("Returns paged feedback records submitted by a doctor")
    void getDoctorFeedbacks_ReturnsPagedResponses() {
      Pageable pageable = PageRequest.of(0, 10);
      DoctorFeedback fb =
          new DoctorFeedback(doctorId, screeningId, "HIGH", "HIGH", true, "Đồng thuận hoàn toàn", null);
      ReflectionTestUtils.setField(fb, "id", UUID.randomUUID());
      ReflectionTestUtils.setField(fb, "createdAt", Instant.now());

      when(doctorFeedbackRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId, pageable))
          .thenReturn(new PageImpl<>(List.of(fb), pageable, 1));

      Page<DoctorFeedbackResponse> page =
          doctorFeedbackService.getDoctorFeedbacks(doctorId, pageable);

      assertThat(page).isNotNull();
      assertThat(page.getContent()).hasSize(1);
      assertThat(page.getContent().get(0).doctorId()).isEqualTo(doctorId);
      assertThat(page.getContent().get(0).aiRiskLevel()).isEqualTo("HIGH");
      assertThat(page.getTotalElements()).isEqualTo(1);
      verify(doctorFeedbackRepository).findByDoctorIdOrderByCreatedAtDesc(doctorId, pageable);
    }

    @Test
    @DisplayName("Returns empty page when doctor has submitted no feedbacks")
    void getDoctorFeedbacks_Empty_ReturnsEmptyPage() {
      Pageable pageable = PageRequest.of(0, 10);
      when(doctorFeedbackRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId, pageable))
          .thenReturn(new PageImpl<>(List.of(), pageable, 0));

      Page<DoctorFeedbackResponse> page =
          doctorFeedbackService.getDoctorFeedbacks(doctorId, pageable);

      assertThat(page.getContent()).isEmpty();
      assertThat(page.getTotalElements()).isZero();
    }
  }

  @Nested
  @DisplayName("getFeedbacksByScreening Tests")
  class GetFeedbacksByScreeningTests {

    @Test
    @DisplayName("Returns list of feedbacks associated with a screening session")
    void getFeedbacksByScreening_ReturnsList() {
      DoctorFeedback fb1 =
          new DoctorFeedback(doctorId, screeningId, "LOW", "MODERATE", false, "Hơi nghi ngờ", null);
      ReflectionTestUtils.setField(fb1, "id", UUID.randomUUID());
      ReflectionTestUtils.setField(fb1, "createdAt", Instant.now());

      when(doctorFeedbackRepository.findByScreeningId(screeningId))
          .thenReturn(List.of(fb1));

      List<DoctorFeedbackResponse> results =
          doctorFeedbackService.getFeedbacksByScreening(screeningId);

      assertThat(results).hasSize(1);
      assertThat(results.get(0).screeningId()).isEqualTo(screeningId);
      assertThat(results.get(0).doctorRiskLevel()).isEqualTo("MODERATE");
      verify(doctorFeedbackRepository).findByScreeningId(screeningId);
    }

    @Test
    @DisplayName("Returns empty list when screening has no feedbacks")
    void getFeedbacksByScreening_Empty_ReturnsEmptyList() {
      when(doctorFeedbackRepository.findByScreeningId(screeningId))
          .thenReturn(List.of());

      List<DoctorFeedbackResponse> results =
          doctorFeedbackService.getFeedbacksByScreening(screeningId);

      assertThat(results).isEmpty();
    }
  }
}
