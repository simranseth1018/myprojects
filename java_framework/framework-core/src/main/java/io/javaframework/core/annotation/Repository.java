package io.javaframework.core.annotation;

import java.lang.annotation.*;

/**
 * Marks a class as a Repository — the data access layer.
 *
 * <h2>Responsibilities of a Repository:</h2>
 * <ul>
 *   <li>Executing database queries (SQL or NoSQL)</li>
 *   <li>Mapping query results to domain objects</li>
 *   <li>Hiding persistence implementation details from the service layer</li>
 *   <li>Implementing the "Repository Pattern" from Domain-Driven Design (DDD)</li>
 * </ul>
 *
 * <h2>Spring's special treatment of @Repository:</h2>
 * Spring's {@code PersistenceExceptionTranslationPostProcessor} automatically
 * wraps ANY exception thrown from a @Repository in a Spring
 * {@code DataAccessException} subclass. This means:
 *   - {@code SQLException} → {@code JdbcSQLException} (Spring)
 *   - {@code PersistenceException} → {@code JpaSystemException} (Spring)
 *
 * The benefit: service layer catches {@code DataAccessException} without knowing
 * whether you're using JDBC, JPA, MongoDB, or Cassandra. Fully decoupled.
 *
 * We'll implement a simpler version of this in Phase 4 with our ORM layer.
 *
 * <h2>Repository Pattern (DDD):</h2>
 * <pre>
 *   interface UserRepository {
 *     User findById(Long id);
 *     List<User> findAll();
 *     void save(User user);
 *     void delete(Long id);
 *   }
 * </pre>
 * The service doesn't care if this hits MySQL, PostgreSQL, MongoDB, or an in-memory Map.
 * You can swap the implementation without changing business logic.
 *
 * @see Component
 * @see Service
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component  // Repositories ARE components — IoC-managed singletons by default
public @interface Repository {

    /**
     * The bean name override.
     *
     * @return the explicit bean name, or empty for default name derivation
     */
    String value() default "";
}
