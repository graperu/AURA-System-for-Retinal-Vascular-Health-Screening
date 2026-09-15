package com.aura.screening.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record BatchDeleteScreeningsRequest(
    @NotEmpty(message = "Danh sách ID sàng lọc không được để trống")
    @JsonAlias({"ids", "screeningIds", "screening_ids"})
    List<String> screeningIds
) {}
