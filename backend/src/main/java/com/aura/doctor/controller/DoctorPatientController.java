package com.aura.doctor.controller;

import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.ErrorCode;
import com.aura.common.response.PageResponse;
import com.aura.doctor.dto.DoctorPatientSummaryResponse;
import com.aura.doctor.service.DoctorPatientAssignmentService;
import com.aura.patient.dto.PatientProfileDto;
import com.aura.patient.dto.PatientProfileResponse;
import com.aura.patient.entity.PatientProfile;
import com.aura.patient.service.PatientProfileService;
import com.aura.screening.dto.CreateScreeningRequest;
import com.aura.screening.entity.Screening;
import com.aura.screening.service.ScreeningService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/doctor/patients")
@Tag(name = "Doctor Patient Management", description = "Endpoints for Doctor Patient Worklist, Search, Filter & Pagination (FR-13, FR-18)")
public class DoctorPatientController {

  private final DoctorPatientAssignmentService assignmentService;
  private final PatientProfileService profileService;
  private final ScreeningService screeningService;
  private final com.aura.doctor.repository.DoctorPatientAssignmentRepository assignmentRepository;
  private final com.aura.user.repository.UserRepository userRepository;
  private final com.aura.patient.repository.PatientProfileRepository patientProfileRepository;

  @org.springframework.beans.factory.annotation.Autowired
  public DoctorPatientController(
      DoctorPatientAssignmentService assignmentService,
      PatientProfileService profileService,
      ScreeningService screeningService,
      @org.springframework.beans.factory.annotation.Autowired(required = false)
      com.aura.doctor.repository.DoctorPatientAssignmentRepository assignmentRepository,
      @org.springframework.beans.factory.annotation.Autowired(required = false)
      com.aura.user.repository.UserRepository userRepository,
      @org.springframework.beans.factory.annotation.Autowired(required = false)
      com.aura.patient.repository.PatientProfileRepository patientProfileRepository) {
    this.assignmentService = assignmentService;
    this.profileService = profileService;
    this.screeningService = screeningService;
    this.assignmentRepository = assignmentRepository;
    this.userRepository = userRepository;
    this.patientProfileRepository = patientProfileRepository;
  }

