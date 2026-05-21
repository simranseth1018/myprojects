package com.spamclassifier.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO carrying the email text sent by the React frontend.
 * Validated before the request reaches the service layer.
 */
public class SpamRequest {

    @NotBlank(message = "Email message cannot be blank.")
    @Size(max = 10_000, message = "Email message must not exceed 10,000 characters.")
    private String message;

    // Default constructor required for Jackson deserialization
    public SpamRequest() {}

    public SpamRequest(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
