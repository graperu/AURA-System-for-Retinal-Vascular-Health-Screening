package com.aura.ai.controller;

import com.aura.ai.dto.AiScreeningRequest;
import com.aura.ai.dto.AiScreeningResponse;
import com.aura.ai.service.AiScreeningService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.blind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")


public class AiController {
    private final AiScreeningService aiScreeningService;

    public AiController(AiScreeningService aiScreeningService) {
        this.aiScreeningService = aiScreeningService;
    }
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of("service","aura-ai-service","status", "UP","modelVersion", "aura-ai-v1.0"));
    
    }
    @PostMapping("/analyze")

    public ResponseEntity<AiScreeningResponse> analyzeImage(@Valid @RequestBody AiScreeningRequest request) {
        
        AiScreeningResponse response = aiScreeningService.analyzeImage(request);
        return ResponseEntity.ok(response);
    }

}