  public DoctorPatientController(
      DoctorPatientAssignmentService assignmentService,
      PatientProfileService profileService,
      ScreeningService screeningService) {
    this(assignmentService, profileService, screeningService, null, null, null);
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'CLINIC')")
  @Operation(summary = "Get paginated patients with dynamic filter and search (FR-18)")
  public ApiResponse<?> getPatients(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String risk,
      @RequestParam(required = false) Integer minScore,
      @RequestParam(required = false) Integer maxScore,
      @RequestParam(required = false) Boolean hasDiabetes,
      @RequestParam(required = false) Boolean hasHypertension,
      @RequestParam(required = false) Boolean historyOfSmoking,
      @RequestParam(required = false) String doctorName,
      @RequestParam(required = false) String reviewStatus,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size,
      @RequestParam(required = false) String sort,
      @AuthenticationPrincipal AuraUserPrincipal principal) {

    boolean isDoctor = hasRole(principal, "DOCTOR");
    boolean isAdmin = hasRole(principal, "ADMIN");

    // If pagination or filter query params provided (e.g. from DoctorPatientListPage)
    if (page != null || size != null || search != null || risk != null || hasDiabetes != null || hasHypertension != null || historyOfSmoking != null) {
      int pageNum = page != null ? page : 0;
      int pageSize = size != null ? size : 10;
      Sort sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
      if (sort != null && !sort.isBlank()) {
        String[] parts = sort.split(",");
        String prop = parts[0].trim();
        Sort.Direction dir = parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        if (prop.equals("lastExamDate") || prop.equals("riskScore") || prop.equals("fullName") || prop.equals("createdAt")) {
          sortObj = Sort.by(dir, prop);
        }
      }
      Pageable pageable = PageRequest.of(pageNum, pageSize, sortObj);

      if (isDoctor && !isAdmin) {
        List<UUID> assignedPatientIds = new java.util.ArrayList<>();
        if (assignmentRepository != null) {
          var ids = assignmentRepository.findPatientIdsByDoctorIdAndStatus(
              principal.id(), com.aura.doctor.entity.AssignmentStatus.ACTIVE);
          if (ids != null) {
            assignedPatientIds.addAll(ids);
          }
        } else if (assignmentService != null) {
          List<DoctorPatientSummaryResponse> assigned = assignmentService.getAssignedPatients(principal.id());
          if (assigned != null) {
            assignedPatientIds.addAll(assigned.stream().map(DoctorPatientSummaryResponse::patientId).toList());
          }
        }

        if (userRepository != null && patientProfileRepository != null) {
          userRepository.findById(principal.id()).ifPresent(doc -> {
            if (doc.getFullName() != null && !doc.getFullName().isBlank()) {
              var profilesByDoctor = patientProfileRepository.findByAssignedDoctor(doc.getFullName());
              if (profilesByDoctor != null) {
                for (var p : profilesByDoctor) {
                  if (p.getUserId() != null && !assignedPatientIds.contains(p.getUserId())) {
                    assignedPatientIds.add(p.getUserId());
                  }
                  if (p.getId() != null && !assignedPatientIds.contains(p.getId())) {
                    assignedPatientIds.add(p.getId());
                  }
                }
              }
            }
          });
        }

        if (!assignedPatientIds.isEmpty()) {
          Page<PatientProfileDto> patientPage = profileService.searchPatients(
              search, risk, minScore, maxScore, hasDiabetes, hasHypertension, historyOfSmoking, doctorName, reviewStatus, assignedPatientIds, pageable);
          return ApiResponse.success("Lấy danh sách bệnh nhân thành công", PageResponse.from(patientPage));
        } else if (doctorName != null && !doctorName.isBlank() && !doctorName.equalsIgnoreCase("ALL")) {
          // Bác sĩ chỉ được tìm kiếm theo tên của chính mình, chống IDOR qua doctorName
          String callerFullName = (principal != null && userRepository != null)
              ? userRepository.findById(principal.id()).map(com.aura.user.entity.User::getFullName).orElse(null)
              : null;
          if (callerFullName != null && !callerFullName.isBlank() && !doctorName.trim().equalsIgnoreCase(callerFullName.trim())) {
            return ApiResponse.success("Lấy danh sách bệnh nhân thành công", PageResponse.from(new org.springframework.data.domain.PageImpl<>(List.of(), pageable, 0)));
          }
          Page<PatientProfileDto> patientPage = profileService.searchPatients(
              search, risk, minScore, maxScore, hasDiabetes, hasHypertension, historyOfSmoking, doctorName, reviewStatus, pageable);
          return ApiResponse.success("Lấy danh sách bệnh nhân thành công", PageResponse.from(patientPage));
        } else {
          // Empty assignments -> return empty page, never fallback to hospital-wide patients
          return ApiResponse.success("Lấy danh sách bệnh nhân thành công", PageResponse.from(new org.springframework.data.domain.PageImpl<>(List.of(), pageable, 0)));
        }
      }

      Page<PatientProfileDto> patientPage = profileService.searchPatients(
          search, risk, minScore, maxScore, hasDiabetes, hasHypertension, historyOfSmoking, doctorName, reviewStatus, pageable);
      return ApiResponse.success("Lấy danh sách bệnh nhân thành công", PageResponse.from(patientPage));
    }

    // Default: Check assigned patients first
    if (principal != null) {
      List<DoctorPatientSummaryResponse> list = assignmentService.getAssignedPatients(principal.id());
      if (list != null && !list.isEmpty()) {
        return ApiResponse.success("Lấy danh sách bệnh nhân được phân công thành công", list);
      }
      if (isDoctor && !isAdmin) {
        // If caller is DOCTOR and has no assigned patients, return empty list! Never fallback to 100 hospital-wide patients
        return ApiResponse.success("Lấy danh sách bệnh nhân được phân công thành công", List.of());
      }
    }

    if (isDoctor && !isAdmin) {
      return ApiResponse.success("Lấy danh sách bệnh nhân được phân công thành công", List.of());
    }

    // If no specific assignment and caller is ADMIN/CLINIC, return default paginated patient profiles
    Pageable pageable = PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<PatientProfileDto> patientPage = profileService.searchPatients(
        null, null, null, null, null, null, null, null, null, pageable);
    return ApiResponse.success("Lấy danh sách bệnh nhân thành công", PageResponse.from(patientPage));
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'CLINIC')")
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create new patient profile")
  public ApiResponse<PatientProfileDto> createPatient(
      @jakarta.validation.Valid @RequestBody PatientProfile patient,
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    UUID doctorId = (principal != null && hasRole(principal, "DOCTOR")) ? principal.id() : null;
    PatientProfileDto created = (doctorId != null)
        ? profileService.createPatient(patient, doctorId)
        : profileService.createPatient(patient);
    return ApiResponse.success("Tạo hồ sơ bệnh nhân mới thành công", created);
  }

