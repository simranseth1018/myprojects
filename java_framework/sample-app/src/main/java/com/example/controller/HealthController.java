package com.example.controller;

import io.javaframework.core.annotation.Controller;
import io.javaframework.web.annotation.GetMapping;
import io.javaframework.web.http.HttpResponse;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Health check endpoint — a production must-have.
 *
 * <h2>Why a health endpoint?</h2>
 * Kubernetes, AWS ELB, Docker, and monitoring systems all need to know
 * if your service is healthy. A /health endpoint returns:
 * - 200 if the service is running normally
 * - 503 if the service is degraded (DB down, etc.)
 *
 * <h2>Spring Boot Actuator:</h2>
 * Spring Boot's /actuator/health does this automatically. It aggregates
 * HealthIndicator beans (DataSourceHealthIndicator, RedisHealthIndicator, etc.).
 * We implement a basic version here. Phase 3 will add an Actuator module.
 *
 * <h2>No @Autowired needed:</h2>
 * This controller has no dependencies — no constructor injection.
 * The framework creates it with a no-arg constructor.
 */
@Controller("/api")
public class HealthController {

    @GetMapping("/health")
    public HttpResponse health() {
        return HttpResponse.ok().json("""
            {
              "status": "UP",
              "timestamp": "%s",
              "framework": "Java Framework v1.0.0-SNAPSHOT",
              "java": "%s"
            }
            """.formatted(
                LocalDateTime.now(),
                System.getProperty("java.version")
            ).trim()
        );
    }

    @GetMapping("/info")
    public HttpResponse info() {
        return HttpResponse.ok().json("""
            {
              "application": "Sample App",
              "version": "1.0.0",
              "description": "Sample application built with Java Framework"
            }
            """.trim()
        );
    }
}
