package com.example.model;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * User domain object.
 *
 * <h2>Java Record vs POJO:</h2>
 * We use a regular class here so Jackson can deserialize it from JSON
 * without a custom deserializer. Jackson requires either:
 * - A no-arg constructor + setters (mutable POJO)
 * - A @JsonCreator constructor (immutable POJO)
 * - Jackson's parameter-names module + -parameters flag (records)
 *
 * We'll use a regular class with a no-arg constructor + setters for simplicity.
 * Phase 3 will show how to use Records with Jackson properly.
 */
public class User {

    private Long id;
    private String name;
    private String email;
    private String role;
    private LocalDateTime createdAt;

    // Default no-arg constructor — required by Jackson for deserialization
    public User() {}

    public User(Long id, String name, String email, String role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.createdAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters — needed for Jackson deserialization
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setRole(String role) { this.role = role; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User user)) return false;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "User{id=%d, name='%s', email='%s', role='%s'}".formatted(id, name, email, role);
    }
}
