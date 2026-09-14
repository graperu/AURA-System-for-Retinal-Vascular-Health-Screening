package com.aura.feedback.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.exception.GlobalExceptionHandler;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.ErrorCode;
import com.aura.common.response.PageResponse;
import com.aura.feedback.dto.DoctorFeedbackRequest;
import com.aura.feedback.dto.DoctorFeedbackResponse;
import com.aura.feedback.service.DoctorFeedbackService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@ExtendWith(MockitoExtension.class)
class DoctorFeedbackControllerTest {

  @Mock
  private DoctorFeedbackService doctorFeedbackService;

  @InjectMocks
  private DoctorFeedbackController controller;

  private MockMvc mockMvc;
  private ObjectMapper objectMapper;

  private UUID doctorId;
  private AuraUserPrincipal doctorPrincipal;
  private UUID screeningId;
  private DoctorFeedbackResponse sampleFeedbackResponse;

  @BeforeEach
  void setUp() {
    doctorId = UUID.randomUUID();
    screeningId = UUID.randomUUID();
    doctorPrincipal = new AuraUserPrincipal(
        doctorId,
        "doctor@aura.test",
        "Encrypted123!",
        true,
        List.of("DOCTOR")
    );
    objectMapper = new ObjectMapper();

    sampleFeedbackResponse = new DoctorFeedbackResponse(
        UUID.randomUUID(),
        doctorId,
        screeningId,
        "HIGH",
        "CRITICAL",
        false,
        "Phát hiện thêm xuất huyết vi mạch cực trên",
        "{\"vessels\":[]}",
        true,
        Instant.now()
    );

    mockMvc = MockMvcBuilders.standaloneSetup(controller)
        .setControllerAdvice(new GlobalExceptionHandler())
        .setCustomArgumentResolvers(new HandlerMethodArgumentResolver() {
          @Override
          public boolean supportsParameter(MethodParameter parameter) {
            return parameter.getParameterType().isAssignableFrom(AuraUserPrincipal.class);
          }

          @Override
          public Object resolveArgument(MethodParameter parameter,
                                        ModelAndViewContainer mavContainer,
                                        NativeWebRequest webRequest,
                                        WebDataBinderFactory binderFactory) {
            return doctorPrincipal;
          }
        })
        .build();
  }

  @Nested
  @DisplayName("POST /api/v1/doctor/feedback - Gửi phản hồi lâm sàng & hiệu chỉnh AI (FR-19, NFR-11)")
  class SubmitFeedbackTests {

    @Test
    @DisplayName("Bác sĩ gửi phản hồi thành công -> HTTP 200 và trả về kết quả")
    void submitFeedback_success() throws Exception {
      DoctorFeedbackRequest request = new DoctorFeedbackRequest(
          screeningId,
          "HIGH",
          "CRITICAL",
          false,
          "Phát hiện thêm xuất huyết vi mạch cực trên",
          "{\"vessels\":[]}"
      );
      when(doctorFeedbackService.submitFeedback(eq(doctorId), any(DoctorFeedbackRequest.class)))
          .thenReturn(sampleFeedbackResponse);

      mockMvc.perform(post("/api/v1/doctor/feedback")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data.doctorId").value(doctorId.toString()))
          .andExpect(jsonPath("$.data.screeningId").value(screeningId.toString()))
          .andExpect(jsonPath("$.data.aiRiskLevel").value("HIGH"))
          .andExpect(jsonPath("$.data.doctorRiskLevel").value("CRITICAL"))
          .andExpect(jsonPath("$.data.isAccurate").value(false));

      verify(doctorFeedbackService).submitFeedback(eq(doctorId), any(DoctorFeedbackRequest.class));
    }

    @Test
    @DisplayName("Gửi phản hồi thất bại (Thiếu screeningId hoặc risk level) -> HTTP 400 VALIDATION_ERROR")
    void submitFeedback_validationError() throws Exception {
      DoctorFeedbackRequest invalidRequest = new DoctorFeedbackRequest(
          null, "", "", null, null, null
      );

      mockMvc.perform(post("/api/v1/doctor/feedback")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(invalidRequest)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.code").value(ErrorCode.VALIDATION_ERROR.name()));
    }
  }

  @Nested
  @DisplayName("GET /api/v1/doctor/feedback - Lấy danh sách phản hồi của bác sĩ hiện tại")
  class GetDoctorFeedbacksTests {

    @Test
    @DisplayName("Lấy danh sách phản hồi phân trang thành công -> HTTP 200 kèm PageResponse")
    void getDoctorFeedbacks_success() throws Exception {
      Page<DoctorFeedbackResponse> page = new PageImpl<>(
          List.of(sampleFeedbackResponse), PageRequest.of(0, 20), 1
      );
      when(doctorFeedbackService.getDoctorFeedbacks(eq(doctorId), any(Pageable.class)))
          .thenReturn(page);

      mockMvc.perform(get("/api/v1/doctor/feedback?page=0&size=20"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data.items[0].doctorId").value(doctorId.toString()))
          .andExpect(jsonPath("$.data.totalItems").value(1))
          .andExpect(jsonPath("$.data.totalPages").value(1));

      verify(doctorFeedbackService).getDoctorFeedbacks(eq(doctorId), any(Pageable.class));
    }
  }

  @Nested
  @DisplayName("GET /api/v1/doctor/feedback/screening/{screeningId} - Danh sách phản hồi theo ca sàng lọc")
  class GetFeedbacksByScreeningTests {

    @Test
    @DisplayName("Lấy danh sách phản hồi của một ca sàng lọc thành công -> HTTP 200")
    void getFeedbacksByScreening_success() throws Exception {
      when(doctorFeedbackService.getFeedbacksByScreening(screeningId))
          .thenReturn(List.of(sampleFeedbackResponse));

      mockMvc.perform(get("/api/v1/doctor/feedback/screening/{screeningId}", screeningId))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data[0].screeningId").value(screeningId.toString()));

      verify(doctorFeedbackService).getFeedbacksByScreening(screeningId);
    }
  }

  @Test
  @DisplayName("Direct method invocation coverage")
  void directControllerCalls_test() {
    DoctorFeedbackRequest request = new DoctorFeedbackRequest(
        screeningId, "LOW", "LOW", true, "Chính xác", null
    );
    when(doctorFeedbackService.submitFeedback(eq(doctorId), eq(request)))
        .thenReturn(sampleFeedbackResponse);

    ApiResponse<DoctorFeedbackResponse> res = controller.submitFeedback(doctorPrincipal, request);
    assertThat(res).isNotNull();
    assertThat(res.success()).isTrue();
    assertThat(res.data().doctorId()).isEqualTo(doctorId);

    Page<DoctorFeedbackResponse> page = new PageImpl<>(List.of(sampleFeedbackResponse));
    when(doctorFeedbackService.getDoctorFeedbacks(eq(doctorId), any(Pageable.class))).thenReturn(page);
    ApiResponse<PageResponse<DoctorFeedbackResponse>> pageRes = controller.getDoctorFeedbacks(doctorPrincipal, 0, 10);
    assertThat(pageRes.data().items()).hasSize(1);
  }
}
