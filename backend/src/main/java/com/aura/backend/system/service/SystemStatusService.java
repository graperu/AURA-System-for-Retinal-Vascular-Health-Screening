package com.aura.backend.system.service;

import com.aura.backend.analysis.client.AiCoreClient;
import com.aura.backend.system.dto.DependencyStatus;
import com.aura.backend.system.dto.SystemInfoResponse;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Arrays;

@Service
public class SystemStatusService {

    private final DataSource dataSource;
    private final AiCoreClient aiCoreClient;
    private final Environment environment;

    public SystemStatusService(DataSource dataSource, AiCoreClient aiCoreClient, Environment environment) {
        this.dataSource = dataSource;
        this.aiCoreClient = aiCoreClient;
        this.environment = environment;
    }

    public SystemInfoResponse getSystemInfo() {
        boolean databaseHealthy = isDatabaseHealthy();
        boolean aiCoreHealthy = aiCoreClient.isHealthy();
        String overallStatus = databaseHealthy && aiCoreHealthy ? "healthy" : "degraded";
        String activeEnvironment = Arrays.stream(environment.getActiveProfiles())
                .findFirst()
                .orElse("default");

        return new SystemInfoResponse(
                "AURA Java API",
                "1.0.0-milestone.1",
                activeEnvironment,
                overallStatus,
                new DependencyStatus(databaseHealthy ? "healthy" : "unavailable"),
                new DependencyStatus(aiCoreHealthy ? "healthy" : "unavailable"),
                Instant.now());
    }

    private boolean isDatabaseHealthy() {
        try (var connection = dataSource.getConnection()) {
            return connection.isValid(1);
        } catch (SQLException exception) {
            return false;
        }
    }
}
