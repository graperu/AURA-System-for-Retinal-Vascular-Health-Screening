package com.aura.auth.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "aura.cors")
public record CorsProperties(List<String> allowedOrigins) {}
