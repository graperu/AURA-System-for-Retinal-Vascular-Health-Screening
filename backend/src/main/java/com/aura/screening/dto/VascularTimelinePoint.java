package com.aura.screening.dto;

import com.aura.screening.entity.Screening;
import java.time.Instant;
import java.util.UUID;

public record VascularTimelinePoint(
    UUID screeningId,
    Instant recordedAt,
    Double avRatio,
    Double vesselDensityPercent,
    Double tortuosityIndex,
    Double verticalCdr,
    Integer cardiovascularRiskScore,
    String riskLevel) {

  public static VascularTimelinePoint from(Screening s) {
    return new VascularTimelinePoint(
        s.getId(),
        s.getCreatedAt(),
        s.getAvRatio(),
        s.getVesselDensityPercent(),
        s.getTortuosityIndex(),
        s.getVerticalCdr(),
        s.getCardiovascularRiskScore(),
        s.getRiskLevel() != null ? s.getRiskLevel().name() : null);
  }
}
