package com.example.service;

import com.example.model.CreateUserRequest;
import com.example.model.User;
import com.example.repository.UserRepository;
import io.javaframework.core.annotation.Autowired;
import io.javaframework.core.annotation.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;

/**
 * Business logic for user management.
 *
 * <h2>Constructor injection in action:</h2>
 * The @Autowired constructor declares UserRepository as a required dependency.
 * The IoC container:
 * 1. Sees that UserService has @Autowired on its constructor
 * 2. Looks up UserRepository in the bean container
 * 3. Creates UserRepository first (if not already created)
 * 4. Creates UserService by calling new UserService(userRepository)
 *
 * The {@code final} keyword on userRepository is important:
 * - It cannot be reassigned after construction
 * - The compiler guarantees it's set before any method runs
 * - Makes the class naturally thread-safe for this field
 */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    // Final + constructor injection = proper dependency management
    private final UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        log.debug("Fetching all users");
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        log.debug("Fetching user by id: {}", id);
        return userRepository.findById(id);
    }

    public User createUser(CreateUserRequest request) {
        // Business validation
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("User name is required");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("User email is required");
        }

        User user = new User(null, request.getName(), request.getEmail(),
            request.getRole() != null ? request.getRole() : "USER");

        User saved = userRepository.save(user);
        log.info("Created user: {}", saved);
        return saved;
    }

    public boolean deleteUser(Long id) {
        log.info("Deleting user: {}", id);
        return userRepository.deleteById(id);
    }

    public List<User> getUsersByRole(String role) {
        return userRepository.findByRole(role);
    }
}
