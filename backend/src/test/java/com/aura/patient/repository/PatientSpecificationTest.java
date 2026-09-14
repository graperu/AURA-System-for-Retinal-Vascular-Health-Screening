package com.aura.patient.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
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

    // Verify search patterns
    verify(cb, times(4)).like(any(), eq("%nguyen%"));
    verify(cb).or(any(), any(), any(), any());

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
  @DisplayName("Verify search filter builds or predicate across fullName, mrn, phone, and assignedDoctor")
  void filterPatients_verifiesSearchFieldPaths() {
    Specification<PatientProfile> spec = PatientSpecification.filterPatients(
        "  0912  ", null, null, null, null, null, null, null, null
    );

    spec.toPredicate(root, query, cb);

    verify(root).get("fullName");
    verify(root).get("mrn");
    verify(root).get("phone");
    verify(root).get("assignedDoctor");
    verify(cb, times(4)).like(any(), eq("%0912%"));
  }
}
