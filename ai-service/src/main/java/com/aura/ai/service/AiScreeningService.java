package com.aura.ai.service;

import com.aura.ai.dto.AiScreeningRequest;
import com.aura.ai.dto.AiScreeningResponse;
import org.springframework.stereotype.Service;

@Service
public class AiScreeningService {

    private static final String MODEL_VERSION = "aura-ai-v1";

    public AiScreeningResponse analyze(AiScreeningRequest request) {

        validateImageUrl(request.imageUrl());

        String riskLevel = "LOW";
        Double confidence = 0.90;

        String findings =
                "AI service đã tiếp nhận ảnh và hoàn tất bước phân tích. "
                + "Kết quả hiện tại đang sử dụng inference placeholder "
                + "cho mục đích kiểm thử tích hợp.";

        return new AiScreeningResponse(
                riskLevel,
                confidence,
                findings,
                MODEL_VERSION
        );
    }

    private void validateImageUrl(String imageUrl) {

        if (imageUrl == null || imageUrl.isBlank()) {
            throw new IllegalArgumentException(
                    "Image URL không được để trống."
            );
        }

        String normalized = imageUrl.trim().toLowerCase();

        boolean validExtension =
                normalized.endsWith(".jpg")
                        || normalized.endsWith(".jpeg")
                        || normalized.endsWith(".png")
                        || normalized.endsWith(".webp")
                        || normalized.endsWith(".dcm");

        if (!validExtension) {
            throw new IllegalArgumentException(
                    "Định dạng ảnh không được hỗ trợ. "
                            + "Chỉ hỗ trợ JPG, JPEG, PNG, WEBP hoặc DICOM."
            );
        }
    }
}