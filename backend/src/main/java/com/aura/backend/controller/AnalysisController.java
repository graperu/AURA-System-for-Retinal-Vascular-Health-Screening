package com.aura.backend.controller;

import com.aura.backend.entity.AnalysisReport;
import com.aura.backend.service.AnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    @GetMapping
    public ResponseEntity<List<AnalysisReport>> getReports() {
        return ResponseEntity.ok(analysisService.getReportsForUser(null));
    }
}
