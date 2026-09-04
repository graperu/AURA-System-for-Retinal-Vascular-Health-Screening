package com.aura.screening.controller;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import com.aura.screening.dto.CreateScreeningRequest;
import com.aura.screening.dto.ReviewScreeningRequest;
import com.aura.screening.entity.Screening;
import com.aura.screening.service.ScreeningService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/screenings")
public class ScreeningController {

  private final ScreeningService screeningService;

  public ScreeningController(ScreeningService screeningService) {
    this.screeningService = screeningService;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<Screening> createScreening(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @Valid @RequestBody CreateScreeningRequest request) {
    UUID patientId = principal != null ? principal.id() : UUID.randomUUID();
    Screening screening = screeningService.createScreening(patientId, request.imageUrl());
    return ApiResponse.success("Tạo ca sàng lọc và phân tích AI thành công", screening);
  }

  @GetMapping
  public ApiResponse<List<Screening>> getScreenings(
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    boolean isDoctorOrAdmin = principal != null && principal.roles().stream()
        .anyMatch(r -> r.equalsIgnoreCase("DOCTOR") || r.equalsIgnoreCase("ADMIN"));

    List<Screening> screenings;
    if (isDoctorOrAdmin) {
      screenings = screeningService.getAllScreenings();
    } else if (principal != null) {
      screenings = screeningService.getScreeningsForPatient(principal.id());
    } else {
      screenings = screeningService.getAllScreenings();
    }

    return ApiResponse.success("Lấy danh sách ca sàng lọc thành công", screenings);
  }

  @GetMapping("/{id}")
  public ApiResponse<Screening> getScreeningById(@PathVariable UUID id) {
    Screening screening = screeningService.getScreeningById(id);
    return ApiResponse.success("Lấy chi tiết ca sàng lọc thành công", screening);
  }

  @PostMapping("/{id}/review")
  public ApiResponse<Screening> reviewScreening(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @PathVariable UUID id,
      @Valid @RequestBody ReviewScreeningRequest request) {
    UUID doctorId = principal != null ? principal.id() : UUID.randomUUID();
    Screening updated = screeningService.addDoctorReview(id, doctorId, request.doctorNotes(), request.riskLevel());
    return ApiResponse.success("Lưu đánh giá chẩn đoán của bác sĩ thành công", updated);
  }
}
