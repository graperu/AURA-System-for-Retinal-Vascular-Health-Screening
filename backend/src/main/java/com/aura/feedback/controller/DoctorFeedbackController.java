package com.aura.feedback.controller;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.PageResponse;
import com.aura.feedback.dto.DoctorFeedbackRequest;
import com.aura.feedback.dto.DoctorFeedbackResponse;
import com.aura.feedback.service.DoctorFeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/doctor/feedback")
@Tag(name = "Doctor Feedback", description = "Endpoints for doctor AI validation and retraining feedback (FR-19, NFR-11)")
public class DoctorFeedbackController {

  private final DoctorFeedbackService doctorFeedbackService;

  public DoctorFeedbackController(DoctorFeedbackService doctorFeedbackService) {
    this.doctorFeedbackService = doctorFeedbackService;
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
  @Operation(summary = "Submit clinical feedback and AI correction")
  public ApiResponse<DoctorFeedbackResponse> submitFeedback(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @Valid @RequestBody DoctorFeedbackRequest request) {
    DoctorFeedbackResponse response =
        doctorFeedbackService.submitFeedback(principal.getId(), request);
    return ApiResponse.success(response);
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
  @Operation(summary = "Get list of feedback given by current doctor")
  public ApiResponse<PageResponse<DoctorFeedbackResponse>> getDoctorFeedbacks(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<DoctorFeedbackResponse> p =
        doctorFeedbackService.getDoctorFeedbacks(principal.getId(), pageable);
    return ApiResponse.success(PageResponse.from(p));
  }

  @GetMapping("/screening/{screeningId}")
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
  @Operation(summary = "Get feedback entries for a specific screening")
  public ApiResponse<List<DoctorFeedbackResponse>> getFeedbacksByScreening(
      @PathVariable UUID screeningId) {
    return ApiResponse.success(doctorFeedbackService.getFeedbacksByScreening(screeningId));
  }
}