  public ApiResponse<PatientProfileDto> createPatient(PatientProfile patient) {
    return createPatient(patient, null);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'CLINIC')")
  @Operation(summary = "Update patient profile")
  public ApiResponse<PatientProfileDto> updatePatient(
      @PathVariable UUID id,
      @jakarta.validation.Valid @RequestBody PatientProfile patient,
      @AuthenticationPrincipal AuraUserPrincipal principal) {

    boolean isDoctor = principal != null && principal.roles() != null && principal.roles().contains("DOCTOR");
    boolean isAdmin = principal != null && principal.roles() != null && principal.roles().contains("ADMIN");

    if (isDoctor && !isAdmin) {
      boolean hasAccess = checkDoctorAccessToPatient(principal.id(), id);
      if (!hasAccess) {
        throw new AuthException(ErrorCode.ACCESS_DENIED, "Bạn không có quyền cập nhật hồ sơ bệnh nhân này do chưa được phân công phụ trách.");
      }
    }

    PatientProfileDto updated = profileService.updatePatient(id, patient);
    return ApiResponse.success("Cập nhật hồ sơ bệnh nhân thành công", updated);
  }

  public ApiResponse<PatientProfileDto> updatePatient(UUID id, PatientProfile patient) {
    return updatePatient(id, patient, null);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'CLINIC')")
  @Operation(summary = "Delete patient profile")
  public ApiResponse<Void> deletePatient(
      @PathVariable UUID id,
      @AuthenticationPrincipal AuraUserPrincipal principal) {

    boolean isDoctor = principal != null && principal.roles() != null && principal.roles().contains("DOCTOR");
    boolean isAdmin = principal != null && principal.roles() != null && principal.roles().contains("ADMIN");

    if (isDoctor && !isAdmin) {
      boolean hasAccess = checkDoctorAccessToPatient(principal.id(), id);
      if (!hasAccess) {
        throw new AuthException(ErrorCode.ACCESS_DENIED, "Bạn không có quyền xóa hồ sơ bệnh nhân này do chưa được phân công phụ trách.");
      }
    }

    profileService.deletePatient(id);
    return ApiResponse.success("Xóa hồ sơ bệnh nhân thành công", null);
  }

  public ApiResponse<Void> deletePatient(UUID id) {
    return deletePatient(id, null);
  }

  public record BatchDeletePatientRequest(List<UUID> patientIds) {}

