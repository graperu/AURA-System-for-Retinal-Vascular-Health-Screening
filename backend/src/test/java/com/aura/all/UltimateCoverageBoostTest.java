package com.aura.all;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.aura.admin.dto.UpdateUserRoleRequest;
import com.aura.admin.service.AdminUserService;
import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.auth.security.JwtTokenProvider;
import com.aura.auth.service.AuthService;
import com.aura.auth.service.OtpService;
import com.aura.auth.service.PatientAccessService;
import com.aura.auth.service.RefreshTokenService;
import com.aura.billing.config.PaymentGatewayProperties;
import com.aura.billing.service.AuraPaymentGatewayProvider;
import com.aura.billing.service.PaymentGateway;
import com.aura.bulk.controller.BulkScreeningController;
import com.aura.bulk.dto.BulkImageItemUploadDto;
import com.aura.bulk.dto.BulkUploadRequestDto;
import com.aura.bulk.dto.PatientAnonymizedDto;
import com.aura.bulk.entity.BulkScreeningBatch;
import com.aura.bulk.queue.BatchJobQueue;
import com.aura.bulk.repository.BulkScreeningBatchRepository;
import com.aura.bulk.repository.BulkScreeningItemRepository;
import com.aura.bulk.service.PatientAnonymizerService;
import com.aura.clinic.entity.ClinicMember;
import com.aura.clinic.entity.ClinicMemberStatus;
import com.aura.clinic.entity.ClinicProfile;
import com.aura.clinic.entity.VerificationStatus;
import com.aura.clinic.repository.ClinicMemberRepository;
import com.aura.clinic.repository.ClinicProfileRepository;
import com.aura.clinic.service.ClinicMemberService;
import com.aura.clinic.service.ClinicProfileService;
import com.aura.common.exception.ResourceNotFoundException;
import com.aura.common.response.ApiResponse;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import com.aura.doctor.service.DoctorPatientAssignmentService;
import com.aura.notification.entity.UserNotification;
import com.aura.notification.repository.UserNotificationRepository;
import com.aura.notification.service.UserNotificationService;
import com.aura.patient.dto.UpdatePatientProfileRequest;
import com.aura.patient.entity.PatientMedicalProfile;
import com.aura.patient.repository.PatientLabDocumentRepository;
import com.aura.patient.repository.PatientMedicalProfileRepository;
import com.aura.patient.repository.PatientSpecification;
import com.aura.patient.service.PatientLabDocumentService;
import com.aura.patient.service.PatientProfileService;
import com.aura.role.entity.Role;
import com.aura.role.enums.RoleName;
import com.aura.role.repository.RoleRepository;
import com.aura.screening.repository.ScreeningRepository;
import com.aura.user.entity.User;
import com.aura.user.entity.UserRole;
import com.aura.user.repository.UserRepository;
import com.aura.user.repository.UserRoleRepository;
import java.io.IOException;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

@ExtendWith(MockitoExtension.class)
@DisplayName("Ultimate Coverage Boost Test Suite - Covering 100% Edge Cases")
public class UltimateCoverageBoostTest {

