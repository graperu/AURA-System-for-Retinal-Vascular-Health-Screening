package com.aura.backend.service;

import com.aura.backend.entity.AnalysisReport;
import com.aura.backend.entity.User;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnalysisService {

    public AnalysisReport createReport(User patient, String imageUrl) {
        // TODO: Call AI Core FastAPI microservice (http://localhost:8000/analyze)
        return null;
    }

    public List<AnalysisReport> getReportsForUser(User user) {
        // TODO: Retrieve analysis reports
        return List.of();
    }
}
