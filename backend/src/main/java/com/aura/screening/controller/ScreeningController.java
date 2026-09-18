package com.aura.screening.controller;

import com.aura.audit.annotation.Audited;
import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.auth.service.PatientAccessService;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.ErrorCode;
import com.aura.common.response.PageResponse;
import com.aura.screening.dto.BatchDeleteScreeningsRequest;
import com.aura.screening.dto.CreateScreeningRequest;
import com.aura.screening.dto.ReviewScreeningRequest;
import com.aura.screening.dto.ScreeningResponse;
import com.aura.screening.entity.Screening;
import com.aura.screening.service.ScreeningService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/screenings")
public class ScreeningController {

  private final ScreeningService screeningService;
  private final PatientAccessService patientAccessService;

  public ScreeningController(ScreeningService screeningService, PatientAccessService patientAccessService) {
    this.screeningService = screeningService;
    this.patientAccessService = patientAccessService;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<ScreeningResponse> createScreening(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @Valid @RequestBody CreateScreeningRequest request) {
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập để thực hiện tạo ca sàng lọc");
    }
    Screening screening = screeningService.createScreening(principal.id(), request);
    return ApiResponse.success("Tạo ca sàng lọc và phân tích AI thành công", ScreeningResponse.fromEntity(screening));
  }

