package com.example.repository;

import com.example.model.User;
import io.javaframework.core.annotation.PostConstruct;
import io.javaframework.core.annotation.Repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * In-memory user repository.
 *
 * <p>In Phase 4, this will be replaced with a real database-backed
 * implementation using our ORM layer.
 *
 * <h2>Note on @Repository:</h2>
 * Annotating with @Repository:
 * 1. Makes this an IoC-managed bean
 * 2. Makes it injectable into UserService via @Autowired
 * 3. (Future) Enables exception translation for database errors
 */
@Repository
public class UserRepository {

    // Thread-safe storage for concurrent requests
    private final Map<Long, User> store = new ConcurrentHashMap<>();
    private final AtomicLong idSequence = new AtomicLong(0);

    /**
     * Initializes the repository with sample data.
     * Called after @Autowired injection completes.
     */
    @PostConstruct
    public void init() {
        save(new User(null, "Alice Johnson", "alice@example.com", "ADMIN"));
        save(new User(null, "Bob Smith", "bob@example.com", "USER"));
        save(new User(null, "Carol White", "carol@example.com", "USER"));
    }

    public User save(User user) {
        if (user.getId() == null) {
            user.setId(idSequence.incrementAndGet());
        }
        store.put(user.getId(), user);
        return user;
    }

    public Optional<User> findById(Long id) {
        return Optional.ofNullable(store.get(id));
    }

    public List<User> findAll() {
        return new ArrayList<>(store.values());
    }

    public List<User> findByRole(String role) {
        return store.values().stream()
            .filter(u -> role.equalsIgnoreCase(u.getRole()))
            .toList();
    }

    public boolean deleteById(Long id) {
        return store.remove(id) != null;
    }

    public long count() {
        return store.size();
    }
}
