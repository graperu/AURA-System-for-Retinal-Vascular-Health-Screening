package com.aura.backend.service;

import com.aura.backend.entity.AnalysisReport;
import com.aura.backend.entity.User;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AnalysisService {

    public AnalysisReport createReport(User patient, String imageUrl) {
        // TODO: Implement retinal report creation and call FastAPI AI Core
        return null;
    }

    public List<AnalysisReport> getReportsForUser(User user) {
        // TODO: Get reports based on roles
        return null;
    }

    public AnalysisReport updateReportNotes(Long reportId, User doctor, String notes) {
        // TODO: Update clinical notes by doctor
        return null;
    }
}