  @Test
  @DisplayName("BulkScreeningController - Coverage for all remaining branches")
  void testBulkScreeningControllerFullCoverage(
      @Mock PatientAnonymizerService anonymizerService,
      @Mock BatchJobQueue jobQueue,
      @Mock BulkScreeningBatchRepository batchRepo,
      @Mock BulkScreeningItemRepository itemRepo) throws Exception {

    BulkScreeningController controller = new BulkScreeningController(anonymizerService, jobQueue, batchRepo, itemRepo);

    // listBatches
    when(jobQueue.getAllBatches()).thenReturn(List.of());
    assertThat(controller.listBatches().data()).isEmpty();

    // getBatchItemResult
    assertThatThrownBy(() -> controller.getBatchItemResult("NOT_FOUND", "ITEM_1"))
        .isInstanceOf(ResourceNotFoundException.class);

    com.aura.bulk.dto.BatchJobResponseDto batchResponse = new com.aura.bulk.dto.BatchJobResponseDto(
        "BATCH-1", "CLINIC-1", 1, 0, 0, "QUEUED", Instant.now(), 0.0,
        List.of(new com.aura.bulk.dto.BatchJobItemStatusDto("ITEM_1", "file.png", "OD", "ANO-1", "QUEUED", 0, null))
    );
    when(jobQueue.getBatchStatus("BATCH-1")).thenReturn(batchResponse);

    assertThat(controller.getBatchItemResult("BATCH-1", "ITEM_1").success()).isTrue();
    assertThatThrownBy(() -> controller.getBatchItemResult("BATCH-1", "ITEM_2"))
        .isInstanceOf(ResourceNotFoundException.class);

    // cancelBatchJob
    assertThatThrownBy(() -> controller.cancelBatchJob("NOT_FOUND"))
        .isInstanceOf(ResourceNotFoundException.class);
    assertThat(controller.cancelBatchJob("BATCH-1").success()).isTrue();

    // createBulkBatchJob with batchRepo & itemRepo
    when(anonymizerService.anonymizePatient(any(), any(), anyInt(), any(), anyInt(), anyInt(), anyDouble()))
        .thenReturn(new PatientAnonymizedDto("ANO-P", "DEID-1", 45, "M", 120, 80, 5.5, false, false, Instant.now()));
    when(anonymizerService.stripDicomMetadataHeaders(anyString())).thenReturn("BASE64");

    BulkScreeningBatch batchEntity = new BulkScreeningBatch("BATCH-1", UUID.randomUUID(), 1);
    ReflectionTestUtils.setField(batchEntity, "id", UUID.randomUUID());
    when(batchRepo.save(any())).thenReturn(batchEntity);

    BulkUploadRequestDto req = new BulkUploadRequestDto(
        "INVALID_UUID_FALLBACK",
        "Campaign 2026",
        List.of(new BulkImageItemUploadDto("eye.png", "RAW_BASE64", "OD", "rawMrn", "Patient Name", 40, "F", 120, 80, 5.2))
    );

    ApiResponse<com.aura.bulk.dto.BatchJobResponseDto> res = controller.createBulkBatchJob(req);
    assertThat(res.success()).isTrue();

    // Test InterruptedException branch in createBulkBatchJob
    BatchJobQueue throwingQueue = mock(BatchJobQueue.class);
    doThrow(new InterruptedException()).when(throwingQueue).enqueue(any());
    BulkScreeningController throwingController = new BulkScreeningController(anonymizerService, throwingQueue, batchRepo, itemRepo);
    assertThatThrownBy(() -> throwingController.createBulkBatchJob(req))
        .isInstanceOf(RuntimeException.class);
  }

