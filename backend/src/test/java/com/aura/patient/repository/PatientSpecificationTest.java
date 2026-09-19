package com.aura.patient.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.patient.entity.PatientProfile;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class PatientSpecificationTest {

  @Mock
  private Root<PatientProfile> root;

  @Mock
  private CriteriaQuery<?> query;

  @Mock
  private CriteriaBuilder cb;

  @Mock
  private Path<Object> mockPath;

  @Mock
  private Expression<String> mockStringExpr;

  @Mock
  private Predicate mockPredicate;

  @BeforeEach
  void setUp() {
    org.mockito.Mockito.lenient().when(root.get(anyString())).thenReturn(mockPath);
    org.mockito.Mockito.lenient().when(cb.lower(any())).thenReturn(mockStringExpr);
    org.mockito.Mockito.lenient().when(cb.upper(any())).thenReturn(mockStringExpr);
    org.mockito.Mockito.lenient().when(cb.like(any(), anyString())).thenReturn(mockPredicate);
    org.mockito.Mockito.lenient().when(cb.or(any(), any(), any(), any())).thenReturn(mockPredicate);
    org.mockito.Mockito.lenient().when(cb.equal(any(), any())).thenReturn(mockPredicate);
    org.mockito.Mockito.lenient().when(cb.greaterThanOrEqualTo(any(), any(Integer.class))).thenReturn(mockPredicate);
    org.mockito.Mockito.lenient().when(cb.lessThanOrEqualTo(any(), any(Integer.class))).thenReturn(mockPredicate);
    org.mockito.Mockito.lenient().when(cb.and(any(Predicate[].class))).thenReturn(mockPredicate);
  }

  @Test
  @DisplayName("Test case 1: Tất cả tham số null -> danh sách predicates rỗng, gọi cb.and() với mảng rỗng")
  void filterPatients_whenAllParametersNull_returnsEmptyPredicatesArray() {
    Specification<PatientProfile> spec = PatientSpecification.filterPatients(
        null, null, null, null, null, null, null, null, null
    );

    Predicate result = spec.toPredicate(root, query, cb);

    assertThat(result).isNotNull();
    ArgumentCaptor<Predicate[]> captor = ArgumentCaptor.forClass(Predicate[].class);
    verify(cb).and(captor.capture());
    assertThat(captor.getValue()).isEmpty();
  }

  @Test
  @DisplayName("Test case 2: Tất cả tham số có giá trị hợp lệ -> tạo đủ 9 predicates tương ứng")
  void filterPatients_whenAllParametersProvided_createsAllPredicates() {
    Specification<PatientProfile> spec = PatientSpecification.filterPatients(
        "Nguyen",
        "HIGH",
        50,
        80,
        true,
        true,
        false,
        "Dr. Thanh",
        "REVIEWED"
    );

    Predicate result = spec.toPredicate(root, query, cb);

    assertThat(result).isNotNull();

    // Verify search patterns (CON-01: 3 fields fullName, mrn, assignedDoctor; phone is not queried via LIKE)
    verify(cb, times(3)).like(any(), eq("%nguyen%"));
    verify(cb).or(any(Predicate[].class));

    // Verify riskLevel
    verify(cb).equal(any(), eq("HIGH"));

    // Verify minScore / maxScore
    verify(cb).greaterThanOrEqualTo(any(), eq(50));
    verify(cb).lessThanOrEqualTo(any(), eq(80));

    // Verify medical conditions
    verify(cb, times(2)).equal(any(), eq(true)); // hasDiabetes and hasHypertension
    verify(cb).equal(any(), eq(false)); // historyOfSmoking

    // Verify doctorName & reviewStatus
    verify(cb).equal(any(), eq("Dr. Thanh"));
    verify(cb).equal(any(), eq("REVIEWED"));

    ArgumentCaptor<Predicate[]> captor = ArgumentCaptor.forClass(Predicate[].class);
    verify(cb).and(captor.capture());
    assertThat(captor.getValue()).hasSize(9);
  }

  @Test
  @DisplayName("Test case 3: riskLevel = 'ALL', doctorName = 'ALL', reviewStatus = 'ALL', search = '' (blank) -> không thêm predicate nào")
  void filterPatients_whenAllFiltersAreALLOrBlank_returnsEmptyPredicates() {
    Specification<PatientProfile> spec = PatientSpecification.filterPatients(
        "",
        "ALL",
        null,
        null,
        null,
        null,
        null,
        "ALL",
        "ALL"
    );

    Predicate result = spec.toPredicate(root, query, cb);

    assertThat(result).isNotNull();
    ArgumentCaptor<Predicate[]> captor = ArgumentCaptor.forClass(Predicate[].class);
    verify(cb).and(captor.capture());
    assertThat(captor.getValue()).isEmpty();
  }

  @Test
  @DisplayName("Test case 4: search, riskLevel, doctorName, reviewStatus đều là khoảng trắng ('   ') -> bỏ qua các nhánh if")
  void filterPatients_whenParametersAreWhitespaceOnly_ignoresBranches() {
    Specification<PatientProfile> spec = PatientSpecification.filterPatients(
        "   ",
        "   ",
        null,
        null,
        null,
        null,
        null,
        "   ",
        "   "
    );

    Predicate result = spec.toPredicate(root, query, cb);

    assertThat(result).isNotNull();
    ArgumentCaptor<Predicate[]> captor = ArgumentCaptor.forClass(Predicate[].class);
    verify(cb).and(captor.capture());
    assertThat(captor.getValue()).isEmpty();
  }

  @Test
  @DisplayName("CON-01: Tìm kiếm với 'ENC' không truy vấn trường phone và không khớp toàn bộ bệnh nhân")
  void filterPatients_whenSearchHasEnc_doesNotQueryCiphertextPhone() {
    Specification<PatientProfile> spec = PatientSpecification.filterPatients(
        "ENC", null, null, null, null, null, null, null, null
    );

    spec.toPredicate(root, query, cb);

    verify(root).get("fullName");
    verify(root).get("mrn");
    verify(root).get("assignedDoctor");
    verify(root, never()).get("phone");
    verify(root, never()).get("phoneHash");
    verify(cb, times(3)).like(any(), eq("%enc%"));
  }

  @Test
  @DisplayName("CON-01: Tìm kiếm số điện thoại hợp lệ truy vấn phoneHash qua Blind Index")
  void filterPatients_whenSearchIsPhoneNumber_queriesPhoneHash() {
    Specification<PatientProfile> spec = PatientSpecification.filterPatients(
        "0912345678", null, null, null, null, null, null, null, null
    );

    spec.toPredicate(root, query, cb);

    verify(root).get("fullName");
    verify(root).get("mrn");
    verify(root).get("assignedDoctor");
    verify(root, never()).get("phone");
    verify(root).get("phoneHash");
    verify(cb).equal(any(), eq(com.aura.common.crypto.BlindIndexUtil.computePhoneHash("0912345678")));
  }
}
