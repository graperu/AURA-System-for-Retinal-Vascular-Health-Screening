package com.aura.doctor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.aura.auth.security.JwtTokenProvider;
import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.entity.DoctorPatientAssignment;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import com.aura.patient.entity.PatientMedicalProfile;
import com.aura.patient.repository.PatientMedicalProfileRepository;
import com.aura.role.entity.Role;
import com.aura.role.enums.RoleName;
import com.aura.role.repository.RoleRepository;
import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.Screening;
import com.aura.screening.repository.ScreeningRepository;
import com.aura.user.entity.User;
import com.aura.user.entity.UserRole;
import com.aura.user.repository.UserRepository;
import com.aura.user.repository.UserRoleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class DoctorPatientAssignmentSecurityTest {

  private static final String ORIGIN = "http://localhost:3000";

  @Container
  static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

  @DynamicPropertySource
  static void properties(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
    registry.add("spring.datasource.username", POSTGRES::getUsername);
    registry.add("spring.datasource.password", POSTGRES::getPassword);
    registry.add("aura.cors.allowed-origins", () -> ORIGIN);
  }

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;
  @Autowired JwtTokenProvider jwtTokenProvider;
  @Autowired PasswordEncoder passwordEncoder;

  @Autowired UserRepository userRepository;
  @Autowired RoleRepository roleRepository;
  @Autowired UserRoleRepository userRoleRepository;
  @Autowired DoctorPatientAssignmentRepository assignmentRepository;
  @Autowired PatientMedicalProfileRepository profileRepository;
  @Autowired ScreeningRepository screeningRepository;

  private User doctorA;
  private User doctorB;
  private User patientA;
  private User patientB;
  private User patientC;
  private User adminUser;

  private String tokenDoctorA;
  private String tokenDoctorB;
  private String tokenPatientA;
  private String tokenPatientB;
  private String tokenPatientC;
  private String tokenAdmin;

  private Screening screeningPatientA;
  private Screening screeningPatientB;
  private Screening screeningPatientC;

  @BeforeEach
  void setUp() {
    assignmentRepository.deleteAll();
    screeningRepository.deleteAll();
    profileRepository.deleteAll();
    userRoleRepository.deleteAll();
    userRepository.deleteAll();

    Role roleDoctor = roleRepository.findByName(RoleName.DOCTOR).orElseThrow();
    Role roleUser = roleRepository.findByName(RoleName.USER).orElseThrow();
    Role roleAdmin = roleRepository.findByName(RoleName.ADMIN).orElseThrow();

    // Create Doctors
    doctorA = createUser("doctorA_" + System.nanoTime() + "@aura.test", "BS. Nguyen Van A", roleDoctor);
    doctorB = createUser("doctorB_" + System.nanoTime() + "@aura.test", "BS. Tran Thi B", roleDoctor);

    // Create Patients
    patientA = createUser("patientA_" + System.nanoTime() + "@aura.test", "Benh Nhan A", roleUser);
    patientB = createUser("patientB_" + System.nanoTime() + "@aura.test", "Benh Nhan B", roleUser);
    patientC = createUser("patientC_" + System.nanoTime() + "@aura.test", "Benh Nhan C", roleUser);

    // Create Admin
    adminUser = createUser("admin_" + System.nanoTime() + "@aura.test", "Admin System", roleAdmin);

    // Create Profiles
    createProfile(patientA, "MRN-PATIENT-A", 45, "Male");
    createProfile(patientB, "MRN-PATIENT-B", 52, "Female");
    createProfile(patientC, "MRN-PATIENT-C", 60, "Male");

    // Create Assignments
    // Doctor A -> Patient A (ACTIVE)
    // Doctor A -> Patient B (ACTIVE)
    // Doctor B -> Patient C (ACTIVE)
    assignmentRepository.save(new DoctorPatientAssignment(doctorA, patientA, AssignmentStatus.ACTIVE, adminUser.getId()));
    assignmentRepository.save(new DoctorPatientAssignment(doctorA, patientB, AssignmentStatus.ACTIVE, adminUser.getId()));
    assignmentRepository.save(new DoctorPatientAssignment(doctorB, patientC, AssignmentStatus.ACTIVE, adminUser.getId()));

    // Create Screenings
    screeningPatientA = screeningRepository.save(new Screening(patientA.getId(), "https://cdn.aura.com/scan_a.png"));
    screeningPatientB = screeningRepository.save(new Screening(patientB.getId(), "https://cdn.aura.com/scan_b.png"));
    screeningPatientC = screeningRepository.save(new Screening(patientC.getId(), "https://cdn.aura.com/scan_c.png"));

    // Generate JWT tokens
    tokenDoctorA = jwtTokenProvider.create(doctorA.getId(), List.of("DOCTOR"));
    tokenDoctorB = jwtTokenProvider.create(doctorB.getId(), List.of("DOCTOR"));
    tokenPatientA = jwtTokenProvider.create(patientA.getId(), List.of("USER"));
    tokenPatientB = jwtTokenProvider.create(patientB.getId(), List.of("USER"));
    tokenPatientC = jwtTokenProvider.create(patientC.getId(), List.of("USER"));
    tokenAdmin = jwtTokenProvider.create(adminUser.getId(), List.of("ADMIN"));
  }

  private User createUser(String email, String fullName, Role role) {
    User user = new User(email, passwordEncoder.encode("Password123!"), fullName);
    user.setEmailVerified(true);
    user = userRepository.save(user);
    userRoleRepository.save(new UserRole(user, role));
    return user;
  }

  private PatientMedicalProfile createProfile(User user, String mrn, int age, String gender) {
    PatientMedicalProfile profile = new PatientMedicalProfile(user, mrn);
    profile.setAge(age);
    profile.setGender(gender);
    return profileRepository.save(profile);
  }

  @Test
  @DisplayName("CASE 1: Doctor A chỉ nhận danh sách Patient A và Patient B, KHÔNG có Patient C")
  void case1_doctorA_getAssignedPatients_returnsOnlyAssignedPatients() throws Exception {
    mvc.perform(
            get("/api/v1/doctor/patients")
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenDoctorA))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.length()").value(2))
        .andExpect(jsonPath("$.data[?(@.patientId == '%s')]", patientA.getId().toString()).exists())
        .andExpect(jsonPath("$.data[?(@.patientId == '%s')]", patientB.getId().toString()).exists())
        .andExpect(jsonPath("$.data[?(@.patientId == '%s')]", patientC.getId().toString()).doesNotExist());
  }

  @Test
  @DisplayName("CASE 2: Doctor B chỉ nhận danh sách Patient C")
  void case2_doctorB_getAssignedPatients_returnsOnlyPatientC() throws Exception {
    mvc.perform(
            get("/api/v1/doctor/patients")
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenDoctorB))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.length()").value(1))
        .andExpect(jsonPath("$.data[0].patientId").value(patientC.getId().toString()))
        .andExpect(jsonPath("$.data[0].fullName").value("Benh Nhan C"));
  }

  @Test
  @DisplayName("CASE 3: Patient gọi /api/v1/doctor/patients bị chặn 403 Forbidden")
  void case3_patient_callsDoctorApi_returns403() throws Exception {
    mvc.perform(
            get("/api/v1/doctor/patients")
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenPatientA))
        .andExpect(status().isForbidden());
  }

  @Test
  @DisplayName("CASE 4: Unauthenticated gọi /api/v1/doctor/patients bị chặn 401 Unauthorized")
  void case4_unauthenticated_callsDoctorApi_returns401() throws Exception {
    mvc.perform(
            get("/api/v1/doctor/patients")
                .header(HttpHeaders.ORIGIN, ORIGIN))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("CASE 5 (IDOR): Doctor A xem profile Patient C (không được assign) -> 403 Forbidden")
  void case5_doctorA_getProfilePatientC_returns403() throws Exception {
    mvc.perform(
            get("/api/v1/patient/profile/" + patientC.getId())
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenDoctorA))
        .andExpect(status().isForbidden());
  }

  @Test
  @DisplayName("CASE 6: Doctor A xem profile Patient A (được assign) -> 200 OK")
  void case6_doctorA_getProfilePatientA_returns200() throws Exception {
    mvc.perform(
            get("/api/v1/patient/profile/" + patientA.getId())
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenDoctorA))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.fullName").value("Benh Nhan A"))
        .andExpect(jsonPath("$.data.mrn").value("MRN-PATIENT-A"));
  }

  @Test
  @DisplayName("CASE 7 (Screening IDOR): Doctor A xem screening của Patient C -> 403 Forbidden")
  void case7_doctorA_getScreeningPatientC_returns403() throws Exception {
    mvc.perform(
            get("/api/v1/screenings/" + screeningPatientC.getId())
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenDoctorA))
        .andExpect(status().isForbidden());
  }

  @Test
  @DisplayName("CASE 8: Doctor A xem screening của Patient A (được assign) -> 200 OK")
  void case8_doctorA_getScreeningPatientA_returns200() throws Exception {
    mvc.perform(
            get("/api/v1/screenings/" + screeningPatientA.getId())
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenDoctorA))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.id").value(screeningPatientA.getId().toString()));
  }

  @Test
  @DisplayName("CASE 9: Patient A gọi review screening -> 403 Forbidden")
  void case9_patientA_callsReviewScreening_returns403() throws Exception {
    String reviewPayload = """
        {
          "doctorNotes": "Patient tự review",
          "riskLevel": "LOW"
        }
        """;

    mvc.perform(
            post("/api/v1/screenings/" + screeningPatientA.getId() + "/review")
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenPatientA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(reviewPayload))
        .andExpect(status().isForbidden());
  }

  @Test
  @DisplayName("CASE 10: Doctor A review screening của Patient C (không được assign) -> 403 Forbidden")
  void case10_doctorA_reviewsScreeningPatientC_returns403() throws Exception {
    String reviewPayload = """
        {
          "doctorNotes": "Doctor A ghi chu trai phep",
          "riskLevel": "HIGH"
        }
        """;

    mvc.perform(
            post("/api/v1/screenings/" + screeningPatientC.getId() + "/review")
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenDoctorA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(reviewPayload))
        .andExpect(status().isForbidden());
  }

  @Test
  @DisplayName("CASE 11: Doctor A review screening Patient A -> 200 OK & doctorId lưu vào DB đúng bằng Doctor A ID")
  void case11_doctorA_reviewsScreeningPatientA_success() throws Exception {
    String reviewPayload = """
        {
          "doctorNotes": "Benh nhan A co dau hieu tang huyet ap nhe",
          "riskLevel": "HIGH"
        }
        """;

    mvc.perform(
            post("/api/v1/screenings/" + screeningPatientA.getId() + "/review")
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenDoctorA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(reviewPayload))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.doctorId").value(doctorA.getId().toString()))
        .andExpect(jsonPath("$.data.doctorNotes").value("Benh nhan A co dau hieu tang huyet ap nhe"))
        .andExpect(jsonPath("$.data.status").value("REVIEWED"));

    Screening inDb = screeningRepository.findById(screeningPatientA.getId()).orElseThrow();
    assertThat(inDb.getDoctorId()).isEqualTo(doctorA.getId());
    assertThat(inDb.getRiskLevel()).isEqualTo(RiskLevel.HIGH);
  }

  @Test
  @DisplayName("CASE 12 (Screening IDOR): Patient A xem screening của Patient B -> 403 Forbidden")
  void case12_patientA_getScreeningPatientB_returns403() throws Exception {
    mvc.perform(
            get("/api/v1/screenings/" + screeningPatientB.getId())
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenPatientA))
        .andExpect(status().isForbidden());
  }

  @Test
  @DisplayName("CASE 13: Admin có quyền xem screening bất kỳ -> 200 OK")
  void case13_admin_getScreening_returns200() throws Exception {
    mvc.perform(
            get("/api/v1/screenings/" + screeningPatientA.getId())
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true));
  }

  @Test
  @DisplayName("CASE 14: Inactive assignment giữa Doctor B và Patient A -> 403 Forbidden")
  void case14_inactiveAssignment_doctorB_accessPatientA_returns403() throws Exception {
    // Save inactive assignment
    assignmentRepository.save(new DoctorPatientAssignment(doctorB, patientA, AssignmentStatus.INACTIVE, adminUser.getId()));

    mvc.perform(
            get("/api/v1/patient/profile/" + patientA.getId())
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenDoctorB))
        .andExpect(status().isForbidden());
  }

  @Test
  @DisplayName("CASE 15: Không được tạo duplicate assignment doctor-patient do vi phạm UNIQUE constraint")
  void case15_duplicateAssignment_throwsDataIntegrityViolationException() {
    assertThatThrownBy(() -> {
      assignmentRepository.saveAndFlush(new DoctorPatientAssignment(doctorA, patientA, AssignmentStatus.ACTIVE, adminUser.getId()));
    }).isInstanceOf(DataIntegrityViolationException.class);
  }
}