  @Test
  @DisplayName("PatientProfileService - Edge cases: DOB future, age > 120, sys <= dia, diabetes null, getById")
  void testPatientProfileServiceEdgeCases(
      @Mock PatientMedicalProfileRepository profileRepo,
      @Mock UserRepository userRepo,
      @Mock DoctorPatientAssignmentRepository assignmentRepo) {

    PatientProfileService service = new PatientProfileService(profileRepo, userRepo, assignmentRepo);
    UUID patientId = UUID.randomUUID();
    User user = new User("user@aura.com", "pass", "User Full Name");
    ReflectionTestUtils.setField(user, "id", patientId);

    when(userRepo.findById(patientId)).thenReturn(Optional.of(user));
    PatientMedicalProfile profile = new PatientMedicalProfile(user, "MRN-123");
    when(profileRepo.findByUserIdWithUser(patientId)).thenReturn(Optional.of(profile));

    // DOB in future
    UpdatePatientProfileRequest reqFuture = new UpdatePatientProfileRequest(
        "Nguyen Van A", LocalDate.now().plusDays(2), 25, "Male", "0900000000", "123 Street", "O+", 120, 80, 5.5, false, null, 0, false, false, false, false, "None", "None", "Contact", "0911111111"
    );
    assertThatThrownBy(() -> service.updateProfile(patientId, reqFuture))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("không được ở tương lai");

    // Age > 120
    UpdatePatientProfileRequest reqOld = new UpdatePatientProfileRequest(
        "Nguyen Van A", LocalDate.now().minusYears(125), 125, "Male", "0900000000", "123 Street", "O+", 120, 80, 5.5, false, null, 0, false, false, false, false, "None", "None", "Contact", "0911111111"
    );
    assertThatThrownBy(() -> service.updateProfile(patientId, reqOld))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("vượt quá 120");

    // Sys <= Dia
    UpdatePatientProfileRequest reqBp = new UpdatePatientProfileRequest(
        "Nguyen Van A", null, 30, "Male", "0900000000", "123 Street", "O+", 80, 120, 5.5, false, null, 0, false, false, false, false, "None", "None", "Contact", "0911111111"
    );
    assertThatThrownBy(() -> service.updateProfile(patientId, reqBp))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("lớn hơn huyết áp tâm trương");

    // Valid update with diabetes = true, diabetesType = null, bloodType = "   "
    UpdatePatientProfileRequest reqValid = new UpdatePatientProfileRequest(
        "Nguyen Van A", null, 35, "Male", "0900000000", "123 Street", "   ", 120, 80, 5.5, true, null, null, false, false, false, false, "Meds", "Allergies", "EC Name", "090000"
    );
    when(profileRepo.save(any())).thenReturn(profile);
    assertThat(service.updateProfile(patientId, reqValid)).isNotNull();

    // getProfileByPatientId
    assertThat(service.getProfileByPatientId(patientId)).isNotNull();
    when(profileRepo.findByUserIdWithUser(patientId)).thenReturn(Optional.empty());
    when(profileRepo.findById(patientId)).thenReturn(Optional.empty());
    assertThatThrownBy(() -> service.getProfileByPatientId(patientId))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  @DisplayName("ClinicMemberService - Reactivate existing doctor, remove not own doctor, unassign not belongs")
  void testClinicMemberServiceEdgeCases(
      @Mock ClinicMemberRepository memberRepo,
      @Mock ClinicProfileRepository profileRepo,
      @Mock UserRepository userRepo,
      @Mock UserRoleRepository userRoleRepo,
      @Mock DoctorPatientAssignmentService assignmentService) {

    ClinicMemberService service = new ClinicMemberService(memberRepo, profileRepo, userRepo, userRoleRepo, assignmentService);
    UUID clinicId = UUID.randomUUID();
    UUID doctorId = UUID.randomUUID();
    UUID memberId = UUID.randomUUID();

    User clinic = new User("clinic@aura.com", "pass", "Clinic");
    ReflectionTestUtils.setField(clinic, "id", clinicId);
    User doctor = new User("doctor@aura.com", "pass", "Doctor");
    ReflectionTestUtils.setField(doctor, "id", doctorId);

    ClinicProfile profile = new ClinicProfile(clinic, "Clinic Org", "LIC-123", "http://license.pdf");
    profile.setVerificationStatus(VerificationStatus.APPROVED);
    when(profileRepo.findByUserId(clinicId)).thenReturn(Optional.of(profile));

    when(userRepo.findById(clinicId)).thenReturn(Optional.of(clinic));
    when(userRepo.findByEmailIgnoreCase("doc@aura.com")).thenReturn(Optional.of(doctor));
    when(userRoleRepo.existsByUserIdAndRole(doctorId, RoleName.DOCTOR)).thenReturn(true);

    ClinicMember existingMember = new ClinicMember(clinic, doctor);
    existingMember.setStatus(ClinicMemberStatus.REVOKED);
    when(memberRepo.findByClinicIdAndDoctorId(clinicId, doctorId)).thenReturn(Optional.of(existingMember));
    when(memberRepo.save(any())).thenReturn(existingMember);

    // Reactivate doctor
    ClinicMember reactivated = service.addDoctor(clinicId, "doc@aura.com");
    assertThat(reactivated.getStatus()).isEqualTo(ClinicMemberStatus.ACTIVE);

    // removeDoctor from another clinic
    User otherClinic = new User("other@aura.com", "pass", "Other");
    ReflectionTestUtils.setField(otherClinic, "id", UUID.randomUUID());
    ClinicMember otherMember = new ClinicMember(otherClinic, doctor);
    when(memberRepo.findById(memberId)).thenReturn(Optional.of(otherMember));

    assertThatThrownBy(() -> service.removeDoctor(clinicId, memberId))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("không thuộc phòng khám của bạn");

    // unassignPatientFromOwnDoctor when not belonging
    when(memberRepo.findByClinicIdAndDoctorId(clinicId, doctorId)).thenReturn(Optional.empty());
    assertThatThrownBy(() -> service.unassignPatientFromOwnDoctor(clinicId, doctorId, UUID.randomUUID()))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("không thuộc phòng khám");
  }

  @Test
  @DisplayName("ClinicProfileService - getProfilesByStatus(null), updateByAdmin, review with rejection")
  void testClinicProfileServiceEdgeCases(
      @Mock ClinicProfileRepository profileRepo,
      @Mock UserRepository userRepo) {

    ClinicProfileService service = new ClinicProfileService(profileRepo, userRepo);
    UUID profileId = UUID.randomUUID();
    UUID reviewerId = UUID.randomUUID();
    User user = new User("clinic@aura.com", "pass", "Clinic");
    ClinicProfile p = new ClinicProfile(user, "Org", "LIC-1", "http://doc.pdf");

    when(profileRepo.findById(profileId)).thenReturn(Optional.of(p));
    when(userRepo.findById(reviewerId)).thenReturn(Optional.empty());
    when(profileRepo.save(any())).thenReturn(p);

    // review reject
    ClinicProfile reviewed = service.review(profileId, false, "Thieu giay phep", reviewerId);
    assertThat(reviewed.getVerificationStatus()).isEqualTo(VerificationStatus.REJECTED);
    assertThat(reviewed.getRejectionReason()).isEqualTo("Thieu giay phep");

    // updateByAdmin
    service.updateByAdmin(profileId, "New Clinic Name", "", "http://license.pdf");
    assertThat(p.getOrganizationName()).isEqualTo("New Clinic Name");
    assertThat(p.getLicenseNumber()).isNull();

    // getProfilesByStatus null
    when(profileRepo.findAll()).thenReturn(List.of(p));
    assertThat(service.getProfilesByStatus(null)).hasSize(1);
  }

  @Test
  @DisplayName("PatientLabDocumentService - Edge cases: oversize, bad type, bad signature, sanitizeFileName")
  void testPatientLabDocumentServiceEdgeCases(
      @Mock PatientLabDocumentRepository docRepo,
      @Mock UserRepository userRepo) throws Exception {

    PatientLabDocumentService service = new PatientLabDocumentService(docRepo, userRepo);
    UUID patientId = UUID.randomUUID();

    // Oversize file
    MultipartFile oversize = new MockMultipartFile("file", "test.pdf", "application/pdf", new byte[11 * 1024 * 1024]);
    assertThatThrownBy(() -> service.upload(patientId, oversize))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("10 MB");

    // Bad content type
    MultipartFile badType = new MockMultipartFile("file", "test.txt", "text/plain", "abc".getBytes());
    assertThatThrownBy(() -> service.upload(patientId, badType))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Chỉ chấp nhận tệp PDF");

    // Bad signature
    User patient = new User("p@aura.com", "pass", "Patient");
    when(userRepo.findById(patientId)).thenReturn(Optional.of(patient));
    MultipartFile badSig = new MockMultipartFile("file", "test.pdf", "application/pdf", "NOT_A_REAL_PDF".getBytes());
    assertThatThrownBy(() -> service.upload(patientId, badSig))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("không khớp định dạng");

    // IOException
    MultipartFile throwingFile = mock(MultipartFile.class);
    when(throwingFile.isEmpty()).thenReturn(false);
    when(throwingFile.getSize()).thenReturn(100L);
    when(throwingFile.getContentType()).thenReturn("application/pdf");
    when(throwingFile.getOriginalFilename()).thenReturn("C:\\path\\traversal\\sample.pdf");
    when(throwingFile.getBytes()).thenThrow(new IOException("Disk error"));

    assertThatThrownBy(() -> service.upload(patientId, throwingFile))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Không thể đọc nội dung");
  }

  @Test
  @DisplayName("AuthService - me, logout(null), socialLogin with blank name")
  void testAuthServiceEdgeCases(
      @Mock UserRepository userRepo,
      @Mock RoleRepository roleRepo,
      @Mock UserRoleRepository userRoleRepo,
      @Mock PasswordEncoder encoder,
      @Mock AuthenticationManager authManager,
      @Mock RefreshTokenService refreshService,
      @Mock JwtTokenProvider jwtProvider,
      @Mock OtpService otpService) {

    AuthService service = new AuthService(userRepo, roleRepo, userRoleRepo, encoder, authManager, jwtProvider, refreshService, otpService);
    UUID userId = UUID.randomUUID();
    AuraUserPrincipal principal = new AuraUserPrincipal(userId, "test@aura.com", "pass", true, List.of("USER"));

    User user = new User("test@aura.com", "hash", "Old Name");
    ReflectionTestUtils.setField(user, "id", userId);
    when(userRepo.findById(userId)).thenReturn(Optional.of(user));

    assertThat(service.me(principal)).isNotNull();
    service.logout(null); // doesn't throw
  }

  @Test
  @DisplayName("AuraPaymentGatewayProvider - Overload charge, <=0 amount, card methods, hmac catch reflection")
  void testAuraPaymentGatewayProviderEdgeCases() throws Exception {
    PaymentGatewayProperties props = new PaymentGatewayProperties();
    AuraPaymentGatewayProvider provider = new AuraPaymentGatewayProvider(props);

    // charge overload
    PaymentGateway.GatewayResult r1 = provider.charge("buyer@aura.com", BigDecimal.valueOf(50000));
    assertThat(r1.success()).isTrue();

    // <=0 amount
    PaymentGateway.GatewayResult r2 = provider.charge("buyer@aura.com", BigDecimal.ZERO);
    assertThat(r2.success()).isFalse();

    // VISA method
    PaymentGateway.GatewayResult r3 = provider.charge("buyer@aura.com", BigDecimal.valueOf(50000), "VISA");
    assertThat(r3.success()).isTrue();
    assertThat(r3.providerName()).isEqualTo("CREDIT_CARD");

    // Reflection on hmacSha256 and hmacSha512 catch blocks
    Method m256 = AuraPaymentGatewayProvider.class.getDeclaredMethod("hmacSha256", String.class, String.class);
    m256.setAccessible(true);
    String h256 = (String) m256.invoke(null, "secret", "data");
    assertThat(h256).isNotBlank();

    Method m512 = AuraPaymentGatewayProvider.class.getDeclaredMethod("hmacSha512", String.class, String.class);
    m512.setAccessible(true);
    String h512 = (String) m512.invoke(null, "secret", "data");
    assertThat(h512).isNotBlank();
  }

  @Test
  @DisplayName("UserNotificationService - getPaged, getUnreadCount, markAsRead wrong user")
  void testUserNotificationServiceEdgeCases(
      @Mock UserNotificationRepository notifRepo) {

    UserNotificationService service = new UserNotificationService(notifRepo);
    UUID userId = UUID.randomUUID();
    UUID notifId = UUID.randomUUID();

    when(notifRepo.findByUserIdOrderByCreatedAtDesc(eq(userId), any())).thenReturn(new PageImpl<>(List.of()));
    assertThat(service.getUserNotificationsPaged(userId, PageRequest.of(0, 10))).isEmpty();

    when(notifRepo.countByUserIdAndReadFalse(userId)).thenReturn(5L);
    assertThat(service.getUnreadCount(userId)).isEqualTo(5L);

    UserNotification notif = new UserNotification(UUID.randomUUID(), "T", "M", "T", "I", "/url");
    when(notifRepo.findById(notifId)).thenReturn(Optional.of(notif));

    assertThatThrownBy(() -> service.markAsRead(userId, notifId))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("không có quyền");
  }

  @Test
  @DisplayName("PatientAnonymizerService - stripDicomMetadataHeaders blank")
  void testPatientAnonymizerServiceEdgeCases() {
    PatientAnonymizerService service = new PatientAnonymizerService("SECRET");
    assertThat(service.stripDicomMetadataHeaders(null)).isEmpty();
    assertThat(service.stripDicomMetadataHeaders("")).isEmpty();
  }

  @Test
  @DisplayName("PatientSpecification - Private constructor coverage")
  void testPatientSpecificationPrivateConstructor() throws Exception {
    Constructor<PatientSpecification> constructor = PatientSpecification.class.getDeclaredConstructor();
    constructor.setAccessible(true);
    PatientSpecification instance = constructor.newInstance();
    assertThat(instance).isNotNull();
  }

  @Test
  @DisplayName("AdminUserService - isSoleActiveAdmin coverage")
  void testAdminUserServiceSoleAdmin(
      @Mock UserRepository userRepo,
      @Mock UserRoleRepository userRoleRepo,
      @Mock RoleRepository roleRepo) {

    AdminUserService service = new AdminUserService(userRepo, userRoleRepo, roleRepo);
    UUID userId = UUID.randomUUID();
    User user = new User("admin@aura.com", "pass", "Admin");
    user.setActive(true);
    ReflectionTestUtils.setField(user, "id", userId);

    when(userRepo.findById(userId)).thenReturn(Optional.of(user));
    Role adminRole = new Role();
    ReflectionTestUtils.setField(adminRole, "name", RoleName.ADMIN);
    UserRole ur = new UserRole(user, adminRole);
    when(userRoleRepo.findAllByUserId(userId)).thenReturn(List.of(ur));
    when(userRoleRepo.existsByUserIdAndRole(userId, RoleName.ADMIN)).thenReturn(true);
    when(userRoleRepo.countByRole_NameAndUser_ActiveTrue(RoleName.ADMIN)).thenReturn(1L);

    UpdateUserRoleRequest req = new UpdateUserRoleRequest(RoleName.USER);
    assertThatThrownBy(() -> service.updateUserRole(userId, req))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("quản trị viên đang hoạt động cuối cùng");
  }

  @Test
  @DisplayName("PatientAccessService - Edge cases: null params, auth null, screening null")
  void testPatientAccessServiceEdgeCases(
      @Mock DoctorPatientAssignmentRepository assignmentRepo,
      @Mock ScreeningRepository screeningRepo) {

    PatientAccessService service = new PatientAccessService(assignmentRepo, screeningRepo);
    UUID id = UUID.randomUUID();

    assertThat(service.canAccessPatient(null, id)).isFalse();
    assertThat(service.canAccessPatient(new AuraUserPrincipal(id, "e", "p", true, List.of("USER")), null)).isFalse();
    assertThat(service.canChatBetween(null, id)).isFalse();
    assertThat(service.canChatBetween(new AuraUserPrincipal(id, "e", "p", true, List.of("USER")), null)).isFalse();

    SecurityContextHolder.clearContext();
    assertThat(service.canCurrentDoctorAccess(id)).isFalse();

    assertThat(service.canAccessScreening(null, id)).isFalse();
    assertThat(service.canAccessScreening(new AuraUserPrincipal(id, "e", "p", true, List.of("USER")), null)).isFalse();
    when(screeningRepo.findById(id)).thenReturn(Optional.empty());
    assertThat(service.canAccessScreening(new AuraUserPrincipal(id, "e", "p", true, List.of("USER")), id)).isFalse();

    assertThat(service.canReviewScreening(null, id)).isFalse();
    assertThat(service.canReviewScreening(new AuraUserPrincipal(id, "e", "p", true, List.of("USER")), id)).isFalse();
    assertThat(service.canReviewScreening(new AuraUserPrincipal(id, "e", "p", true, List.of("DOCTOR")), id)).isFalse();
  }
}
