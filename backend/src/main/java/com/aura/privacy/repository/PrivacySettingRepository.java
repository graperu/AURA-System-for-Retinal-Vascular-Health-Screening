package com.aura.privacy.repository;

import com.aura.privacy.entity.PrivacySetting;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PrivacySettingRepository extends JpaRepository<PrivacySetting, UUID> {}
