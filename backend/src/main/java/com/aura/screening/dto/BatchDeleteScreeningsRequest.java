package com.aura.screening.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public record BatchDeleteScreeningsRequest(
    List<String> screeningIds
) {
  public BatchDeleteScreeningsRequest {
    if (screeningIds == null) {
      screeningIds = List.of();
    }
  }

  @JsonCreator
  public static BatchDeleteScreeningsRequest of(
      @JsonProperty("screeningIds") List<String> screeningIds,
      @JsonProperty("ids") List<String> ids,
      @JsonProperty("screening_ids") List<String> snakeIds
  ) {
    List<String> merged = new ArrayList<>();
    if (screeningIds != null) merged.addAll(screeningIds);
    if (ids != null) merged.addAll(ids);
    if (snakeIds != null) merged.addAll(snakeIds);
    return new BatchDeleteScreeningsRequest(
        merged.stream().filter(s -> s != null && !s.isBlank()).distinct().toList()
    );
  }
}

