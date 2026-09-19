package com.aura.patient.repository;

import com.aura.patient.entity.PatientProfile;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public class PatientSpecification {

  public static Specification<PatientProfile> filterPatients(
      String search,
      String riskLevel,
      Integer minScore,
      Integer maxScore,
      Boolean hasDiabetes,
      Boolean hasHypertension,
      Boolean historyOfSmoking,
      String doctorName,
      String reviewStatus) {
    return filterPatients(
        search, riskLevel, minScore, maxScore, hasDiabetes, hasHypertension, historyOfSmoking, doctorName, reviewStatus, null);
  }

  public static Specification<PatientProfile> filterPatients(
      String search,
      String riskLevel,
      Integer minScore,
      Integer maxScore,
      Boolean hasDiabetes,
      Boolean hasHypertension,
      Boolean historyOfSmoking,
      String doctorName,
      String reviewStatus,
      java.util.List<java.util.UUID> allowedPatientIds) {
    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();

      if (allowedPatientIds != null) {
        if (allowedPatientIds.isEmpty()) {
          predicates.add(cb.disjunction());
        } else {
          predicates.add(cb.or(
              root.get("userId").in(allowedPatientIds),
              root.get("id").in(allowedPatientIds)
          ));
        }
      }

      if (search != null && !search.isBlank()) {
        String rawSearch = search.trim();
        String pattern = "%" + rawSearch.toLowerCase() + "%";
        List<Predicate> searchPredicates = new ArrayList<>();
        searchPredicates.add(cb.like(cb.lower(root.get("fullName")), pattern));
        searchPredicates.add(cb.like(cb.lower(root.get("mrn")), pattern));
        searchPredicates.add(cb.like(cb.lower(root.get("assignedDoctor")), pattern));

        // CON-01: TUYỆT ĐỐI KHÔNG dùng cb.like trên trường ciphertext 'phone' (tránh rò rỉ khi search 'ENC')
        // Tra cứu số điện thoại bằng Blind Index (HMAC-SHA256) nếu từ khóa chứa số điện thoại hợp lệ
        String normalizedPhone = com.aura.common.crypto.BlindIndexUtil.normalizePhone(rawSearch);
        if (normalizedPhone != null && normalizedPhone.length() >= 7) {
          String phoneHash = com.aura.common.crypto.BlindIndexUtil.computePhoneHash(normalizedPhone);
          searchPredicates.add(cb.equal(root.get("phoneHash"), phoneHash));
        }
        predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
      }

      if (riskLevel != null && !riskLevel.isBlank() && !riskLevel.equalsIgnoreCase("ALL")) {
        predicates.add(cb.equal(cb.upper(root.get("riskLevel")), riskLevel.trim().toUpperCase()));
      }

      if (minScore != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("riskScore"), minScore));
      }

      if (maxScore != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("riskScore"), maxScore));
      }

      if (hasDiabetes != null) {
        predicates.add(cb.equal(root.get("hasDiabetes"), hasDiabetes));
      }

      if (hasHypertension != null) {
        predicates.add(cb.equal(root.get("hasHypertension"), hasHypertension));
      }

      if (historyOfSmoking != null) {
        predicates.add(cb.equal(root.get("historyOfSmoking"), historyOfSmoking));
      }

      if (doctorName != null && !doctorName.isBlank() && !doctorName.equalsIgnoreCase("ALL")) {
        predicates.add(cb.equal(root.get("assignedDoctor"), doctorName.trim()));
      }

      if (reviewStatus != null && !reviewStatus.isBlank() && !reviewStatus.equalsIgnoreCase("ALL")) {
        predicates.add(cb.equal(root.get("reviewStatus"), reviewStatus.trim()));
      }

      return cb.and(predicates.toArray(new Predicate[0]));
    };
  }
}
