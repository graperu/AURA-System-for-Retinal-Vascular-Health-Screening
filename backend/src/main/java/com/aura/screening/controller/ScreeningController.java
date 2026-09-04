package com.aura.screening.controller;

import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.ErrorCode;
import com.aura.screening.dto.CreateScreeningRequest;
import com.aura.screening.dto.ReviewScreeningRequest;
import com.aura.screening.entity.Screening;
import com.aura.screening.service.ScreeningService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập để thực hiện tạo ca sàng lọc");
    }
    Screening screening = screeningService.createScreening(principal.id(), request);
    return ApiResponse.success("Tạo ca sàng lọc và phân tích AI thành công", screening);
  }

  @GetMapping
  public ApiResponse<List<Screening>> getScreenings(
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập để xem danh sách sàng lọc");
    }
    List<Screening> screenings;
    boolean isDoctorOrAdmin = principal.roles() != null && principal.roles().stream()
        .anyMatch(r -> r.equalsIgnoreCase("DOCTOR") || r.equalsIgnoreCase("ADMIN"));
    if (isDoctorOrAdmin) {
      screenings = screeningService.getAllScreenings();
    } else {
      screenings = screeningService.getScreeningsForPatient(principal.id());
    }

    return ApiResponse.success("Lấy danh sách ca sàng lọc thành công", screenings);
  }

  @GetMapping("/{id}")
  @PreAuthorize("@patientAccessService.canAccessScreening(principal, #id)")
  public ApiResponse<Screening> getScreeningById(
      @PathVariable UUID id,
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    Screening screening = screeningService.getScreeningById(id);
    return ApiResponse.success("Lấy chi tiết ca sàng lọc thành công", screening);
  }

  @PostMapping("/{id}/review")
  @PreAuthorize("hasRole('DOCTOR') && @patientAccessService.canReviewScreening(principal, #id)")
  public ApiResponse<Screening> reviewScreening(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @PathVariable UUID id,
      @Valid @RequestBody ReviewScreeningRequest request) {
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập tài khoản Bác sĩ");
    }
    Screening updated = screeningService.addDoctorReview(id, principal.id(), request.doctorNotes(), request.riskLevel());
    return ApiResponse.success("Lưu đánh giá chẩn đoán của bác sĩ thành công", updated);
  }
}
