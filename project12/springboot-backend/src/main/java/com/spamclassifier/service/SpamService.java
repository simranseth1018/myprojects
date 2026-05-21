package com.spamclassifier.service;

import com.spamclassifier.dto.SpamRequest;
import com.spamclassifier.dto.SpamResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * SpamService - Business logic layer.
 *
 * Responsibilities:
 *   1. Build the HTTP request to the Flask ML service.
 *   2. Parse the ML response into a SpamResponse DTO.
 *   3. Translate low-level HTTP errors into meaningful exceptions.
 */
@Service
public class SpamService {

    private static final Logger log = LoggerFactory.getLogger(SpamService.class);

    private final RestTemplate restTemplate;

    @Value("${flask.service.url}")
    private String flaskServiceUrl;

    public SpamService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Send the email text to the Flask ML service and return the classification result.
     *
     * @param request DTO containing the raw email message
     * @return SpamResponse with prediction label and confidence percentage
     * @throws RuntimeException if the ML service is unreachable or returns an error
     */
    @SuppressWarnings("unchecked")
    public SpamResponse classifyEmail(SpamRequest request) {
        String predictUrl = flaskServiceUrl + "/predict";

        // Build HTTP headers with JSON content type
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Flask expects: { "message": "..." }
        Map<String, String> body = Map.of("message", request.getMessage());
        HttpEntity<Map<String, String>> httpRequest = new HttpEntity<>(body, headers);

        log.debug("Calling Flask ML service at: {}", predictUrl);

        try {
            Map<String, Object> flaskResponse = restTemplate.postForObject(
                    predictUrl,
                    httpRequest,
                    Map.class
            );

            if (flaskResponse == null) {
                throw new RuntimeException("ML service returned an empty response.");
            }

            // Parse Flask response fields
            String prediction    = (String) flaskResponse.get("prediction");
            double confidence    = ((Number) flaskResponse.get("confidence")).doubleValue();
            String rawPrediction = (String) flaskResponse.getOrDefault("raw_prediction", "");

            log.info("ML result -> prediction: {}, confidence: {}%", prediction, confidence);

            return new SpamResponse(prediction, confidence, rawPrediction);

        } catch (ResourceAccessException e) {
            log.error("Cannot reach Flask ML service at {}: {}", predictUrl, e.getMessage());
            throw new RuntimeException(
                    "ML service is unavailable. Please ensure the Flask service is running on port 5000.", e);
        } catch (RestClientException e) {
            log.error("Flask ML service error: {}", e.getMessage());
            throw new RuntimeException("ML service returned an error: " + e.getMessage(), e);
        }
    }
}
