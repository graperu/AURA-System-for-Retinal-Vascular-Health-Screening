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
    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();

      if (search != null && !search.isBlank()) {
        String pattern = "%" + search.trim().toLowerCase() + "%";
        Predicate nameMatch = cb.like(cb.lower(root.get("fullName")), pattern);
        Predicate mrnMatch = cb.like(cb.lower(root.get("mrn")), pattern);
        Predicate phoneMatch = cb.like(cb.lower(root.get("phone")), pattern);
        Predicate doctorMatch = cb.like(cb.lower(root.get("assignedDoctor")), pattern);
        predicates.add(cb.or(nameMatch, mrnMatch, phoneMatch, doctorMatch));
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
