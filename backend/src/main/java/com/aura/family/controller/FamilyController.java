package com.aura.family.controller;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import com.aura.family.dto.CreateFamilyMemberRequest;
import com.aura.family.dto.FamilyMemberResponse;
import com.aura.family.service.FamilyService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/family")
public class FamilyController {

  private final FamilyService familyService;

  public FamilyController(FamilyService familyService) {
    this.familyService = familyService;
  }

  @GetMapping
  public ApiResponse<List<FamilyMemberResponse>> list(@AuthenticationPrincipal AuraUserPrincipal principal) {
    return ApiResponse.success(familyService.list(principal.id()));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<FamilyMemberResponse> create(
      @AuthenticationPrincipal AuraUserPrincipal principal, @RequestBody CreateFamilyMemberRequest request) {
    return ApiResponse.success("Đã thêm hồ sơ thành viên", familyService.create(principal.id(), request));
  }

  @PostMapping("/{id}/activate")
  public ApiResponse<FamilyMemberResponse> activate(
      @PathVariable UUID id, @AuthenticationPrincipal AuraUserPrincipal principal) {
    return ApiResponse.success("Đã chuyển hồ sơ đang xem", familyService.activate(principal.id(), id));
  }

  @DeleteMapping("/{id}")
  public ApiResponse<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal AuraUserPrincipal principal) {
    familyService.delete(principal.id(), id);
    return ApiResponse.success("Đã xóa hồ sơ thành viên", null);
  }
}