  @PostMapping("/batch-delete")
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'CLINIC')")
  @Operation(summary = "Batch delete patient profiles")
  public ApiResponse<Integer> batchDeletePatients(
      @RequestBody BatchDeletePatientRequest request,
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    if (request == null || request.patientIds() == null || request.patientIds().isEmpty()) {
      return ApiResponse.success("Không có bệnh nhân nào được chọn để xóa", 0);
    }

    boolean isDoctor = principal != null && principal.roles() != null && principal.roles().contains("DOCTOR");
    boolean isAdmin = principal != null && principal.roles() != null && principal.roles().contains("ADMIN");

    List<UUID> idsToDelete = request.patientIds();
    if (isDoctor && !isAdmin) {
      idsToDelete = idsToDelete.stream()
          .filter(id -> checkDoctorAccessToPatient(principal.id(), id))
          .toList();
      if (idsToDelete.isEmpty()) {
        throw new AuthException(ErrorCode.ACCESS_DENIED, "Bạn không có quyền xóa các bệnh nhân đã chọn.");
      }
    }

    int count = profileService.batchDeletePatients(idsToDelete);
    return ApiResponse.success("Xóa thành công " + count + " hồ sơ bệnh nhân", count);
  }

  private boolean checkDoctorAccessToPatient(UUID doctorId, UUID patientOrProfileId) {
    if (doctorId == null || patientOrProfileId == null) {
      return false;
    }
    if (assignmentRepository != null && assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(
        doctorId, patientOrProfileId, com.aura.doctor.entity.AssignmentStatus.ACTIVE)) {
      return true;
    }
    if (patientProfileRepository != null) {
      var profileOpt = patientProfileRepository.findById(patientOrProfileId);
      if (profileOpt.isPresent()) {
        PatientProfile p = profileOpt.get();
        if (p.getUserId() != null && assignmentRepository != null && assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(
            doctorId, p.getUserId(), com.aura.doctor.entity.AssignmentStatus.ACTIVE)) {
          return true;
        }
        if (p.getAssignedDoctor() != null && userRepository != null) {
          var docOpt = userRepository.findById(doctorId);
          if (docOpt.isPresent() && p.getAssignedDoctor().equalsIgnoreCase(docOpt.get().getFullName())) {
            return true;
          }
        }
      }
    }
    if (assignmentService != null) {
      List<DoctorPatientSummaryResponse> assigned = assignmentService.getAssignedPatients(doctorId);
      if (assigned != null) {
        return assigned.stream().anyMatch(a -> patientOrProfileId.equals(a.patientId()));
      }
    }
    return false;
  }

  @GetMapping("/{patientId}")
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN') && @patientAccessService.canAccessPatient(principal, #patientId)")
  public ApiResponse<PatientProfileResponse> getAssignedPatientProfile(
      @PathVariable UUID patientId) {
    UUID effectivePatientId = patientId;
    if (patientProfileRepository != null) {
      var profileOpt = patientProfileRepository.findById(patientId);
      if (profileOpt.isPresent() && profileOpt.get().getUserId() != null) {
        effectivePatientId = profileOpt.get().getUserId();
      }
    }
    PatientProfileResponse response = profileService.getProfileByPatientId(effectivePatientId);
    return ApiResponse.success("Lấy thông tin hồ sơ bệnh nhân thành công", response);
  }

  @GetMapping("/{patientId}/screenings")
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN') && @patientAccessService.canAccessPatient(principal, #patientId)")
  public ApiResponse<List<Screening>> getAssignedPatientScreenings(
      @PathVariable UUID patientId) {
    UUID effectivePatientId = patientId;
    if (patientProfileRepository != null) {
      var profileOpt = patientProfileRepository.findById(patientId);
      if (profileOpt.isPresent() && profileOpt.get().getUserId() != null) {
        effectivePatientId = profileOpt.get().getUserId();
      }
    }
    List<Screening> screenings = screeningService.getScreeningsForPatient(effectivePatientId);
    if (screenings.isEmpty() && !effectivePatientId.equals(patientId)) {
      List<Screening> directScreenings = screeningService.getScreeningsForPatient(patientId);
      if (!directScreenings.isEmpty()) {
        screenings = directScreenings;
      }
    }
    return ApiResponse.success("Lấy lịch sử ca sàng lọc của bệnh nhân thành công", screenings);
  }

  @PostMapping("/{patientId}/screenings")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN') && @patientAccessService.canAccessPatient(principal, #patientId)")
  public ApiResponse<Screening> createScreeningForAssignedPatient(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @PathVariable UUID patientId,
      @Valid @RequestBody CreateScreeningRequest request) {
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập tài khoản Bác sĩ");
    }
    UUID effectivePatientId = patientId;
    if (patientProfileRepository != null) {
      var profileOpt = patientProfileRepository.findById(patientId);
      if (profileOpt.isPresent() && profileOpt.get().getUserId() != null) {
        effectivePatientId = profileOpt.get().getUserId();
      }
    }
    Screening screening = screeningService.createScreening(effectivePatientId, request);
    return ApiResponse.success("Tạo ca sàng lọc cho bệnh nhân được phân công thành công", screening);
  }

  private boolean hasRole(AuraUserPrincipal principal, String role) {
    if (principal == null || principal.roles() == null) {
      return false;
    }
    String target = role.toUpperCase();
    String targetWithPrefix = target.startsWith("ROLE_") ? target : "ROLE_" + target;
    String targetWithoutPrefix = target.startsWith("ROLE_") ? target.substring(5) : target;
    return principal.roles().stream()
        .map(String::toUpperCase)
        .anyMatch(r -> r.equals(targetWithPrefix) || r.equals(targetWithoutPrefix));
  }
}
