package com.aura.privacy.service;

import com.aura.billing.repository.PaymentTransactionRepository;
import com.aura.patient.repository.PatientMedicalProfileRepository;
import com.aura.privacy.entity.PrivacySetting;
import com.aura.privacy.repository.PrivacySettingRepository;
import com.aura.screening.repository.ScreeningRepository;
import com.aura.user.entity.User;
import com.aura.user.exception.UserNotFoundException;
import com.aura.user.repository.UserRepository;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PrivacyService {

  private final PrivacySettingRepository privacySettingRepository;
  private final UserRepository userRepository;
  private final ScreeningRepository screeningRepository;
  private final PatientMedicalProfileRepository profileRepository;
  private final PaymentTransactionRepository paymentTransactionRepository;

  public PrivacyService(
      PrivacySettingRepository privacySettingRepository,
      UserRepository userRepository,
      ScreeningRepository screeningRepository,
      PatientMedicalProfileRepository profileRepository,
      PaymentTransactionRepository paymentTransactionRepository) {
    this.privacySettingRepository = privacySettingRepository;
    this.userRepository = userRepository;
    this.screeningRepository = screeningRepository;
    this.profileRepository = profileRepository;
    this.paymentTransactionRepository = paymentTransactionRepository;
  }

  public PrivacySetting getOrCreate(UUID userId) {
    return privacySettingRepository.findById(userId).orElseGet(() -> privacySettingRepository.save(new PrivacySetting(userId)));
  }

  @Transactional
  public PrivacySetting update(UUID userId, boolean allowAnonymousAiTraining) {
    PrivacySetting setting = getOrCreate(userId);
    setting.setAllowAnonymousAiTraining(allowAnonymousAiTraining);
    return privacySettingRepository.save(setting);
  }

  public Map<String, Object> exportPersonalData(UUID userId) {
    User user =
        userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId.toString()));
    Map<String, Object> dump = new LinkedHashMap<>();
    dump.put("exportedAt", Instant.now().toString());
    dump.put("standard", "GDPR Art.20 / HIPAA individual access");
    dump.put(
        "account",
        Map.of(
            "id", user.getId(),
            "email", user.getEmail(),
            "fullName", user.getFullName() == null ? "" : user.getFullName(),
            "active", user.isActive()));
    dump.put(
        "medicalProfile",
        profileRepository
            .findByUserId(userId)
            .map(
                p ->
                    Map.of(
                        "mrn", p.getMrn() == null ? "" : p.getMrn(),
                        "age", p.getAge() == null ? 0 : p.getAge(),
                        "gender", p.getGender() == null ? "" : p.getGender()))
            .orElse(Map.of()));
    dump.put("screeningCount", screeningRepository.countByPatientId(userId));
    dump.put(
        "paymentCount",
        paymentTransactionRepository
            .findByBuyerIdOrderByCreatedAtDesc(userId, org.springframework.data.domain.PageRequest.of(0, 1))
            .getTotalElements());
    dump.put(
        "privacy",
        Map.of("allowAnonymousAiTraining", getOrCreate(userId).isAllowAnonymousAiTraining()));
    return dump;
  }

  @Transactional
  public void requestAccountDeletion(UUID userId) {
    User user =
        userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId.toString()));
    user.setActive(false);
    user.setDeletedAt(Instant.now());
    userRepository.save(user);
  }
}
