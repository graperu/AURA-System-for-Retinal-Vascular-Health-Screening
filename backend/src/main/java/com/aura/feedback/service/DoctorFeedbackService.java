package com.aura.feedback.service;

import com.aura.bulk.dto.PatientAnonymizedDto;
import com.aura.bulk.service.PatientAnonymizerService;
import com.aura.feedback.dto.DoctorFeedbackRequest;
import com.aura.feedback.dto.DoctorFeedbackResponse;
import com.aura.feedback.dto.RetrainingDatasetItemDto;
import com.aura.feedback.entity.DoctorFeedback;
import com.aura.feedback.repository.DoctorFeedbackRepository;
import com.aura.patient.entity.PatientProfile;
import com.aura.patient.repository.PatientProfileRepository;
import com.aura.screening.entity.Screening;
import com.aura.screening.repository.ScreeningRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DoctorFeedbackService {

  private final DoctorFeedbackRepository doctorFeedbackRepository;
  private final ScreeningRepository screeningRepository;
  private final PatientProfileRepository patientProfileRepository;
  private final PatientAnonymizerService patientAnonymizerService;

  @Autowired
  public DoctorFeedbackService(
      DoctorFeedbackRepository doctorFeedbackRepository,
      @Autowired(required = false) ScreeningRepository screeningRepository,
      @Autowired(required = false) PatientProfileRepository patientProfileRepository,
      @Autowired(required = false) PatientAnonymizerService patientAnonymizerService) {
    this.doctorFeedbackRepository = doctorFeedbackRepository;
    this.screeningRepository = screeningRepository;
    this.patientProfileRepository = patientProfileRepository;
    this.patientAnonymizerService = patientAnonymizerService;
  }

  public DoctorFeedbackService(DoctorFeedbackRepository doctorFeedbackRepository) {
    this(doctorFeedbackRepository, null, null, null);
  }

  @Transactional
  public DoctorFeedbackResponse submitFeedback(UUID doctorId, DoctorFeedbackRequest request) {
    DoctorFeedback feedback =
        new DoctorFeedback(
            doctorId,
            request.screeningId(),
            request.aiRiskLevel(),
            request.doctorRiskLevel(),
            request.isAccurate(),
            request.feedbackNotes(),
            request.vesselAnnotationData());
    DoctorFeedback saved = doctorFeedbackRepository.save(feedback);
    return DoctorFeedbackResponse.fromEntity(saved);
  }

  @Transactional(readOnly = true)
  public Page<DoctorFeedbackResponse> getDoctorFeedbacks(UUID doctorId, Pageable pageable) {
    return doctorFeedbackRepository
        .findByDoctorIdOrderByCreatedAtDesc(doctorId, pageable)
        .map(DoctorFeedbackResponse::fromEntity);
  }

  @Transactional(readOnly = true)
  public List<DoctorFeedbackResponse> getFeedbacksByScreening(UUID screeningId) {
    return doctorFeedbackRepository.findByScreeningId(screeningId).stream()
        .map(DoctorFeedbackResponse::fromEntity)
        .toList();
  }

  @Transactional
  public List<RetrainingDatasetItemDto> exportRetrainingDataset() {
    List<DoctorFeedback> feedbacks = doctorFeedbackRepository.findByIncludedInRetrainingFalse();
    if (feedbacks == null || feedbacks.isEmpty()) {
      return List.of();
    }

    List<RetrainingDatasetItemDto> dataset = new ArrayList<>();
    Instant exportTimestamp = Instant.now();

    for (DoctorFeedback feedback : feedbacks) {
      String pseudonymId = "ANO-PAT-UNKNOWN";
      String deidentifiedMrn = "MRN-DEID-UNKNOWN";
      int age = 50;
      String gender = "Other";
      int systolicBp = 120;
      int diastolicBp = 80;
      double hba1c = 5.7;
      boolean hasDiabetes = false;
      boolean hasHypertension = false;

      if (screeningRepository != null && feedback.getScreeningId() != null) {
        Optional<Screening> screeningOpt = screeningRepository.findById(feedback.getScreeningId());
        if (screeningOpt.isPresent()) {
          Screening screening = screeningOpt.get();
          UUID patientId = screening.getPatientId();
          if (patientId != null && patientProfileRepository != null) {
            Optional<PatientProfile> profileOpt = patientProfileRepository.findById(patientId);
            if (profileOpt.isEmpty()) {
              profileOpt = patientProfileRepository.findByUserId(patientId);
            }
            if (profileOpt.isPresent()) {
              PatientProfile profile = profileOpt.get();
              age = profile.getAge() != null ? profile.getAge() : 50;
              gender = profile.getGender() != null ? profile.getGender() : "Other";
              systolicBp = profile.getSystolicBp() != null ? profile.getSystolicBp() : 120;
              diastolicBp = profile.getDiastolicBp() != null ? profile.getDiastolicBp() : 80;
              hba1c = profile.getHba1c() != null ? profile.getHba1c() : 5.7;
              hasDiabetes = profile.getHasDiabetes();
              hasHypertension = profile.getHasHypertension();

              if (patientAnonymizerService != null) {
                String rawMrn = profile.getMrn() != null ? profile.getMrn() : "MRN-ANON";
                String rawName = profile.getFullName() != null ? profile.getFullName() : "ANONYMOUS";
                PatientAnonymizedDto anonymized = patientAnonymizerService.anonymizePatient(
                    rawMrn, rawName, age, gender, systolicBp, diastolicBp, hba1c);
                pseudonymId = anonymized.pseudonymId();
                deidentifiedMrn = anonymized.deidentifiedMrn();
                hasDiabetes = anonymized.hasDiabetes();
                hasHypertension = anonymized.hasHypertension();
              }
            }
          }
        }
      }

      feedback.setIncludedInRetraining(true);
      doctorFeedbackRepository.save(feedback);

      dataset.add(new RetrainingDatasetItemDto(
          feedback.getId(),
          feedback.getScreeningId(),
          pseudonymId,
          deidentifiedMrn,
          age,
          gender,
          systolicBp,
          diastolicBp,
          hba1c,
          hasDiabetes,
          hasHypertension,
          feedback.getAiRiskLevel(),
          feedback.getDoctorRiskLevel(),
          feedback.getIsAccurate(),
          feedback.getFeedbackNotes(),
          feedback.getVesselAnnotationData(),
          exportTimestamp
      ));
    }

    return dataset;
  }
}
