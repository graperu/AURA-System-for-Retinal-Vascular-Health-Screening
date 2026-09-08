package com.aura.screening.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import com.aura.screening.dto.CreateScreeningRequest;
import com.aura.screening.dto.ReviewScreeningRequest;
import com.aura.screening.entity.ReviewDecision;
import com.aura.screening.entity.Screening;
import com.aura.screening.service.ScreeningService;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ScreeningControllerTest {

  @Mock
  private ScreeningService screeningService;

  private ScreeningController controller;

  private AuraUserPrincipal patientPrincipal;
  private AuraUserPrincipal doctorPrincipal;
  private UUID patientId;
  private UUID doctorId;

  @BeforeEach
  void setUp() {
    controller = new ScreeningController(screeningService);
    patientId = UUID.randomUUID();
    doctorId = UUID.randomUUID();
    patientPrincipal = new AuraUserPrincipal(patientId, "patient@aura.com", "pass", true, List.of("USER"));
    doctorPrincipal = new AuraUserPrincipal(doctorId, "doctor@aura.com", "pass", true, List.of("DOCTOR"));
  }

  @Test
  @DisplayName("FR-2: Patient tạo ca sàng lọc thành công")
  void createScreening_success() {
    CreateScreeningRequest req = new CreateScreeningRequest(
        "data:image/png;base64,sample", "OD", "FUNDUS", "eye.png", 1024L, "image/png", null, null, null
    );
    Screening screening = new Screening(patientId, req.imageUrl());

    when(screeningService.createScreening(eq(patientId), eq(req))).thenReturn(screening);

    ApiResponse<Screening> response = controller.createScreening(patientPrincipal, req);

    assertNotNull(response);
    assertEquals(screening, response.data());
  }

  @Test
  @DisplayName("FR-6: Patient lấy danh sách ca sàng lọc của chính mình")
  void getScreenings_forPatient() {
    Screening s1 = new Screening(patientId, "img1");
    when(screeningService.getScreeningsForPatient(patientId)).thenReturn(List.of(s1));

    ApiResponse<List<Screening>> response = controller.getScreenings(patientPrincipal);

    assertNotNull(response);
    assertEquals(1, response.data().size());
  }

  @Test
  @DisplayName("FR-15: Doctor thẩm định và duyệt ca sàng lọc")
  void reviewScreening_success() {
    UUID screeningId = UUID.randomUUID();
    ReviewScreeningRequest req = new ReviewScreeningRequest(
        ReviewDecision.APPROVED,
        "Đồng ý với AI",
        null,
        null,
        List.of("H35.0")
    );
    Screening screening = new Screening(patientId, "img1");

    when(screeningService.addDoctorReview(
        eq(screeningId),
        eq(doctorId),
        eq(req.decision()),
        eq(req.doctorNotes()),
        eq(req.adjustedCardioRisk()),
        eq(req.adjustedDrRisk()),
        eq(req.icd10Codes())
    )).thenReturn(screening);

    ApiResponse<Screening> response = controller.reviewScreening(doctorPrincipal, screeningId, req);

    assertNotNull(response);
    assertEquals(screening, response.data());
  }
}
