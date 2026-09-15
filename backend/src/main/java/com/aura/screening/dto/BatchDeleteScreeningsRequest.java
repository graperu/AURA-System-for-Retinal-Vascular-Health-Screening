package com.aura.screening.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public record BatchDeleteScreeningsRequest(
    @NotEmpty(message = "Danh sách ID sàng lọc không được để trống")
    @JsonAlias({"ids", "screeningIds"})
    List<UUID> screeningIds
) {}
