package com.aura.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    @PostMapping
    public ResponseEntity<?> createAnalysis(@RequestBody Object request) {
        // TODO: Map to create analysis report service
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<?> getAnalyses() {
        // TODO: Map to fetch reports service
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/notes")
    public ResponseEntity<?> updateNotes(@PathVariable Long id, @RequestBody Object request) {
        // TODO: Map to update doctor notes service
        return ResponseEntity.ok().build();
    }
}
