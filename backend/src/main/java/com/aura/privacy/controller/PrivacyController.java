package com.aura.privacy.controller;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import com.aura.privacy.entity.PrivacySetting;
import com.aura.privacy.service.PrivacyService;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/privacy")
public class PrivacyController {

  private final PrivacyService privacyService;

  public PrivacyController(PrivacyService privacyService) {
    this.privacyService = privacyService;
  }

  @GetMapping
  public ApiResponse<Map<String, Object>> get(@AuthenticationPrincipal AuraUserPrincipal principal) {
    PrivacySetting s = privacyService.getOrCreate(principal.id());
    return ApiResponse.success(
        Map.of(
            "allowAnonymousAiTraining",
            s.isAllowAnonymousAiTraining(),
            "updatedAt",
            s.getUpdatedAt() == null ? "" : s.getUpdatedAt().toString()));
  }

  @PutMapping
  public ApiResponse<Map<String, Object>> update(
      @AuthenticationPrincipal AuraUserPrincipal principal, @RequestBody Map<String, Boolean> body) {
    boolean allow = Boolean.TRUE.equals(body.get("allowAnonymousAiTraining"));
    PrivacySetting s = privacyService.update(principal.id(), allow);
    return ApiResponse.success(
        "Đã cập nhật quyền dữ liệu", Map.of("allowAnonymousAiTraining", s.isAllowAnonymousAiTraining()));
  }

  @PostMapping("/export")
  public ApiResponse<Map<String, Object>> export(@AuthenticationPrincipal AuraUserPrincipal principal) {
    return ApiResponse.success("Bản trích xuất dữ liệu cá nhân", privacyService.exportPersonalData(principal.id()));
  }

  @PostMapping("/delete-account")
  public ApiResponse<Void> delete(@AuthenticationPrincipal AuraUserPrincipal principal) {
    privacyService.requestAccountDeletion(principal.id());
    return ApiResponse.success("Tài khoản đã được vô hiệu hóa và đánh dấu xóa", null);
  }
}
