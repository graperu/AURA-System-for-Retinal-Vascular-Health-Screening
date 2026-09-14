package com.aura.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import com.aura.screening.entity.Screening;
import com.aura.screening.repository.ScreeningRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class PatientAccessServiceTest {

  @Mock private DoctorPatientAssignmentRepository assignmentRepository;
  @Mock private ScreeningRepository screeningRepository;

  @InjectMocks private PatientAccessService service;

  private UUID patientId;
  private UUID otherPatientId;
  private UUID doctorId;
  private UUID adminId;
  private UUID clinicId;

  private AuraUserPrincipal adminPrincipal;
  private AuraUserPrincipal patientPrincipal;
  private AuraUserPrincipal doctorPrincipal;
  private AuraUserPrincipal clinicPrincipal;

  @BeforeEach
  void setUp() {
    patientId = UUID.randomUUID();
    otherPatientId = UUID.randomUUID();
    doctorId = UUID.randomUUID();
    adminId = UUID.randomUUID();
    clinicId = UUID.randomUUID();

    adminPrincipal = new AuraUserPrincipal(adminId, "admin@aura.com", "pass", true, List.of("ADMIN"));
    patientPrincipal = new AuraUserPrincipal(patientId, "patient@aura.com", "pass", true, List.of("USER"));
    doctorPrincipal = new AuraUserPrincipal(doctorId, "doctor@aura.com", "pass", true, List.of("DOCTOR"));
    clinicPrincipal = new AuraUserPrincipal(clinicId, "clinic@aura.com", "pass", true, List.of("CLINIC"));
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  @Nested
  @DisplayName("canAccessPatient tests")
  class CanAccessPatientTests {

    @Test
    @DisplayName("returns false when principal or patientId is null")
    void canAccessPatient_NullChecks() {
      assertThat(service.canAccessPatient(null, patientId)).isFalse();
      assertThat(service.canAccessPatient(patientPrincipal, null)).isFalse();
      assertThat(service.canAccessPatient(null, null)).isFalse();
    }

    @Test
    @DisplayName("ADMIN role is granted access to any patient")
    void canAccessPatient_AdminAccessGranted() {
      assertThat(service.canAccessPatient(adminPrincipal, patientId)).isTrue();
      assertThat(service.canAccessPatient(adminPrincipal, otherPatientId)).isTrue();
      verifyNoInteractions(assignmentRepository);
    }

    @Test
    @DisplayName("USER role can access own record but cannot access other patient records (Anti-IDOR)")
    void canAccessPatient_UserRoleAccessControl() {
      // Patient accessing own data -> OK
      assertThat(service.canAccessPatient(patientPrincipal, patientId)).isTrue();

      // Patient accessing other patient data -> FORBIDDEN (IDOR prevented)
      assertThat(service.canAccessPatient(patientPrincipal, otherPatientId)).isFalse();
      verifyNoInteractions(assignmentRepository);
    }

    @Test
    @DisplayName("DOCTOR role can access patient when active assignment exists")
    void canAccessPatient_DoctorRole_Assigned_AccessGranted() {
      when(assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(doctorId, patientId, AssignmentStatus.ACTIVE))
          .thenReturn(true);

      assertThat(service.canAccessPatient(doctorPrincipal, patientId)).isTrue();
    }

    @Test
    @DisplayName("DOCTOR role is denied access when assignment does not exist or is inactive")
    void canAccessPatient_DoctorRole_Unassigned_AccessDenied() {
      when(assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(doctorId, otherPatientId, AssignmentStatus.ACTIVE))
          .thenReturn(false);

      assertThat(service.canAccessPatient(doctorPrincipal, otherPatientId)).isFalse();
    }

    @Test
    @DisplayName("Other roles such as CLINIC are denied patient access")
    void canAccessPatient_OtherRoles_Denied() {
      assertThat(service.canAccessPatient(clinicPrincipal, patientId)).isFalse();
    }
  }

  @Nested
  @DisplayName("canChatBetween tests")
  class CanChatBetweenTests {

    @Test
    @DisplayName("returns false when principal or targetUserId is null")
    void canChatBetween_NullChecks() {
      assertThat(service.canChatBetween(null, doctorId)).isFalse();
      assertThat(service.canChatBetween(patientPrincipal, null)).isFalse();
    }

    @Test
    @DisplayName("ADMIN can chat with any target user")
    void canChatBetween_AdminCanChatWithAnyone() {
      assertThat(service.canChatBetween(adminPrincipal, doctorId)).isTrue();
      assertThat(service.canChatBetween(adminPrincipal, patientId)).isTrue();
      verifyNoInteractions(assignmentRepository);
    }

    @Test
    @DisplayName("USER can chat with assigned Doctor, denied for unassigned Doctor")
    void canChatBetween_PatientWithDoctor() {
      // Assigned doctor
      when(assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(doctorId, patientId, AssignmentStatus.ACTIVE))
          .thenReturn(true);
      assertThat(service.canChatBetween(patientPrincipal, doctorId)).isTrue();

      // Unassigned doctor
      UUID unassignedDoctorId = UUID.randomUUID();
      when(assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(unassignedDoctorId, patientId, AssignmentStatus.ACTIVE))
          .thenReturn(false);
      assertThat(service.canChatBetween(patientPrincipal, unassignedDoctorId)).isFalse();
    }

    @Test
    @DisplayName("DOCTOR can chat with assigned Patient, denied for unassigned Patient")
    void canChatBetween_DoctorWithPatient() {
      // Assigned patient
      when(assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(doctorId, patientId, AssignmentStatus.ACTIVE))
          .thenReturn(true);
      assertThat(service.canChatBetween(doctorPrincipal, patientId)).isTrue();

      // Unassigned patient
      when(assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(doctorId, otherPatientId, AssignmentStatus.ACTIVE))
          .thenReturn(false);
      assertThat(service.canChatBetween(doctorPrincipal, otherPatientId)).isFalse();
    }

    @Test
    @DisplayName("Other roles (e.g. CLINIC) cannot initiate consultation chat")
    void canChatBetween_OtherRoles_Denied() {
      assertThat(service.canChatBetween(clinicPrincipal, patientId)).isFalse();
    }
  }

  @Nested
  @DisplayName("canCurrentDoctorAccess tests")
  class CanCurrentDoctorAccessTests {

    @Test
    @DisplayName("returns false when security context has no authentication")
    void canCurrentDoctorAccess_NoAuth_ReturnsFalse() {
      SecurityContextHolder.clearContext();
      assertThat(service.canCurrentDoctorAccess(patientId)).isFalse();
    }

    @Test
    @DisplayName("returns false when authentication principal is not AuraUserPrincipal")
    void canCurrentDoctorAccess_NonAuraPrincipal_ReturnsFalse() {
      Authentication auth = new UsernamePasswordAuthenticationToken("anonymousUser", "pass");
      SecurityContext context = mock(SecurityContext.class);
      when(context.getAuthentication()).thenReturn(auth);
      SecurityContextHolder.setContext(context);

      assertThat(service.canCurrentDoctorAccess(patientId)).isFalse();
    }

    @Test
    @DisplayName("delegates to canAccessPatient when principal is AuraUserPrincipal")
    void canCurrentDoctorAccess_ValidDoctorPrincipal_Delegates() {
      Authentication auth = new UsernamePasswordAuthenticationToken(doctorPrincipal, null, doctorPrincipal.getAuthorities());
      SecurityContext context = mock(SecurityContext.class);
      when(context.getAuthentication()).thenReturn(auth);
      SecurityContextHolder.setContext(context);

      when(assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(doctorId, patientId, AssignmentStatus.ACTIVE))
          .thenReturn(true);

      assertThat(service.canCurrentDoctorAccess(patientId)).isTrue();
    }
  }

  @Nested
  @DisplayName("canAccessScreening tests")
  class CanAccessScreeningTests {

    private UUID screeningId;

    @BeforeEach
    void setUpScreening() {
      screeningId = UUID.randomUUID();
    }

    @Test
    @DisplayName("returns false when principal or screeningId is null")
    void canAccessScreening_NullChecks() {
      assertThat(service.canAccessScreening(null, screeningId)).isFalse();
      assertThat(service.canAccessScreening(patientPrincipal, null)).isFalse();
    }

    @Test
    @DisplayName("ADMIN role can access any screening")
    void canAccessScreening_AdminAccessGranted() {
      assertThat(service.canAccessScreening(adminPrincipal, screeningId)).isTrue();
      verifyNoInteractions(screeningRepository);
    }

    @Test
    @DisplayName("returns false if screening does not exist")
    void canAccessScreening_NotFound_ReturnsFalse() {
      when(screeningRepository.findById(screeningId)).thenReturn(Optional.empty());

      assertThat(service.canAccessScreening(patientPrincipal, screeningId)).isFalse();
    }

    @Test
    @DisplayName("Patient can access own screening but not other patient's screening")
    void canAccessScreening_PatientAccessControl() {
      Screening screening = mock(Screening.class);
      when(screening.getPatientId()).thenReturn(patientId);
      when(screeningRepository.findById(screeningId)).thenReturn(Optional.of(screening));

      // Own screening -> true
      assertThat(service.canAccessScreening(patientPrincipal, screeningId)).isTrue();

      // Other patient's screening -> false
      Screening otherScreening = mock(Screening.class);
      when(otherScreening.getPatientId()).thenReturn(otherPatientId);
      UUID otherScreeningId = UUID.randomUUID();
      when(screeningRepository.findById(otherScreeningId)).thenReturn(Optional.of(otherScreening));

      assertThat(service.canAccessScreening(patientPrincipal, otherScreeningId)).isFalse();
    }
  }

  @Nested
  @DisplayName("canReviewScreening tests")
  class CanReviewScreeningTests {

    private UUID screeningId;

    @BeforeEach
    void setUpScreening() {
      screeningId = UUID.randomUUID();
    }

    @Test
    @DisplayName("returns false when principal or screeningId is null")
    void canReviewScreening_NullChecks() {
      assertThat(service.canReviewScreening(null, screeningId)).isFalse();
      assertThat(service.canReviewScreening(doctorPrincipal, null)).isFalse();
    }

    @Test
    @DisplayName("ADMIN role can review any screening")
    void canReviewScreening_AdminAccessGranted() {
      assertThat(service.canReviewScreening(adminPrincipal, screeningId)).isTrue();
      verifyNoInteractions(screeningRepository);
    }

    @Test
    @DisplayName("non-DOCTOR role (e.g. USER, CLINIC) cannot review screening")
    void canReviewScreening_NonDoctorRole_ReturnsFalse() {
      assertThat(service.canReviewScreening(patientPrincipal, screeningId)).isFalse();
      assertThat(service.canReviewScreening(clinicPrincipal, screeningId)).isFalse();
      verifyNoInteractions(screeningRepository);
    }

    @Test
    @DisplayName("DOCTOR receives false if screening does not exist")
    void canReviewScreening_NotFound_ReturnsFalse() {
      when(screeningRepository.findById(screeningId)).thenReturn(Optional.empty());

      assertThat(service.canReviewScreening(doctorPrincipal, screeningId)).isFalse();
    }

    @Test
    @DisplayName("DOCTOR can review screening when active assignment to patient exists")
    void canReviewScreening_AssignedDoctor_CanReview() {
      Screening screening = mock(Screening.class);
      when(screening.getPatientId()).thenReturn(patientId);
      when(screeningRepository.findById(screeningId)).thenReturn(Optional.of(screening));
      when(assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(doctorId, patientId, AssignmentStatus.ACTIVE))
          .thenReturn(true);

      assertThat(service.canReviewScreening(doctorPrincipal, screeningId)).isTrue();
    }

    @Test
    @DisplayName("DOCTOR cannot review screening when no active assignment exists")
    void canReviewScreening_UnassignedDoctor_CannotReview() {
      Screening screening = mock(Screening.class);
      when(screening.getPatientId()).thenReturn(patientId);
      when(screeningRepository.findById(screeningId)).thenReturn(Optional.of(screening));
      when(assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(doctorId, patientId, AssignmentStatus.ACTIVE))
          .thenReturn(false);

      assertThat(service.canReviewScreening(doctorPrincipal, screeningId)).isFalse();
    }
  }
}
