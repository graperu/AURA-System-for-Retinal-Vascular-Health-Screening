package com.aura.clinic.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.clinic.dto.AddClinicMemberRequest;
import com.aura.clinic.dto.ClinicMemberResponse;
import com.aura.clinic.entity.ClinicMember;
import com.aura.clinic.entity.ClinicMemberStatus;
import com.aura.clinic.service.ClinicMemberService;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.ErrorCode;
import com.aura.user.entity.User;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ClinicMemberControllerTest {

  @Mock
  private ClinicMemberService clinicMemberService;

  private ClinicMemberController controller;

  private UUID clinicUserId;
  private AuraUserPrincipal clinicPrincipal;
  private UUID doctorUserId;
  private User clinicUser;
  private User doctorUser;
  private ClinicMember sampleMember;
  private UUID memberId;
  private UUID patientId;

  @BeforeEach
  void setUp() {
    controller = new ClinicMemberController(clinicMemberService);

    clinicUserId = UUID.randomUUID();
    clinicPrincipal = new AuraUserPrincipal(clinicUserId, "clinic@aura.test", "secret", true, List.of("ROLE_CLINIC"));

    doctorUserId = UUID.randomUUID();
    patientId = UUID.randomUUID();
    memberId = UUID.randomUUID();

    clinicUser = new User("clinic@aura.test", "hash", "Phòng Khám Đa Khoa Sài Gòn");
    ReflectionTestUtils.setField(clinicUser, "id", clinicUserId);

    doctorUser = new User("doctor@aura.test", "hash", "BS. Trần Văn Hùng");
    ReflectionTestUtils.setField(doctorUser, "id", doctorUserId);

    sampleMember = new ClinicMember(clinicUser, doctorUser);
    ReflectionTestUtils.setField(sampleMember, "id", memberId);
    ReflectionTestUtils.setField(sampleMember, "status", ClinicMemberStatus.ACTIVE);
    ReflectionTestUtils.setField(sampleMember, "invitedAt", Instant.now());
  }

  @Nested
  @DisplayName("GET /api/v1/clinic/members - Lấy danh sách bác sĩ trực thuộc")
  class ListMembersTests {

    @Test
    @DisplayName("Thất bại: Principal là null -> ném AuthException 401")
    void listMembers_whenPrincipalNull_throwsAuthException() {
      assertThatThrownBy(() -> controller.listMembers(null))
          .isInstanceOf(AuthException.class)
          .satisfies(ex -> assertThat(((AuthException) ex).code()).isEqualTo(ErrorCode.UNAUTHORIZED));
    }

    @Test
    @DisplayName("Thành công: Trả về danh sách bác sĩ trực thuộc")
    void listMembers_success() {
      when(clinicMemberService.getMembers(eq(clinicUserId))).thenReturn(List.of(sampleMember));

      ApiResponse<List<ClinicMemberResponse>> response = controller.listMembers(clinicPrincipal);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Lấy danh sách bác sĩ trực thuộc phòng khám thành công");
      assertThat(response.data()).hasSize(1);
      assertThat(response.data().get(0).id()).isEqualTo(memberId);
      assertThat(response.data().get(0).doctorId()).isEqualTo(doctorUserId);
      assertThat(response.data().get(0).doctorName()).isEqualTo("BS. Trần Văn Hùng");
      verify(clinicMemberService).getMembers(eq(clinicUserId));
    }
  }

  @Nested
  @DisplayName("POST /api/v1/clinic/members - Thêm bác sĩ vào phòng khám")
  class AddMemberTests {

    @Test
    @DisplayName("Thất bại: Principal là null -> ném AuthException 401")
    void addMember_whenPrincipalNull_throwsAuthException() {
      AddClinicMemberRequest req = new AddClinicMemberRequest("doctor@aura.test");

      assertThatThrownBy(() -> controller.addMember(null, req))
          .isInstanceOf(AuthException.class)
          .satisfies(ex -> assertThat(((AuthException) ex).code()).isEqualTo(ErrorCode.UNAUTHORIZED));
    }

    @Test
    @DisplayName("Thành công: Thêm bác sĩ theo email thành công")
    void addMember_success() {
      AddClinicMemberRequest req = new AddClinicMemberRequest("doctor@aura.test");
      when(clinicMemberService.addDoctor(eq(clinicUserId), eq("doctor@aura.test"))).thenReturn(sampleMember);

      ApiResponse<ClinicMemberResponse> response = controller.addMember(clinicPrincipal, req);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Đã thêm bác sĩ vào phòng khám");
      assertThat(response.data()).isNotNull();
      assertThat(response.data().doctorEmail()).isEqualTo("doctor@aura.test");
      verify(clinicMemberService).addDoctor(eq(clinicUserId), eq("doctor@aura.test"));
    }
  }

  @Nested
  @DisplayName("DELETE /api/v1/clinic/members/{memberId} - Gỡ bác sĩ khỏi phòng khám")
  class RemoveMemberTests {

    @Test
    @DisplayName("Thất bại: Principal là null -> ném AuthException 401")
    void removeMember_whenPrincipalNull_throwsAuthException() {
      assertThatThrownBy(() -> controller.removeMember(null, memberId))
          .isInstanceOf(AuthException.class)
          .satisfies(ex -> assertThat(((AuthException) ex).code()).isEqualTo(ErrorCode.UNAUTHORIZED));
    }

    @Test
    @DisplayName("Thành công: Gỡ bác sĩ thành công")
    void removeMember_success() {
      ApiResponse<Void> response = controller.removeMember(clinicPrincipal, memberId);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Đã gỡ bác sĩ khỏi phòng khám");
      verify(clinicMemberService).removeDoctor(eq(clinicUserId), eq(memberId));
    }
  }

  @Nested
  @DisplayName("POST /api/v1/clinic/members/{doctorId}/patients/{patientId} - Phân công bệnh nhân cho bác sĩ")
  class AssignPatientToDoctorTests {

    @Test
    @DisplayName("Thất bại: Principal là null -> ném AuthException 401")
    void assignPatientToDoctor_whenPrincipalNull_throwsAuthException() {
      assertThatThrownBy(() -> controller.assignPatientToDoctor(null, doctorUserId, patientId))
          .isInstanceOf(AuthException.class)
          .satisfies(ex -> assertThat(((AuthException) ex).code()).isEqualTo(ErrorCode.UNAUTHORIZED));
    }

    @Test
    @DisplayName("Thành công: Phân công bệnh nhân cho bác sĩ")
    void assignPatientToDoctor_success() {
      ApiResponse<Void> response = controller.assignPatientToDoctor(clinicPrincipal, doctorUserId, patientId);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Đã phân công bệnh nhân cho bác sĩ thành công");
      verify(clinicMemberService).assignPatientToOwnDoctor(eq(clinicUserId), eq(doctorUserId), eq(patientId), eq(clinicUserId));
    }
  }

  @Nested
  @DisplayName("DELETE /api/v1/clinic/members/{doctorId}/patients/{patientId} - Hủy phân công bệnh nhân")
  class UnassignPatientFromDoctorTests {

    @Test
    @DisplayName("Thất bại: Principal là null -> ném AuthException 401")
    void unassignPatientFromDoctor_whenPrincipalNull_throwsAuthException() {
      assertThatThrownBy(() -> controller.unassignPatientFromDoctor(null, doctorUserId, patientId))
          .isInstanceOf(AuthException.class)
          .satisfies(ex -> assertThat(((AuthException) ex).code()).isEqualTo(ErrorCode.UNAUTHORIZED));
    }

    @Test
    @DisplayName("Thành công: Hủy phân công bệnh nhân khỏi bác sĩ")
    void unassignPatientFromDoctor_success() {
      ApiResponse<Void> response = controller.unassignPatientFromDoctor(clinicPrincipal, doctorUserId, patientId);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Đã gỡ phân công bệnh nhân khỏi bác sĩ");
      verify(clinicMemberService).unassignPatientFromOwnDoctor(eq(clinicUserId), eq(doctorUserId), eq(patientId));
    }
  }
}
