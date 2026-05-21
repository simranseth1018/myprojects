package com.spamclassifier.controller;

import com.spamclassifier.dto.SpamRequest;
import com.spamclassifier.dto.SpamResponse;
import com.spamclassifier.service.SpamService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * SpamController - REST API layer.
 *
 * Exposes:
 *   POST /api/predict  -> classify an email message
 *   GET  /api/health   -> service health check
 *
 * CORS is configured globally in CorsConfig but @CrossOrigin is kept here
 * as an explicit, self-documenting reminder that this endpoint serves the frontend.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class SpamController {

    private static final Logger log = LoggerFactory.getLogger(SpamController.class);

    private final SpamService spamService;

    public SpamController(SpamService spamService) {
        this.spamService = spamService;
    }

    /**
     * Classify an email as Spam or Not Spam.
     *
     * Request body  : { "message": "<email text>" }
     * Success (200) : SpamResponse JSON
     * Error   (400) : validation failure
     * Error   (503) : ML service unavailable
     */
    @PostMapping("/predict")
    public ResponseEntity<?> predict(@Valid @RequestBody SpamRequest request) {
        log.info("Prediction request received. Message length: {} chars", request.getMessage().length());

        try {
            SpamResponse response = spamService.classifyEmail(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Prediction failed: {}", e.getMessage());
            return ResponseEntity
                    .status(503)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Simple health check used for liveness probes.
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "Spam Classifier Backend",
                "version", "1.0.0"
        ));
    }
}
