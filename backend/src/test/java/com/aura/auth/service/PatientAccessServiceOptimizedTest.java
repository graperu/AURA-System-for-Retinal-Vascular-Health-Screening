package com.aura.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import com.aura.screening.entity.Screening;
import com.aura.screening.repository.ScreeningRepository;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
@DisplayName("PatientAccessService - Optimized Null Principal & Empty Roles Unit Tests")
class PatientAccessServiceOptimizedTest {

  @Mock private DoctorPatientAssignmentRepository assignmentRepository;
  @Mock private ScreeningRepository screeningRepository;

  private PatientAccessService accessService;
  private UUID samplePatientId;
  private UUID sampleScreeningId;

  @BeforeEach
  void setUp() {
    accessService = new PatientAccessService(assignmentRepository, screeningRepository);
    samplePatientId = UUID.randomUUID();
    sampleScreeningId = UUID.randomUUID();
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  @Test
  @DisplayName("canAccessPatient: Trả về false khi principal == null hoặc patientId == null")
  void testCanAccessPatientWithNullPrincipalOrNullPatientId() {
    AuraUserPrincipal validPrincipal = new AuraUserPrincipal(UUID.randomUUID(), "user@aura.ai", "pass", true, List.of("ADMIN"));

    assertThat(accessService.canAccessPatient(null, samplePatientId)).isFalse();
    assertThat(accessService.canAccessPatient(validPrincipal, null)).isFalse();
    assertThat(accessService.canAccessPatient(null, null)).isFalse();

    verifyNoInteractions(assignmentRepository, screeningRepository);
  }

  @Test
  @DisplayName("canAccessPatient: Trả về false khi roles của principal là null hoặc rỗng")
  void testCanAccessPatientWithNullOrEmptyRoles() {
    AuraUserPrincipal principalNullRoles = new AuraUserPrincipal(samplePatientId, "user@aura.ai", "pass", true, null);
    AuraUserPrincipal principalEmptyRoles = new AuraUserPrincipal(samplePatientId, "user@aura.ai", "pass", true, Collections.emptyList());

    assertThat(accessService.canAccessPatient(principalNullRoles, samplePatientId)).isFalse();
    assertThat(accessService.canAccessPatient(principalEmptyRoles, samplePatientId)).isFalse();

    verifyNoInteractions(assignmentRepository);
  }

  @Test
  @DisplayName("canChatBetween: Trả về false khi principal == null, targetUserId == null, hoặc roles rỗng/null")
  void testCanChatBetweenWithNullPrincipalOrEmptyRoles() {
    UUID targetId = UUID.randomUUID();
    AuraUserPrincipal principalNullRoles = new AuraUserPrincipal(UUID.randomUUID(), "u@aura.ai", "p", true, null);
    AuraUserPrincipal principalEmptyRoles = new AuraUserPrincipal(UUID.randomUUID(), "u@aura.ai", "p", true, List.of());
    AuraUserPrincipal validDoctor = new AuraUserPrincipal(UUID.randomUUID(), "doc@aura.ai", "p", true, List.of("DOCTOR"));

    assertThat(accessService.canChatBetween(null, targetId)).isFalse();
    assertThat(accessService.canChatBetween(validDoctor, null)).isFalse();
    assertThat(accessService.canChatBetween(principalNullRoles, targetId)).isFalse();
    assertThat(accessService.canChatBetween(principalEmptyRoles, targetId)).isFalse();

    verifyNoInteractions(assignmentRepository);
  }

  @Test
  @DisplayName("canChatBetween: Kiểm tra role không được hỗ trợ chat (như CLINIC) trả về false")
  void testCanChatBetweenUnsupportedRole() {
    AuraUserPrincipal clinicPrincipal = new AuraUserPrincipal(UUID.randomUUID(), "clinic@aura.ai", "p", true, List.of("CLINIC"));

    assertThat(accessService.canChatBetween(clinicPrincipal, UUID.randomUUID())).isFalse();
    verifyNoInteractions(assignmentRepository);
  }

  @Test
  @DisplayName("canAccessScreening: Trả về false khi principal null, roles null, hoặc screening không tồn tại")
  void testCanAccessScreeningEdgeCases() {
    AuraUserPrincipal nullRolesPrincipal = new AuraUserPrincipal(UUID.randomUUID(), "u@aura.ai", "p", true, null);
    AuraUserPrincipal doctorPrincipal = new AuraUserPrincipal(UUID.randomUUID(), "d@aura.ai", "p", true, List.of("DOCTOR"));

    assertThat(accessService.canAccessScreening(null, sampleScreeningId)).isFalse();
    assertThat(accessService.canAccessScreening(doctorPrincipal, null)).isFalse();
    assertThat(accessService.canAccessScreening(nullRolesPrincipal, sampleScreeningId)).isFalse();

    when(screeningRepository.findById(sampleScreeningId)).thenReturn(Optional.empty());
    assertThat(accessService.canAccessScreening(doctorPrincipal, sampleScreeningId)).isFalse();
  }

  @Test
  @DisplayName("canReviewScreening: Trả về false khi principal null, không phải DOCTOR/ADMIN, hoặc screening null")
  void testCanReviewScreeningEdgeCases() {
    AuraUserPrincipal userPrincipal = new AuraUserPrincipal(UUID.randomUUID(), "patient@aura.ai", "p", true, List.of("USER"));
    AuraUserPrincipal doctorPrincipal = new AuraUserPrincipal(UUID.randomUUID(), "doctor@aura.ai", "p", true, List.of("DOCTOR"));

    assertThat(accessService.canReviewScreening(null, sampleScreeningId)).isFalse();
    assertThat(accessService.canReviewScreening(doctorPrincipal, null)).isFalse();
    assertThat(accessService.canReviewScreening(userPrincipal, sampleScreeningId)).isFalse();

    when(screeningRepository.findById(sampleScreeningId)).thenReturn(Optional.empty());
    assertThat(accessService.canReviewScreening(doctorPrincipal, sampleScreeningId)).isFalse();
  }

  @Test
  @DisplayName("canReviewScreening: Admin được duyệt tất cả screening ngay cả khi không có assignment")
  void testCanReviewScreeningAdminAlwaysAllowed() {
    AuraUserPrincipal adminPrincipal = new AuraUserPrincipal(UUID.randomUUID(), "admin@aura.ai", "p", true, List.of("ADMIN"));
    assertThat(accessService.canReviewScreening(adminPrincipal, sampleScreeningId)).isTrue();
    verifyNoInteractions(screeningRepository, assignmentRepository);
  }

  @Test
  @DisplayName("canCurrentDoctorAccess: Trả về false khi SecurityContext rỗng hoặc Principal không phải AuraUserPrincipal")
  void testCanCurrentDoctorAccessWithInvalidSecurityContext() {
    // 1. Context authentication is null
    SecurityContextHolder.clearContext();
    assertThat(accessService.canCurrentDoctorAccess(samplePatientId)).isFalse();

    // 2. Context has anonymous string principal
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    Authentication stringAuth = new UsernamePasswordAuthenticationToken("anonymousUser", null);
    context.setAuthentication(stringAuth);
    SecurityContextHolder.setContext(context);
    assertThat(accessService.canCurrentDoctorAccess(samplePatientId)).isFalse();
  }

  @Test
  @DisplayName("canCurrentDoctorAccess: Ủy quyền thành công cho canAccessPatient khi Authentication là AuraUserPrincipal")
  void testCanCurrentDoctorAccessDelegation() {
    UUID doctorId = UUID.randomUUID();
    AuraUserPrincipal doctorPrincipal = new AuraUserPrincipal(doctorId, "doc@aura.ai", "pass", true, List.of("DOCTOR"));

    SecurityContext context = SecurityContextHolder.createEmptyContext();
    Authentication auth = new UsernamePasswordAuthenticationToken(doctorPrincipal, null);
    context.setAuthentication(auth);
    SecurityContextHolder.setContext(context);

    when(assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(doctorId, samplePatientId, AssignmentStatus.ACTIVE))
        .thenReturn(true);

    assertThat(accessService.canCurrentDoctorAccess(samplePatientId)).isTrue();
  }
}
