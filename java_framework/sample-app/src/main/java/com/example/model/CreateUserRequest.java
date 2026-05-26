package com.example.model;

/**
 * Request DTO for creating a new user.
 *
 * <h2>DTOs (Data Transfer Objects):</h2>
 * DTOs separate the external API contract from the internal domain model.
 * This is important because:
 * - The domain User might have sensitive fields not for external exposure
 * - The API request might have fields that don't directly map to domain fields
 * - Validation annotations (@NotNull, @Size) belong on DTOs, not domain objects
 *
 * Phase 3 will add @Valid support with validation annotations.
 */
public class CreateUserRequest {

    private String name;
    private String email;
    private String role;

    public CreateUserRequest() {}

    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }

    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setRole(String role) { this.role = role; }
}
