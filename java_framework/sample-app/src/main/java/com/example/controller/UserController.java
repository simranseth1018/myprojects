package com.example.controller;

import com.example.model.CreateUserRequest;
import com.example.model.User;
import com.example.service.UserService;
import io.javaframework.core.annotation.Autowired;
import io.javaframework.core.annotation.Controller;
import io.javaframework.web.annotation.*;
import io.javaframework.web.http.HttpResponse;
import io.javaframework.web.http.HttpStatus;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST controller for user management operations.
 *
 * <h2>This demonstrates the full framework feature set:</h2>
 * <ul>
 *   <li>@Controller with base path</li>
 *   <li>@GetMapping, @PostMapping, @DeleteMapping</li>
 *   <li>@Autowired constructor injection</li>
 *   <li>@PathVariable for extracting URL segments</li>
 *   <li>@RequestParam for query parameters</li>
 *   <li>@RequestBody for JSON deserialization</li>
 *   <li>Returning objects (auto-serialized to JSON)</li>
 *   <li>Returning HttpResponse for custom status codes</li>
 * </ul>
 *
 * <h2>Test with curl:</h2>
 * <pre>
 *   # Get all users
 *   curl http://localhost:8080/api/users
 *
 *   # Get user by ID
 *   curl http://localhost:8080/api/users/1
 *
 *   # Create user
 *   curl -X POST http://localhost:8080/api/users \
 *        -H "Content-Type: application/json" \
 *        -d '{"name":"Dave Brown","email":"dave@example.com","role":"USER"}'
 *
 *   # Delete user
 *   curl -X DELETE http://localhost:8080/api/users/1
 *
 *   # Filter by role
 *   curl http://localhost:8080/api/users?role=ADMIN
 *
 *   # Health check
 *   curl http://localhost:8080/api/health
 * </pre>
 */
@Controller("/api/users")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * GET /api/users — returns all users, optionally filtered by role.
     *
     * <p>Return type List<User> is automatically serialized to a JSON array.
     */
    @GetMapping
    public List<User> getAllUsers(@RequestParam(required = false) String role) {
        if (role != null && !role.isBlank()) {
            return userService.getUsersByRole(role);
        }
        return userService.getAllUsers();
    }

    /**
     * GET /api/users/{id} — returns a single user by ID.
     *
     * <p>Demonstrates:
     * - @PathVariable extraction and type conversion (String → Long)
     * - Returning HttpResponse with custom status for 404
     */
    @GetMapping("/{id}")
    public HttpResponse getUserById(@PathVariable Long id) {
        Optional<User> user = userService.getUserById(id);

        if (user.isEmpty()) {
            return HttpResponse.notFound()
                .json("""
                    {"error": "User not found", "id": %d}
                    """.formatted(id).trim());
        }

        // Framework auto-serializes the User object to JSON with 200 OK
        // But we want to return HttpResponse directly for control
        return HttpResponse.ok().json(
            // In Phase 2, we'll have proper response wrapping
            // For now, we demonstrate returning a specific user
            "{\"id\":%d,\"name\":\"%s\",\"email\":\"%s\",\"role\":\"%s\"}"
                .formatted(user.get().getId(), user.get().getName(),
                           user.get().getEmail(), user.get().getRole())
        );
    }

    /**
     * POST /api/users — creates a new user from JSON body.
     *
     * <p>@RequestBody triggers JSON deserialization of the request body
     * into a CreateUserRequest object. The framework uses Jackson for this.
     *
     * <p>Returns 201 Created with the created user.
     */
    @PostMapping
    public HttpResponse createUser(@RequestBody CreateUserRequest request) {
        try {
            User created = userService.createUser(request);
            // 201 Created with Location header (REST best practice)
            return HttpResponse.created()
                .header("Location", "/api/users/" + created.getId())
                .json("""
                    {"id":%d,"name":"%s","email":"%s","role":"%s"}
                    """.formatted(
                        created.getId(), created.getName(),
                        created.getEmail(), created.getRole()
                    ).trim());
        } catch (IllegalArgumentException e) {
            return HttpResponse.badRequest()
                .json("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * DELETE /api/users/{id} — deletes a user.
     *
     * <p>Returns 204 No Content on success (REST convention for DELETE).
     * Returns 404 Not Found if user doesn't exist.
     */
    @DeleteMapping("/{id}")
    public HttpResponse deleteUser(@PathVariable Long id) {
        boolean deleted = userService.deleteUser(id);

        if (!deleted) {
            return HttpResponse.notFound()
                .json("{\"error\": \"User not found\", \"id\": " + id + "}");
        }

        return HttpResponse.noContent();
    }
}