  @GetMapping
  public ApiResponse<PageResponse<ScreeningResponse>> getScreenings(
      @RequestParam(required = false) UUID patientId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "15") int size,
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập để xem danh sách sàng lọc");
    }

    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<Screening> screeningsPage;
    boolean isAdmin = hasRole(principal, "ADMIN");
    boolean isDoctor = hasRole(principal, "DOCTOR");
    boolean isClinic = hasRole(principal, "CLINIC");

    if (isAdmin) {
      if (patientId != null) {
        screeningsPage = screeningService.getScreeningsForPatient(patientId, pageable);
      } else {
        screeningsPage = screeningService.getAllScreenings(pageable);
      }
    } else if (isDoctor) {
      if (patientId != null) {
        if (!patientAccessService.canAccessPatient(principal, patientId)) {
          throw new AuthException(
              ErrorCode.ACCESS_DENIED,
              "Bác sĩ không có quyền truy cập lịch sử của bệnh nhân chưa được phân công");
        }
        screeningsPage = screeningService.getScreeningsForPatient(patientId, pageable);
      } else {
        screeningsPage = screeningService.getScreeningsForDoctor(principal.id(), pageable);
      }
    } else if (isClinic) {
      if (patientId != null) {
        screeningsPage = screeningService.getScreeningsForPatient(patientId, pageable);
      } else {
        screeningsPage = screeningService.getScreeningsForClinic(principal.id(), pageable);
      }
    } else {
      if (patientId != null && !patientId.equals(principal.id())) {
        throw new AuthException(
            ErrorCode.ACCESS_DENIED,
            "Không có quyền truy cập lịch sử sàng lọc của bệnh nhân khác");
      }
      screeningsPage = screeningService.getScreeningsForPatient(principal.id(), pageable);
    }

    Page<ScreeningResponse> responsePage = screeningsPage.map(ScreeningResponse::fromEntitySummary);
    return ApiResponse.success("Lấy danh sách ca sàng lọc thành công", PageResponse.from(responsePage));
  }

  public ApiResponse<List<Screening>> getScreenings(
      UUID patientId,
      AuraUserPrincipal principal) {
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập để xem danh sách sàng lọc");
    }

    List<Screening> screenings;
    boolean isAdmin = hasRole(principal, "ADMIN");
    boolean isDoctor = hasRole(principal, "DOCTOR");
    boolean isClinic = hasRole(principal, "CLINIC");

    if (isAdmin) {
      if (patientId != null) {
        screenings = screeningService.getScreeningsForPatient(patientId);
      } else {
        screenings = screeningService.getAllScreenings();
      }
    } else if (isDoctor) {
      if (patientId != null) {
        if (!patientAccessService.canAccessPatient(principal, patientId)) {
          throw new AuthException(
              ErrorCode.ACCESS_DENIED,
              "Bác sĩ không có quyền truy cập lịch sử của bệnh nhân chưa được phân công");
        }
        screenings = screeningService.getScreeningsForPatient(patientId);
      } else {
        screenings = screeningService.getScreeningsForDoctor(principal.id());
      }
    } else if (isClinic) {
      if (patientId != null) {
        screenings = screeningService.getScreeningsForPatient(patientId);
      } else {
        screenings = screeningService.getScreeningsForClinic(principal.id());
      }
    } else {
      if (patientId != null && !patientId.equals(principal.id())) {
        throw new AuthException(
            ErrorCode.ACCESS_DENIED,
            "Không có quyền truy cập lịch sử sàng lọc của bệnh nhân khác");
      }
      screenings = screeningService.getScreeningsForPatient(principal.id());
    }

    return ApiResponse.success("Lấy danh sách ca sàng lọc thành công", screenings);
  }

  private boolean hasRole(AuraUserPrincipal principal, String role) {
    if (principal == null || principal.roles() == null) {
      return false;
    }
    String cleanRole = role.startsWith("ROLE_") ? role.substring(5) : role;
    return principal.roles().stream().anyMatch(r -> {
      String cleanR = r.startsWith("ROLE_") ? r.substring(5) : r;
      return cleanR.equalsIgnoreCase(cleanRole);
    });
  }

  public ApiResponse<List<Screening>> getScreenings(AuraUserPrincipal principal) {
    return getScreenings(null, principal);
  }

  @GetMapping("/{id}")
  @PreAuthorize("@patientAccessService.canAccessScreening(principal, #id)")
  public ApiResponse<ScreeningResponse> getScreening(
      @PathVariable UUID id,
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    Screening screening = screeningService.getScreeningById(id);
    return ApiResponse.success("Lấy chi tiết ca sàng lọc thành công", ScreeningResponse.fromEntity(screening));
  }

  public ApiResponse<ScreeningResponse> getScreeningById(
      UUID id,
      AuraUserPrincipal principal) {
    return getScreening(id, principal);
  }

  @Audited(action = "CLINICAL_REVIEW", module = "SCREENING", resourceType = "SCREENING", description = "Bác sĩ thẩm định đánh giá lâm sàng và điều chỉnh nguy cơ")
  @PostMapping("/{id}/review")
  @PreAuthorize("hasRole('DOCTOR') && @patientAccessService.canReviewScreening(principal, #id)")
  public ApiResponse<ScreeningResponse> reviewScreening(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @PathVariable UUID id,
      @Valid @RequestBody ReviewScreeningRequest request) {
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập tài khoản Bác sĩ");
    }
    Screening updated = screeningService.addDoctorReview(
      id,
      principal.id(),
      request.decision(),
      request.doctorNotes(),
      request.adjustedCardioRisk(),
      request.adjustedDrRisk(),
      request.icd10Codes());
    return ApiResponse.success("Lưu đánh giá chẩn đoán của bác sĩ thành công", ScreeningResponse.fromEntity(updated));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> deleteScreening(
      @PathVariable UUID id,
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập để thực hiện xóa ca sàng lọc");
    }
    boolean isAdmin = hasRole(principal, "ADMIN");
    screeningService.deleteScreening(id, principal.id(), isAdmin);
    return ApiResponse.success("Xóa ca sàng lọc thành công", null);
  }

  @PostMapping("/batch-delete")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Integer> batchDeleteScreenings(
      @Valid @RequestBody BatchDeleteScreeningsRequest request,
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập để thực hiện xóa ca sàng lọc");
    }
    boolean isAdmin = hasRole(principal, "ADMIN");
    int deletedCount = screeningService.batchDeleteScreenings(request.screeningIds(), principal.id(), isAdmin);
    return ApiResponse.success("Đã xóa thành công " + deletedCount + " ca sàng lọc", deletedCount);
  }
}
