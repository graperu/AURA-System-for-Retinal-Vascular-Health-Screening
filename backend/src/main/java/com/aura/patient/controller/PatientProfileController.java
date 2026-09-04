package com.aura.patient.controller;

import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.ErrorCode;
import com.aura.patient.dto.PatientLabDocumentResponse;
import com.aura.patient.dto.PatientProfileResponse;
import com.aura.patient.dto.UpdatePatientProfileRequest;
import com.aura.patient.entity.PatientLabDocument;
import com.aura.patient.service.PatientLabDocumentService;
import com.aura.patient.service.PatientProfileService;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/patient/profile")
public class PatientProfileController {
  private final PatientProfileService profileService;
  private final PatientLabDocumentService labDocumentService;

  public PatientProfileController(
      PatientProfileService profileService,
      PatientLabDocumentService labDocumentService) {
    this.profileService = profileService;
    this.labDocumentService = labDocumentService;
  }

  @GetMapping
  public ApiResponse<PatientProfileResponse> getMyProfile(
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    requirePrincipal(principal);
    return ApiResponse.success("Lấy thông tin hồ sơ y tế thành công",
        profileService.getOrCreateProfile(principal.id()));
  }

  @PutMapping
  public ApiResponse<PatientProfileResponse> updateMyProfile(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @Valid @RequestBody UpdatePatientProfileRequest request) {
    requirePrincipal(principal);
    return ApiResponse.success("Cập nhật thông tin cá nhân và tiền sử y tế thành công",
        profileService.updateProfile(principal.id(), request));
  }

  @GetMapping("/{patientId}")
  @PreAuthorize("@patientAccessService.canAccessPatient(principal, #patientId)")
  public ApiResponse<PatientProfileResponse> getPatientProfileById(
      @PathVariable UUID patientId,
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    return ApiResponse.success("Tra cứu thông tin hồ sơ bệnh nhân thành công",
        profileService.getProfileByPatientId(patientId));
  }

  @GetMapping("/lab-documents")
  @PreAuthorize("hasRole('USER')")
  public ApiResponse<List<PatientLabDocumentResponse>> getMyLabDocuments(
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    return ApiResponse.success(labDocumentService.list(principal.id()));
  }

  @PostMapping(value = "/lab-documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("hasRole('USER')")
  public ApiResponse<PatientLabDocumentResponse> uploadMyLabDocument(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @RequestPart("file") MultipartFile file) {
    return ApiResponse.success("Đã đính kèm kết quả xét nghiệm",
        labDocumentService.upload(principal.id(), file));
  }

  @DeleteMapping("/lab-documents/{documentId}")
  @PreAuthorize("hasRole('USER')")
  public ApiResponse<Void> deleteMyLabDocument(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @PathVariable UUID documentId) {
    labDocumentService.delete(principal.id(), documentId);
    return ApiResponse.success("Đã xóa tệp xét nghiệm", null);
  }

  @GetMapping("/{patientId}/lab-documents")
  @PreAuthorize("@patientAccessService.canAccessPatient(principal, #patientId)")
  public ApiResponse<List<PatientLabDocumentResponse>> getPatientLabDocuments(
      @PathVariable UUID patientId) {
    return ApiResponse.success(labDocumentService.list(patientId));
  }

  @GetMapping("/{patientId}/lab-documents/{documentId}/content")
  @PreAuthorize("@patientAccessService.canAccessPatient(principal, #patientId)")
  public ResponseEntity<ByteArrayResource> downloadLabDocument(
      @PathVariable UUID patientId,
      @PathVariable UUID documentId) {
    PatientLabDocument document = labDocumentService.getContent(patientId, documentId);
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(document.getContentType()))
        .contentLength(document.getFileSize())
        .header(HttpHeaders.CONTENT_DISPOSITION,
            ContentDisposition.attachment()
                .filename(document.getFileName(), StandardCharsets.UTF_8)
                .build().toString())
        .body(new ByteArrayResource(document.getContent()));
  }

  private void requirePrincipal(AuraUserPrincipal principal) {
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Chưa đăng nhập hoặc phiên làm việc đã hết hạn");
    }
  }
}
